#!/bin/bash
# ============================================================
# KoreShield Safe Rollout Script
# Run as root from the repo root on the VPS:
#   bash deploy.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()   { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $*"; }
header(){ echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════${NC}"; }

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# ── 0. Locate repo root ──────────────────────────────────────────────────────
if [ ! -f "$COMPOSE_FILE" ]; then
  for d in /root/koreshield /home/koreshield /opt/koreshield /srv/koreshield; do
    if [ -f "$d/$COMPOSE_FILE" ]; then cd "$d" && break; fi
  done
fi
[ -f "$COMPOSE_FILE" ] || { fail "Cannot find $COMPOSE_FILE. Run from repo root."; exit 1; }
[ -f "$ENV_FILE" ]     || { fail "Missing .env at $(pwd)/$ENV_FILE"; exit 1; }
log "Working directory: $(pwd)"

# ── 0.1. Periodic Docker Cleanup ─────────────────────────────────────────────
header "0.1. PERIODIC DOCKER CLEANUP"
PRUNE_BREADCRUMB="/tmp/.last_docker_prune"
PRUNE_INTERVAL_DAYS=7 # Run cleanup if last run was > 7 days ago

if [ ! -f "$PRUNE_BREADCRUMB" ] || [ $(( $(date +%s) - $(stat -c %Y "$PRUNE_BREADCRUMB" 2>/dev/null || stat -f %m "$PRUNE_BREADCRUMB" 2>/dev/null) )) -gt $(( $PRUNE_INTERVAL_DAYS * 86400 )) ]; then
  log "Last cleanup was more than $PRUNE_INTERVAL_DAYS days ago (or never)."
  log "Reclaiming disk space (build cache, unused images)..."
  docker system prune -af --volumes
  touch "$PRUNE_BREADCRUMB"
  ok "Cleanup complete. Disk state optimized."
else
  log "Recent cleanup found (within $PRUNE_INTERVAL_DAYS days). Skipping."
fi

# ── 1. FULL ENV AUDIT + PATCH ────────────────────────────────────────────────
header "1. ENV CHECK & PATCH"

# Required vars with known correct values (from local .env as source of truth)
declare -A REQUIRED_VARS=(
  ["VITE_EMAILJS_SERVICE_ID"]="service_vtd0qcv"
  ["VITE_EMAILJS_TEMPLATE_ID"]="template_tgoe3z3"
  ["VITE_EMAILJS_TEMPLATE_ID_CONTACT"]="template_ww9dkkm"
  ["VITE_EMAILJS_PUBLIC_KEY"]="nB2BtJ_zcb1kkII0G"
  ["BILLING_INTERNAL_UNLIMITED_EMAILS"]="ei@nsisong.com,isaacnsisong@gmail.com,test@koreshield.com,admin@koreshield.com,ei@koreshield.com"
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
  ["RESEND_API_KEY"]=""
  ["KORESHIELD_EAGER_APP_INIT"]="true"
  ["COOKIE_SECURE"]="true"
  ["COOKIE_SAMESITE"]="lax"
)

# Vars that must be non-empty but have secret values we don't hardcode here
MUST_EXIST=(
  JWT_SECRET POLAR_ACCESS_TOKEN POLAR_WEBHOOK_SECRET
  DEEPSEEK_API_KEY GEMINI_API_KEY GOOGLE_API_KEY
  AZURE_OPENAI_API_KEY POSTGRES_PASSWORD DATABASE_URL
  TELEGRAM_BOT_TOKEN
)

PATCHED=0
for var in "${!REQUIRED_VARS[@]}"; do
  expected="${REQUIRED_VARS[$var]}"
  current=$(grep -E "^${var}=(.+)" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- || true)
  if [ -z "$current" ]; then
    if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      sed -i "s|^${var}=.*|${var}=${expected}|" "$ENV_FILE"
      warn "PATCHED (was empty): ${var}=${expected}"
    else
      echo "${var}=${expected}" >> "$ENV_FILE"
      warn "ADDED (was missing): ${var}=${expected}"
    fi
    PATCHED=$((PATCHED+1))
  elif [ "$current" != "$expected" ]; then
    warn "DIFFERS: ${var}"
    warn "  VPS value : $current"
    warn "  Expected  : $expected"
    read -rp "  Overwrite with expected? [y/N] " ans
    if [[ "${ans,,}" == "y" ]]; then
      sed -i "s|^${var}=.*|${var}=${expected}|" "$ENV_FILE"
      ok "Updated ${var}"
      PATCHED=$((PATCHED+1))
    else
      warn "Kept VPS value for ${var}"
    fi
  else
    ok "${var} ✓"
  fi
done

for var in "${MUST_EXIST[@]}"; do
  current=$(grep -E "^${var}=(.+)" "$ENV_FILE" 2>/dev/null | head -1 | cut -d'=' -f2- || true)
  if [ -z "$current" ]; then
    warn "SECRET VAR MISSING OR EMPTY: $var — edit .env manually before continuing"
  else
    ok "${var} ✓ (set)"
  fi
done

[ "$PATCHED" -gt 0 ] && ok "${PATCHED} var(s) patched" || ok "All env vars already correct"

# ── 2. Git pull ──────────────────────────────────────────────────────────────
header "2. PULL LATEST MAIN"
if [ -d ".git" ]; then
  BEFORE=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  log "Git repo detected. Updating..."
  git fetch origin main 2>&1 | tail -3
  git reset --hard origin/main 2>&1 | tail -3
  AFTER=$(git rev-parse --short HEAD)
  if [ "$BEFORE" != "$AFTER" ]; then
    ok "Updated: $BEFORE → $AFTER"
    git log --oneline -5
  else
    ok "Already at latest: $BEFORE"
  fi
else
  warn "Not a git repository (missing .git). Skipping pull; using local files."
fi

# ── 3. Core services ─────────────────────────────────────────────────────────
header "3. CORE SERVICES (postgres + redis)"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

for i in $(seq 1 15); do
  PG=$(docker inspect --format='{{.State.Health.Status}}' koreshield-postgres 2>/dev/null || echo "starting")
  [ "$PG" = "healthy" ] && ok "Postgres healthy" && break
  [ "$i" -eq 15 ] && fail "Postgres not healthy after 60s" && exit 1
  log "  postgres: $PG ($i/15)..."; sleep 4
done

for i in $(seq 1 10); do
  RD=$(docker inspect --format='{{.State.Health.Status}}' koreshield-redis 2>/dev/null || echo "starting")
  [ "$RD" = "healthy" ] && ok "Redis healthy" && break
  [ "$i" -eq 10 ] && fail "Redis not healthy" && exit 1
  sleep 3
done

# ── 4. Rebuild API ───────────────────────────────────────────────────────────
header "4. REBUILD API"

log "Creating local image backup..."
docker tag koreshield:latest koreshield:backup 2>/dev/null || true

log "Building new API image..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache api

log "Swapping containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f api 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
ok "API container started"

log "Waiting for API health..."
for i in $(seq 1 25); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
  log "  attempt $i/25 — HTTP $HTTP"
  if [ "$HTTP" = "200" ]; then
    ok "API healthy!"
    break
  fi
  if [ "$i" -eq 25 ]; then
    fail "API failed health check! Attempting ROLLBACK to backup image..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api 2>/dev/null || true
    docker tag koreshield:backup koreshield:latest
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
    fail "Rollback complete. Please check logs: docker logs koreshield-api"
    exit 1
  fi
  sleep 4
done

# ── 5. Rebuild WEB ───────────────────────────────────────────────────────────
header "5. REBUILD WEB (bakes VITE_* vars into bundle)"

log "Creating local image backup..."
docker tag koreshield-web:latest koreshield-web:backup 2>/dev/null || true

log "Building new WEB image..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache web

log "Swapping containers..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop web 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f web 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web
ok "Web container started"

log "Waiting for Web health..."
for i in $(seq 1 20); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
  log "  attempt $i/20 — HTTP $HTTP"
  if [ "$HTTP" = "200" ]; then
    ok "Web healthy (HTTP $HTTP)"
    break
  fi
  if [ "$i" -eq 20 ]; then
    fail "Web failed health check! Attempting ROLLBACK to backup image..."
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop web 2>/dev/null || true
    docker tag koreshield-web:backup koreshield-web:latest 2>/dev/null || true
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web
    fail "Rollback complete. Please check logs: docker logs koreshield-web"
    exit 1
  fi
  sleep 3
done

# ── 6. Caddy ─────────────────────────────────────────────────────────────────
header "6. CADDY"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d caddy
ok "Caddy up"

# ── 7. Final verification ────────────────────────────────────────────────────
header "7. FINAL VERIFICATION"
sleep 4

LOCAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
[ "$LOCAL_HEALTH" = "200" ] && ok "API localhost /health → $LOCAL_HEALTH" || fail "API /health → $LOCAL_HEALTH"

WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
[ "$WEB_STATUS" = "200" ] && ok "Web :3000 → $WEB_STATUS" || warn "Web → $WEB_STATUS"

echo ""
log "Container state:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

# ── 8. Export threat logs ─────────────────────────────────────────────────────
header "8. EXPORT THREAT & BLOCK LOGS"
EXPORT_FILE="/root/koreshield_threats_$(date +%Y%m%d_%H%M%S).csv"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
  psql -U koreshield -d koreshield -c \
  "\COPY (SELECT timestamp, request_id, attack_type AS threat_type, is_blocked, block_reason, attack_detected, provider, model, status_code, ROUND(latency_ms::numeric,1) AS latency_ms, tokens_total, ROUND(cost::numeric,6) AS cost_gbp, ip_address, user_agent FROM request_logs WHERE attack_detected = true OR is_blocked = true ORDER BY timestamp DESC LIMIT 50000) TO STDOUT WITH CSV HEADER" \
  > "$EXPORT_FILE" 2>/dev/null \
  && ok "Threat logs exported → $EXPORT_FILE ($(wc -l < "$EXPORT_FILE") rows)" \
  || warn "No threat logs found yet (DB may be empty) — skipping export"

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Rollout complete!                                  ${NC}"
echo -e "${GREEN}  Commit: $(git rev-parse --short HEAD)              ${NC}"
echo -e "${GREEN}  Verify: curl https://api.koreshield.com/health     ${NC}"
echo -e "${GREEN}  Web:    https://koreshield.com                     ${NC}"
if [ -f "$EXPORT_FILE" ]; then
echo -e "${GREEN}  Logs:   $EXPORT_FILE                              ${NC}"
fi
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
