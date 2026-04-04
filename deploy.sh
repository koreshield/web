#!/bin/bash
# ============================================================
# KoreShield Safe Rollout Script
# Run as root from the repo root on the VPS:
#   bash deploy.sh
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()   { echo -e "${GREEN}[ OK ]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
fail() { echo -e "${RED}[FAIL]${NC}  $*"; }
head() { echo -e "\n${CYAN}══════════════════════════════════════════${NC}"; echo -e "${CYAN}  $*${NC}"; echo -e "${CYAN}══════════════════════════════════════════${NC}"; }

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

# ── 1. ENV DIFF + PATCH ──────────────────────────────────────────────────────
head "1. ENV CHECK & PATCH"

# Required env vars with their expected values
declare -A REQUIRED_VARS=(
  ["VITE_EMAILJS_SERVICE_ID"]="service_vtd0qcv"
  ["VITE_EMAILJS_TEMPLATE_ID"]="template_tgoe3z3"
  ["VITE_EMAILJS_TEMPLATE_ID_CONTACT"]="template_ww9dkkm"
  ["VITE_EMAILJS_PUBLIC_KEY"]="nB2BtJ_zcb1kkII0G"
  ["BILLING_INTERNAL_UNLIMITED_EMAILS"]="ei@nsisong.com,isaacnsisong@gmail.com,tes@koreshield.com,admin@koreshield.com,ei@koreshield.com"
  ["POLAR_DEFAULT_CURRENCY"]="GBP"
  ["POLAR_SERVER"]="production"
)

PATCHED=0
for var in "${!REQUIRED_VARS[@]}"; do
  expected="${REQUIRED_VARS[$var]}"
  # Check if var exists and is non-empty in .env
  current=$(grep -E "^${var}=(.+)" "$ENV_FILE" | cut -d'=' -f2- || true)
  if [ -z "$current" ]; then
    if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
      # Key exists but is empty — update it
      sed -i "s|^${var}=.*|${var}=${expected}|" "$ENV_FILE"
      warn "PATCHED (was empty): ${var}=${expected}"
    else
      # Key missing entirely — append it
      echo "${var}=${expected}" >> "$ENV_FILE"
      warn "ADDED (was missing): ${var}=${expected}"
    fi
    PATCHED=$((PATCHED+1))
  elif [ "$current" != "$expected" ]; then
    warn "DIFFERS: ${var}"
    warn "  VPS has : $current"
    warn "  Expected: $expected"
    read -rp "  Overwrite with expected value? [y/N] " ans
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

if [ "$PATCHED" -eq 0 ]; then
  ok "All env vars already correct — no changes needed"
else
  ok "${PATCHED} env var(s) updated"
fi

# Show the current EmailJS block for confirmation
echo ""
log "Current EmailJS config in .env:"
grep -E "^VITE_EMAILJS_" "$ENV_FILE" | while read -r line; do
  echo "  $line"
done

# ── 2. Git pull ──────────────────────────────────────────────────────────────
head "2. PULL LATEST MAIN"

if git rev-parse --git-dir > /dev/null 2>&1; then
  BEFORE=$(git rev-parse --short HEAD)
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
  warn "Not a git repo — skipping pull"
fi

# ── 3. Ensure postgres + redis healthy ───────────────────────────────────────
head "3. CORE SERVICES (postgres + redis)"

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

for i in $(seq 1 15); do
  PG=$(docker inspect --format='{{.State.Health.Status}}' koreshield-postgres 2>/dev/null || echo "missing")
  [ "$PG" = "healthy" ] && ok "Postgres healthy" && break
  [ "$i" -eq 15 ] && fail "Postgres not healthy after 60s" && exit 1
  log "  postgres: $PG ($i/15)..."; sleep 4
done

for i in $(seq 1 10); do
  RD=$(docker inspect --format='{{.State.Health.Status}}' koreshield-redis 2>/dev/null || echo "missing")
  [ "$RD" = "healthy" ] && ok "Redis healthy" && break
  [ "$i" -eq 10 ] && fail "Redis not healthy" && exit 1
  sleep 3
done

# ── 4. Rebuild API ───────────────────────────────────────────────────────────
head "4. REBUILD API"

log "Building API image..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache api
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop api 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f api 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api
ok "API container started"

log "Waiting for API health..."
for i in $(seq 1 25); do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
  log "  attempt $i/25 — HTTP /health: $HTTP"
  [ "$HTTP" = "200" ] && ok "API healthy!" && break
  [ "$i" -eq 25 ] && fail "API not healthy after 100s" && docker logs koreshield-api --tail 60 && exit 1
  sleep 4
done

# ── 5. Rebuild WEB ───────────────────────────────────────────────────────────
head "5. REBUILD WEB (bakes new EmailJS key + pricing changes)"

log "Building web image with updated env..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache web
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop web 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" rm -f web 2>/dev/null || true
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d web
ok "Web container started"

# ── 6. Ensure Caddy running ──────────────────────────────────────────────────
head "6. CADDY"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d caddy
ok "Caddy up"

# ── 7. Final verification ────────────────────────────────────────────────────
head "7. FINAL VERIFICATION"

sleep 4

LOCAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health 2>/dev/null || echo "000")
[ "$LOCAL_HEALTH" = "200" ] && ok "API localhost:8000/health → $LOCAL_HEALTH" || fail "API /health → $LOCAL_HEALTH"

CADDY_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: api.koreshield.com" http://localhost/health 2>/dev/null || echo "000")
[ "$CADDY_HEALTH" = "200" ] && ok "Caddy proxy /health → $CADDY_HEALTH" || warn "Caddy proxy → $CADDY_HEALTH (check external)"

# Check web is serving HTML
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
[ "$WEB_STATUS" = "200" ] && ok "Web container :3000 → $WEB_STATUS" || warn "Web container → $WEB_STATUS"

echo ""
log "Container state:"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Rollout complete. Verify externally:              ${NC}"
echo -e "${GREEN}  curl https://api.koreshield.com/health            ${NC}"
echo -e "${GREEN}  open https://koreshield.com                       ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
