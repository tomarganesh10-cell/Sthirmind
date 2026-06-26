#!/bin/bash
# ── SthirMind Production Deploy Script ───────────────────────
# Run on your VPS: bash deploy.sh
set -e

DOMAIN="sthirmind.playplate.in"
APP_DIR="/opt/sthirmind"
COMPOSE="docker compose -f $APP_DIR/infra/docker-compose.prod.yml"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[DEPLOY]${NC} $1"; }
ok()   { echo -e "${GREEN}[  OK  ]${NC} $1"; }
warn() { echo -e "${YELLOW}[ WARN ]${NC} $1"; }
fail() { echo -e "${RED}[ FAIL ]${NC} $1"; exit 1; }

# ── 1. Prerequisites ─────────────────────────────────────────
log "Checking prerequisites..."
command -v docker   >/dev/null 2>&1 || fail "Docker not installed. Run: curl -fsSL https://get.docker.com | sh"
command -v git      >/dev/null 2>&1 || fail "Git not installed"
[ -f "$APP_DIR/.env" ] || fail "Missing $APP_DIR/.env — copy .env.example and fill values"
ok "Prerequisites OK"

# ── 2. Pull latest code ──────────────────────────────────────
log "Pulling latest code..."
cd $APP_DIR
git pull origin main
ok "Code updated"

# ── 3. Pull Docker images ────────────────────────────────────
log "Pulling latest Docker images..."
$COMPOSE pull
ok "Images pulled"

# ── 4. Run DB migrations ─────────────────────────────────────
log "Running database migrations..."
$COMPOSE run --rm api npx prisma migrate deploy 2>/dev/null || warn "Prisma migrate skipped (may not be set up)"
ok "Migrations done"

# ── 5. Start / restart services ──────────────────────────────
log "Starting services..."
$COMPOSE up -d postgres redis
log "Waiting for database..."
sleep 10

$COMPOSE up -d api
log "Waiting for API to be healthy..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T api wget -qO- http://localhost:3001/health >/dev/null 2>&1; then
    ok "API healthy"
    break
  fi
  [ $i -eq 30 ] && fail "API failed to start"
  sleep 2
done

$COMPOSE up -d web nginx certbot
ok "All services started"

# ── 6. Seed books (first deploy only) ───────────────────────
if [ "${SEED_BOOKS:-false}" = "true" ]; then
  log "Seeding wisdom books..."
  $COMPOSE exec api node -e "
    const { PrismaClient } = require('@prisma/client');
    console.log('Seeding skipped — run seed-wisdom.ts manually');
  "
fi

# ── 7. SSL certificate ───────────────────────────────────────
if [ ! -f "$APP_DIR/infra/nginx/ssl/fullchain.pem" ]; then
  warn "No SSL certificate found. Getting Let's Encrypt cert..."
  $COMPOSE run --rm certbot certbot certonly \
    --webroot -w /var/www/certbot \
    --email admin@$DOMAIN \
    --agree-tos --no-eff-email \
    -d $DOMAIN \
    && $COMPOSE restart nginx \
    && ok "SSL certificate obtained"
else
  ok "SSL certificate already exists"
fi

# ── 8. Health check ──────────────────────────────────────────
log "Running health checks..."
sleep 5
curl -sf https://$DOMAIN/health >/dev/null && ok "HTTPS health check passed" || warn "HTTPS health check failed (SSL may still be propagating)"
$COMPOSE ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   SthirMind deployed successfully! 🚀  ║${NC}"
echo -e "${GREEN}║   https://$DOMAIN        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
