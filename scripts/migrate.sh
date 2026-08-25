#!/usr/bin/env bash
# Non-interactive migration helper for sandboxed environments where
# `prisma migrate dev` refuses to run (no TTY). Diffs the schema against
# the existing migrations, writes a new migration folder, then deploys it.
set -euo pipefail

NAME="${1:?Usage: scripts/migrate.sh <migration_name>}"
SHADOW_URL="postgresql://postgres:postgres@localhost:5432/distribuidora_shadow?schema=public"

TS=$(date -u +%Y%m%d%H%M%S)
DIR="prisma/migrations/${TS}_${NAME}"
mkdir -p "$DIR"

npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "$SHADOW_URL" \
  --script > "$DIR/migration.sql"

if [ ! -s "$DIR/migration.sql" ] || ! grep -q '[A-Za-z]' "$DIR/migration.sql"; then
  echo "No schema changes detected, removing empty migration folder."
  rmdir "$DIR"
  exit 0
fi

npx prisma migrate deploy
npx prisma generate
