---
type: blueprint
owner: ozby
title: "Hook startup runtime workaround"
status: completed
completed_at: "2026-06-26"
complexity: S
created: "2026-06-26"
last_updated: "2026-06-26"
progress_pct: 100
progress: "100% (merged and validated across setup + PR CI)"
depends_on: []
---

# Hook startup runtime workaround

## Goal

- Keep Webpresso-managed Claude and Codex hooks usable in this repo after `wp setup`.
- Prevent the generated SessionStart hook from stalling host startup.

## Architecture before

- `wp setup` materializes `.claude/settings.json` and `.codex/hooks.json` with SessionStart commands that dispatch through `wp hook sessionstart-routing`.
- In this environment, runtime-lane `wp hook sessionstart-routing` can hang even though the underlying JS hook entrypoint exits normally.
- Re-running `wp setup` can overwrite local hook repairs.

## Architecture after

- SessionStart commands in the committed Claude/Codex hook configs force non-runtime hook dispatch for that one hook.
- `.webpressorc.json` preserves the repaired hook files across future `wp setup` runs.
- Regression tests assert both the persistence contract and the executable SessionStart command contract.

## Tasks

#### [hooks] Task 1.1: Make SessionStart hook repair durable across setup reruns

**Status:** done

**Depends:** None

- Add a repo-level preservation contract for repaired hook files.
- Patch the generated Claude/Codex SessionStart commands to avoid the hanging runtime path.
- Add regression coverage for the preserved files and runnable SessionStart commands.
- Verify direct hook execution plus Codex/Claude CLI startup behavior.

## Verification

- Targeted Vitest coverage for hook config preservation and runnable SessionStart commands.
- Manual CLI verification in both Claude and Codex.
