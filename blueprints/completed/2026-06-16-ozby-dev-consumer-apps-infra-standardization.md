---
type: blueprint
title: "ozby.dev: consumer apps + infra standardization"
owner: ozby
status: completed
historical_zero_task_waiver: true
historical_zero_task_rationale: "Historical completed outcome record predates strict task-block tracking; implementation and evidence remain preserved below."
complexity: M
created: "2026-06-16"
last_updated: "2026-06-16"
progress: "100% (completed 2026-06-16)"
depends_on:
  - 2026-06-02-ozby-dev-strict-agent-kit-dogfood
  - 2026-06-09-ozby-dev-shared-reusable-deploy-workflow-alignment
tags:
  - ozby-dev
  - standardization
  - workspace
  - apps
  - workers
  - infra
  - deploy
---

# ozby.dev: consumer apps + infra standardization

**Goal:** Close the remaining truth-state gap on the already-standardized
`apps/client` + `apps/workers` + `infra` branch and remove the last deploy-path
regression before merge.

## Completion summary

- Kept the shared consumer shape (`apps/client`, `apps/workers`, `infra`) as
  the canonical repo layout.
- Closed the June 16 release blocker: `infra/src/deploy/deploy-production.ts`
  no longer shells out to bare `vp`; it now builds through
  `pnpm --filter @ozby-dev/workers run build`, with the Worker package owning
  typegen + client prebuild orchestration.
- Applied the same toolchain-safe principle to preview deploys:
  `infra/src/deploy/deploy-preview.ts` now builds the client through
  `pnpm --filter @ozby-dev/client run build`.
- Added package-local Worker type generation, committed
  `apps/workers/worker-configuration.d.ts`, and switched the Worker runtime to
  consume generated Wrangler bindings instead of a handwritten env interface.
- Added regression coverage so infra deploy entrypoints cannot quietly
  reintroduce bare `vp` shell-outs.

## Acceptance

- [x] `ozby-dev` keeps the standardized `apps/client` + `apps/workers` + `infra`
      layout.
- [x] Production and preview deploy entrypoints stop depending on ambient `vp`
      on PATH.
- [x] Worker bindings are generated from `apps/workers/wrangler.jsonc` and used
      by the runtime.
- [x] Blueprint lifecycle state reflects the actual branch truth.

## Verification

- `wp lint`
- `wp typecheck`
- `wp test --file apps/workers/src/index.test.ts --file infra/src/deploy/deploy-contract.test.ts --file infra/src/deploy/deploy-runner.test.ts --file infra/src/deploy/git-paths.test.ts --file test/ci-governance-contract.test.ts`
- `pnpm --filter @ozby-dev/workers run build`
- `pnpm run verify:deploy-contract`
- `pnpm run blueprints:check`
