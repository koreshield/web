#!/bin/bash
# ============================================================
# KoreShield Safe Rollout Script  v2
# Run as root from the repo root on the VPS:
#   bash deploy.sh [--api-only | --web-only | --infra-only]
#
# Flags:
#   --api-only    Rebuild + swap API container only
#   --web-only    Rebuild + swap web container only
#   --infra-only  Ensure postgres/redis/caddy are healthy, skip rebuilds
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()    { echo -e "$(date '+%H:%M:%S') ${BLUE}[INFO]${NC}  $*"; }
ok()     { echo -e "$(date '+%H:%M:%S') ${GREEN}[ OK ]${NC}  $*"; }
warn()   { echo -e "$(date '+%H:%M:%S') ${YELLOW}[WARN]${NC}  $*"; }
fail()   { echo -e "$(date '+%H:%M:%S') ${RED}[FAIL]${NC}  $*"; }
header() { echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════${NC}"; }

# ── Parse flags ──────────────────────────────────────────────────────────────
API_ONLY=false; WEB_ONLY=false; INFRA_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --api-only)   API_ONLY=true ;;
    --web-only)   WEB_ONLY=true ;;
    --infra-only) INFRA_ONLY=true ;;
    *) warn "Unknown flag: $arg — ignoring" ;;
  esac
done

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# ── 0. Locate repo root ──────────────────────────────────────────────────────
header "0. LOCATE REPO + PREFLIGHT"

# Primary location is /opt/koreshield — search there first
if [ ! -f "$COMPOSE_FILE" ]; then
  for d in /opt/koreshield /root/koreshield /home/koreshield /srv/koreshield; do
    if [ -f "$d/$COMPOSE_FILE" ]; then cd "$d" && break; fi
  done
fi
[ -f "$COMPOSE_FILE" ] || { fail "Cannot find $COMPOSE_FILE. Run from repo root or ensure /opt/koreshield exists."; exit 1; }
[ -f "$ENV_FILE" ]     || { fail "Missing .env at $(pwd)/$ENV_FILE — cannot deploy without environment."; exit 1; }
ok "Repo root: $(pwd)"

# Sanity check: make sure we're not accidentally in a backup directory
case "$(pwd)" in
  *backup*|*_old*|*_bak*) fail "Looks like a backup directory — refusing to deploy from: $(pwd)"; exit 1 ;;
esac

# ── 0.1. Periodic Docker Cleanup ─────────────────────────────────────────────
header "0.1. PERIODIC DOCKER CLEANUP"
PRUNE_BREADCRUMB="/tmp/.last_docker_prune"
PRUNE_INTERVAL_DAYS=7

if [ ! -f "$PRUNE_BREADCRUMB" ] || [ $(( $(date +%s) - $(stat -c %Y "$PRUNE_BREADCRUMB" 2>/dev/null || echo 0) )) -gt $(( PRUNE_INTERVAL_DAYS * 86400 )) ]; then
  DISK_PCT=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
  log "Disk at ${DISK_PCT}% — pruning unused Docker objects (images + build cache, NOT volumes)..."
  docker image prune -af 2>/dev/null || true
  docker builder prune -af 2>/dev/null || true
  touch "$PRUNE_BREADCRUMB"
  ok "Cleanup done. Disk: $(df -h / | tail -1 | awk '{print $4}') free."
else
  log "Recent cleanup found (within ${PRUNE_INTERVAL_DAYS}d). Skipping."
fi

# ── 0.2. Remove stale hash-prefixed containers (Docker naming artefact) ───────
header "0.2. CLEAN STALE CONTAINERS"
STALE=$(docker ps -a --format '{{.Names}}' | grep -E '^[a-f0-9]{12}_koreshield-' || true)
if [ -n "$STALE" ]; then
  warn "Found hash-prefixed containers (stale artefact) — removing:"
  echo "$STALE"
  docker stop $STALE 2>/dev/null || true
  docker rm   $STALE 2>/dev/null || true
  ok "Stale containers removed."
else
  ok "No stale containers found."
fi

# ── 1. FULL ENV AUDIT + PATCH ────────────────────────────────────────────────
header "1. ENV CHECK & PATCH"

declare -A REQUIRED_VARS=(
  ["VITE_EMAILJS_SERVICE_ID"]="service_vtd0qcv"
  ["VITE_EMAILJS_TEMPLATE_ID"]="template_tgoe3z3"
  ["VITE_EMAILJS_TEMPLATE_ID_CONTACT"]="template_ww9dkkm"
  ["VITE_EMAILJS_PUBLIC_KEY"]="nB2BtJ_zcb1kkII0G"
  ["BILLING_INTERNAL_UNLIMITED_EMAILS"]="ei@nsisong.com,isaacnsisong@gmail.com,tes@koreshield.com,admin@koreshield.com,ei@koreshield.com"
  ["POLAR_DEFAULT_CURRENCY"]="GBP"
  ["POLAR_SERVER"]="production"
  ["POLAR_ORGANIZATION_SLUG"]="koreshield"
  ["POLAR_ORGANIZATION_ID"]="a8312734-2e5b-4bea-842e-5618430c27d2"
  ["VITE_POLAR_STARTUP_PRODUCT_ID"]="40723be6-3dbf-4cb9-b627-0b77cd6860d6"
  ["VITE_POLAR_STARTUP_ANNUAL_PRODUCT_ID"]="72d8ce7d-c195-4467-a326-727ee16f2286"
  ["VITE_POLAR_GROWTH_PRODUCT_ID"]="2259942b-1680-4067-b3de-015dcec3a5bf"
  ["VITE_POLAR_GROWTH_ANNUAL_PRODUCT_ID"]="36fd15f6-7772-4fed-b95d-faa060725035"
  ["POSTGRES_USER"]="koreshield"
  ["POSTGRES_DB"]="koreshield"
  ["TELEGRAM_ALERTS_ENABLED"]="true"
  ["AZURE_OPENAI_ENDPOINT"]="https://koreshieldai.cognitiveservices.azure.com/"
  ["ENABLED_PROVIDERS"]="gemini,azure_openai,deepseek,openai"
  ["KORESHIELD_EAGER_APP_INIT"]="true"
  ["COOKIE_SECURE"]="true"
  ["COOKIE_SAMESITE"]="lax"
)

MUST_EXIST=(
  JWT_SECRET POLAR_ACCESS_TOKEN POLAR_WEBHOOK_SECRET
  DEEPSEEK_API_KEY GEMINI_API_KEY GOOGLE_API_KEY
  AZURE_OPENAI_API_KEY POSTGRES_PASSWORD DATABASE_URL
  TELEGRAM_BOT_TOKEN
)

PATCHED=0
for var in "${!REQUIRED_VARS[@]}"; do
  expected="${REQUIRED_VARS[$var]}"
  # Read exactly what's after the = sign, handling empty values
  current=$(grep -E "^${var}=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- || true)
  if [ -z "$current" ] && [ -z "$expected" ]; then
    ok "${var} ✓ (intentionally empty)"
  elif [ "$current" = "$expected" ]; then
    ok "${var} ✓"
  elif [ -z "$current" ]; then
    if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^${var}=.*|${var}=${expected}|" "$ENV_FILE"
    else
      echo "${var}=${expected}" >> "$ENV_FILE"
    fi
    warn "PATCHED: ${var} → ${expected}"
    PATCHED=$((PATCHED+1))
  else
    warn "DIFFERS: ${var}"
    warn "  VPS    : $current"
    warn "  Expected: $expected"
    # In non-interactive mode (piped stdin), keep VPS value
    if [ -t 0 ]; then
      read -rp "  Overwrite? [y/N] " ans
      if [[ "${ans,,}" == "y" ]]; then
        sed -i "s|^${var}=.*|${var}=${expected}|" "$ENV_FILE"
        ok "Updated ${var}"
        PATCHED=$((PATCHED+1))
      else
        warn "Kept VPS value for ${var}"
      fi
    else
      warn "Non-interactive mode — keeping VPS value for ${var}"
    fi
  fi
done

MISSING_SECRETS=()
for var in "${MUST_EXIST[@]}"; do
  current=$(grep -E "^${var}=(.+)" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- || true)
  if [ -z "$current" ]; then
    warn "SECRET MISSING OR EMPTY: $var"
    MISSING_SECRETS+=("$var")
  else
    ok "${var} ✓ (set)"
  fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  fail "Critical secrets missing: ${MISSING_SECRETS[*]}"
  fail "Edit .env before deploying: nano $(pwd)/.env"
  exit 1
fi

[ "$PATCHED" -gt 0 ] && ok "${PATCHED} var(s) patched" || ok "All env vars correct"

# ── 2. Git pull ──────────────────────────────────────────────────────────────
header "2. PULL LATEST MAIN"
if [ -d ".git" ]; then
  BEFORE=$(git rev-parse --short HEAD 2>/dev/null || echo "no-commit")
  log "Pulling from origin/main..."
  # Use reset --hard to avoid merge conflicts on VPS
  git fetch origin main 2>&1 | tail -5
  git reset --hard origin/main 2>&1 | tail -3
  AFTER=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  if [ "$BEFORE" != "$AFTER" ]; then
    ok "Code updated: $BEFORE → $AFTER"
    git log --oneline -5
  else
    ok "Already at latest commit: $AFTER"
  fi
else
  warn "No .git found — cannot auto-pull code."
  warn "To enable auto-pull, add the VPS deploy key to GitHub:"
  warn "  cat /root/.ssh/id_ed25519.pub"
  warn "  → Go to github.com/koreshield/koreshield → Settings → Deploy keys → Add key"
  warn "Using existing files on disk for this deploy."
fi

# Skip the rest if infra-only
if $INFRA_ONLY; then
  header "INFRA-ONLY MODE — skipping rebuilds"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis caddy
  ok "Infra services ensured. Exiting."
  exit 0
fi

# ── 3. Core services (postgres + redis) ──────────────────────────────────────
header "3. CORE SERVICES (postgres + redis)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

log "Waiting for postgres to be healthy..."
for i in $(seq 1 20); do
  PG=$(docker inspect --format='{{.State.Health.Status}}' koreshield-postgres 2>/dev/null || echo "missing")
  [ "$PG" = "healthy" ] && ok "Postgres healthy" && break
  [ "$i" -eq 20 ] && { fail "Postgres not healthy after 80s. Check: docker logs koreshield-postgres --tail 50"; exit 1; }
  log "  postgres: $PG ($i/20)..."; sleep 4
done

log "Waiting for redis to be healthy..."
for i in $(seq 1 10); do
  RD=$(docker inspect --format='{{.State.Health.Status}}' koreshield-redis 2>/dev/null || echo "missing")
  [ "$RD" = "healthy" ] && ok "Redis healthy" && break
  [ "$i" -eq 10 ] && { fail "Redis not healthy. Check: docker logs koreshield-redis --tail 30"; exit 1; }
  sleep 3
done

# Verify DB connectivity directly (not just container health)
PG_CONN=$(docker exec koreshield-postgres pg_isready -U koreshield -d koreshield 2>&1)
if echo "$PG_CONN" | grep -q "accepting connections"; then
  ok "Postgres accepting connections ✓"
else
  fail "Postgres not accepting connections: $PG_CONN"
  exit 1
fi

REDIS_PING=$(docker exec koreshield-redis redis-cli ping 2>&1)
[ "$REDIS_PING" = "PONG" ] && ok "Redis responding ✓" || { fail "Redis ping failed: $REDIS_PING"; exit 1; }

# ── 4. Rebuild API ────────────────────────────────────────────────────────────
if ! $WEB_ONLY; then
  header "4. REBUILD API"

  log "Tagging current image as backup..."
  docker tag koreshield:latest koreshield:backup 2>/dev/null && ok "Backup tagged: koreshield:backup" || warn "No existing image to backup"

  log "Building new API image (--no-cache)..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache api

  log "Swapping API container..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f api 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
  ok "API container started"

  log "Waiting for API to be healthy (tests HTTP + DB + Redis)..."
  API_UP=false
  for i in $(seq 1 30); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
    # Also check container health status
    CONTAINER_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' koreshield-api 2>/dev/null || echo "unknown")
    log "  attempt $i/30 — HTTP $HTTP | container: $CONTAINER_HEALTH"
    if [ "$HTTP" = "200" ] && [ "$CONTAINER_HEALTH" = "healthy" ]; then
      ok "API healthy (HTTP 200, container healthy)"
      API_UP=true
      break
    fi
    if [ "$i" -eq 30 ]; then
      fail "API failed to come healthy after 120s!"
      fail "Last 50 log lines:"
      docker logs koreshield-api --tail 50 2>&1 || true
      break
    fi
    sleep 4
  done

  if ! $API_UP; then
    fail "ROLLING BACK API to backup image..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f api 2>/dev/null || true
    docker tag koreshield:backup koreshield:latest 2>/dev/null || { fail "No backup image found — cannot rollback!"; exit 1; }
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
    # Wait for rollback
    for i in $(seq 1 15); do
      HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
      [ "$HTTP" = "200" ] && ok "Rollback successful — old version running" && break
      [ "$i" -eq 15 ] && fail "Rollback also failed — manual intervention needed!" && exit 1
      sleep 4
    done
    fail "Deployed version failed — running on rollback. Fix the code and redeploy."
    exit 1
  fi
fi

# ── 5. Rebuild WEB ────────────────────────────────────────────────────────────
if ! $API_ONLY; then
  header "5. REBUILD WEB (bakes VITE_* vars into bundle)"

  log "Tagging current web image as backup..."
  docker tag koreshield-web:latest koreshield-web:backup 2>/dev/null && ok "Backup tagged: koreshield-web:backup" || warn "No existing web image to backup"

  log "Building new WEB image (--no-cache)..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache web

  log "Swapping web container..."
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop web 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f web 2>/dev/null || true
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web
  ok "Web container started"

  log "Waiting for web to be healthy..."
  WEB_UP=false
  for i in $(seq 1 25); do
    HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
    log "  attempt $i/25 — HTTP $HTTP"
    if [ "$HTTP" = "200" ]; then
      ok "Web healthy (HTTP $HTTP)"
      WEB_UP=true
      break
    fi
    if [ "$i" -eq 25 ]; then
      fail "Web failed health check!"
      docker logs koreshield-web --tail 30 2>&1 || true
      break
    fi
    sleep 3
  done

  if ! $WEB_UP; then
    fail "ROLLING BACK WEB to backup image..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop web 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f web 2>/dev/null || true
    docker tag koreshield-web:backup koreshield-web:latest 2>/dev/null || { fail "No web backup image — cannot rollback!"; exit 1; }
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web
    for i in $(seq 1 15); do
      HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
      [ "$HTTP" = "200" ] && ok "Web rollback successful" && break
      [ "$i" -eq 15 ] && fail "Web rollback also failed!" && exit 1
      sleep 3
    done
    fail "Web deploy failed — running on rollback."
    exit 1
  fi
fi

# ── 6. Caddy ──────────────────────────────────────────────────────────────────
header "6. CADDY"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d caddy
ok "Caddy ensured"

# ── 7. Final verification ─────────────────────────────────────────────────────
header "7. FINAL VERIFICATION"
sleep 4

ERRORS=0

# API local
API_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
[ "$API_HTTP" = "200" ] && ok "API localhost /health → $API_HTTP" || { fail "API /health → $API_HTTP"; ERRORS=$((ERRORS+1)); }

# Web local
WEB_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
[ "$WEB_HTTP" = "200" ] && ok "Web localhost:3000 → $WEB_HTTP" || { warn "Web → $WEB_HTTP (may be rebuilding)"; }

# DB direct
PG_OK=$(docker exec koreshield-postgres pg_isready -U koreshield -d koreshield 2>&1)
echo "$PG_OK" | grep -q "accepting connections" && ok "Postgres accepting connections ✓" || { fail "Postgres: $PG_OK"; ERRORS=$((ERRORS+1)); }

# Redis direct
RD_OK=$(docker exec koreshield-redis redis-cli ping 2>&1)
[ "$RD_OK" = "PONG" ] && ok "Redis PONG ✓" || { fail "Redis: $RD_OK"; ERRORS=$((ERRORS+1)); }

# HTTPS via Caddy
HTTPS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://api.koreshield.com/health 2>/dev/null || echo "000")
[ "$HTTPS_HTTP" = "200" ] && ok "HTTPS api.koreshield.com/health → $HTTPS_HTTP" || warn "HTTPS → $HTTPS_HTTP (check Caddy TLS / DNS)"

# All container status
echo ""
log "Container status:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

# ── 8. Export threat logs ─────────────────────────────────────────────────────
header "8. EXPORT THREAT & BLOCK LOGS"
EXPORT_FILE="/root/koreshield_threats_$(date +%Y%m%d_%H%M%S).csv"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U koreshield -d koreshield -c \
  "\COPY (SELECT timestamp, request_id, attack_type AS threat_type, is_blocked, block_reason, attack_detected, provider, model, status_code, ROUND(latency_ms::numeric,1) AS latency_ms, tokens_total, ROUND(cost::numeric,6) AS cost_gbp, ip_address, user_agent FROM request_logs WHERE attack_detected = true OR is_blocked = true ORDER BY timestamp DESC LIMIT 50000) TO STDOUT WITH CSV HEADER" \
  > "$EXPORT_FILE" 2>/dev/null \
  && ok "Threat logs exported → $EXPORT_FILE ($(wc -l < "$EXPORT_FILE") rows)" \
  || warn "DB query failed or no threat logs yet — skipping export"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
if [ "$ERRORS" -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✓  Rollout complete — all checks passed             ║${NC}"
  echo -e "${GREEN}║  Commit : $COMMIT                                    ${NC}${GREEN}║${NC}"
  echo -e "${GREEN}║  API    : https://api.koreshield.com/health          ║${NC}"
  echo -e "${GREEN}║  Web    : https://koreshield.com                     ║${NC}"
  [ -f "$EXPORT_FILE" ] && echo -e "${GREEN}║  Logs   : $EXPORT_FILE   ${NC}${GREEN}║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
else
  echo -e "${RED}╔══════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ✗  Rollout complete with $ERRORS error(s)            ║${NC}"
  echo -e "${RED}║  Review the FAIL lines above before declaring done.  ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
