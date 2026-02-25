#!/usr/bin/env bash

set -euo pipefail

SERVICES=(
  realestate-backend.service
  realestate-frontend.service
  realestate-tenant-next.service
)

echo "== Service State =="
for svc in "${SERVICES[@]}"; do
  enabled="$(sudo systemctl is-enabled "$svc" 2>/dev/null || echo disabled)"
  active="$(sudo systemctl is-active "$svc" 2>/dev/null || echo inactive)"
  printf "%-34s enabled=%-8s active=%s\n" "$svc" "$enabled" "$active"
done

echo
echo "== Health Checks =="

check_url() {
  local label="$1"
  local url="$2"
  local code
  code="$(curl -sS -o /dev/null -w "%{http_code}" "$url" || echo "000")"
  printf "%-18s %s (%s)\n" "$label" "$code" "$url"
}

check_url "backend" "http://127.0.0.1:8080/healthz"
check_url "frontend" "http://127.0.0.1:3000"
check_url "tenant-next" "http://127.0.0.1:3001"

echo
echo "== SMTP Diagnostics =="

ENV_FILE="/etc/realestate-backend.env"
SMTP_HOST=""
SMTP_PORT=""
EMAIL_MODE=""
EMAIL_HTTP_ENDPOINT=""

if [[ -r "$ENV_FILE" ]]; then
  SMTP_HOST="$(grep -E '^SMTP_HOST=' "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  SMTP_PORT="$(grep -E '^SMTP_PORT=' "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  EMAIL_MODE="$(grep -E '^EMAIL_DELIVERY_MODE=' "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
  EMAIL_HTTP_ENDPOINT="$(grep -E '^EMAIL_HTTP_ENDPOINT=' "$ENV_FILE" | tail -n1 | cut -d= -f2- || true)"
elif command -v sudo >/dev/null 2>&1; then
  SMTP_HOST="$(sudo grep -E '^SMTP_HOST=' "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  SMTP_PORT="$(sudo grep -E '^SMTP_PORT=' "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  EMAIL_MODE="$(sudo grep -E '^EMAIL_DELIVERY_MODE=' "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
  EMAIL_HTTP_ENDPOINT="$(sudo grep -E '^EMAIL_HTTP_ENDPOINT=' "$ENV_FILE" 2>/dev/null | tail -n1 | cut -d= -f2- || true)"
fi

if [[ -z "$SMTP_HOST" ]]; then
  echo "smtp_host           not configured"
else
  resolved_ip="$(python3 - <<PY
import socket
try:
    print(socket.gethostbyname('${SMTP_HOST}'))
except Exception:
    print('unresolved')
PY
)"
  echo "smtp_host           ${SMTP_HOST}"
  echo "email_mode          ${EMAIL_MODE:-auto}"
  if [[ -n "$EMAIL_HTTP_ENDPOINT" ]]; then
    echo "http_fallback       configured"
  else
    echo "http_fallback       not_configured"
  fi
  echo "smtp_resolved_ip    ${resolved_ip}"

  probe_port() {
    local port="$1"
    if timeout 5 bash -lc "</dev/tcp/${SMTP_HOST}/${port}" >/dev/null 2>&1; then
      echo "smtp_port_${port}      open"
    else
      echo "smtp_port_${port}      blocked_or_timeout"
    fi
  }

  if [[ -n "$SMTP_PORT" ]]; then
    probe_port "$SMTP_PORT"
  fi
  if [[ "$SMTP_PORT" != "465" ]]; then
    probe_port 465
  fi
  if [[ "$SMTP_PORT" != "587" ]]; then
    probe_port 587
  fi
fi
