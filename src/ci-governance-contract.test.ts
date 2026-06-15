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
 * Claude/Codex hooks are absent, so CI must hydrate them. Current guardrails
 * also need the broader generated surface refresh from `wp setup`, but CI must
 * immediately clean ignored consumer projections (`agent-rules/`, `agent-skills/`)
 * before running audits so stale generated placeholders never enter the guardrail
 * surface.
 */
describe("ozby-dev CI governance contract", () => {
  it("hydrates hooks and generated surfaces via full wp setup, then cleans ignored projections before audit", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("wp setup");
    expect(ci).toContain("git clean -fdX agent-rules agent-skills");

    const wpSetupSteps = ci
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("- run:") && line.includes("wp setup"));

    expect(wpSetupSteps.length).toBeGreaterThan(0);
    for (const step of wpSetupSteps) {
      expect(step).toContain("wp setup");
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

  it("does not keep the old quarantine helper script ignore workaround once audits are repo-owned", () => {
    const gitignore = readRepoFile(".gitignore");

    expect(gitignore).not.toContain("scripts/audit-secret-provider-quarantine.ts");
    expect(gitignore).not.toContain("scripts/check-no-dev-vars.ts");
  });
});
