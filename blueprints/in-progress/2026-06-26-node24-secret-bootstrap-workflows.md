---
type: blueprint
owner: ozby
title: "Node 24 secret bootstrap workflow fix"
status: in-progress
complexity: S
created: "2026-06-26"
last_updated: "2026-06-26"
progress: "80% (upstream shared workflow fixes merged; consumer pin update and validation in progress)"
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

**Status:** in progress

**Depends:** None

- Merge the shared `webpresso/github-actions` fixes for Node-24-safe secret bootstrap and toolchain action pinning.
- Update release and preview caller workflow SHAs to the merged upstream commit.
- Update deploy contract tests to pin the new shared workflow SHA.

## Verification

- Targeted workflow/contract tests.
- Relevant local lint/typecheck/tests.
- PR checks green; post-merge deploy/release workflows no longer emit the Node 20 annotation.
