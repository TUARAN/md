#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Building with CF_WORKERS=1 (same as CI)..."
pnpm package:syncblog-plugin
cd apps/web
CF_WORKERS=1 pnpm exec vite build

echo "Deploying from apps/web..."
pnpm exec wrangler deploy "$@"
