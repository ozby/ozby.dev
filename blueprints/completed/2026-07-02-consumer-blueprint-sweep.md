---
type: blueprint
owner: ozby
title: "Consumer blueprint sweep"
status: completed
complexity: M
created: "2026-07-02"
last_updated: "2026-07-02"
completed_at: "2026-07-02"
progress_pct: 100
progress: "Fresh origin/main worktrees were scanned across ingest-lens, edge-matte, ozby.dev, and aksaprocess.tr; every still-open consumer blueprint received an evidence-backed complete/archive decision."
depends_on: []
---

# Consumer blueprint sweep

## Goal

Clear every non-completed consumer blueprint across `ingest-lens`,
`edge-matte`, `ozby.dev`, and `aksaprocess.tr` using fresh `origin/main`
filesystem truth rather than README summaries or local branch state.

## Wave 0 baseline

All lifecycle decisions in this sweep were taken from fresh worktrees created on
2026-07-02 from `origin/main`:

- `ingest-lens` → `codex/blueprint-sweep-20260702-ingest-lens`
- `edge-matte` → `codex/blueprint-sweep-20260702-edge-matte`
- `ozby.dev` → `codex/blueprint-sweep-20260702-ozby.dev`
- `aksaprocess.tr` → `codex/blueprint-sweep-20260702-aksaprocess.tr`

Notable drift caught by this baseline pass: `ingest-lens` had a locally visible
`in-progress` lightweight-version blueprint, but fresh `origin/main` already had
that blueprint in `blueprints/completed/2026-06-18-lightweight-version-automation.md`.

## Cross-repo dependency scan

| Repo | Open blueprint on fresh `origin/main` | Decision | Shared surfaces / proof dependencies | Serialization notes |
| --- | --- | --- | --- | --- |
| `ingest-lens` | `draft/framework-package-consumer-cutover.md` | Complete | `package-surface.json`, live package/import grep, `wp audit blueprint-lifecycle` | Independent |
| `ingest-lens` | `draft/migrate-ingest-lens-release-flow-to-changesets.md` | Archive | `.github/workflows/release.yml`, `infra/release-metadata.production.json`, `test/reusable-deploy-workflows.test.ts`, completed lightweight-version blueprint | Independent |
| `edge-matte` | `draft/framework-docs-cleanup.md` | Complete | `docs/secrets.md`, `wp audit architecture-drift --root .`, `wp audit blueprint-lifecycle` | Independent of security rollout |
| `edge-matte` | `parked/2026-05-28-edge-matte-security-hardening.md` | Archive | `docs/release.md`, `docs/secrets.md`, `docs/runbooks/abuse-response.md`, live `curl` evidence against production | Must wait for external Cloudflare/secret rollout; no further repo-local code work |
| `ozby.dev` | `draft/changesets-only-production-deploys.md` | Archive | `.github/workflows/release.yml`, `test/ci-governance-contract.test.ts`, `infra/src/deploy/deploy-contract.test.ts`, completed lightweight-version blueprint | Independent |
| `aksaprocess.tr` | none | Verify only | `find blueprints -maxdepth 2 -type f` | No lane required |

## Shared workflow / release assumptions checked in Wave 0

| Repo | `changesets-release.yml` SHA | `cloudflare-production.yml` SHA |
| --- | --- | --- |
| `ingest-lens` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` |
| `edge-matte` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` |
| `ozby.dev` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` | `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0` |
| `aksaprocess.tr` | `aaf5e03cb7b215bcc8232858ebcf4cbbec2a8c0e` | `aaf5e03cb7b215bcc8232858ebcf4cbbec2a8c0e` |

## Decision matrix outcome

- `ingest-lens`: one blueprint completed, one stale draft archived.
- `edge-matte`: one blueprint completed, one externally blocked rollout record archived.
- `ozby.dev`: one stale template draft archived.
- `aksaprocess.tr`: already zero-open; verification only.

## Final acceptance target

After per-repo verification, the expected steady state is zero blueprints in
`draft`, `planned`, `in-progress`, or `parked` for all four consumers.

## Verification evidence

### ingest-lens

- `wp audit blueprint-lifecycle` — pass
- `git diff --check` — pass
- `node --test test/reusable-deploy-workflows.test.ts` — pass
- `wp lint` — pass
- `wp typecheck` — pass
- `rg -n '@webpresso/webpresso' --glob '!blueprints/**' .` — no live matches

### edge-matte

- `wp audit blueprint-lifecycle` — pass
- `git diff --check` — pass
- `wp audit docs-frontmatter` — pass
- `wp audit architecture-drift --root .` — pass
- `wp lint` — pass
- `vp run typecheck` — pass
- `curl -I https://edge-matte.ozby.dev/health` — `HTTP/2 200` without Access headers
- `curl -I https://edge-matte.ozby.dev/` — `HTTP/2 200` without Access headers
- `curl -s https://edge-matte.ozby.dev/api/security-config` — `{"turnstile":{"enabled":false,"siteKey":null,"action":"upload"}}`

### ozby.dev

- `wp audit blueprint-lifecycle` — pass
- `git diff --check` — pass
- `wp test --file test/ci-governance-contract.test.ts` — pass
- `vp run --filter @ozby-dev/infra test` — pass
- `wp lint` — pass
- `wp typecheck` — pass

### aksaprocess.tr

- `wp audit blueprint-lifecycle` — pass
- `git diff --check` — pass
- zero open blueprint inventory on fresh `origin/main` — pass

## Final zero-open sweep

- `ingest-lens` — zero files in `draft/`, `planned/`, `in-progress/`, `parked/`
- `edge-matte` — zero files in `draft/`, `planned/`, `in-progress/`, `parked/`
- `ozby.dev` — zero files in `draft/`, `planned/`, `in-progress/`, `parked/`
- `aksaprocess.tr` — zero files in `draft/`, `planned/`, `in-progress/`, `parked/`
