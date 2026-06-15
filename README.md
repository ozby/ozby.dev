# ozby.dev

Personal landing page + blog for Özberk Erçin. React 19 SPA served via Cloudflare Workers Assets.

**Live:** https://ozby.dev · **Preview (main):** https://preview-main.ozby.dev

## Stack

- React 19 + React Router v7 — SPA with `/`, `/writing`, `/writing/:slug`, `/projects/:slug`
- Cloudflare Workers Assets — `not_found_handling: single-page-application`
- Blog: `.md` files in `src/content/posts/` → `gray-matter` + `marked` + `highlight.js`
- Fonts: Geist + Geist Mono (self-hosted via `@fontsource-variable`)
- Design: zinc palette, CSS custom properties, `prefers-color-scheme` light/dark

## Writing a post

Add a file to `src/content/posts/<slug>.md`:

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

Edit `src/projects.ts` and add an entry to the array:

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

This repo uses [vite-plus](https://www.npmjs.com/package/vite-plus) (`vp`) as its task runner. pnpm is the underlying package manager — use `vp run` for scripts rather than `pnpm run` directly.

```bash
pnpm install
vp run qa        # lint + typecheck + tests
vp run build     # production build
vp run dev       # local preview at localhost:8787
```

## Secrets + deploy contract

- Shared infrastructure credentials come from **Doppler `ozby-shell`**.
- Repo-local secret-manager metadata lives in `.webpresso/secrets.config.json`.
- Apply/update that metadata locally with:

```bash
vp run setup:secrets
```

- On install, the repo automatically seeds the runtime secret-manager metadata
  into the repo's git common dir at `webpresso/secrets.json` (so linked
  worktrees share the same runtime metadata) when it is missing.
- Secret-scoped deploy execution prefers the canonical `with-secrets -- <cmd>`
  contract when available, and only falls back to direct Doppler execution when
  that shared runner is not installed on the machine.

- Dry-run deploy stays secret-free:

```bash
vp run deploy:dry-run
```

- Preview deploys use additive custom domains:

  - `https://preview-main.ozby.dev`
  - `https://preview-pr-<n>.ozby.dev`

- Preview deploys run a mandatory Cloudflare DNS preflight before publish. If a
  conflicting manual CNAME already exists for the preview hostname, the deploy
  fails early with a cleanup message instead of letting Cloudflare custom-domain
  attachment fail later.

- Production deploy uses the same DRY secret-manager contract as the other consumer repos:

```bash
vp run deploy:production
```

That build + deploy path resolves Cloudflare credentials through the selected
manager instead of hardcoding repo-local env files or ad hoc provider commands.

- Verify the repo stays metadata-only with:

```bash
vp run verify:secrets
```

## GitHub deploy workflows

This repo now uses thin caller workflows that delegate to the shared
`agent-kit` reusable deploy harness by immutable commit SHA while keeping the
repo-local commands here:

- preview: `.github/workflows/deploy-preview.yml`
- production: `.github/workflows/deploy-production.yml`

## Verify

```bash
vp run lint
vp run typecheck
vp run test
vp run qa
vp run deploy:dry-run
vp run verify:deploy-contract
```
