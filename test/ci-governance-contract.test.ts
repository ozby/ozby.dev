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
 * The `wp audit guardrails > agents` audit now requires the full managed agent
 * surface, including `.claude/agents`, so CI must hydrate the complete setup
 * contract rather than the earlier hooks-only restore path. The full setup also
 * regenerates local-only helper scripts that are intentionally gitignored and
 * can trip unrelated guardrails, so CI deletes those helper files again before
 * running the audit.
 *
 * These assertions fail against the stale `--restore-hooks` variant and against
 * partial setup invocations, so the CI contract stays aligned with the actual
 * guardrail surface.
 */
describe("ozby-dev CI governance contract", () => {
  it("hydrates the full managed agent surface via wp setup in CI", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("wp setup");

    const wpSetupSteps = ci
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- run:") && line.includes("wp setup"));

    expect(wpSetupSteps.length).toBeGreaterThan(0);
    for (const step of wpSetupSteps) {
      // CI should run the full setup surface, not stale hooks-only restore.
      expect(step).toContain("wp setup");
      expect(step).not.toContain("wp setup --with");
      expect(step).not.toContain("wp setup --restore-hooks");
    }
  });

  it("deletes regenerated local-only helper scripts before running guardrails in CI", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");
    expect(ci).toContain("rm -f scripts/check-no-dev-vars.ts scripts/audit-secret-provider-quarantine.ts");
  });

  it("skips full wp setup during CI installs so the gitignored artifacts are never regenerated in CI", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts.postinstall).toContain('test -n "$CI" || wp setup');
  });

  it("keeps the hooks manifest available for hook repair and setup drift audits", () => {
    const manifest = JSON.parse(readRepoFile(".webpresso/hooks-manifest.json")) as {
      claude?: unknown;
      codex?: unknown;
    };

    expect(manifest).toHaveProperty("claude");
    expect(manifest).toHaveProperty("codex");
  });

  it("keeps the quarantine-tripping generated helper scripts gitignored (never committed)", () => {
    const gitignore = readRepoFile(".gitignore");

    expect(gitignore).toContain("scripts/audit-secret-provider-quarantine.ts");
    expect(gitignore).toContain("scripts/check-no-dev-vars.ts");
  });
});
