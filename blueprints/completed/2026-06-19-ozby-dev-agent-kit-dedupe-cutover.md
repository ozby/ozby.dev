---
type: blueprint
title: "ozby-dev: agent-kit dedupe cutover"
owner: ozby
status: completed
completed_at: "2026-06-19"
complexity: S
created: "2026-06-19"
last_updated: "2026-06-19"
progress: "100% (local setup/version-helper drift removed; deploy/release callers simplified; repo-owned workflow setup drift removed; reusable workflow callers now use the shared capability-aware contract)"
depends_on: []
cross_repo_depends_on:
  - repo: webpresso/agent-kit
    slug: 2026-06-19-agent-kit-wp-shared-e2e-secrets-act-supervisor
    require_status: completed
  - repo: webpresso/github-actions
    slug: 2026-06-19-github-actions-shared-setup-oidc-cache-pin-hardening
    require_status: in-progress
tags:
  - ozby-dev
  - wp
  - ci
  - setup
---

# ozby-dev: agent-kit dedupe cutover

**Goal:** Align `ozby-dev` with the shared Agent Kit / GitHub Actions setup and secret/runtime contract, removing repo-local duplication while preserving current app/infra behavior.

## Tasks

1. Replace duplicated setup/workflow logic with shared lanes.
2. Remove forbidden repo-local clones covered by the plan.
3. Verify the repo still satisfies its current CI/deploy contract.

#### [cutover] Task 3.1: Remove duplicated helper/setup ownership and adopt shared capability-aware workflow callers

**Status:** done

**Depends:** None

**Verification:**

```webpresso-evidence-v1
[{"agent":"codex","command":"../node_modules/.bin/vitest run src/deploy/deploy-contract.test.ts","exit_code":0,"kind":"integration","result":"pass","target_files":[".github/workflows/deploy-preview.yml",".github/workflows/deploy-production.yml",".github/workflows/release.yml","infra/src/deploy/deploy-contract.test.ts"],"ts":"2026-06-19T22:19:00Z"},{"agent":"codex","audit_kind":"harness-surfaces","kind":"audit","passed":true,"result":"pass","ts":"2026-06-19T15:16:00Z"},{"agent":"codex","audit_kind":"secret-provider-quarantine","kind":"audit","passed":true,"result":"pass","ts":"2026-06-19T15:16:00Z"}]
```

## Verification

- affected workflow validation
- repo `wp` verification gates

## Current completion evidence

- Deleted retired local helper:
  - `scripts/resolve-webpresso-cli-versions.js`
- Local setup action now installs global `vite-plus` + `@webpresso/agent-kit`
  directly rather than depending on the retired version-resolution helper.
- Deploy/release caller `install_command` blocks now use direct global installs
  and no longer reference the retired local helper.
- Repo-owned CI/security/harness/architecture workflows no longer invoke the
  local `setup-webpresso` action; they now install shared global tooling
  directly in the workflow steps.
- The now-unused local `.github/actions/setup-webpresso/action.yml` file was
  deleted.
- Reusable workflow caller cleanup:
  - `.github/workflows/deploy-preview.yml`,
    `.github/workflows/deploy-production.yml`, and `.github/workflows/release.yml`
    no longer pass `skip_when_ci_secret_missing` and now pass only the shared
    `ci_secret_provider_token` plus repo-owned `secret_profile`
