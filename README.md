# ozby.dev

Personal landing page + blog for Özberk Erçin. Workspace split app: `apps/client` React frontend, `apps/workers` Worker runtime, `infra` deploy surface.

**Live:** https://ozby.dev · **Preview (main):** https://preview-main.ozby.dev

## Stack

- React 19 + React Router v7 — SPA with `/`, `/writing`, `/writing/:slug`, `/projects/:slug`
- Cloudflare Workers Assets — `not_found_handling: single-page-application`
- Blog: `.md` files in `apps/client/src/content/posts/` → `gray-matter` + `marked` + `highlight.js`
- Fonts: Geist + Geist Mono (self-hosted via `@fontsource-variable`)
- Design: zinc palette, CSS custom properties, `prefers-color-scheme` light/dark

## Writing a post

Add a file to `apps/client/src/content/posts/<slug>.md`:

```markdown
---
title: Your Post Title
date: 2026-06-11
description: One-line summary shown in post lists.
published: true
---

Body content in standard Markdown. Fenced code blocks get syntax highlighting.
```

## Adding a project

Edit `apps/client/src/projects.ts` and add an entry to the array:

```ts
{
  slug: 'my-project',
  name: 'my-project',
  summary: 'One-line description for the projects list.',
  url: 'https://github.com/ozby/my-project',
  tech: ['TypeScript', 'Cloudflare Workers'],
  demoUrl: 'https://my-project.ozby.dev',   // optional
  why: 'Why you built it, in plain prose.',
}
```

## Development

This repo follows `wp` > `vp` > `pnpm`: use `wp` for project operations,
`vp` when `wp` has no equivalent, and raw `pnpm` only as the final fallback.

```bash
vp install
wp run qa        # lint + typecheck + tests
wp run build     # production build
wp run dev       # builds client dist, then serves the local preview at localhost:8787
```

## GitHub Packages

This repo consumes `@ozby/cloudflare` from GitHub Packages. GitHub Actions uses `NODE_AUTH_TOKEN: ${{ github.token }}` with `packages: read`. For local installs, export a token from the GitHub CLI session before running install commands:

```bash
export NODE_AUTH_TOKEN="$(gh auth token)"
```

## Secrets + deploy contract

- Shared infrastructure credentials come from the committed `schemaVersion: 1`
  secret profile map in `.webpresso/secrets.config.json` (`ozby/ozby-dev`,
  `preview -> stg`, `production -> prd`).
- Repo-local secret-manager metadata lives in `.webpresso/secrets.config.json`.
- Diagnose the current preview profile locally with:

```bash
wp secrets doctor --profile preview --json
```

- On install, the repo automatically seeds the runtime secret-manager metadata
  into the repo's git common dir at `webpresso/secrets.json` (so linked
  worktrees share the same runtime metadata) when it is missing.
- Secret-scoped execution now goes through shared `wp` surfaces (`wp preview`,
  `wp deploy`, `wp ci act`, and `wp secrets run --sink <sink> --profile <name> -- <cmd>`).

- Dry-run deploy stays secret-free:

```bash
wp run deploy:dry-run
```

- Preview deploys use additive custom domains:
  - `https://preview-main.ozby.dev`
  - `https://preview-pr-<n>.ozby.dev`

- Preview deploys run a mandatory Cloudflare DNS preflight before publish. If a
  conflicting manual CNAME already exists for the preview hostname, the deploy
  fails early with a cleanup message instead of letting Cloudflare custom-domain
  attachment fail later.

- Production deploy uses the same DRY secret-manager contract as the other site repos:

```bash
wp run changeset && merge the generated Version Packages PR
```

That build + deploy path resolves Cloudflare credentials through the selected
manager instead of hardcoding repo-local env files or ad hoc provider commands.

- Verify the repo stays metadata-only with:

```bash
wp run verify:secrets
```

## Contact Form Production Gates

The `/contact` route loads its public Turnstile site key at runtime from `/api/contact/config`; the Worker keeps the matching server-side secret in runtime bindings. Production is not complete until these checks are done:

- Onboard `ozby.dev` in Cloudflare Email Sending and verify bounce/SPF/DKIM/DMARC DNS records.
- Approve `info@ozby.dev` as the sender and keep the Wrangler `send_email` binding restricted to that sender only.
- Set `CONTACT_TURNSTILE_SITE_KEY` and `CONTACT_TURNSTILE_SECRET_KEY` through Worker secrets or the repo secret-provider flow; do not create `.env` or `.dev.vars` files.
- Confirm Workers Paid is active before sending customer confirmations to arbitrary customer email addresses.
- Submit one real production form and confirm the internal recipient receives the message and the customer receives the confirmation.

## GitHub deploy workflows

This repo now uses thin caller workflows that delegate to the shared
`agent-kit` reusable deploy harness by immutable commit SHA while keeping the
repo-local commands here:

- preview: `.github/workflows/deploy-preview.yml`
- release orchestration: `.github/workflows/release.yml`
- production redeploy/rollback: create a new versioned Changesets release PR; production deploys only from `.github/workflows/release.yml` after Version Packages merges

## Verify

```bash
wp run lint
wp run typecheck
wp run test
wp run qa
wp run deploy:dry-run
wp run verify:deploy-contract
```
