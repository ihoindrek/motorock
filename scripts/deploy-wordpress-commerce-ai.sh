#!/usr/bin/env bash
# Package Commerce AI mu-plugins for shop.motorock.eu (direct storefront + v0.5.6).
#
# Usage:
#   ./scripts/deploy-wordpress-commerce-ai.sh
#   ./scripts/deploy-wordpress-commerce-ai.sh --upload
#
# Optional upload (set in environment or .env.local):
#   WP_DEPLOY_HOST=...
#   WP_DEPLOY_USER=...
#   WP_DEPLOY_PATH=/home/.../public_html/wp-content
#   WP_DEPLOY_PORT=22

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WP_DIR="$ROOT/wordpress"
ARCHIVE="/tmp/motorock-commerce-ai-deploy.tar.gz"
UPLOAD=false

if [[ "${1:-}" == "--upload" ]]; then
  UPLOAD=true
fi

for path in \
  motorock-commerce-ai.php \
  motorock-ai-writer.php \
  motorock-commerce-ai \
  motorock-ai-writer; do
  if [[ ! -e "$WP_DIR/$path" ]]; then
    echo "Missing: $WP_DIR/$path" >&2
    exit 1
  fi
done

tar -czf "$ARCHIVE" \
  -C "$WP_DIR" \
  motorock-commerce-ai.php \
  motorock-ai-writer.php \
  motorock-commerce-ai \
  motorock-ai-writer

echo "Created $ARCHIVE ($(du -h "$ARCHIVE" | awk '{print $1}'))"
echo
echo "Manual install on shop.motorock.eu:"
echo "  1. Extract into wp-content/mu-plugins/"
echo "  2. Hard-refresh WP admin (Cmd+Shift+R) before testing AI"
echo "  3. Verify wp-config.php has MOTOROCK_STOREFRONT_URL and MOTOROCK_AI_API_SECRET"
echo "  4. Test: product editor → Generate with AI (WP should stay responsive)"

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
: "${WP_DEPLOY_PATH:?Set WP_DEPLOY_PATH for --upload (wp-content path)}"

PORT="${WP_DEPLOY_PORT:-22}"
MU_PLUGINS="${WP_DEPLOY_PATH%/}/mu-plugins"

rsync -avz -e "ssh -p $PORT" \
  "$WP_DIR/motorock-commerce-ai.php" \
  "$WP_DIR/motorock-ai-writer.php" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$MU_PLUGINS/"

rsync -avz --delete -e "ssh -p $PORT" \
  "$WP_DIR/motorock-commerce-ai/" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$MU_PLUGINS/motorock-commerce-ai/"

rsync -avz --delete -e "ssh -p $PORT" \
  "$WP_DIR/motorock-ai-writer/" \
  "$WP_DEPLOY_USER@$WP_DEPLOY_HOST:$MU_PLUGINS/motorock-ai-writer/"

echo "Uploaded Commerce AI mu-plugins to $WP_DEPLOY_HOST:$MU_PLUGINS/"
