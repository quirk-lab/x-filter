# Release & Rollback Policy

## Versioning

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- MAJOR: breaking API or contract changes across packages
- MINOR: backward-compatible feature additions
- PATCH: fixes, documentation updates, test-only improvements

## Pre-release Checklist

1. Ensure CI is green (lint, typecheck, tests, visual regression, accessibility)
2. Verify coverage ≥95% per package; publish updated dashboard artifacts
3. Update `CHANGELOG.md` with a user-focused summary
4. Provide migration notes for breaking/behavioural changes in package READMEs
5. Confirm CODEOWNERS approvals (minimum two maintainers)

## Rollback Plan

- Tag releases from protected branches only
- To rollback, create a new patch release reverting the offending commits; do not delete tags
- Document the rollback reason and remediation tasks in `CHANGELOG.md`
- Run playground smoke tests against the rollback build before promoting to consumers
