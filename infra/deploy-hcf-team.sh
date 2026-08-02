#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# HCF ERP — deploy team.hopecommonersfoundation.com on the SthirMind VPS
# ---------------------------------------------------------------------
# Serves the static HCF ERP site (hcf-erp/) as a NEW subdomain through the
# EXISTING sthirmind-nginx container (which already owns ports 80/443).
# It does NOT touch the running SthirMind app — it only ADDS server blocks.
#
# What it changes (backups are written for each, *.bak.<timestamp>):
#   • infra/nginx/nginx.conf         → adds `include /etc/nginx/conf.d/*.conf;`
#   • infra/docker-compose.prod.yml  → mounts conf.d/ + hcf-erp/ into nginx
#   • infra/nginx/conf.d/*.conf      → new team HTTP + HTTPS server blocks
#
# PREREQUISITE: a DNS A record  team → <this VPS IP>  (same IP as sthirmind).
#
# Run as root on the VPS:
#   cd /opt/sthirmind && bash infra/deploy-hcf-team.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="team.hopecommonersfoundation.com"
APP_DIR="/opt/sthirmind"
BRANCH="claude/hcf-erp-platform-setup-dfsmou"
EMAIL="hopecommonersfoundation@gmail.com"

COMPOSE="docker compose -f $APP_DIR/infra/docker-compose.prod.yml"
NGINX_CONF="$APP_DIR/infra/nginx/nginx.conf"
COMPOSE_FILE="$APP_DIR/infra/docker-compose.prod.yml"
CONFD="$APP_DIR/infra/nginx/conf.d"
SITE_DIR="$APP_DIR/hcf-erp"
SSL_DIR="$APP_DIR/infra/nginx/ssl"

blue(){ echo -e "\033[0;34m[HCF]\033[0m  $*"; }
ok(){   echo -e "\033[0;32m[ OK ]\033[0m $*"; }
warn(){ echo -e "\033[1;33m[WARN]\033[0m $*"; }
die(){  echo -e "\033[0;31m[FAIL]\033[0m $*"; exit 1; }

# ── Sanity ───────────────────────────────────────────────────────────
[ -d "$APP_DIR/.git" ]        || die "$APP_DIR is not the SthirMind repo. Run the SthirMind VPS setup first."
command -v docker >/dev/null  || die "Docker not found."
docker ps --format '{{.Names}}' | grep -q '^sthirmind-nginx$' \
  || die "sthirmind-nginx is not running. Start the SthirMind stack first: $COMPOSE up -d"

# ── 1. DNS check (warn only) ─────────────────────────────────────────
SERVER_IP="$(curl -fsSL https://api.ipify.org 2>/dev/null || echo '')"
RESOLVED="$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}')"
blue "This VPS public IP : ${SERVER_IP:-unknown}"
blue "$DOMAIN resolves to: ${RESOLVED:-<nothing>}"
if [ -n "$SERVER_IP" ] && [ "$RESOLVED" != "$SERVER_IP" ]; then
  warn "DNS is not pointing here yet."
  warn "Add this record at your domain provider, then re-run:"
  warn "    Type: A   Host: team   Value: $SERVER_IP   TTL: default"
  warn "Continuing — but the SSL step will FAIL until DNS propagates."
fi

# ── 2. Export the static site from the branch (no branch switch) ─────
blue "Fetching HCF ERP files ($BRANCH)…"
git -C "$APP_DIR" fetch origin "$BRANCH" --quiet
rm -rf "$SITE_DIR"; mkdir -p "$SITE_DIR"
git -C "$APP_DIR" archive "origin/$BRANCH:hcf-erp" | tar -x -C "$SITE_DIR"
[ -f "$SITE_DIR/index.html" ] || die "Site export failed (no index.html)."
ok "Static site ready at $SITE_DIR"

# ── 3. conf.d dir + team HTTP block (safe: no cert needed) ───────────
mkdir -p "$CONFD"
cat > "$CONFD/team-http.conf" <<'EOF'
# HCF ERP — team subdomain · HTTP (ACME challenge + redirect to HTTPS)
server {
  listen 80;
  server_name team.hopecommonersfoundation.com;

  location /.well-known/acme-challenge/ { root /var/www/certbot; }
  location / { return 301 https://$host$request_uri; }
}
EOF
ok "Wrote team HTTP server block"

# ── 4. Make nginx include conf.d (idempotent + backup) ──────────────
if ! grep -q 'include /etc/nginx/conf.d/\*.conf;' "$NGINX_CONF"; then
  cp "$NGINX_CONF" "$NGINX_CONF.bak.$(date +%s)"
  sed -i 's#^http {#http {\n  include /etc/nginx/conf.d/*.conf;#' "$NGINX_CONF"
  ok "Enabled conf.d include in nginx.conf (backup saved)"
else
  ok "conf.d include already present"
fi

# ── 5. Mount conf.d + site into the nginx service (idempotent) ──────
if ! grep -q '/usr/share/nginx/hcf-erp' "$COMPOSE_FILE"; then
  cp "$COMPOSE_FILE" "$COMPOSE_FILE.bak.$(date +%s)"
  sed -i 's#\(- \./nginx/nginx\.conf:/etc/nginx/nginx\.conf:ro\)#\1\n      - ./nginx/conf.d:/etc/nginx/conf.d:ro\n      - ../hcf-erp:/usr/share/nginx/hcf-erp:ro#' "$COMPOSE_FILE"
  ok "Mounted conf.d + site into nginx (backup saved)"
else
  ok "nginx mounts already present"
fi

# ── 6. Recreate nginx → team :80 live (ACME ready) ──────────────────
blue "Recreating nginx…"
$COMPOSE up -d nginx
sleep 3
docker exec sthirmind-nginx nginx -t || die "nginx config test failed — restore from *.bak files."
docker exec sthirmind-nginx nginx -s reload || true
ok "team :80 is live"

# ── 7. Issue Let's Encrypt certificate (webroot) ────────────────────
if [ ! -f "$SSL_DIR/live/$DOMAIN/fullchain.pem" ]; then
  blue "Requesting SSL certificate for $DOMAIN…"
  $COMPOSE run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    --non-interactive --agree-tos --no-eff-email \
    --email "$EMAIL" -d "$DOMAIN" \
    || die "Cert failed. Ensure the DNS A record 'team → $SERVER_IP' has propagated, then re-run."
  ok "Certificate obtained"
else
  ok "Certificate already present"
fi

# ── 8. team HTTPS block (static site) ───────────────────────────────
cat > "$CONFD/team-ssl.conf" <<'EOF'
# HCF ERP — team subdomain · HTTPS (static site)
server {
  listen 443 ssl http2;
  server_name team.hopecommonersfoundation.com;

  ssl_certificate     /etc/nginx/ssl/live/team.hopecommonersfoundation.com/fullchain.pem;
  ssl_certificate_key /etc/nginx/ssl/live/team.hopecommonersfoundation.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSLTEAM:10m;

  root /usr/share/nginx/hcf-erp;
  index index.html;

  location / { try_files $uri $uri/ =404; }

  location ~* \.(?:css|js|jpe?g|png|gif|svg|webp|ico|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public";
  }
}
EOF

# ── 9. Reload with HTTPS ────────────────────────────────────────────
docker exec sthirmind-nginx nginx -t || die "nginx test failed after adding HTTPS block — check $CONFD/team-ssl.conf."
docker exec sthirmind-nginx nginx -s reload
ok "HTTPS is live"

echo
ok  "🎉 Deployed!"
echo "    Landing : https://$DOMAIN"
echo "    Portal  : https://$DOMAIN/activity-upload/index.html"
echo "    Admin   : https://$DOMAIN/admin/dashboard.html"
echo
echo "Re-run this script any time to publish updated HCF ERP files."
