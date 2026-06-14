#!/bin/sh
set -e

mkdir -p /app/public/uploads
chmod -R 777 /app/public

IMPORT_FLAG="/app/public/.strapi_imported"

if [ ! -f "$IMPORT_FLAG" ]; then
  echo "[entrypoint] First run — copying public dir..."
  cp -r /public-seed/. /app/public/
  touch "$IMPORT_FLAG"
  echo "[entrypoint] Public dir copy complete."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Frontend : ${FRONTEND_URL}"
echo "  Admin    : http://localhost:${PORT:-1337}/admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "[entrypoint] Starting Strapi..."
exec node_modules/.bin/strapi start
