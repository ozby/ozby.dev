---
type: blueprint
owner: ozby
title: "Release red Turnstile secrets fix"
status: in-progress
complexity: S
created: "2026-06-26"
last_updated: "2026-06-26"
progress: "20% (failing release root cause confirmed; fix in progress)"
depends_on: []
---

# Release red Turnstile secrets fix

## Goal

- Restore green release/deploy CI by making production deploys satisfy Wrangler's required Turnstile secret contract.

## Architecture before

- `apps/workers/wrangler.jsonc` declares required Turnstile secrets.
- Release CI receives those values in env, but `deploy-production.ts` does not materialize them into Wrangler secret input.
- `wrangler deploy` aborts because the Worker secrets are not pre-provisioned.

## Architecture after

- Production deploy builds a temporary Wrangler secrets file from the required env-backed secret set and passes it to deploy.
- CI can deploy with the shared secret surface without requiring manual pre-provisioning drift.
- Regression coverage pins the secret-file contract.

## Tasks

#### [deploy] Task 1.1: Materialize required Wrangler secrets during production deploy

**Status:** in progress

**Depends:** None

- Confirm the failing release log and secret contract mismatch.
- Add the minimal deploy helper that writes the required secret file from env.
- Cover the helper and deploy args with tests.
- Re-run targeted release/deploy verification.

## Verification

- Targeted Vitest for deploy-production helper behavior.
- Relevant deploy contract tests.
- Local release/deploy smoke where feasible.
