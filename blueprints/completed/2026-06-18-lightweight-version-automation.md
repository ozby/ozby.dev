---
type: blueprint
owner: ozby
title: "Lightweight version automation"
status: completed
completed_at: "2026-06-26"
complexity: S
created: "2026-06-18"
last_updated: "2026-06-26"
progress_pct: 100
progress: "100% (merged and validated on main)"
depends_on: []
---

# Lightweight version automation

## Goal

- Keep generated `Version Packages` release PRs cheap and predictable while preserving full validation on feature branches and release/deploy paths.

## Architecture before

- generated release PRs could still run preview/security style lanes that were already exercised on feature branches.
- generated `Version Packages` merges on `main` could still trigger mutation work with no new product signal.

## Architecture after

- feature branches remain the primary heavy validation surface.
- generated release automation keeps lightweight integrity checks while skipping duplicate preview/security/mutation work.

## Tasks

- Skip preview/security workflows for `changeset-release/main` PRs.
- Skip mutation on generated `Version Packages` pushes to `main`.
- Keep `wp-check` as the branch-protection-facing integrity gate.

#### [ci] Task 1.1: Lighten version automation workflow lanes

**Status:** done

**Depends:** None

- preserve `wp-check` as the required integrity gate
- skip duplicate preview/security PR lanes for generated release branches
- skip duplicate mutation work on generated `Version Packages` main merges

## Verification

- CI governance/deploy contract tests assert the release-automation skip rules.
- Targeted local tests pass after workflow edits.
