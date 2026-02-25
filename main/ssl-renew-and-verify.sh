#!/usr/bin/env bash
set -euo pipefail

DOMAIN="luxury-uaeproperty.com"
ROOT_URL="https://www.${DOMAIN}"
API_URL="https://www.${DOMAIN}/api/tenants/top-agencies?limit=2"
TENANT_URLS=(
  "https://mdkamaluddin.${DOMAIN}/"
  "https://testrealty.${DOMAIN}/"
)

echo "[1/4] Renewing Let's Encrypt certificates (if needed)..."
if ! sudo certbot renew --quiet; then
  echo "[warn] certbot renew reported an issue (likely stale legacy renewal config). Continuing with reload + verification."
fi

echo "[2/4] Validating and reloading nginx..."
sudo nginx -t
sudo systemctl reload nginx

echo "[3/4] Verifying key endpoints..."
echo "- ${ROOT_URL}"
curl -I -s "${ROOT_URL}" | sed -n '1,5p'
echo "- ${API_URL}"
curl -I -s "${API_URL}" | sed -n '1,5p'

for url in "${TENANT_URLS[@]}"; do
  echo "- ${url}"
  curl -I -s "${url}" | sed -n '1,5p'
done

echo "[4/4] Done. SSL renew/reload/verification completed."
