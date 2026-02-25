#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_NAME="realestate_saas"
DEFAULT_DB="master_realestate_saas"
DEFAULT_PORTS=(3000 8080 6379 27018)

DROP_DB=true
DB_NAME="$DEFAULT_DB"
STOP_DOCKER=true

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}➤${NC} $1"; }
ok() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
err() { echo -e "${RED}❌${NC} $1"; }

usage() {
  cat <<EOF
Usage: ./main/cleanup.sh [options]

Options:
  --no-drop-db           Do not drop local test DB
  --db-name <name>       DB name to drop (default: ${DEFAULT_DB})
  --no-docker-down       Skip docker compose down
  -h, --help             Show help

What it does:
  1) Stops project Node/NPM processes
  2) Frees app ports: ${DEFAULT_PORTS[*]}
  3) Runs docker compose down (if available)
  4) Drops local Mongo DB (default: ${DEFAULT_DB})
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-drop-db)
      DROP_DB=false
      shift
      ;;
    --db-name)
      DB_NAME="${2:-}"
      if [[ -z "$DB_NAME" ]]; then
        err "Missing value for --db-name"
        exit 1
      fi
      shift 2
      ;;
    --no-docker-down)
      STOP_DOCKER=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      err "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

cd "$ROOT_DIR"

log "Stopping project Node/NPM processes"
pkill -f "$ROOT_DIR/.*/node index.js" 2>/dev/null || true
pkill -f "$ROOT_DIR/.*/react-scripts" 2>/dev/null || true
pkill -f "$ROOT_DIR/.*/npm start" 2>/dev/null || true
pkill -f "$ROOT_DIR/backend.*node index.js" 2>/dev/null || true
pkill -f "$ROOT_DIR/frontend.*react-scripts" 2>/dev/null || true
ok "Project processes cleanup done"

log "Freeing app ports (${DEFAULT_PORTS[*]})"
for port in "${DEFAULT_PORTS[@]}"; do
  pids="$(ss -ltnp 2>/dev/null | awk -v p=":${port}" '$4 ~ p {print $NF}' | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' | sort -u)"
  if [[ -n "$pids" ]]; then
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      kill "$pid" 2>/dev/null || true
    done <<< "$pids"
    warn "Requested stop for process(es) on port ${port}: $(echo "$pids" | tr '\n' ' ')"
  else
    ok "Port ${port} already free"
  fi
done

if $STOP_DOCKER; then
  log "Stopping Docker stack (if present)"
  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      docker compose down >/dev/null 2>&1 || true
      ok "docker compose down attempted"
    elif command -v docker-compose >/dev/null 2>&1; then
      docker-compose down >/dev/null 2>&1 || true
      ok "docker-compose down attempted"
    else
      warn "Docker Compose not available, skipping"
    fi
  else
    warn "Docker not installed, skipping docker cleanup"
  fi
fi

if $DROP_DB; then
  log "Dropping Mongo DB '${DB_NAME}' (if exists)"
  if command -v mongosh >/dev/null 2>&1; then
    mongosh --quiet --eval "const d='${DB_NAME}'; const res=db.getSiblingDB(d).dropDatabase(); print(JSON.stringify(res));" >/tmp/${PROJECT_NAME}_dropdb.out 2>/tmp/${PROJECT_NAME}_dropdb.err || true
    if grep -q '"ok":1' /tmp/${PROJECT_NAME}_dropdb.out 2>/dev/null; then
      ok "Mongo DB '${DB_NAME}' drop attempted"
    else
      warn "Mongo DB drop skipped or failed (service may be stopped)"
    fi
  else
    warn "mongosh not found, skipping DB drop"
  fi
else
  warn "DB drop disabled by flag"
fi

log "Final port status"
ss -ltnp | grep -E ':3000|:8080|:6379|:27017|:27018' || true

ok "Cleanup complete"
