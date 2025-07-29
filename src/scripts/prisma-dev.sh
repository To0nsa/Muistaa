#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <migration-name>"
  exit 1
fi

MIGRATION_NAME=$1

echo "Applying Prisma migration: $MIGRATION_NAME"
npx prisma migrate dev --name "$MIGRATION_NAME"

echo "Seeding database (prisma db seed)…"
npx prisma db seed

echo "Regenerating Prisma Client…"
npx prisma generate
