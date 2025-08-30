# prisma-dev.sh
#!/usr/bin/env sh
set -e
pnpm run db:deploy
exec "$@"
