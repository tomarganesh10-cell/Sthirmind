#!/bin/bash
# ── SthirMind deploy on a VPS where another app already owns :80/:443 ──
# Adds SthirMind as a second site behind the existing (Playplate) nginx.
# Does NOT touch the other app's containers or configs.
set -e

DOMAIN="sthirmind.hopecommonersfoundation.com"
EMAIL="hopecommonersfoundation@gmail.com"
APP_DIR="/opt/sthirmind"
WEB_ROOT="/var/www/sthirmind"
DATA_DIR="/opt/sthirmind-data"
PROXY="playplate-nginx-1"
CONFD="/root/playplate/infra/nginx/conf.d"
LE_DIR="/root/playplate/certbot/conf"
ACME_DIR="/root/playplate/certbot/www"

echo "=== SthirMind — shared-nginx deploy ==="

# 0. sanity
docker inspect "$PROXY" >/dev/null 2>&1 || { echo "ERROR: $PROXY not running"; exit 1; }
[ -d "$CONFD" ] || { echo "ERROR: $CONFD not found"; exit 1; }

NET=$(docker inspect "$PROXY" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}' | awk '{print $1}')
echo "[1/6] Proxy network: $NET"

# 1. latest code + files
cd "$APP_DIR" && git fetch origin main -q && git reset --hard origin/main -q
mkdir -p "$WEB_ROOT" "$DATA_DIR" "$ACME_DIR"
cp -r "$APP_DIR"/apps/pwa/* "$WEB_ROOT"/
echo "[2/6] Files copied to $WEB_ROOT"

# 2. secrets / keys
[ -f "$DATA_DIR/.secret" ] || openssl rand -hex 24 > "$DATA_DIR/.secret"
APP_SECRET=$(cat "$DATA_DIR/.secret")
AI_KEY=""; GEMINI_KEY=""; GROQ_KEY=""; ADMIN_PW=""
if [ -f "$APP_DIR/.env" ]; then
  AI_KEY=$(grep -E '^ANTHROPIC_API_KEY=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '\042\047')
  GEMINI_KEY=$(grep -E '^GEMINI_API_KEY=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '\042\047')
  GROQ_KEY=$(grep -E '^GROQ_API_KEY=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '\042\047')
  ADMIN_PW=$(grep -E '^ADMIN_PASSWORD=' "$APP_DIR/.env" | cut -d= -f2- | tr -d '\042\047')
fi
[ "$AI_KEY" = "sk-ant-REPLACE_ME" ] && AI_KEY=""
[ -z "$ADMIN_PW" ] && ADMIN_PW="hope2026"

# 3. containers (no host ports — only reachable inside $NET)
docker rm -f sthir-ai sthir-web >/dev/null 2>&1 || true
docker run -d --name sthir-ai --restart always --network "$NET" \
  -e ANTHROPIC_API_KEY="$AI_KEY" -e GEMINI_API_KEY="$GEMINI_KEY" -e GROQ_API_KEY="$GROQ_KEY" \
  -e ADMIN_PASSWORD="$ADMIN_PW" -e APP_SECRET="$APP_SECRET" -e DB_FILE="/data/db.json" \
  -v "$WEB_ROOT/server.mjs":/app/server.mjs:ro -v "$DATA_DIR":/data -w /app \
  node:20-alpine node server.mjs >/dev/null
docker run -d --name sthir-web --restart always --network "$NET" \
  -v "$WEB_ROOT":/usr/share/nginx/html:ro nginx:1.27-alpine >/dev/null
echo "[3/6] Containers up (sthir-ai, sthir-web)"
if [ -n "$AI_KEY$GEMINI_KEY$GROQ_KEY" ]; then echo "      AI key loaded ✅"; else echo "      No AI key — coach uses offline wisdom replies"; fi

# 4. HTTP-only vhost so certbot can validate
cat > "$CONFD/sthirmind.conf" <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location /api/ { proxy_pass http://sthir-ai:8080; proxy_set_header Host $host; proxy_read_timeout 60s; }
  location / { proxy_pass http://sthir-web:80; proxy_set_header Host $host; }
}
NGINX
docker exec "$PROXY" nginx -s reload
echo "[4/6] HTTP vhost live"

# 5. certificate (webroot — no downtime for the other site)
if [ ! -f "$LE_DIR/live/$DOMAIN/fullchain.pem" ]; then
  docker run --rm -v "$LE_DIR":/etc/letsencrypt -v "$ACME_DIR":/var/www/certbot \
    certbot/certbot certonly --webroot -w /var/www/certbot \
    --non-interactive --agree-tos --email "$EMAIL" -d "$DOMAIN" || echo "      SSL failed — staying on HTTP"
fi

# 6. HTTPS vhost if cert exists
if [ -f "$LE_DIR/live/$DOMAIN/fullchain.pem" ]; then
cat > "$CONFD/sthirmind.conf" <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 443 ssl;
  http2 on;
  server_name sthirmind.hopecommonersfoundation.com;
  ssl_certificate     /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/privkey.pem;
  location /api/ { proxy_pass http://sthir-ai:8080; proxy_set_header Host $host; proxy_read_timeout 60s; }
  location = /sw.js { proxy_pass http://sthir-web:80/sw.js; add_header Cache-Control "no-cache"; }
  location / { proxy_pass http://sthir-web:80; proxy_set_header Host $host; }
}
NGINX
  docker exec "$PROXY" nginx -s reload
  echo "[5/6] HTTPS live 🔒"
else
  echo "[5/6] Serving over HTTP (cert pending)"
fi

echo "[6/6] Done"
echo ""
echo "App:      https://$DOMAIN"
echo "Landing:  https://$DOMAIN/download.html"
echo "Admin:    https://$DOMAIN/admin.html  (password from .env ADMIN_PASSWORD)"
docker ps --filter name=sthir- --format 'table {{.Names}}\t{{.Status}}'
