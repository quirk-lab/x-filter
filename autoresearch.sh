#!/usr/bin/env bash
set -e
echo "=== running tests ==="
pnpm test
echo ""
echo "=== running benchmarks ==="
npx tsx packages/core/benchmarks/bench.ts
