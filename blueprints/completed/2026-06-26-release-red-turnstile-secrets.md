---
type: blueprint
owner: ozby
title: "Release red Turnstile secrets fix"
status: completed
completed_at: "2026-06-28"
complexity: S
created: "2026-06-26"
last_updated: "2026-06-28"
progress_pct: 100
progress: "100% (production deploy secret materialization merged on main; latest release/deploy runs green)"
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

**Status:** done

**Depends:** None

- Confirm the failing release log and secret contract mismatch.
- Add the minimal deploy helper that writes the required secret file from env.
- Cover the helper and deploy args with tests.
- Re-run targeted release/deploy verification.

## Verification

- Targeted Vitest for deploy-production helper behavior.
- Relevant deploy contract tests.
- Local release/deploy smoke where feasible.

## Current completion evidence

- `infra/src/deploy/deploy-production.ts` now:
  - validates the required Turnstile env-backed secrets with `resolveRequiredWranglerSecrets`;
  - writes a temporary JSON secrets payload with `writeWranglerSecretsFile`;
  - passes that file to Wrangler via `--secrets-file`;
  - deletes the temporary directory in a `finally` block after the deploy attempt, including thrown deploy failures.
- `infra/src/deploy/deploy-production.test.ts` covers the required-secret resolution and Wrangler secrets-file generation behavior.
- `infra/src/deploy/deploy-contract.test.ts` asserts the production deploy path still routes through `deploy-production.ts --release-version \"${RELEASE_VERSION}\" --skip-smoke` and keeps the Worker secret contract explicit in `apps/workers/wrangler.jsonc`.
- GitHub `main` evidence:
  - `CI` run `28225407410` succeeded on commit `700a395b56a6c39573a96f21fab9b9ca4901eaa7` on 2026-06-26.
  - `Deploy preview` run `28225407685` succeeded on the same commit on 2026-06-26.
  - `Release` run `28225407660` succeeded on the same commit on 2026-06-26.
  - The later `main` release run `28231388550` on commit `be4baf25011c9f73d0676f5a20d1b530c0ea9732` also succeeded on 2026-06-26, confirming the fix stayed green after the follow-up workflow SHA bump.
- `gh pr list --base main --state open` returned no open PRs on 2026-06-28.
