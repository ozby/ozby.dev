# ozby.dev

React personal dev site for Cloudflare Workers. `@webpresso/agent-kit` owns the quality surface (`wp lint` / `wp typecheck` / `wp test`) and the canonical `wp deploy` adapter surface, while Wrangler remains the repo-local provider deployer behind that adapter.

## Secrets + deploy contract

- Shared infrastructure credentials come from **Doppler `ozby-shell`**.
- Repo-local secret-manager metadata lives in `.webpresso/secrets.config.json`.
- Apply/update that metadata locally with:

```bash
pnpm run setup:secrets
```

- On install, the repo automatically seeds the runtime secret-manager metadata
  into `.git/webpresso/secrets.json` when it is missing.
- Secret-scoped deploy execution prefers the canonical `with-secrets -- <cmd>`
  contract when available, and only falls back to direct Doppler execution when
  that shared runner is not installed on the machine.

- Dry-run deploy stays secret-free:

```bash
pnpm run deploy:dry-run
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
pnpm run deploy:production
```

That build + deploy path resolves Cloudflare credentials through the selected
manager instead of hardcoding repo-local env files or ad hoc provider commands.

- Verify the repo stays metadata-only with:

```bash
pnpm run verify:secrets
```

## GitHub deploy workflows

This repo now uses thin caller workflows that delegate to the shared
`agent-kit` reusable deploy harness by immutable commit SHA while keeping the
repo-local commands here:

- preview: `.github/workflows/deploy-preview.yml`
- production: `.github/workflows/deploy-production.yml`


## Verify

Use the shared `wp` quality surface directly:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run qa
pnpm run deploy:dry-run
pnpm run verify:deploy-contract
```
