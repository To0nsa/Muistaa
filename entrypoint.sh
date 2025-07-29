#!/usr/bin/env sh
set -e

printf 'Waiting for database…\n'
TRIES=60
while ! pg_isready -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  printf '.'
  TRIES=$((TRIES - 1))
  [ "$TRIES" -le 0 ] && echo "DB not responding" && exit 1
  sleep 1
done
printf '\nDatabase is up, running migrations…\n'

npx prisma migrate deploy

exec "$@"
