#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Packaging CSYNC extension zip..."
pnpm package:csync

echo "Building with CF_WORKERS=1 (same as CI)..."
cd apps/web
CF_WORKERS=1 pnpm exec vite build

echo "Verifying CSYNC zip in dist/client..."
test -f dist/client/csync-extension.zip || {
  echo "error: dist/client/csync-extension.zip missing after build"
  exit 1
}

echo "Deploying from apps/web..."
pnpm exec wrangler deploy "$@"
