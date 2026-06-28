---
type: blueprint
owner: ozby
title: "Node 24 secret bootstrap workflow fix"
status: completed
completed_at: "2026-06-28"
complexity: S
created: "2026-06-26"
last_updated: "2026-06-28"
progress_pct: 100
progress: "100% (caller SHA bump merged on main; latest required main workflows green and no open PRs remain)"
depends_on: []
---

# Node 24 secret bootstrap workflow fix

## Goal

- Remove the remaining Node 20 deprecation annotation from preview/release deploy workflows.

## Architecture before

- Repo thin workflows call shared `webpresso/github-actions` Cloudflare reusable workflows.
- Those reusable workflows still pin `DopplerHQ/secrets-fetch-action` v1.3.0.
- GitHub now warns because that action targets Node 20 and is force-run on Node 24.

## Architecture after

- Repo thin workflows pin the upstream shared Cloudflare reusable workflows by commit SHA.
- Shared `webpresso/github-actions` workflows now use a Node-24-safe Doppler bootstrap, support schemaVersion 1 secret metadata, and pin their matching toolchain action commit.
- Consumer caller workflows only need a SHA bump to inherit the shared fix.

## Tasks

#### [workflows] Task 1.1: Bump caller workflow SHAs after upstream shared fix

**Status:** done

**Depends:** None

- Merge the shared `webpresso/github-actions` fixes for Node-24-safe secret bootstrap and toolchain action pinning.
- Update release and preview caller workflow SHAs to the merged upstream commit.
- Update deploy contract tests to pin the new shared workflow SHA.

## Verification

- Targeted workflow/contract tests.
- Relevant local lint/typecheck/tests.
- PR checks green; caller workflows now pin the shared Node-24-safe reusable-workflow SHA that carries the upstream secret-bootstrap fix.

## Current completion evidence

- `.github/workflows/deploy-preview.yml` now pins both preview reusable-workflow calls to `webpresso/github-actions` commit `ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0`.
- `.github/workflows/release.yml` now pins both release and production reusable-workflow calls to the same shared commit.
- `infra/src/deploy/deploy-contract.test.ts` pins the caller SHA and asserts the release/preview workflows reference it.
- `infra/src/deploy/secrets-policy.test.ts` keeps the consumer aligned with the upstream schemaVersion 1 secret metadata contract mentioned in this blueprint.
- GitHub `main` evidence:
  - `CI` run `28231388224` succeeded on commit `be4baf25011c9f73d0676f5a20d1b530c0ea9732` on 2026-06-26.
  - `Deploy preview` run `28231388595` succeeded on the same commit on 2026-06-26.
  - `Release` run `28231388550` succeeded on the same commit on 2026-06-26.
  - `Security scan` run `28311329446` succeeded on `main` on 2026-06-28.
- `gh pr list --base main --state open` returned no open PRs on 2026-06-28.
