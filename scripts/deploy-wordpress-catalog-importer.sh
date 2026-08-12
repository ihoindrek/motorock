#!/usr/bin/env bash
# Package Motorock Catalog Importer for upload to shop.motorock.eu.
#
# Usage:
#   ./scripts/deploy-wordpress-catalog-importer.sh
#   ./scripts/deploy-wordpress-catalog-importer.sh --upload
#
# Optional SFTP upload (set in environment or .env.local):
#   WP_DEPLOY_HOST=...
#   WP_DEPLOY_USER=...
#   WP_DEPLOY_PATH=/home/.../public_html/wp-content/plugins
#   WP_DEPLOY_PORT=22

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN_DIR="$ROOT/wordpress/motorock-catalog-importer"
ARCHIVE="/tmp/motorock-catalog-importer-deploy.tar.gz"
UPLOAD=false

if [[ "${1:-}" == "--upload" ]]; then
  UPLOAD=true
fi

if [[ ! -d "$PLUGIN_DIR" ]]; then
  echo "Plugin directory not found: $PLUGIN_DIR" >&2
  exit 1
fi

tar -czf "$ARCHIVE" -C "$ROOT/wordpress" motorock-catalog-importer
echo "Created $ARCHIVE ($(du -h "$ARCHIVE" | awk '{print $1}'))"
echo
echo "Manual install on shop.motorock.eu:"
echo "  1. Upload and extract to wp-content/plugins/motorock-catalog-importer/"
echo "  2. WP Admin → Plugins → Activate \"Motorock Catalog Importer\""
echo "  3. WooCommerce → Catalog Import → create Holy Freedom feed"
echo "  4. Test with --limit or update-only on a few SKUs first"

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

rsync -avz --delete \
  -e "ssh -p $PORT" \
  "$PLUGIN_DIR/" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$WP_DEPLOY_PATH/motorock-catalog-importer/"

echo "Uploaded plugin to $WP_DEPLOY_HOST:$WP_DEPLOY_PATH/motorock-catalog-importer/"
