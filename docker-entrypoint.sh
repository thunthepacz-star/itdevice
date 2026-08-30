#!/bin/sh
set -e

echo "🚀 Starting IT Device Register container..."

# Check and push database schema if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "📦 Checking and syncing PostgreSQL database schema (prisma db push)..."
  npx prisma db push --skip-generate || echo "⚠️ Notice: Database sync encountered an issue, proceeding with startup..."
fi

echo "✨ Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
