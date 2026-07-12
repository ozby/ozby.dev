---
type: blueprint
title: "ozby.dev: shared reusable deploy workflow alignment cleanup"
owner: ozby
status: completed
historical_zero_task_waiver: true
historical_zero_task_rationale: "Historical completed alignment record predates strict task-block tracking; implementation and evidence remain preserved below."
complexity: S
created: "2026-06-09"
last_updated: "2026-06-11"
progress: "100% (completed 2026-06-11)"
depends_on:
  - 2026-06-02-ozby-dev-strict-agent-kit-dogfood
tags:
  - ozby-dev
  - agent-kit
  - github-actions
  - cloudflare
  - preview
  - deploy
---

# ozby.dev: shared reusable deploy workflow alignment cleanup

**Goal:** Close the stale planning loop after shared deploy harness adoption
already landed on the active ozby.dev branch, and normalize the repo's QA
contract around the existing `wp` wrappers.

## Completion summary

- Replaced the stale future-adoption blueprint that still claimed there were no
  workflows or preview lanes.
- Normalized `qa` to call the canonical `wp` test surface directly instead of
  bouncing through `pnpm run test`.
- Refreshed repo docs so the current workflow-caller and verification truth is
  explicit.

## Acceptance

- [x] No blueprint still claims missing workflows or preview lanes.
- [x] QA uses the repo's canonical shared verification surface consistently.
- [x] Blueprint state reflects the actual current branch truth.
- [x] Remaining repo-local dogfood work stays in the existing in-progress lane.

## Verification

- `wp lint`
- `wp typecheck`
- `wp test --file src/projects.test.ts --file src/worker.test.ts --file src/deploy-contract.test.ts`
- `wp audit blueprint-lifecycle`
- `wp audit cloudflare-deploy-contract`
- `wp deploy --lane prd --dry-run`
