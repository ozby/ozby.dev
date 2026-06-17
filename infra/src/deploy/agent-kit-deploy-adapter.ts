import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { findRepoRoot } from "./deploy-runner.ts";
import { canonicalPreviewLaneToDashed } from "./deploy-lanes.ts";

type DeployRequest = {
  lane: string;
  dryRun: boolean;
  mode?: "deploy" | "destroy";
};

type DeployStep =
  | {
      kind: "managed-tool";
      id: string;
      label?: string;
      tool: string;
      args?: string[];
      cwd?: string;
      env?: Record<string, string>;
    }
  | {
      kind: "command";
      id: string;
      label?: string;
      runtimeProfile?: string;
      command: string;
      args?: string[];
      cwd?: string;
      env?: Record<string, string>;
    };

type DeployPlan = {
  schemaVersion: 1;
  lane: string;
  provider: string;
  requiredCredentials: string[];
  steps: DeployStep[];
};

type DeployAdapter = {
  createPlan(request: DeployRequest): DeployPlan;
};

const deployDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = findRepoRoot(deployDir);

export const webpressoDeployAdapter: DeployAdapter = {
  createPlan(request): DeployPlan {
    const previewLane = canonicalPreviewLaneToDashed(
      request.lane as "prd" | "preview_main" | `preview_pr_${number}`,
    );

    if (previewLane) {
      return {
        schemaVersion: 1,
        lane: request.lane,
        provider: "cloudflare",
        requiredCredentials: request.dryRun
          ? []
          : ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
        steps: [
          {
            kind: "command",
            id: "preview-deploy",
            runtimeProfile: "none",
            label:
              request.mode === "destroy"
                ? `Destroy ${request.lane} preview custom domain`
                : request.dryRun
                  ? `Validate ${request.lane} preview deploy without publishing`
                  : `Deploy ${request.lane} preview custom domain`,
            command: "bun",
            args: [
              resolve(deployDir, "deploy-preview.ts"),
              "--lane",
              previewLane,
              ...(request.mode === "destroy" ? ["--destroy"] : []),
              ...(request.dryRun ? ["--dry-run"] : []),
            ],
            cwd: repoRoot,
          },
        ],
      };
    }

    if (request.lane !== "prd") {
      throw new Error(`Unsupported deploy lane: ${request.lane}`);
    }

    return {
      schemaVersion: 1,
      lane: request.lane,
      provider: "cloudflare",
      requiredCredentials: request.dryRun ? [] : ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
      steps: request.dryRun
        ? [
            {
              kind: "command",
              id: "production-deploy",
              runtimeProfile: "none",
              label: "Validate ozby.dev production deploy",
              command: "bun",
              args: [resolve(deployDir, "deploy-production.ts"), "--dry-run"],
              cwd: repoRoot,
            },
          ]
        : [
            {
              kind: "command",
              id: "production-deploy",
              runtimeProfile: "none",
              label: "Deploy ozby.dev production",
              command: "bun",
              args: [resolve(deployDir, "deploy-production.ts"), "--skip-smoke"],
              cwd: repoRoot,
            },
          ],
    };
  },
};

export default webpressoDeployAdapter;
