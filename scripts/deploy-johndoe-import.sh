#!/usr/bin/env bash
# Deploy John Doe catalog + run WP-CLI import (with-images-only by default).
#
# Usage:
#   ./scripts/deploy-johndoe-import.sh              # dry-run import on server
#   ./scripts/deploy-johndoe-import.sh --run        # live import + backfill + revalidate
#   ./scripts/deploy-johndoe-import.sh --run --fetch  # refresh stock CSV first
#
# Requires .env.local: WP_DEPLOY_HOST, WP_DEPLOY_USER, WP_DEPLOY_PATH, REVALIDATE_SECRET

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN=false
FETCH=false

for arg in "$@"; do
  case "$arg" in
    --run) RUN=true ;;
    --fetch) FETCH=true ;;
  esac
done

if [[ -f "$ROOT/.env.local" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$ROOT/.env.local"
  set +a
fi

: "${WP_DEPLOY_HOST:?Set WP_DEPLOY_HOST in .env.local}"
: "${WP_DEPLOY_USER:?Set WP_DEPLOY_USER in .env.local}"
: "${WP_DEPLOY_PATH:?Set WP_DEPLOY_PATH in .env.local}"

PORT="${WP_DEPLOY_PORT:-22}"
WP_ROOT="$(dirname "$WP_DEPLOY_PATH")"
REMOTE="$WP_DEPLOY_USER@$WP_DEPLOY_HOST"
SSH=(ssh -p "$PORT" "$REMOTE")
RSYNC=(rsync -avz -e "ssh -p $PORT")

echo "==> Building with-images-only import CSV"
if [[ "$FETCH" == true ]]; then
  (cd "$ROOT" && npm run import:johndoe -- --fetch --with-images-only)
else
  (cd "$ROOT" && npm run import:johndoe -- --input output/johndoe/source-stock.csv --with-images-only)
fi

echo "==> Deploying catalog importer plugin"
"$ROOT/scripts/deploy-wordpress-catalog-importer.sh" --upload

UPLOAD_BASE="$WP_ROOT/wp-content/uploads/motorock-catalog-importer"
CSV_REMOTE="$UPLOAD_BASE/csv/johndoe-source.csv"
CACHE_REMOTE="$UPLOAD_BASE/cache/johndoe-partseurope-index.json"

echo "==> Uploading stock CSV + Parts Europe cache"
"${SSH[@]}" "mkdir -p '$UPLOAD_BASE/csv' '$UPLOAD_BASE/cache'"
"${RSYNC[@]}" "$ROOT/output/johndoe/source-stock.csv" "$REMOTE:$CSV_REMOTE"
"${RSYNC[@]}" "$ROOT/output/johndoe/.cache/partseurope-index.json" "$REMOTE:$CACHE_REMOTE"
"${RSYNC[@]}" "$ROOT/wordpress/motorock-backfill-pa-brand.php" "$REMOTE:$WP_ROOT/motorock-backfill-pa-brand.php"

IMPORT_ARGS="with-images-only"
if [[ "$RUN" != true ]]; then
  IMPORT_ARGS="dry-run with-images-only"
fi

echo "==> Running John Doe import on server (${IMPORT_ARGS})"
"${SSH[@]}" "cd '$WP_ROOT' && php wp-cli.phar eval-file wp-content/plugins/motorock-catalog-importer/scripts/run-johndoe-import.php '$CSV_REMOTE' $IMPORT_ARGS"

if [[ "$RUN" != true ]]; then
  echo
  echo "Dry run complete. Re-run with --run to import live."
  exit 0
fi

echo "==> Backfill pa_brand for John Doe products"
"${SSH[@]}" "cd '$WP_ROOT' && php wp-cli.phar eval-file motorock-backfill-pa-brand.php" || true

echo "==> Revalidate storefront cache"
(cd "$ROOT" && npm run revalidate)

echo
echo "John Doe import finished."
