---
title: Reference parity matrix
type: guide
last_updated: 2026-06-15
---

# Reference parity matrix

This matrix is the repo-owned checklist for replacement parity claims. A row
being present does not mean the release claim is green: required rows must be
`full` and `passed` before public replacement parity wording can be promoted.

| capability | host scope | support level | proof artifact | required for release | status |
| --- | --- | --- | --- | --- | --- |
| lifecycle capture | Codex, Claude hooks scaffolding | degraded | docs/bench/reference-parity-matrix.md | yes | open |
| resume injection | generated setup surfaces | degraded | docs/bench/reference-parity-matrix.md | yes | open |
| tool discovery | tracked catalog skills | degraded | docs/bench/reference-parity-matrix.md | yes | open |
| indexed search | content and route indexing | degraded | docs/bench/reference-parity-matrix.md | yes | passed |
| host setup smoke | CI setup + guardrail lane | degraded | docs/bench/reference-parity-matrix.md | yes | passed |
| benchmark thresholds | quality smoke placeholder | degraded | docs/bench/reference-parity-matrix.md | yes | open |
| release claim gating | deploy contract audit lane | degraded | docs/bench/reference-parity-matrix.md | yes | open |
