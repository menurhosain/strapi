#!/bin/sh
set -e

# Ensure public dir is writable after volume mount
mkdir -p /app/public/uploads
chmod -R 777 /app/public

IMPORT_FLAG="/app/.strapi_imported"

if [ ! -f "$IMPORT_FLAG" ]; then
  echo "[entrypoint] First run — starting Strapi to apply DB migrations..."
  node_modules/.bin/strapi start &
  STRAPI_PID=$!

  echo "[entrypoint] Waiting for Strapi to be ready..."
  until curl -sf http://localhost:1337/_health > /dev/null 2>&1; do
    sleep 5
  done

  echo "[entrypoint] Migrations done. Stopping Strapi before import..."
  kill $STRAPI_PID
  wait $STRAPI_PID 2>/dev/null || true
  sleep 3

  echo "[entrypoint] Importing backup..."
  node_modules/.bin/strapi import -f /backup.tar.gz --force

  touch "$IMPORT_FLAG"
  echo "[entrypoint] Import complete."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Frontend : ${FRONTEND_URL}"
echo "  Backend  : http://localhost:${PORT:-1337}"
echo "  Admin    : http://localhost:${PORT:-1337}/admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "[entrypoint] Starting Strapi..."
exec node_modules/.bin/strapi start
