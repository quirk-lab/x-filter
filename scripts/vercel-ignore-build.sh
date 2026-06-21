#!/usr/bin/env bash
# Vercel ignoreBuildStep script.
# Exit 0 = skip build, exit 1 = proceed with build.
#
# Only rebuild the docs site when changes touch:
#   - apps/web/          (the docs app itself)
#   - packages/          (workspace packages the docs app depends on)
#   - vercel.json        (deploy config)
#   - root package.json / pnpm-lock.yaml (dependency changes)
#   - tsconfig*.json     (TS config changes affecting build)

set -euo pipefail

# Fallbacks when Vercel env vars are absent (e.g. first deploy or manual run).
PREVIOUS_SHA="${VERCEL_GIT_PREVIOUS_SHA:-}"
CURRENT_SHA="${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo '')}"

if [ -z "$PREVIOUS_SHA" ]; then
  # No previous commit to compare — always build (first deploy or force push).
  exit 1
fi

# Get the list of changed files between the two commits.
CHANGED=$(git diff --name-only "$PREVIOUS_SHA" "$CURRENT_SHA" 2>/dev/null || true)

if [ -z "$CHANGED" ]; then
  # Diff failed or empty — build to be safe.
  exit 1
fi

# Patterns that should trigger a rebuild.
PATTERNS=(
  '^apps/web/'
  '^packages/'
  '^vercel\.json'
  '^package\.json'
  '^pnpm-lock\.yaml'
  '^tsconfig.*\.json'
  '^\.env\.example'
)

for file in $CHANGED; do
  for pattern in "${PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      exit 1
    fi
  done
done

# No relevant files changed — skip the build.
exit 0
