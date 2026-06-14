import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

/**
 * Pins the CI hook-materialization contract.
 *
 * The `wp audit guardrails > agents` audit fails CLOSED when the managed
 * Claude/Codex hooks are absent, so CI must hydrate them. But a full
 * `wp setup` in CI regenerates gitignored artifacts that fail OTHER
 * guardrails:
 *   - `agent-skills/<slug>/SKILL.md` with stale frontmatter -> `skills` audit
 *   - `scripts/audit-secret-provider-quarantine.ts` (literal banned patterns)
 *     -> `secret-provider-quarantine` audit
 *
 * The only correct path is the manifest-driven `wp setup --restore-hooks`,
 * which materializes hooks ONLY. These assertions fail against every wrong
 * variant we hit historically (bare `wp setup`, `wp setup --with agent-hooks`,
 * and dropping hook generation entirely), so the discover-in-CI loop cannot
 * recur — a regression turns the local `pnpm test` red before push.
 */
describe("ozby-dev CI governance contract", () => {
  it("hydrates managed hooks via the manifest-only restore path, never full wp setup", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("wp setup --restore-hooks");

    const wpSetupSteps = ci
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- run:") && line.includes("wp setup"));

    expect(wpSetupSteps.length).toBeGreaterThan(0);
    for (const step of wpSetupSteps) {
      // Every wp-setup invocation in CI must be the restore-hooks variant.
      expect(step).toContain("wp setup --restore-hooks");
      expect(step).not.toContain("wp setup --with");
    }
  });

  it("skips full wp setup during CI installs so the gitignored artifacts are never regenerated in CI", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts.postinstall).toContain('test -n "$CI" || wp setup');
  });

  it("commits the hooks manifest that --restore-hooks depends on", () => {
    const manifest = JSON.parse(readRepoFile(".webpresso/hooks-manifest.json")) as {
      claude?: unknown;
      codex?: unknown;
    };

    expect(manifest.claude).toBeDefined();
    expect(manifest.codex).toBeDefined();
  });

  it("keeps the quarantine-tripping generated helper scripts gitignored (never committed)", () => {
    const gitignore = readRepoFile(".gitignore");

    expect(gitignore).toContain("scripts/audit-secret-provider-quarantine.ts");
    expect(gitignore).toContain("scripts/check-no-dev-vars.ts");
  });
});
