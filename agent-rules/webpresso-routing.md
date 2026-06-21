---
type: rule
slug: webpresso-routing
title: Webpresso Routing
status: active
scope: repo
applies_to: [agents]
related:
  - cmd-execution
created: "2026-06-15"
last_reviewed: "2026-06-15"
---

# Webpresso Routing

Use the repo-owned Webpresso surfaces before ad hoc command forms.

## Command routing

- Prefer `wp` for audits, tests, lint, typecheck, QA, hooks, and deploy-lane validation.
- Prefer `vp` for repo script execution and package-scoped orchestration.
- Do not wrap `wp` in package-manager command chains such as `pnpm run wp`, `npm run wp`, `yarn wp`, `bun run wp`, or `vp run wp`.

## Secrets and provider access

- Route secret-aware execution through the repo contract (`wp secrets doctor --profile <profile> --json`, `wp secrets run --sink <sink> --profile <profile> -- <cmd>`, or repo-owned wrappers).
- Do not call secret-provider CLIs directly from agent instructions when a repo-owned Webpresso surface already exists.
