#!/bin/bash
# ── SthirMind PWA — One-Command Deploy (no build needed) ──────
# Serves the static PWA via nginx + auto SSL. Run as root on VPS.
set -e

DOMAIN="sthirmind.hopecommonersfoundation.com"
APP_DIR="/opt/sthirmind"
WEB_ROOT="/var/www/sthirmind"
EMAIL="hopecommonersfoundation@gmail.com"

echo "=== SthirMind PWA Deploy ==="

# Latest code
cd $APP_DIR && git fetch origin main && git reset --hard origin/main

# Copy PWA files to web root
mkdir -p $WEB_ROOT
cp -r $APP_DIR/apps/pwa/* $WEB_ROOT/
echo "[1/4] Files copied to $WEB_ROOT"

# Stop anything on port 80/443
docker rm -f sthir-web certbot-nginx sthirmind-nginx 2>/dev/null || true
fuser -k 80/tcp 2>/dev/null || true
sleep 2

# SSL cert (standalone)
echo "[2/4] Getting SSL certificate..."
docker run --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone --non-interactive --agree-tos \
  --email $EMAIL -d $DOMAIN || echo "SSL: using existing / will serve HTTP"

# nginx config
echo "[3/4] Writing nginx config..."
mkdir -p $APP_DIR/pwa-nginx
cat > $APP_DIR/pwa-nginx/default.conf <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}
server {
  listen 443 ssl http2;
  server_name sthirmind.hopecommonersfoundation.com;
  ssl_certificate     /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sthirmind.hopecommonersfoundation.com/privkey.pem;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location = /sw.js { add_header Cache-Control "no-cache"; }
  location = /manifest.json { add_header Cache-Control "no-cache"; }
}
NGINX

# If no cert, fall back to HTTP-only config
if [ ! -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]; then
cat > $APP_DIR/pwa-nginx/default.conf <<'NGINX'
server {
  listen 80;
  server_name sthirmind.hopecommonersfoundation.com;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
}
NGINX
echo "  (serving HTTP — SSL cert not found)"
fi

# Run nginx
echo "[4/4] Starting web server..."
docker run -d --name sthir-web --restart always \
  -p 80:80 -p 443:443 \
  -v $WEB_ROOT:/usr/share/nginx/html:ro \
  -v $APP_DIR/pwa-nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  nginx:1.27-alpine

echo ""
echo "=== DONE ==="
echo "Live: https://$DOMAIN"
docker ps --filter name=sthir-web
