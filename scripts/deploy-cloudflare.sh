#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Packaging csync extension zip..."
pnpm package:csync

echo "Building with CF_WORKERS=1 (same as CI)..."
CF_WORKERS=1 pnpm web build:h5-netlify

echo "Deploying from apps/web..."
cd apps/web
pnpm exec wrangler deploy "$@"
