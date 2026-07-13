---
type: blueprint
title: "Fix wp setup metadata and contact form routing"
owner: ozby
status: completed
complexity: M
created: '2026-07-13'
last_updated: '2026-07-13'
progress: '100% (completed)'
worktree_owner_id: owner-75c2f373b17e
worktree_owner_branch: bp/fix-wp-setup-metadata-and-contact-form-routing
historicalZeroTaskWaiver: true
historicalZeroTaskRationale: >-
  This blueprint records a completed, narrowly scoped repair whose behavior
  proof is captured by the affected integration and deploy-contract tests.
historical_zero_task_waiver: true
historical_zero_task_rationale: >-
  This blueprint records a completed, narrowly scoped repair whose behavior
  proof is captured by the affected integration and deploy-contract tests.
depends_on: []
tags:
  - tooling
  - cloudflare
  - contact-form
approvals:
  - reviewer: claude
    verdict: approve
    commit: 2eac7b36cae7f123ddbc0fdcd530f97bce15aa57
    targetHash: 2eac7b36cae7f123ddbc0fdcd530f97bce15aa57
    evidence: reviews.md
    artifact: review-artifacts/c49a674888a4a27a-claude-claude.md
    model: opus
    rev: gate:c49a674888a4a27a:claude:opus
    note: >-
      Claude returned approve-with-nits; the non-blocking /health routing
      observation is documented in the committed review artifact.
---

# Fix wp setup metadata and contact form routing

## Outcome

- Diagnosed the `wp setup` metadata failure as an upstream global
  `@webpresso/agent-kit` URL-path bug caused by Vite+ install directories that
  contain `#`; the consumer repo correctly keeps only `@webpresso/agent-config`.
- Configured Cloudflare Static Assets to send `/api/*` requests to the Worker
  first, preventing the asset layer from returning HTTP 405 for the contact
  form.

## Changed files

- `apps/workers/wrangler.jsonc`: added `assets.run_worker_first` for `/api/*`.
- `infra/src/deploy/deploy-contract.test.ts`: added a regression assertion for
  the API routing contract.

## Tasks

#### [infra] Task 1.1: Route contact API before Static Assets

**Status:** done

Added the `/api/*` `run_worker_first` rule and its deploy-contract regression
assertion; local Worker smoke requests prove the Worker receives the API path.

#### [tooling] Task 1.2: Repair wp setup runtime and verify

**Status:** done

Diagnosed the global package URL-path bug, repaired the active runtime, and
verified both dry-run and full setup completion.

## Verification

- `wp setup --dry-run` succeeds with no metadata or write failure.
- `WP_SKIP_AUTO_INSTALL=1 WP_SKIP_UPDATE_CHECK=1 wp setup --host none`
  completes successfully; the remaining preflight warning is only that this
  repository keeps its Worker and Vite projects in nested directories.
- Client build and Wrangler deploy dry-run succeed.
- Local Wrangler smoke requests to `/api/contact` return the expected 303
  invalid-submission redirect, and `/api/contact/config` returns 200 JSON.
- Governance, client, worker, and infra Vitest suites pass; typecheck, lint,
  deploy-contract audit, absolute-path audit, and diff checks pass.

## Non-goals

- No production deployment or real contact submission was performed.
- No dependency or lockfile change was made; the repository follows the
  supported global `wp` installation contract.
