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
 * contract rather than the earlier hooks-only restore path.
 *
 * These assertions fail against the stale `--restore-hooks` variant and against
 * partial setup invocations, so the CI contract stays aligned with the actual
 * guardrail surface.
 */
describe("ozby-dev CI governance contract", () => {
  it("exposes a single branch-protection-facing wp-check job that runs the full wp quality gate", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("wp-check:");
    expect(ci).toContain("name: wp-check");
    expect(ci).toContain("wp audit hook-vendor-drift");
    expect(ci).toContain("wp audit harness-surfaces");
    expect(ci).toContain("wp audit architecture-drift --root .");
    expect(ci).toContain("wp lint");
    expect(ci).toContain("wp typecheck");
    expect(ci).toContain("vp run test");
    expect(ci).toContain("wp audit blueprint-lifecycle");
    expect(ci).toContain("wp test --mutation");
    expect(ci).not.toContain("wp test --affected");
    expect(ci).toContain("!startsWith(github.event.head_commit.message, 'Version Packages')");
  });

  it("uses pinned global Webpresso CLIs without regenerating agent setup surfaces in CI", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain("Install shared Webpresso CLIs");
    expect(ci).toContain("curl -fsSL https://vite.plus | bash");
    expect(ci).toContain('export PATH="$HOME/.vite-plus/bin:$PATH"');
    expect(ci).toContain('echo "$HOME/.vite-plus/bin" >> "$GITHUB_PATH"');
    expect(ci).toContain('vp install -g "@webpresso/agent-kit@2.3.2"');
    expect(ci).not.toContain("agent-kit@latest");
    expect(ci).not.toContain("AGENT_KIT_VERSION");
    expect(ci).not.toContain("VITE_PLUS_VERSION");
    expect(ci).not.toMatch(/(?<!p)npm\b/u);
    expect(ci).not.toContain("wp setup");
    expect(ci).not.toContain("git checkout -- package.json .gitignore AGENTS.md");
    expect(ci).not.toContain(
      "rm -f scripts/check-no-dev-vars.ts scripts/audit-secret-provider-quarantine.ts",
    );

    const pkg = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts["setup:agent"]).toBeUndefined();
    expect(pkg.scripts.postinstall).toBeUndefined();
  });

  it("skips heavy version-automation preview and security workflows on changeset release PRs", () => {
    const preview = readRepoFile(".github/workflows/deploy-preview.yml");
    const security = readRepoFile(".github/workflows/security-scan.yml");

    expect(preview).toContain("github.event.pull_request.head.ref != 'changeset-release/main'");
    expect(security).toContain("github.event.pull_request.head.ref != 'changeset-release/main'");
  });
});
