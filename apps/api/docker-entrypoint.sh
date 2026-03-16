#!/bin/sh
set -e

echo "Pushing database schema..."
npx -w packages/db prisma db push --skip-generate

echo "Seeding database..."
npx tsx packages/db/prisma/seed.ts || echo "Seed skipped (may already exist)"

echo "Starting API server..."
exec npx tsx apps/api/src/server.ts
