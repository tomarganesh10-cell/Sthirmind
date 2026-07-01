#!/bin/bash
# ── SthirMind VPS One-Click Setup ────────────────────────────
# Run as root on Ubuntu 24.04:
#   bash <(curl -fsSL https://raw.githubusercontent.com/tomarganesh10-cell/Sthirmind/main/infra/setup-vps.sh)
set -e

DOMAIN="sthirmind.hopecommonersfoundation.com"
APP_DIR="/opt/sthirmind"
REPO="https://github.com/tomarganesh10-cell/Sthirmind.git"
EMAIL="hopecommonersfoundation@gmail.com"

echo "============================================"
echo "  SthirMind VPS Setup — Ubuntu 24.04"
echo "============================================"

# ── System updates ────────────────────────────────────────────
echo "[1/7] Updating system..."
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q git curl ufw fail2ban openssl

# ── Docker ────────────────────────────────────────────────────
echo "[2/7] Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
fi
docker --version

# ── Firewall ─────────────────────────────────────────────────
echo "[3/7] Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

# ── Clone repo ────────────────────────────────────────────────
echo "[4/7] Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  cd $APP_DIR && git pull origin main
else
  rm -rf $APP_DIR
  git clone $REPO $APP_DIR
fi
cd $APP_DIR

# ── Generate .env ─────────────────────────────────────────────
echo "[5/7] Creating .env file..."
if [ ! -f "$APP_DIR/.env" ]; then
  POSTGRES_PASS=$(openssl rand -hex 16)
  REDIS_PASS=$(openssl rand -hex 16)
  JWT_SECRET=$(openssl rand -hex 32)

  cat > $APP_DIR/.env << ENVEOF
# ── Database ──────────────────────────────────────────────────
POSTGRES_PASSWORD=${POSTGRES_PASS}
REDIS_PASSWORD=${REDIS_PASS}
DATABASE_URL=postgresql://sthirmind:${POSTGRES_PASS}@postgres:5432/sthirmind

# ── JWT ───────────────────────────────────────────────────────
JWT_SECRET=${JWT_SECRET}

# ── Clerk (fill these in) ─────────────────────────────────────
CLERK_PUBLISHABLE_KEY=pk_live_REPLACE_ME
CLERK_SECRET_KEY=sk_live_REPLACE_ME
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REPLACE_ME

# ── AI APIs (fill these in) ───────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-REPLACE_ME
OPENAI_API_KEY=sk-REPLACE_ME
ELEVENLABS_API_KEY=REPLACE_ME

# ── Payments (optional) ───────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_REPLACE_ME
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
RAZORPAY_KEY_ID=REPLACE_ME
RAZORPAY_KEY_SECRET=REPLACE_ME

# ── App ───────────────────────────────────────────────────────
NODE_ENV=production
DOMAIN=${DOMAIN}
ENVEOF

  echo ""
  echo "⚠️  .env created. Fill in API keys:"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# ── SSL Certificate ───────────────────────────────────────────
echo "[6/7] Getting SSL certificate..."
mkdir -p $APP_DIR/infra/nginx/ssl

# Get SSL cert via standalone certbot
docker run --rm \
  -v $APP_DIR/infra/nginx/ssl:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  -d $DOMAIN || echo "SSL: will retry on first deploy"

# ── Start App ─────────────────────────────────────────────────
echo "[7/7] Starting SthirMind..."
cd $APP_DIR
docker compose -f infra/docker-compose.prod.yml --env-file .env up -d

echo ""
echo "============================================"
echo "  Setup Complete!"
echo "============================================"
echo ""
echo "App: https://$DOMAIN"
echo ""
echo "Commands:"
echo "  Status: docker compose -f /opt/sthirmind/infra/docker-compose.prod.yml ps"
echo "  Logs:   docker compose -f /opt/sthirmind/infra/docker-compose.prod.yml logs -f"
echo "  Restart: docker compose -f /opt/sthirmind/infra/docker-compose.prod.yml restart"
echo ""
echo "Fill in API keys then restart:"
echo "  nano /opt/sthirmind/.env"
