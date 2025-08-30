#!/usr/bin/env sh
set -e
pnpm prisma migrate deploy && pnpm prisma db seed && pnpm prisma generate
pnpm run build
exec "$@"
