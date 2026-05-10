#!/bin/sh
set -eu

echo "[entrypoint] applying prisma schema"
npx prisma db push --skip-generate

echo "[entrypoint] starting application: $*"
exec "$@"