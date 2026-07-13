import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { webpressoDeployAdapter } from "./agent-kit-deploy-adapter.ts";
import {
  buildCloudflareDnsRecordsUrl,
  getConflictingCustomDomainCnameRecords,
} from "./custom-domain-preflight.ts";
import { canonicalPreviewLaneToDashed, resolvePreviewLane } from "./deploy-lanes.ts";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const reusableWorkflowSha = "ba439b2d66ece6f16d3e7fee34bdee3ac5c987c0";

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("ozby-dev deploy contract", () => {
  it("declares preview_main / preview_pr / prd Cloudflare lane metadata", async () => {
    const { default: agentKitConfig } = await import("../../../agent-kit.config.ts");
    const cloudflare = agentKitConfig.deploy.cloudflare;

    expect(cloudflare.lanes.dev).toMatchObject({ wranglerEnvName: "dev" });
    expect(cloudflare.lanes.preview_main).toMatchObject({ wranglerEnvName: "preview-main" });
    expect(cloudflare.lanes.preview_pr).toMatchObject({ wranglerEnvNamePattern: "preview-pr-<n>" });
    expect(cloudflare.lanes.prd).toMatchObject({
      wranglerEnvName: "production",
      deployedWorkerNameMode: "top_level_name",
    });
    expect(cloudflare.production.metadataPath).toBe("infra/release-metadata.production.json");
    expect(cloudflare.targets).toMatchObject([
      {
        id: "ozby-dev-site",
        topLevelWorkerName: "ozby-dev",
        previewTransport: "custom_domain_env",
        routeSpec: { pattern: "preview-main.ozby.dev" },
      },
    ]);
  });

  it("maps canonical preview lanes to repo-local dashed lanes", () => {
    expect(canonicalPreviewLaneToDashed("preview_main")).toBe("preview-main");
    expect(canonicalPreviewLaneToDashed("preview_pr_42")).toBe("preview-pr-42");
    expect(canonicalPreviewLaneToDashed("prd")).toBeNull();
    expect(resolvePreviewLane("preview-main")).toMatchObject({
      hostname: "preview-main.ozby.dev",
      workerName: "ozby-dev-preview-main",
    });
    expect(resolvePreviewLane("preview-pr-7")).toMatchObject({
      hostname: "preview-pr-7.ozby.dev",
      workerName: "ozby-dev-preview-pr-7",
    });
  });

  it("keeps the canonical split workspace topology and infra-owned deploy surface", () => {
    expect(readRepoFile("pnpm-workspace.yaml")).toContain('"apps/*"');
    expect(readRepoFile("pnpm-workspace.yaml")).toContain('"infra"');
    expect(() => readRepoFile("apps/client/package.json")).not.toThrow();
    expect(() => readRepoFile("apps/workers/package.json")).not.toThrow();
    expect(() => readRepoFile("infra/package.json")).not.toThrow();

    expect(() => readRepoFile("apps/workers/wrangler.jsonc")).not.toThrow();
    const wrangler = readRepoFile("apps/workers/wrangler.jsonc");
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
    expect(wrangler).toContain('"allowed_sender_addresses": ["info@ozby.dev"]');
    expect(wrangler).toContain(
      '"required": ["CONTACT_TURNSTILE_SITE_KEY", "CONTACT_TURNSTILE_SECRET_KEY"]',
    );
    expect(() => readRepoFile("apps/workers/worker-configuration.d.ts")).not.toThrow();
    expect(() => readRepoFile("wrangler.jsonc")).toThrow();
    expect(() => readRepoFile("infra/src/deploy/agent-kit-deploy-adapter.ts")).not.toThrow();
    expect(() => readRepoFile("scripts/agent-kit-deploy-adapter.ts")).toThrow();
    expect(() => readRepoFile("infra/src/deploy/deploy-preview.ts")).not.toThrow();
    expect(() => readRepoFile("scripts/deploy-preview.ts")).toThrow();
    expect(() => readRepoFile("infra/src/deploy/deploy-production.ts")).not.toThrow();
    expect(() => readRepoFile("scripts/deploy-production.ts")).toThrow();
    expect(readRepoFile("infra/src/deploy/deploy-production.ts")).not.toContain(
      "../../../scripts/",
    );
  });

  it("uses wp deploy as the canonical package deploy surface and changesets for release orchestration", async () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      version: string;
      scripts: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/);
    expect(pkg.scripts["deploy:dry-run"]).toBe("wp deploy --lane prd --dry-run");
    expect(pkg.scripts["deploy:preview"]).toBe("wp deploy --lane preview_main");
    expect(pkg.scripts["deploy:production"]).toBeUndefined();
    expect(pkg.scripts["deploy:production:wrangler"]).toBeUndefined();
    expect(pkg.scripts["changeset"]).toBe("changeset");
    expect(pkg.scripts["changeset:status"]).toBe("changeset status");
    expect(pkg.scripts["version"]).toBe(
      "changeset version && bun scripts/sync-release-metadata-version.ts",
    );
    expect(pkg.scripts["release:publish"]).toBe("bun scripts/release-publish.ts");
    expect(pkg.devDependencies?.["@changesets/cli"]).toBeDefined();
    expect(() => readRepoFile(".changeset/config.json")).not.toThrow();
  });

  it("uses pnpm-backed workspace builds inside infra deploy entrypoints", () => {
    const productionDeploy = readRepoFile("infra/src/deploy/deploy-production.ts");
    const previewDeploy = readRepoFile("infra/src/deploy/deploy-preview.ts");

    expect(productionDeploy).not.toContain('run("vp"');
    expect(previewDeploy).not.toContain('run("vp"');
    expect(productionDeploy).not.toContain('run("pnpm", ["run", "build"])');
    expect(productionDeploy).toContain(
      'run("pnpm", ["--filter", "@ozby-dev/workers", "run", "build"])',
    );
    expect(previewDeploy).toContain(
      'run("pnpm", ["--filter", "@ozby-dev/client", "run", "build"])',
    );
  });

  it("consumes infra deploy helpers through the infra package surface instead of a root alias", () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as {
      devDependencies?: Record<string, string>;
    };

    expect(pkg.devDependencies?.["@ozby-dev/infra"]).toBe(undefined);
    expect(() => readRepoFile("infra/src/deploy/sync-webpresso-config.ts")).toThrow();
  });

  it("builds preview dry-run and deploy plans through the local preview script", () => {
    const previewMainDryRun = webpressoDeployAdapter.createPlan({
      lane: "preview_main",
      dryRun: true,
    });
    expect(previewMainDryRun.requiredCredentials).toEqual([]);
    expect(previewMainDryRun.steps).toHaveLength(1);
    const previewMainStep = previewMainDryRun.steps[0];
    expect(previewMainStep?.kind).toBe("command");
    if (previewMainStep?.kind !== "command") throw new Error("expected command step");
    expect(previewMainStep.args).toEqual(
      expect.arrayContaining([
        expect.stringContaining("deploy-preview.ts"),
        "--lane",
        "preview-main",
        "--dry-run",
      ]),
    );

    const previewPrDeploy = webpressoDeployAdapter.createPlan({
      lane: "preview_pr_123",
      dryRun: false,
    });
    expect(previewPrDeploy.requiredCredentials).toEqual([
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ZONE_ID",
    ]);
    expect(previewPrDeploy.steps).toHaveLength(1);
    const previewDeployStep = previewPrDeploy.steps[0];
    expect(previewDeployStep?.kind).toBe("command");
    if (previewDeployStep?.kind !== "command") throw new Error("expected command step");
    expect(previewDeployStep.args).toEqual(
      expect.arrayContaining([
        expect.stringContaining("deploy-preview.ts"),
        "--lane",
        "preview-pr-123",
      ]),
    );

    const productionDryRun = webpressoDeployAdapter.createPlan({
      lane: "prd",
      dryRun: true,
    });
    expect(productionDryRun.requiredCredentials).toEqual([]);
    expect(productionDryRun.steps).toHaveLength(1);
    const productionDryRunStep = productionDryRun.steps[0];
    expect(productionDryRunStep?.kind).toBe("command");
    if (productionDryRunStep?.kind !== "command") throw new Error("expected command step");
    expect(productionDryRunStep.args).toEqual([
      expect.stringContaining("deploy-production.ts"),
      "--dry-run",
    ]);
  });

  it("uses a single command step for live production deploys", () => {
    const productionDeploy = webpressoDeployAdapter.createPlan({
      lane: "prd",
      dryRun: false,
    });

    expect(productionDeploy.steps).toHaveLength(1);
    expect(productionDeploy.steps[0]).toMatchObject({
      kind: "command",
      id: "production-deploy",
      args: [expect.stringContaining("deploy-production.ts"), "--skip-smoke"],
    });
  });

  it("checks only conflicting manual CNAME records during the custom-domain preflight", () => {
    expect(
      getConflictingCustomDomainCnameRecords("preview-main.ozby.dev", [
        { type: "A", name: "preview-main.ozby.dev", content: "1.1.1.1" },
        {
          type: "CNAME",
          name: "preview-main.ozby.dev",
          content: "preview-main.ozby.dev.cdn.cloudflare.net",
          proxied: true,
        },
        { type: "CNAME", name: "preview-main.ozby.dev", content: "example.net" },
        { type: "CNAME", name: "preview-pr-7.ozby.dev", content: "example.org" },
      ]),
    ).toEqual([{ type: "CNAME", name: "preview-main.ozby.dev", content: "example.net" }]);

    expect(buildCloudflareDnsRecordsUrl("zone-123", "preview-main.ozby.dev")).toContain(
      "type=CNAME",
    );
  });

  it("uses thin caller workflows pinned to the shared reusable workflow commits", () => {
    const previewWorkflow = readRepoFile(".github/workflows/deploy-preview.yml");
    expect(() => readRepoFile(".github/workflows/deploy-production.yml")).toThrow();
    const releaseWorkflow = readRepoFile(".github/workflows/release.yml");

    expect(previewWorkflow).toContain(
      `uses: webpresso/github-actions/.github/workflows/cloudflare-preview.yml@${reusableWorkflowSha}`,
    );
    expect(previewWorkflow).toContain("branches: [main]");
    expect(previewWorkflow).toContain("types: [opened, synchronize, reopened, closed]");
    expect(previewWorkflow).toContain("mode: deploy");
    expect(previewWorkflow).toContain("mode: destroy");
    expect(previewWorkflow).toContain(
      "github.event.pull_request.head.ref != 'changeset-release/main'",
    );
    expect(previewWorkflow).toContain("id-token: write");
    expect(previewWorkflow).toContain("secret_profile: preview");
    expect(previewWorkflow).toContain(
      "ci_secret_provider_token: ${{ secrets.CI_SECRET_PROVIDER_TOKEN_PREVIEW }}",
    );
    expect(previewWorkflow).not.toContain('export NODE_AUTH_TOKEN="${{ github.token }}"');

    expect(releaseWorkflow).toContain(
      `uses: webpresso/github-actions/.github/workflows/changesets-release.yml@${reusableWorkflowSha}`,
    );
    expect(releaseWorkflow).not.toContain("release-preflight:");
    expect(releaseWorkflow).not.toContain("Detect versionable release diff");
    expect(releaseWorkflow).not.toContain("workflow_dispatch:");
    expect(releaseWorkflow).toContain("branches: [main]");
    expect(releaseWorkflow).toContain("version_command: vp run version");
    expect(releaseWorkflow).toContain("publish_command: vp run release:publish");
    expect(releaseWorkflow).not.toContain('export NODE_AUTH_TOKEN="${{ github.token }}"');
    expect(releaseWorkflow).toContain("cloudflare-production.yml@");
    expect(releaseWorkflow).toContain("if: ${{ needs.gate.outputs.should_deploy == 'true' }}");
    expect(releaseWorkflow).toContain(
      'deploy-production.ts --release-version "${RELEASE_VERSION}" --skip-smoke',
    );
    expect(releaseWorkflow).toContain(
      "ci_secret_provider_token: ${{ secrets.CI_SECRET_PROVIDER_TOKEN_PRODUCTION }}",
    );
    expect(releaseWorkflow).not.toContain("CI_SECRET_PROVIDER_TOKEN }}");
    expect(releaseWorkflow).toContain("release_version: ${{ needs.gate.outputs.release_version }}");
    expect(releaseWorkflow).toContain("permissions:");
    expect(releaseWorkflow).toContain("contents: write");
    expect(releaseWorkflow).toContain("pull-requests: write");
    expect(releaseWorkflow).toContain("packages: write");
  });

  it("documents preview domains and the mandatory custom-domain conflict preflight", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain("preview-main.ozby.dev");
    expect(readme).toContain("preview-pr-<n>.ozby.dev");
    expect(readme).toContain("mandatory Cloudflare DNS preflight");
    expect(readme).toContain(".github/workflows/deploy-preview.yml");
  });
});
