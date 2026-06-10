import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { webpressoDeployAdapter } from "../scripts/agent-kit-deploy-adapter.ts";
import {
  buildCloudflareDnsRecordsUrl,
  getConflictingCustomDomainCnameRecords,
} from "../scripts/lib/custom-domain-preflight.ts";
import {
  canonicalPreviewLaneToDashed,
  resolvePreviewLane,
} from "../scripts/lib/deploy-lanes.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("ozby-dev deploy contract", () => {
  it("declares preview_main / preview_pr / prd Cloudflare lane metadata", async () => {
    const { default: agentKitConfig } = await import("../agent-kit.config");
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

  it("uses wp deploy as the canonical package deploy surface", async () => {
    const pkg = JSON.parse(readRepoFile("package.json")) as { scripts: Record<string, string> };

    expect(pkg.scripts["deploy:dry-run"]).toBe("wp deploy --lane prd --dry-run");
    expect(pkg.scripts["deploy:preview"]).toBe("wp deploy --lane preview_main");
    expect(pkg.scripts["deploy:production"]).toBe("wp deploy --lane prd");
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
    expect(previewMainStep.runtimeProfile).toBeUndefined();
    expect(previewMainStep.args).toEqual(
      expect.arrayContaining([expect.stringContaining("deploy-preview.ts"), "--lane", "preview-main", "--dry-run"]),
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
    expect(previewDeployStep.runtimeProfile).toBe("secrets-only");
    expect(previewDeployStep.args).toEqual(
      expect.arrayContaining([expect.stringContaining("deploy-preview.ts"), "--lane", "preview-pr-123"]),
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

  it("uses explicit health and homepage http checks for live production deploys", () => {
    const productionDeploy = webpressoDeployAdapter.createPlan({
      lane: "prd",
      dryRun: false,
      releaseVersion: "1.2.3",
    });

    expect(productionDeploy.releaseVersion).toBe("1.2.3");
    expect(productionDeploy.steps).toHaveLength(3);
    expect(productionDeploy.steps[0]).toMatchObject({
      kind: "command",
      runtimeProfile: "prd",
      args: [expect.stringContaining("deploy-production.ts"), "--skip-smoke"],
    });
    expect(productionDeploy.steps[1]).toMatchObject({
      kind: "http-check",
      id: "production-health",
      stage: "health",
      runtimeProfile: "prd",
      url: "https://ozby.dev/health",
      retries: 24,
      intervalMs: 5000,
    });
    expect(productionDeploy.steps[2]).toMatchObject({
      kind: "http-check",
      id: "production-homepage",
      stage: "homepage",
      runtimeProfile: "prd",
      url: "https://ozby.dev/",
      retries: 12,
      intervalMs: 5000,
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

  it("uses thin caller workflows pinned to the shared reusable workflow commit", () => {
    const previewWorkflow = readRepoFile(".github/workflows/deploy-preview.yml");
    const productionWorkflow = readRepoFile(".github/workflows/deploy-production.yml");
    const sha = "317fc3aa5952f5dee0604413a0b9dd1e6d7635dd";

    expect(previewWorkflow).toContain(
      `uses: webpresso/agent-kit/.github/workflows/cloudflare-preview.yml@${sha}`,
    );
    expect(previewWorkflow).toContain("branches: [main]");
    expect(previewWorkflow).toContain("types: [opened, synchronize, reopened, closed]");
    expect(previewWorkflow).toContain("mode: ${{ needs.resolve.outputs.mode }}");
    expect(previewWorkflow).toContain("DOPPLER_SERVICE_TOKEN");

    expect(productionWorkflow).toContain(
      `uses: webpresso/agent-kit/.github/workflows/cloudflare-production.yml@${sha}`,
    );
    expect(productionWorkflow).toContain('tags: ["v*"]');
    expect(productionWorkflow).not.toContain("workflow_dispatch:");
    expect(productionWorkflow).toContain("resolve-release");
  });

  it("documents preview domains and the mandatory custom-domain conflict preflight", () => {
    const readme = readRepoFile("README.md");

    expect(readme).toContain("preview-main.ozby.dev");
    expect(readme).toContain("preview-pr-<n>.ozby.dev");
    expect(readme).toContain("mandatory Cloudflare DNS preflight");
    expect(readme).toContain(".github/workflows/deploy-preview.yml");
  });
});
