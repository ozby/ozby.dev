---
type: blueprint
title: Repoint setup-wp to the public github-actions action
status: draft
complexity: S
owner: claude
created: "2026-07-15"
last_updated: "2026-07-15"
progress: "0% (drafted; implementation verified manually, pending formal task-verify)"
depends_on: []
tags: [ci, agent-kit]
---

# Repoint setup-wp to the public github-actions action

**Goal:** Repoint this repo's `ci.yml`, `harness-gate.yml`, and
`security-scan.yml` setup-wp action references from the private
`webpresso/agent-kit` repo to the new public
`webpresso/github-actions/.github/actions/setup-wp` action, since GitHub
cannot grant private-repo Actions access to callers outside the `webpresso`
GitHub org.

This is CI toolchain maintenance. It does not change runtime topology,
deployment shape, storage boundaries, or the public application contract.

## Product wedge anchor

- **Stage outcome:** Every CI run currently fails at "Set up job" with
  `Unable to resolve action 'webpresso/agent-kit', not found`, because that
  action lives in a private repo this repo's GitHub org cannot access.
- **Consuming surface:** This repo's own `.github/workflows/*.yml` — every PR
  to this repo, regardless of what it changes.
- **New user-visible capability:** Every future PR to this repo can pass CI
  again — currently every PR is red regardless of the actual code change.

## Key Decisions

| Decision                                | Choice                                                                                                         | Rationale                                                                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where to source `wp` install            | Public `webpresso/github-actions/.github/actions/setup-wp` action                                              | GitHub cannot grant this repo's org access to the private `webpresso/agent-kit` repo's Actions                                                                         |
| Version                                 | Hardcoded `version: "3.1.11"`                                                                                  | Matches the version the private repo's previously-pinned commit (`e02badc2...`) resolved to — preserves behavior exactly                                               |
| `scripts/check-workflow-action-pins.ts` | Removed the check rejecting any `setup-wp` `with: version:` input; updated reason text on the version-pin rule | The old private action was self-versioning; the new one requires an explicit version, so the old rejection rule is now backwards                                       |
| `test/ci-governance-contract.test.ts`   | Updated the assertion from the old private path to the new public path                                         | Hardcoded assumption from the same design; would have failed against this fix otherwise                                                                                |
| `.oxfmtrc.json`                         | Added minimal `{}`                                                                                             | Pre-commit's `wp format --affected` failed repo-wide with "No formatter config owner found"; no root `vite.config.*` exists, so a standalone config is the minimal fix |

Note: the reusable-workflow calls in `deploy-preview.yml`/`release.yml` pin an
older `webpresso/github-actions` commit (`ba439b2d`) that self-installs
`wp` via `cli-global-packages` (inline npm) rather than the private action,
so they already work and are intentionally left unchanged.

#### Task 1.1: Repoint 4 direct setup-wp occurrences and fix governance

**Status:** todo

**Depends:** None

Swap all 4 direct `uses:` occurrences (`ci.yml` x2, `harness-gate.yml`,
`security-scan.yml`) from
`webpresso/agent-kit/.github/actions/setup-wp@e02badc2ba922b2d8cbfe7f3f35fb9cf56848182`
to `webpresso/github-actions/.github/actions/setup-wp@c2c71a7a4be446fc6858e6b57bf55a11ccfa2d88`
with `with: version: "3.1.11"`. Fix `scripts/check-workflow-action-pins.ts`
and `test/ci-governance-contract.test.ts`.

**Files:**

- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/harness-gate.yml`
- Modify: `.github/workflows/security-scan.yml`
- Modify: `scripts/check-workflow-action-pins.ts`
- Modify: `test/ci-governance-contract.test.ts`

**Acceptance:**

- [ ] All 4 direct `uses:` occurrences point at the new public action's SHA with `version: "3.1.11"` (verified manually)
- [ ] `actionlint` (touched files) exits 0 (verified manually — passed)
- [ ] `node scripts/check-workflow-action-pins.ts` exits 0 (verified manually — passed)
- [ ] `vp exec vitest run test/`: all pass (verified manually — 5 tests passed)

---

## Verification Gates

| Gate           | Command                                      | Success Criteria |
| -------------- | -------------------------------------------- | ---------------- |
| Action lint    | `actionlint` (touched files)                 | Exit 0           |
| Pin governance | `node scripts/check-workflow-action-pins.ts` | Exit 0           |
| Tests          | `vp exec vitest run test/`                   | All pass         |

## Cross-Plan References

| Type       | Blueprint                                                                                            | Relationship                      |
| ---------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- |
| Upstream   | `webpresso/github-actions#23` (adds the public `setup-wp` action)                                    | blocking dependency, merged first |
| Downstream | Sibling fixes in `webpresso/framework`, `ozby/ingest-lens`, `ozby/edge-matte`, `ozby/aksaprocess.tr` | parallel, independent PRs         |

## Non-goals

- Does not touch the reusable-workflow calls in `deploy-preview.yml`/`release.yml` (pinned at `ba439b2d`, self-install via `cli-global-packages`, already working).
- Does not add a repo-local `@webpresso/agent-kit` package dependency.

## Risks

| Risk                                                                       | Impact                | Mitigation                                                             |
| -------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------- |
| Governance scripts/tests encoding the old design could resurface elsewhere | Same CI break repeats | Same fix pattern applied to sibling repos; each verified independently |
