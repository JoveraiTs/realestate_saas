#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Prefer system nginx when available (host deployment)
if command -v nginx >/dev/null 2>&1 && systemctl list-unit-files nginx.service >/dev/null 2>&1; then
  echo "ℹ️ Using system nginx"
  sudo nginx -t
  sudo systemctl reload nginx
  echo "✅ System nginx config reloaded"
  exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "❌ System nginx unavailable and Docker is not installed"
  exit 1
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "❌ Docker Compose is not installed"
  exit 1
fi

if ! $COMPOSE_CMD ps nginx >/dev/null 2>&1; then
  echo "❌ Nginx service is not available in the current compose project"
  exit 1
fi

$COMPOSE_CMD exec -T nginx nginx -t
$COMPOSE_CMD exec -T nginx nginx -s reload

echo "✅ Nginx config reloaded"
