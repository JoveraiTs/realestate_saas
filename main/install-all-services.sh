#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN_USER="${SUDO_USER:-$USER}"
NPM_BIN="$(command -v npm || true)"
BACKEND_ENV_FILE="/etc/realestate-backend.env"

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

echo "➤ Writing backend env file (${BACKEND_ENV_FILE})"
sudo install -m 600 "$TMP_ENV_FILE" "$BACKEND_ENV_FILE"
rm -f "$TMP_ENV_FILE"

install_service() {
  local service_name="$1"
  local service_body="$2"
  local service_path="/etc/systemd/system/${service_name}"

  echo "➤ Installing ${service_name}"
  sudo tee "$service_path" >/dev/null <<EOF
[Unit]
Description=RealEstate SaaS ${service_name}
After=network.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_USER}
Restart=always
RestartSec=5
KillSignal=SIGINT
TimeoutStopSec=20
${service_body}

[Install]
WantedBy=multi-user.target
EOF
}

install_service \
  "realestate-backend.service" \
  "WorkingDirectory=${ROOT_DIR}/backend
EnvironmentFile=${BACKEND_ENV_FILE}
Environment=NODE_ENV=production
Environment=ENABLE_EMAIL_QUEUE=false
ExecStart=${NPM_BIN} run start"

install_service \
  "realestate-frontend.service" \
  "WorkingDirectory=${ROOT_DIR}
Environment=PORT=3000
ExecStart=${NPM_BIN} run start:frontend"

install_service \
  "realestate-tenant-next.service" \
  "WorkingDirectory=${ROOT_DIR}/tenant-website-next
Environment=NODE_ENV=production
Environment=PORT=3001
ExecStart=${NPM_BIN} run start"

install_service \
  "realestate-tenant-ecommerce.service" \
  "WorkingDirectory=${ROOT_DIR}/tenant-website-ecommerce
Environment=NODE_ENV=production
Environment=PORT=3002
ExecStart=${NPM_BIN} run start"

install_service \
  "realestate-tenant-tourism.service" \
  "WorkingDirectory=${ROOT_DIR}/tenant-website-tourism
Environment=NODE_ENV=production
Environment=PORT=3003
ExecStart=${NPM_BIN} run start"

echo "➤ Reloading systemd daemon"
sudo systemctl daemon-reload

echo "➤ Enabling and starting all services"
sudo systemctl enable --now \
  realestate-backend.service \
  realestate-frontend.service \
  realestate-tenant-next.service \
  realestate-tenant-ecommerce.service \
  realestate-tenant-tourism.service

echo "➤ Service summary"
sudo systemctl --no-pager --full status \
  realestate-backend.service \
  realestate-frontend.service \
  realestate-tenant-next.service \
  realestate-tenant-ecommerce.service \
  realestate-tenant-tourism.service | sed -n '1,80p'

echo "✅ All RealEstate services are installed and running"