#!/usr/bin/env bash
# Upload headless checkout mu-plugins to shop.motorock.eu.
#
# Usage:
#   ./scripts/deploy-wordpress-headless-checkout.sh
#   ./scripts/deploy-wordpress-headless-checkout.sh --upload
#
# Optional SFTP upload (set in environment or .env.local):
#   WP_DEPLOY_HOST=...
#   WP_DEPLOY_USER=...
#   WP_DEPLOY_PATH=/home/.../public_html/wp-content
#   WP_DEPLOY_PORT=22

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP_DIR="$ROOT/wordpress"
UPLOAD=false

if [[ "${1:-}" == "--upload" ]]; then
  UPLOAD=true
fi

for f in motorock-headless-montonio.php motorock-headless-backorders.php; do
  if [[ ! -f "$WP_DIR/$f" ]]; then
    echo "Missing: $WP_DIR/$f" >&2
    exit 1
  fi
done

echo "Files to install in wp-content/mu-plugins/:"
echo "  - motorock-headless-montonio.php (v1.3+ — Montonio card remint pending gateway)"
echo "  - motorock-headless-backorders.php (allow checkout at zero supplier stock)"
echo
echo "Catalog importer (if not already deployed): class-product-writer.php backorder on import"

if [[ "$UPLOAD" != true ]]; then
  exit 0
fi

if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env.local"
  set +a
fi

: "${WP_DEPLOY_HOST:?Set WP_DEPLOY_HOST for --upload}"
: "${WP_DEPLOY_USER:?Set WP_DEPLOY_USER for --upload}"
: "${WP_DEPLOY_PATH:?Set WP_DEPLOY_PATH for --upload (wp-content parent path)}"

PORT="${WP_DEPLOY_PORT:-22}"
MU_PLUGINS="${WP_DEPLOY_PATH%/}/mu-plugins"

rsync -avz -e "ssh -p $PORT" \
  "$WP_DIR/motorock-headless-montonio.php" \
  "$WP_DIR/motorock-headless-backorders.php" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$MU_PLUGINS/"

echo "Uploaded checkout mu-plugins to $WP_DEPLOY_HOST:$MU_PLUGINS/"
