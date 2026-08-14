#!/bin/bash
# ── SthirMind PWA + AI Coach — One-Command Deploy (no build) ──
# Serves static PWA via nginx + real AI Coach backend + auto SSL.
# Run as root on VPS. Set ANTHROPIC_API_KEY in /opt/sthirmind/.env for live AI.
set -e

DOMAIN="sthirmind.hopecommonersfoundation.com"
APP_DIR="/opt/sthirmind"
WEB_ROOT="/var/www/sthirmind"
EMAIL="hopecommonersfoundation@gmail.com"

echo "=== SthirMind PWA + AI Deploy ==="

# Latest code
cd $APP_DIR && git fetch origin main && git reset --hard origin/main

# Copy PWA files to web root
mkdir -p $WEB_ROOT
cp -r $APP_DIR/apps/pwa/* $WEB_ROOT/
echo "[1/5] Files copied to $WEB_ROOT"

# Load AI keys from .env if present (any one is enough)
AI_KEY=""; GEMINI_KEY=""; GROQ_KEY=""
if [ -f "$APP_DIR/.env" ]; then
  AI_KEY=$(grep -E '^ANTHROPIC_API_KEY=' $APP_DIR/.env | cut -d= -f2- | tr -d '"' | tr -d "'")
  GEMINI_KEY=$(grep -E '^GEMINI_API_KEY=' $APP_DIR/.env | cut -d= -f2- | tr -d '"' | tr -d "'")
  GROQ_KEY=$(grep -E '^GROQ_API_KEY=' $APP_DIR/.env | cut -d= -f2- | tr -d '"' | tr -d "'")
  ADMIN_PW=$(grep -E '^ADMIN_PASSWORD=' $APP_DIR/.env | cut -d= -f2- | tr -d '"' | tr -d "'")
fi
[ -z "$ADMIN_PW" ] && ADMIN_PW="hope2026"
[ "$AI_KEY" = "sk-ant-REPLACE_ME" ] && AI_KEY=""

# Stop old containers, free ports
docker rm -f sthir-web sthir-ai 2>/dev/null || true
fuser -k 80/tcp 443/tcp 2>/dev/null || true
sleep 2

# ── AI Coach backend ──────────────────────────────────────────
echo "[2/5] Starting AI Coach backend..."
mkdir -p /opt/sthirmind-data
[ -f /opt/sthirmind-data/.secret ] || openssl rand -hex 24 > /opt/sthirmind-data/.secret 2>/dev/null || echo "sthir-secret-fallback" > /opt/sthirmind-data/.secret
APP_SECRET=$(cat /opt/sthirmind-data/.secret)
docker run -d --name sthir-ai --restart always \
  -e ANTHROPIC_API_KEY="$AI_KEY" \
  -e GEMINI_API_KEY="$GEMINI_KEY" \
  -e GROQ_API_KEY="$GROQ_KEY" \
  -e CLAUDE_MODEL="claude-sonnet-5" \
  -e ADMIN_PASSWORD="$ADMIN_PW" \
  -e APP_SECRET="$APP_SECRET" \
  -e DB_FILE="/data/db.json" \
  -v $WEB_ROOT/server.mjs:/app/server.mjs:ro \
  -v /opt/sthirmind-data:/data \
  -w /app \
  node:20-alpine node server.mjs
if [ -n "$AI_KEY$GEMINI_KEY$GROQ_KEY" ]; then echo "  ✅ AI Coach LIVE (key loaded)"; else echo "  ⚠️  No AI key — coach uses offline wisdom replies. Add GEMINI_API_KEY (free) to .env"; fi

# ── SSL cert ──────────────────────────────────────────────────
echo "[3/5] SSL certificate..."
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
  docker run --rm -p 80:80 -v /etc/letsencrypt:/etc/letsencrypt \
    certbot/certbot certonly --standalone --non-interactive --agree-tos \
    --email $EMAIL -d $DOMAIN || echo "  SSL failed — serving HTTP"
fi

# ── nginx config ──────────────────────────────────────────────
echo "[4/5] nginx config..."
mkdir -p $APP_DIR/pwa-nginx
if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
cat > $APP_DIR/pwa-nginx/default.conf <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 443 ssl http2;
  server_name sthirmind.hopecommonersfoundation.com;
  ssl_certificate     /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/privkey.pem;
  root /usr/share/nginx/html;
  index index.html;
  location /api/ { proxy_pass http://sthir-ai:8080; proxy_set_header Host $host; proxy_read_timeout 60s; }
  location / { try_files $uri $uri/ /index.html; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
}
NGINX
else
cat > $APP_DIR/pwa-nginx/default.conf <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  root /usr/share/nginx/html;
  index index.html;
  location /api/ { proxy_pass http://sthir-ai:8080; proxy_set_header Host $host; proxy_read_timeout 60s; }
  location / { try_files $uri $uri/ /index.html; }
}
NGINX
fi

# ── nginx (shares network with AI via link) ───────────────────
echo "[5/5] Starting web server..."
docker run -d --name sthir-web --restart always \
  -p 80:80 -p 443:443 \
  --link sthir-ai:sthir-ai \
  -v $WEB_ROOT:/usr/share/nginx/html:ro \
  -v $APP_DIR/pwa-nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:1.27-alpine

echo ""
echo "=== DONE ==="
echo "Live: https://$DOMAIN"
docker ps --filter name=sthir- --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
