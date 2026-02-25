#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="realestate-backend.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"
ENV_FILE_PATH="/etc/realestate-backend.env"
RUN_USER="${SUDO_USER:-$USER}"
NPM_BIN="$(command -v npm || true)"

if [[ -z "$NPM_BIN" ]]; then
  echo "❌ npm not found in PATH"
  exit 1
fi

if ! id "$RUN_USER" >/dev/null 2>&1; then
  echo "❌ Service user not found: $RUN_USER"
  exit 1
fi

TMP_ENV_FILE="$(mktemp)"

append_key_from_file() {
  local key="$1"
  local file="$2"
  [[ -f "$file" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  if ! grep -qE "^${key}=" "$TMP_ENV_FILE"; then
    echo "$line" >> "$TMP_ENV_FILE"
  fi
}

append_key_from_pid_env() {
  local key="$1"
  local pid="$2"
  [[ -n "$pid" ]] || return 0
  [[ -r "/proc/${pid}/environ" ]] || return 0
  local line
  line="$(tr '\0' '\n' < "/proc/${pid}/environ" | grep -E "^${key}=" | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  if ! grep -qE "^${key}=" "$TMP_ENV_FILE"; then
    echo "$line" >> "$TMP_ENV_FILE"
  fi
}

for key in JWT_SECRET MONGO_MAIN_URI BASE_DOMAIN API_DOMAIN; do
  append_key_from_file "$key" "$ROOT_DIR/backend/.env"
  append_key_from_file "$key" "$ROOT_DIR/backend/.env.production"
  append_key_from_file "$key" "$ROOT_DIR/backend/.env.production.example"
done

ACTIVE_BACKEND_PID="$(ss -ltnp 2>/dev/null | sed -n 's/.*:8080 .*pid=\([0-9]\+\).*/\1/p' | head -n1 || true)"
for key in JWT_SECRET MONGO_MAIN_URI BASE_DOMAIN API_DOMAIN; do
  append_key_from_pid_env "$key" "$ACTIVE_BACKEND_PID"
done

if ! grep -qE '^JWT_SECRET=' "$TMP_ENV_FILE" || ! grep -qE '^MONGO_MAIN_URI=' "$TMP_ENV_FILE"; then
  rm -f "$TMP_ENV_FILE"
  echo "❌ Missing required backend env keys (JWT_SECRET, MONGO_MAIN_URI)"
  echo "   Add them to backend/.env (or backend/.env.production) and re-run."
  exit 1
fi

echo "➤ Writing backend env file (${ENV_FILE_PATH})"
sudo install -m 600 "$TMP_ENV_FILE" "$ENV_FILE_PATH"
rm -f "$TMP_ENV_FILE"

echo "➤ Installing ${SERVICE_NAME} for user ${RUN_USER}"

sudo tee "$SERVICE_PATH" >/dev/null <<EOF
[Unit]
Description=RealEstate SaaS Backend (Node.js)
After=network.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_USER}
WorkingDirectory=${ROOT_DIR}/backend
EnvironmentFile=${ENV_FILE_PATH}
Environment=NODE_ENV=production
Environment=ENABLE_EMAIL_QUEUE=false
ExecStart=${NPM_BIN} run start
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=20

[Install]
WantedBy=multi-user.target
EOF

echo "➤ Reloading systemd daemon"
sudo systemctl daemon-reload

echo "➤ Enabling and starting ${SERVICE_NAME}"
sudo systemctl enable --now "$SERVICE_NAME"

echo "➤ Service status"
sudo systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,18p'

echo "✅ ${SERVICE_NAME} installed and running"