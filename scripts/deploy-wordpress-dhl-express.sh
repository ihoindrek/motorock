#!/usr/bin/env bash
# Upload Motorock DHL Express mu-plugins to shop.motorock.eu.
#
# Usage:
#   ./scripts/deploy-wordpress-dhl-express.sh
#   ./scripts/deploy-wordpress-dhl-express.sh --upload
#
# Optional (environment or .env.local):
#   WP_DEPLOY_HOST, WP_DEPLOY_USER, WP_DEPLOY_PATH, WP_DEPLOY_PORT

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP_DIR="$ROOT/wordpress"
UPLOAD=false

if [[ "${1:-}" == "--upload" ]]; then
  UPLOAD=true
fi

for f in motorock-dhl-express.php motorock-dhl-express-lib.php; do
  if [[ ! -f "$WP_DIR/$f" ]]; then
    echo "Missing: $WP_DIR/$f" >&2
    exit 1
  fi
done

echo "Files ready:"
echo "  $WP_DIR/motorock-dhl-express.php"
echo "  $WP_DIR/motorock-dhl-express-lib.php"
echo
echo "After upload — WooCommerce → Settings → Shipping → zone → Add method → Motorock DHL Express"

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
: "${WP_DEPLOY_PATH:?Set WP_DEPLOY_PATH for --upload}"

PORT="${WP_DEPLOY_PORT:-22}"
MU_PLUGINS="${WP_DEPLOY_PATH%/}/mu-plugins"

rsync -avz -e "ssh -p $PORT" \
  "$WP_DIR/motorock-dhl-express.php" \
  "$WP_DIR/motorock-dhl-express-lib.php" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$MU_PLUGINS/"

echo "Uploaded to $WP_DEPLOY_HOST:$MU_PLUGINS/"
