#!/bin/bash
# ── SthirMind VPS First-Time Setup ───────────────────────────
# Run as root on a fresh Ubuntu 22.04 VPS
set -e

DOMAIN="sthirmind.playplate.in"
APP_DIR="/opt/sthirmind"
APP_USER="sthirmind"

echo "🚀 Setting up SthirMind VPS..."

# ── System updates ────────────────────────────────────────────
apt-get update -q && apt-get upgrade -y -q
apt-get install -y -q git curl ufw fail2ban

# ── Docker ────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
fi

# ── App user ─────────────────────────────────────────────────
id -u $APP_USER &>/dev/null || useradd -m -s /bin/bash $APP_USER
usermod -aG docker $APP_USER

# ── Firewall ─────────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
echo "✅ Firewall configured"

# ── Clone repo ────────────────────────────────────────────────
if [ ! -d "$APP_DIR" ]; then
  git clone https://github.com/tomarganesh10-cell/Sthirmind.git $APP_DIR
  chown -R $APP_USER:$APP_USER $APP_DIR
fi

# ── Environment file ─────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  cp $APP_DIR/.env.example $APP_DIR/.env
  echo ""
  echo "⚠️  IMPORTANT: Edit $APP_DIR/.env and fill in all values:"
  echo "   nano $APP_DIR/.env"
  echo ""
fi

# ── SSL directory ─────────────────────────────────────────────
mkdir -p $APP_DIR/infra/nginx/ssl
chmod 755 $APP_DIR/infra/deploy.sh

echo ""
echo "✅ VPS setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit /opt/sthirmind/.env with real API keys"
echo "  2. Point DNS: $DOMAIN → $(curl -s ifconfig.me)"
echo "  3. Run: bash /opt/sthirmind/infra/deploy.sh"
