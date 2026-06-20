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

    expect(ci).toContain("git checkout -- package.json .gitignore AGENTS.md");
  });

  it("deletes regenerated local-only helper scripts before running guardrails in CI", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");

    expect(ci).toContain(
      "rm -f scripts/check-no-dev-vars.ts scripts/audit-secret-provider-quarantine.ts",
    );
  });

  it("skips full wp setup during CI installs so the gitignored artifacts are never regenerated in CI", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      scripts: Record<string, string>;
    };

    expect(pkg.scripts.postinstall).toContain('test -n "$CI" || (wp setup');
    expect(pkg.scripts.postinstall).toContain("sync-webpresso-config.ts");
  });

  it("skips heavy version-automation preview and security workflows on changeset release PRs", () => {
    const preview = readRepoFile(".github/workflows/deploy-preview.yml");
    const security = readRepoFile(".github/workflows/security-scan.yml");

    expect(preview).toContain("github.event.pull_request.head.ref != 'changeset-release/main'");
    expect(security).toContain("github.event.pull_request.head.ref != 'changeset-release/main'");
  });

  it("grants reusable Cloudflare workflow callers the OIDC permission required by the shared deploy harness", () => {
    const ci = readRepoFile(".github/workflows/ci.yml");
    const preview = readRepoFile(".github/workflows/deploy-preview.yml");
    const production = readRepoFile(".github/workflows/deploy-production.yml");

    expect(ci).toContain("deploy-preview:");
    expect(ci).toContain("id-token: write");
    expect(ci).toContain("uses: webpresso/github-actions/.github/workflows/cloudflare-preview.yml");

    expect(preview).toContain("preview:");
    expect(preview).toContain("destroy:");
    expect(preview).toContain("id-token: write");
    expect(preview).toContain("uses: webpresso/github-actions/.github/workflows/cloudflare-preview.yml");

    expect(production).toContain("deploy:");
    expect(production).toContain("id-token: write");
    expect(production).toContain("uses: webpresso/github-actions/.github/workflows/cloudflare-production.yml");
  });

});
