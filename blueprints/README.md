# Blueprints

This directory is the canonical home for implementation plans (blueprints).
Each subdirectory represents a lifecycle state:

- `draft/` — early-stage sketches. Expect churn; move to `planned/` once scoped.
- `planned/` — committed-to specs, ready to pick up.
- `in-progress/` — actively being executed. Exactly one blueprint per lane.
- `completed/` — execution finished and verified. Kept for reference.
- `parked/` — intentionally paused. Include a reason in the spec's frontmatter.
- `archived/` — superseded or abandoned. Not deleted — the record matters.

## Authoring

- Use the agent-kit blueprint template as the starting point.
- For iterative refinement, load the `plan-refine` skill.

## Moving between states

Move files with `git mv` so history follows the spec through its lifecycle.

## Active work (2026-06-08)

| Blueprint | Path | Purpose |
| --------- | ---- | ------- |
| Strict agent-kit dogfood | [`in-progress/2026-06-02-ozby-dev-strict-agent-kit-dogfood.md`](./in-progress/2026-06-02-ozby-dev-strict-agent-kit-dogfood.md) | Scaffold landed in commit `d6d5722`, but the repo now tracks the stricter current contract: repo-owned `typescript` / `vitest` / `wrangler` surfaces plus remaining repo-local dry-run, deploy-contract audit, and fresh-clone proof. |

The upstream/parent blueprint lives in agent-kit:
`webpresso/agent-kit/blueprints/in-progress/2026-06-02-agent-kit-wp-deploy-orchestrator-toolchain-isolation.md`,
with sibling consumer blueprints now completed in `ozby/edge-matte/blueprints/completed/2026-06-02-edge-matte-wp-deploy-adapter-toolchain-isolation.md` and `ozby/ingest-lens/blueprints/completed/2026-06-02-ingest-lens-wp-deploy-adapter-toolchain-isolation.md`.
