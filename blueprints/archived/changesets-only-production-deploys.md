---
type: blueprint
owner: ozby
title: "Changesets-only production deploys"
status: archived
complexity: M
created: "2026-06-25"
last_updated: "2026-07-02"
progress: "Archived as stale template scaffolding: fresh origin/main already enforces Changesets-only production deploys through completed release-automation work and contract tests."
depends_on: []
cross_repo_depends_on: []
tags: []
---

# Changesets-only production deploys

This draft is archived because it is template scaffolding rather than the
truthful record of current repo state.

## Archive note

Fresh `origin/main` already satisfies the intended outcome:

- `.github/workflows/release.yml` runs a Changesets release job on `main`, then
  gates production deploys on `needs.gate.outputs.should_deploy == 'true'`.
- `test/ci-governance-contract.test.ts` proves release PR skip rules remain in
  place.
- `infra/src/deploy/deploy-contract.test.ts` proves the Changesets-only release
  and production deploy contract.
- `blueprints/completed/2026-06-18-lightweight-version-automation.md` already
  records the live lightweight-release policy.

Why archive instead of complete this file:

- the file is still the raw blueprint template, with placeholder tasks,
  diagrams, and acceptance criteria;
- the actual implementation truth already lives in current workflows/tests and
  the completed lightweight-version automation blueprint;
- rewriting the template into a second completed history file would add noise,
  not evidence.

## Verification evidence

- `sed -n '1,220p' .github/workflows/release.yml`
- `wp test --file test/ci-governance-contract.test.ts`
- `vp run --filter @ozby-dev/infra test`
- `wp audit blueprint-lifecycle`
