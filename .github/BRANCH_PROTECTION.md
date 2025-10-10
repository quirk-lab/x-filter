# Branch Protection Policy

To satisfy the library constitution's review and quality requirements, protect the following branches:

- `main`
- `release/*`

## Required Status Checks

- `CI (Node 18.x)`
- `CI (Node 20.x)`

All checks must succeed before merge. Pull requests must be rebased (linear history enforced).

## Required Reviews

- Minimum of **two maintainer approvals**
- Reviewers must be members of `@x-filter/maintainers` or the relevant package team listed in `CODEOWNERS`

## Additional Rules

- Dismiss stale reviews on new commits
- Require signed commits (optional, recommended)
- Block merges on unresolved conversations
- Enforce branch up-to-date requirement prior to merging
- Run `pnpm security` locally (wraps `pnpm audit`) before requesting review for dependency updates

Document any exceptions in CHANGELOG along with mitigation steps.
