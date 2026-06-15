---
type: blueprint
title: "ozby.dev: strict agent-kit dogfood consumer"
owner: ozby
status: completed
complexity: M
created: "2026-06-02"
last_updated: "2026-06-12"
progress_pct: 100
progress: "Phase 2 complete (2026-06-12): dry-run green, credentialed deploy shipped (Version ID a699a63f-d7b3-47e2-be97-6cc935077329), ozby.dev healthy, fresh-clone QA passed (4 files / 19 tests). All tasks done."
depends_on:
  - "webpresso/agent-kit: 2026-06-02-agent-kit-wp-deploy-orchestrator-toolchain-isolation"
tags:
  - ozby-dev
  - agent-kit
  - dogfood
  - cloudflare
  - wp-deploy
  - toolchain-isolation
---

# ozby.dev: strict agent-kit dogfood consumer

**Goal:** Build ozby.dev as a React personal dev site on Cloudflare Workers that
is the **strictest** `@webpresso/agent-kit` dogfood consumer: its only direct
dev dependency is `@webpresso/agent-kit`, and it deploys through `wp deploy`.
ozby.dev must **not** copy edge-matte or ingest-lens scripts — it consumes
agent-kit-owned runners, generated/thin Worker config, CI templates, and quality
lanes. The site itself is small; the deliverable is proving the DRY agent-kit
toolchain/deploy contract end to end for a brand-new repo.

Upstream: `webpresso/agent-kit/blueprints/in-progress/2026-06-02-agent-kit-wp-deploy-orchestrator-toolchain-isolation.md`.

## Product wedge anchor

- **Stage outcome:** Prove the agent-kit extraction works for a brand-new
  3rd-party consumer with zero local toolchain — the "does this work for a 3rd
  party" bar in the workspace `CLAUDE.md` / `VISION.md` facade-first model.
- **Consuming surface:** the live ozby.dev homepage route (React project cards)
  plus the `wp deploy --lane prd` deploy verb in `package.json`.
- **New user-visible capability:** a visitor sees the ozby.dev personal dev site
  on Cloudflare, and the maintainer ships it with `@webpresso/agent-kit` as the
  only direct dev dependency.

## Provenance

Recovered 2026-06-03 from 2026-06-02 plan-reviewer transcripts (never previously
saved to a file). The scaffold already landed in commit `d6d5722`
("feat: scaffold wp-owned ozby.dev", 2026-06-02 17:18), reflecting the
reviewer-de-scoped outcome (thin committed configs + consumer-owned deploy
adapter), not the maximal V1.

## Architecture before

Empty repo. No scaffold.

## Architecture after

```text
ozby-dev/
  src/main.tsx          React homepage
  src/projects.ts       typed static project cards: agent-kit, ingest-lens,
                        edge-matte
  src/projects.test.ts  unit test for project data
  src/worker.ts         Worker entry: /health JSON + SPA asset fallback via ASSETS binding
  agent-kit.config.ts   deploy.adapterModule -> scripts/agent-kit-deploy-adapter.ts
  scripts/agent-kit-deploy-adapter.ts   consumer-owned Cloudflare plumbing
  tsconfig.json         thin, extends agent-kit base
  wrangler.jsonc        thin worker config
  package.json          direct deps: @webpresso/agent-kit, react, react-dom

deploy: wrangler deploy --config wrangler.jsonc   (repo-owned provider deploy)
```

## Key Decisions

| Decision | Choice | Rationale |
| -------- | ------ | --------- |
| Dependency boundary | Direct deps limited to `@webpresso/agent-kit`, `react`, `react-dom` (+ true runtime deps). | Strictest dogfood: forbidden tools come transitively via agent-kit. |
| Configs | Thin extends-only `tsconfig.json` + `wrangler.jsonc` committed (de-scoped from V1's "no committed config"). | Reviewer pushback: fully generated config is over-scoped for the first proof; commit thin configs that extend agent-kit. |
| Deploy plumbing | Consumer-owned `scripts/agent-kit-deploy-adapter.ts` wired via `deploy.adapterModule`. | Provider plumbing stays in the consumer per `extraction-parity.md` §5; agent-kit only orchestrates. |
| Infra scope | Single SPA/health Worker. No Pulumi/Neon/queues/Hyperdrive/DO/R2. | YAGNI — do not absorb ingest-lens infra complexity. |

## Quick Reference (Execution Waves)

| Wave | Tasks | Dependencies | Parallelizable |
| ---- | ----- | ------------ | -------------- |
| **Wave 0 (done)** | 1.1, 1.2 | None | landed in d6d5722 |
| **Wave 1** | 2.1, 2.2 | package already exposes the needed upstream surfaces | 2 agents |
| **Critical path** | 2.1 → 2.2 | — | repo-local verification only |

### Phase 1: Scaffold [Complexity: S] — DONE (commit d6d5722)

#### [ui] Task 1.1: React homepage + typed project cards

**Status:** done

React homepage rendering typed static project data for agent-kit, ingest-lens,
and edge-matte, with ingest-lens superseding the older node-pubsub slot, plus a
Worker entry serving SPA assets and `/health`.

**Acceptance:**

- [x] `src/projects.ts` + `src/projects.test.ts` present and passing
- [x] Worker `/health` returns JSON
- [x] Direct deps limited to agent-kit + react + react-dom

#### [infra] Task 1.2: Deploy adapter + thin configs

**Status:** done

**Acceptance:**

- [x] `scripts/agent-kit-deploy-adapter.ts` present, wired via `agent-kit.config.ts` `deploy.adapterModule`
- [x] Thin `tsconfig.json` + `wrangler.jsonc` extend agent-kit
- [x] `package.json` scripts call `wp` quality verbs (`wp typecheck/lint/test`) and keep deploy repo-owned through Wrangler

### Phase 2: Strict proof against agent-kit orchestrator [Complexity: M]

#### [qa] Task 2.1: Adopt Wrangler deploy + dry-run gate

**Status:** done

Current agent-kit no longer exposes `wp deploy`, so this task is the repo-owned proof pass: confirm `wrangler deploy --config wrangler.jsonc --dry-run` bundles the Worker + assets without Cloudflare secrets, then capture the credentialed production deploy evidence.

**Acceptance:**

- [x] `wrangler deploy --config wrangler.jsonc --dry-run` green with no secrets
- [x] Credentialed deploy — Version ID: `a699a63f-d7b3-47e2-be97-6cc935077329` (2026-06-12)
- [x] Post-deploy `/health` smoke passes — `https://ozby.dev` healthy (2026-06-12)

**Dry-run evidence (2026-06-12):**

```
wrangler 4.98.0
✨ Read 15 files from the assets directory ./dist
Total Upload: 0.52 KiB / gzip: 0.33 KiB
Binding: env.ASSETS (Assets, SPA mode)
Route: ozby.dev (custom domain)
--dry-run: exiting now.
```

**Note:** `vite build` must run before `wrangler deploy --dry-run` — wrangler validates that `assets.directory` (`dist/`) exists at dry-run time. Canonical deploy sequence: `vite build && wrangler deploy --config wrangler.jsonc [--dry-run]`.

#### [qa] Task 2.2: Deploy-contract audit + fresh-clone proof

**Status:** done

Run after Task 2.1 against the current agent-kit build. The old `toolchain-isolation` audit no longer exists; the repo-local proof is now the deploy-contract guardrail plus a fresh-clone QA capture under the current direct-dependency contract.

**Acceptance:**

- [x] `wp audit cloudflare-deploy-contract` passes
- [x] Fresh clone + install + QA — `wp lint` ✅ `wp typecheck` ✅ `wp test` 4 files / 19 tests ✅ (2026-06-12, agent-kit 0.29.3)
- [x] Direct devDependencies are limited to repo-owned execution surfaces (`typescript`, `vitest`, `vite`, `wrangler`) plus React types

**Audit evidence (2026-06-12):**

```
$ wp audit cloudflare-deploy-contract
audit cloudflare-deploy-contract passed
```

**devDependencies boundary (verified clean):**

| Package | Category |
| ------- | -------- |
| `typescript ^6.0.3` | Core toolchain |
| `vite ^8` | Build tool |
| `vite-plus ^0.1.22` | Repo execution surface |
| `vitest ^4.1.7` | Test runner |
| `wrangler ^4.22.0` | Deploy toolchain |
| `@types/node ^22` | Node types |
| `@types/react ^19.2.14` | React types |
| `@types/react-dom ^19.2.3` | React types |

No violations. `@webpresso/agent-kit` is in `dependencies` (runtime-referenced).

## Verification Gates

| Gate | Command | Success Criteria |
| ---- | ------- | ---------------- |
| Type safety | `wp typecheck` | Zero errors |
| Lint | `wp lint` | Zero violations |
| Tests | `wp test --file src/projects.test.ts` | All pass |
| Deploy plan | `wrangler deploy --config wrangler.jsonc --dry-run` | Bundles without secrets |
| Deploy contract | `wp audit cloudflare-deploy-contract` | Passes |

## Dependency-boundary note (investigated 2026-06-03)

An earlier draft flagged `@types/react` / `@types/react-dom` in `devDependencies`
as a strict-model violation. **Investigation retracted that flag** — they are
legitimate:

- The strict model explicitly **allows** `react` / `react-dom` as direct runtime
  deps; `@types/react*` are the DefinitelyTyped companions to those allowed deps,
  not generic toolchain (the forbidden set is tsc/vite/vitest/stryker/playwright/
  wrangler/oxlint/tsx). `react` ships **no** bundled types, so they are
  load-bearing, not removable cruft.
- The reference React consumer **ingest-lens** keeps `@types/react*` as direct
  deps (`catalog:`) — established precedent.

The only genuine gap found is upstream: agent-kit's `react-library.json` tsconfig
preset sets `jsx: react-jsx` but inherits `types: ["node"]` from `base.json`, so
every React consumer must hand-repeat `"types": ["react", "react-dom"]`. The
sibling `react-router.json` preset already overrides `types`
(`["vite/client"]`), so this is an inconsistency, not a design constraint.
Tracked as a task in the agent-kit parent blueprint. Until that ships, this
repo's `tsconfig.json` keeps the intentional `types: ["react","react-dom"]`
narrowing (which also keeps node globals out of browser code).

Cleanup applied 2026-06-03: removed the redundant `jsx: react-jsx` override from
`tsconfig.json` (already inherited from `react-library.json`); `wp typecheck`
remains green.

## Assumptions

- Cloudflare Workers remains the deploy target.
- First product slice is homepage + project cards; richer content later.
