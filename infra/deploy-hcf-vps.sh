#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# HCF ERP — universal VPS deploy for team.hopecommonersfoundation.com
# ---------------------------------------------------------------------
# Auto-detects the environment and does the right thing:
#   • INTEGRATED : if the SthirMind Docker nginx (sthirmind-nginx) is
#                  running, it adds team.* as extra server blocks there.
#   • STANDALONE : if ports 80/443 are free, it installs host nginx +
#                  certbot and serves the site directly.
#   • CONFLICT   : if something else holds 80/443, it stops and explains.
#
# PREREQUISITE: DNS A record  team → <this VPS IP>  must already exist.
#
# Run as root on the VPS (one line):
#   bash <(curl -fsSL https://raw.githubusercontent.com/tomarganesh10-cell/Sthirmind/refs/heads/claude/hcf-erp-platform-setup-dfsmou/infra/deploy-hcf-vps.sh)
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="team.hopecommonersfoundation.com"
EMAIL="hopecommonersfoundation@gmail.com"
BRANCH="claude/hcf-erp-platform-setup-dfsmou"
TARBALL="https://codeload.github.com/tomarganesh10-cell/Sthirmind/tar.gz/refs/heads/${BRANCH}"
WEBROOT="/var/www/hcf-erp"
APP_DIR="/opt/sthirmind"

blue(){ echo -e "\033[0;34m[HCF]\033[0m  $*"; }
ok(){   echo -e "\033[0;32m[ OK ]\033[0m $*"; }
warn(){ echo -e "\033[1;33m[WARN]\033[0m $*"; }
die(){  echo -e "\033[0;31m[FAIL]\033[0m $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Please run as root (use: sudo bash …)."
command -v curl >/dev/null || die "curl not found. Install: apt-get install -y curl"

# ── Detect this server's public IP + DNS ─────────────────────────────
SERVER_IP="$(curl -fsSL https://api.ipify.org 2>/dev/null || echo '')"
RESOLVED="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}')"
blue "This VPS public IP : ${SERVER_IP:-unknown}"
blue "$DOMAIN resolves to: ${RESOLVED:-<nothing>}"
if [ -z "$RESOLVED" ]; then
  warn "No DNS record for $DOMAIN yet."
  warn "Add:  Type A · Host team · Value ${SERVER_IP:-<this VPS IP>} · TTL default"
  warn "The SSL step will FAIL until it propagates (check: dig +short $DOMAIN)."
elif [ -n "$SERVER_IP" ] && [ "$RESOLVED" != "$SERVER_IP" ]; then
  warn "$DOMAIN points to $RESOLVED but this VPS is $SERVER_IP — fix the A record."
fi

# ── Download the static site ─────────────────────────────────────────
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
blue "Downloading HCF ERP files…"
curl -fsSL "$TARBALL" | tar xz -C "$TMP" || die "Download failed (is the VPS online?)."
SRC="$(find "$TMP" -maxdepth 2 -type d -name hcf-erp | head -1)"
[ -n "$SRC" ] && [ -f "$SRC/index.html" ] || die "Could not find hcf-erp files in download."
ok "Files downloaded"

# ── Detect mode ──────────────────────────────────────────────────────
MODE="standalone"
if command -v docker >/dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^sthirmind-nginx$'; then
  MODE="integrated"
elif ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE '(:80|:443)$'; then
  MODE="conflict"
fi
blue "Deployment mode: $MODE"

# ═════════════════════════════════════════════════════════════════════
# INTEGRATED — add team.* to the running sthirmind-nginx
# ═════════════════════════════════════════════════════════════════════
if [ "$MODE" = "integrated" ]; then
  [ -d "$APP_DIR/infra" ] || die "sthirmind-nginx is running but $APP_DIR/infra not found."
  COMPOSE="docker compose -f $APP_DIR/infra/docker-compose.prod.yml"
  NGINX_CONF="$APP_DIR/infra/nginx/nginx.conf"
  COMPOSE_FILE="$APP_DIR/infra/docker-compose.prod.yml"
  CONFD="$APP_DIR/infra/nginx/conf.d"
  SSL_DIR="$APP_DIR/infra/nginx/ssl"

  blue "Publishing site to $APP_DIR/hcf-erp"
  rm -rf "$APP_DIR/hcf-erp"; mkdir -p "$APP_DIR/hcf-erp"; cp -r "$SRC/." "$APP_DIR/hcf-erp/"

  mkdir -p "$CONFD"
  cat > "$CONFD/team-http.conf" <<'EOF'
server {
  listen 80;
  server_name team.hopecommonersfoundation.com;
  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}
EOF

  if ! grep -q 'include /etc/nginx/conf.d/\*.conf;' "$NGINX_CONF"; then
    cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%s)"
    sed -i 's#^http {#http {\n  include /etc/nginx/conf.d/*.conf;#' "$NGINX_CONF"
    ok "Enabled conf.d include (backup saved)"
  fi
  if ! grep -q '/usr/share/nginx/hcf-erp' "$COMPOSE_FILE"; then
    cp "$COMPOSE_FILE" "$COMPOSE_FILE.bak.$(date +%s)"
    sed -i 's#\(- \./nginx/nginx\.conf:/etc/nginx/nginx\.conf:ro\)#\1\n      - ./nginx/conf.d:/etc/nginx/conf.d:ro\n      - ../hcf-erp:/usr/share/nginx/hcf-erp:ro#' "$COMPOSE_FILE"
    ok "Mounted conf.d + site into nginx (backup saved)"
  fi

  blue "Recreating nginx…"; $COMPOSE up -d nginx; sleep 3
  docker exec sthirmind-nginx nginx -t || die "nginx test failed — restore *.bak files."
  docker exec sthirmind-nginx nginx -s reload || true

  if [ ! -f "$SSL_DIR/live/$DOMAIN/fullchain.pem" ]; then
    blue "Requesting SSL certificate…"
    $COMPOSE run --rm --entrypoint certbot certbot certonly \
      --webroot -w /var/www/certbot --non-interactive --agree-tos --no-eff-email \
      --email "$EMAIL" -d "$DOMAIN" \
      || die "Cert failed. Ensure 'team → ${SERVER_IP}' DNS has propagated, then re-run."
  fi

  cat > "$CONFD/team-ssl.conf" <<'EOF'
server {
  listen 443 ssl http2;
  server_name team.hopecommonersfoundation.com;
  ssl_certificate     /etc/nginx/ssl/live/team.hopecommonersfoundation.com/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/live/team.hopecommonersfoundation.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  root /usr/share/nginx/hcf-erp;
  index index.html;
  location / { try_files $uri $uri/ =404; }
  location ~* \.(?:css|js|jpe?g|png|gif|svg|webp|ico|woff2?)$ { expires 30d; add_header Cache-Control "public"; }
}
EOF
  docker exec sthirmind-nginx nginx -t || die "nginx test failed after SSL block."
  docker exec sthirmind-nginx nginx -s reload
  ok "HTTPS live (integrated with sthirmind-nginx)"

# ═════════════════════════════════════════════════════════════════════
# CONFLICT — 80/443 busy but not sthirmind-nginx
# ═════════════════════════════════════════════════════════════════════
elif [ "$MODE" = "conflict" ]; then
  warn "Ports 80/443 are in use by another service (not sthirmind-nginx):"
  ss -ltnp 2>/dev/null | grep -E ':(80|443)\b' || true
  die "Tell me what this service is (apache? another docker?) and I'll adapt the script."

# ═════════════════════════════════════════════════════════════════════
# STANDALONE — fresh VPS: install host nginx + certbot
# ═════════════════════════════════════════════════════════════════════
else
  blue "Installing nginx + certbot…"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -q
  apt-get install -y -q nginx certbot python3-certbot-nginx >/dev/null
  ok "Packages ready"

  blue "Publishing site to $WEBROOT"
  rm -rf "$WEBROOT"; mkdir -p "$WEBROOT"; cp -r "$SRC/." "$WEBROOT/"
  chown -R www-data:www-data "$WEBROOT" 2>/dev/null || true

  cat > /etc/nginx/sites-available/hcf-team.conf <<'EOF'
server {
  listen 80;
  listen [::]:80;
  server_name team.hopecommonersfoundation.com;

  root /var/www/hcf-erp;
  index index.html;

  location / { try_files $uri $uri/ =404; }
  location ~* \.(?:css|js|jpe?g|png|gif|svg|webp|ico|woff2?)$ { expires 30d; add_header Cache-Control "public"; }
}
EOF
  ln -sf /etc/nginx/sites-available/hcf-team.conf /etc/nginx/sites-enabled/hcf-team.conf
  nginx -t || die "nginx config test failed."
  systemctl enable nginx >/dev/null 2>&1 || true
  systemctl restart nginx
  ok "Site live on HTTP"

  # Firewall (if ufw is active)
  if command -v ufw >/dev/null && ufw status 2>/dev/null | grep -q "Status: active"; then
    ufw allow 80/tcp  >/dev/null 2>&1 || true
    ufw allow 443/tcp >/dev/null 2>&1 || true
  fi

  blue "Requesting SSL certificate (Let's Encrypt)…"
  certbot --nginx --non-interactive --agree-tos --redirect \
    -m "$EMAIL" -d "$DOMAIN" \
    || die "Cert failed. Ensure 'team → ${SERVER_IP}' DNS has propagated, then re-run."
  ok "HTTPS live (standalone nginx)"
fi

echo
ok "🎉 Deployed!"
echo "    Landing : https://$DOMAIN"
echo "    Portal  : https://$DOMAIN/activity-upload/index.html"
echo "    Admin   : https://$DOMAIN/admin/dashboard.html"
echo
echo "Re-run this command any time to publish updated files."
