#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVICE_NAME="realestate-tenant-next.service"
SERVICE_PATH="/etc/systemd/system/${SERVICE_NAME}"
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

echo "➤ Installing ${SERVICE_NAME} for user ${RUN_USER}"

sudo tee "$SERVICE_PATH" >/dev/null <<EOF
[Unit]
Description=RealEstate SaaS ${SERVICE_NAME}
After=network.target

[Service]
Type=simple
User=${RUN_USER}
Group=${RUN_USER}
WorkingDirectory=${ROOT_DIR}/tenant-website-next
Environment=NODE_ENV=production
Environment=PORT=3001
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
