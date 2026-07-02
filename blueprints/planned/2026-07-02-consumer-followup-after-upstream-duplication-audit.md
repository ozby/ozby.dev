---
type: blueprint
owner: ozby
title: "Consumer follow-up after upstream duplication audit"
status: planned
complexity: M
created: "2026-07-02"
last_updated: "2026-07-02"
progress_pct: 0
progress: "Drafted: consumer verification and selective follow-up lane defined after the upstream cross-consumer duplication audit landed in webpresso/monorepo."
depends_on:
  - "webpresso/monorepo#106: cross-consumer duplication audit"
  - "ozby.dev: Consumer duplication upstreaming"
  - "aksaprocess.tr: Consumer duplication upstreaming"
  - "edge-matte: Consumer duplication upstreaming"
  - "ingest-lens: Consumer duplication upstreaming"
---

# Consumer follow-up after upstream duplication audit

## Goal

Use the merged upstream cross-consumer duplication audit as the source of truth, run a verification sweep across `ingest-lens`, `aksaprocess.tr`, `edge-matte`, and `ozby.dev`, and open consumer PRs only where the sweep finds real drift or a required gate-restoring fix.

## Current facts

- `webpresso/monorepo#106` merged the new cross-consumer duplication registry, audit CLI, and test coverage.
- The upstream audit currently passes against the live sibling repos with:
  - `unclassifiedRepeats = 0`
  - `missingDisposition = 0`
  - `missingOwnerOrTrigger = 0`
  - `unapprovedHandMaintainedSharedSemanticClones = 0`
- `ingest-lens` is currently on a non-main local branch, so any consumer follow-up should start from a fresh branch off `origin/main`.
- Accepted `repo-local-policy` classes are not automatically bugs; only drift or an explicit second-wave cleanup decision should create consumer code work.

## Tasks

#### [audit] Task 1.1: Re-run the upstream duplication audit against current consumer heads

**Status:** planned

**Depends:** None

Use the merged upstream audit from `webpresso/monorepo` to classify each consumer as `no follow-up`, `required fix`, or `optional cleanup only`.

**Acceptance:**

- [ ] The audit is rerun against the live sibling repos from a fresh `webpresso/monorepo` checkout.
- [ ] Each consumer has an explicit disposition recorded in execution notes.
- [ ] No consumer is queued for a PR without concrete evidence of drift or a gate-restoring need.

#### [fix] Task 1.2: Create consumer follow-up branches and PRs only where required

**Status:** planned

**Depends:** Task 1.1

For any consumer that fails the audit or has required shared-owner/generated-owned/thin-adapter drift, create the smallest fix on a fresh branch from `origin/main`, verify it locally, and open a PR.

**Acceptance:**

- [ ] Only consumers with real follow-up work get code changes.
- [ ] Fixes preserve the approved duplicate class (`shared-owner`, `generated-owned`, `thin-adapter`, `thin-workflow-glue-adapter`, `tracked-bootstrap-exception`, or approved `repo-local-policy`).
- [ ] Each changed consumer has targeted verification evidence attached to its PR.

#### [verify] Task 1.3: Close the sweep with explicit consumer outcomes

**Status:** planned

**Depends:** Task 1.1, Task 1.2

Record which consumers needed no change, which received PRs, and whether any accepted `repo-local-policy` surfaces should be revisited in a separate cleanup wave.

**Acceptance:**

- [ ] Final sweep outcome is explicit for all four consumers.
- [ ] Any no-op consumers are documented as intentionally unchanged because the upstream audit already passed.
- [ ] Any optional second-wave cleanup is separated from required follow-up work.

## Acceptance criteria

- The follow-up lane is decision-complete and execution-ready.
- The upstream audit remains the single owner for duplicate classification.
- Consumers are changed only when the audit or targeted verification proves they must change.
- `ingest-lens` follow-up, if any, starts from a fresh branch off `origin/main`.

## Verification plan

- `wp audit blueprint-lifecycle`
- repo-local markdown/blueprint checks if the lifecycle audit requires them
- before execution, rerun `bun apps/scripts/src/audit/consumer-duplication-audit.ts --json` from the merged `webpresso/monorepo` lane
