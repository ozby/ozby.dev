---
type: blueprint
title: "ozby.dev: shared reusable deploy workflow adoption"
owner: ozby
status: planned
complexity: M
created: "2026-06-09"
last_updated: "2026-06-09"
progress: "0% (planned)"
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

# ozby.dev: shared reusable deploy workflow adoption

**Goal:** Adopt the shared `agent-kit` reusable deploy harness, restore `wp deploy` as the canonical deploy surface, and add custom-domain preview lanes for `ozby.dev`.

## Planning Summary

- Current repo state: production-only deploy path, no GitHub workflows, no preview lanes
- Desired state: thin caller workflows using shared `agent-kit` harness plus repo-local adapter-backed preview/prod deploys
- Preview domains to add: `preview-main.ozby.dev`, `preview-pr-<n>.ozby.dev`

## Architecture Overview

```text
ozby-dev
  ├── agent-kit reusable workflow callers
  ├── wp deploy --lane preview_main|preview_pr_<n>|prd
  ├── repo-local deploy adapter
  └── Cloudflare custom domains:
        ozby.dev
        preview-main.ozby.dev
        preview-pr-<n>.ozby.dev
```

## Key Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Preview transport | custom-domain previews | Matches the requested parity with the other consumer repos. |
| Production trigger | tag-driven release deploys | Safer than main-push prod deploys and closer to current release-gated patterns. |
| Deploy surface | restore `wp deploy` | Bring `ozby-dev` back onto the same public deploy interface family as the other repos. |

## Quick Reference (Execution Waves)

| Wave              | Tasks | Dependencies | Parallelizable |
| ----------------- | ----- | ------------ | -------------- |
| **Wave 0**        | 1.1, 1.2 | None | 2 agents |
| **Wave 1**        | 2.1, 2.2 | Wave 0 | 2 agents |
| **Critical path** | 1.1 → 2.1 | -- | 2 waves |

### Phase 1: Preview/prod deploy surface [Complexity: M]

#### [infra] Task 1.1: Expand deploy adapter for preview_main / preview_pr_<n> / prd

**Status:** todo

**Depends:** None

The current adapter is production-only. Expand it to support canonical internal
lanes plus any repo-local mapping needed for custom-domain preview deploys.

**Acceptance:**

- [ ] Adapter supports `preview_main`, `preview_pr_<n>`, and `prd`
- [ ] Preview lanes are dry-runnable without publishing
- [ ] Production lane remains deployable and smoke-verifiable

#### [infra] Task 1.2: Add preview lane metadata and route specs

**Status:** todo

**Depends:** None

Add `deploy.cloudflare` lane and target metadata to `agent-kit.config.ts`,
including custom-domain preview route specs.

**Acceptance:**

- [ ] `agent-kit.config.ts` declares preview/prod lane metadata
- [ ] Preview route specs are additive and do not rename production
- [ ] Custom-domain conflict preflight is documented and enforced

### Phase 2: Shared workflow adoption [Complexity: M]

#### [infra] Task 2.1: Add thin preview/prod caller workflows

**Status:** todo

**Depends:** Task 1.1, Task 1.2

Create `.github/workflows/deploy-preview.yml` and
`.github/workflows/deploy-production.yml` that call the shared `agent-kit`
reusable workflows by pinned SHA.

**Acceptance:**

- [ ] Preview workflow handles main push, PR deploy, PR destroy, and manual lane dispatch
- [ ] Production workflow handles tag-driven deploys and optional manual dispatch
- [ ] Caller workflows pass repo-local install/verify/deploy/smoke commands only

#### [qa] Task 2.2: Prove live preview/prod behavior

**Status:** todo

**Depends:** Task 2.1

**Acceptance:**

- [ ] `wp deploy --lane prd --dry-run` passes
- [ ] `wp deploy --lane preview_main --dry-run` passes
- [ ] `wp deploy --lane preview_pr_123 --dry-run` passes
- [ ] `https://ozby.dev/` and `/health` pass after prod deploy
- [ ] Preview hostnames return 200 after deploy

## Verification Gates

| Gate | Command | Success Criteria |
| ---- | ------- | ---------------- |
| Type safety | `wp typecheck` | Zero errors |
| Lint | `wp lint` | Zero violations |
| Tests | `wp test --file src/projects.test.ts --file src/worker.test.ts` | All pass |
| Deploy contract | `wp audit cloudflare-deploy-contract` | Passes |
| Deploy dry-runs | `wp deploy --lane ... --dry-run` | All targeted lanes pass |

## Cross-Plan References

| Type | Blueprint | Relationship |
| ---- | --------- | ------------ |
| Upstream | `agent-kit: reusable Cloudflare deploy workflows` | Shared workflow shell owner |
| Upstream | `2026-06-02-ozby-dev-strict-agent-kit-dogfood` | Current repo baseline and existing direct-Wrangler proof lane |

## Non-goals

- Auto-deploying production on every push to `main`
- Switching preview transport to `workers.dev`
- Replacing repo-local deploy scripts with a universal deploy script

