#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_CONF="$ROOT_DIR/nginx/default.conf"
TARGET_CONF="/etc/nginx/sites-available/realestate-saas"

if ! command -v nginx >/dev/null 2>&1; then
  echo "❌ nginx is not installed"
  exit 1
fi

if [[ ! -f "$SOURCE_CONF" ]]; then
  echo "❌ Source config not found: $SOURCE_CONF"
  exit 1
fi

echo "➤ Installing system nginx config"
sudo cp "$SOURCE_CONF" "$TARGET_CONF"

echo "➤ Enabling realestate-saas site"
sudo ln -sf /etc/nginx/sites-available/realestate-saas /etc/nginx/sites-enabled/realestate-saas

echo "➤ Removing legacy conflicting config (if exists)"
sudo rm -f /etc/nginx/conf.d/realestate_saas.conf
sudo rm -f /etc/nginx/sites-enabled/luxury-uaeproperty

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  echo "➤ Disabling default nginx site"
  sudo rm -f /etc/nginx/sites-enabled/default
fi

echo "➤ Validating nginx config"
sudo nginx -t

echo "➤ Reloading nginx"
sudo systemctl reload nginx

echo "✅ System nginx configured for realestate_saas"
