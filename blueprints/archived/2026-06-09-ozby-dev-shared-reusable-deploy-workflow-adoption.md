---
type: blueprint
title: "ozby.dev: shared reusable deploy workflow adoption"
owner: ozby
status: archived
complexity: M
created: "2026-06-09"
last_updated: "2026-06-16"
progress: "Superseded: the workflow-adoption work landed and the truthful end-state is already captured by the completed 2026-06-09 alignment cleanup blueprint. Remaining structural work now lives in 2026-06-16-ozby-dev-consumer-apps-infra-standardization."
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

This blueprint is archived because the underlying adoption work already landed
on `main`, and the repo's truthful post-adoption state is recorded in:

- `completed/2026-06-09-ozby-dev-shared-reusable-deploy-workflow-alignment.md`

It should not be used as the active plan for current work. The remaining live
repo-local structural follow-up now belongs to:

- `planned/2026-06-16-ozby-dev-consumer-apps-infra-standardization.md`

## Archive note

- Original planning value: captured the intended preview/prod workflow adoption
  before the final truth-state cleanup.
- Why archived: the completed alignment blueprint replaced this as the accurate
  record after adoption landed, and leaving this file in `planned/` incorrectly
  suggested unfinished deploy adoption work.
- Rationale preserved: the current standardization lane still builds on the
  deploy adoption outcome captured here; archiving changes lifecycle truth, not
  historical intent.
- Successor lane: consumer-shape standardization, not deploy-workflow adoption.
