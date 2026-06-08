# ozby.dev

React personal dev site for Cloudflare Workers. `@webpresso/agent-kit` owns the quality surface (`wp lint` / `wp typecheck` / `wp test`), and Wrangler owns deployment.

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
