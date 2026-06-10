import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { canonicalPreviewLaneToDashed } from "./lib/deploy-lanes.ts";

type DeployRequest = {
  lane: string;
  dryRun: boolean;
  mode?: "deploy" | "destroy";
  releaseVersion?: string;
};

type DeployStep =
  | {
      kind: "managed-tool";
      id: string;
      label: string;
      tool: string;
      args: string[];
      cwd: string;
      runtimeProfile?: string;
      stage?: "preview_health" | "health" | "homepage" | "production_smoke" | "production_journey";
    }
  | {
      kind: "command";
      id: string;
      label: string;
      command: string;
      args: string[];
      cwd: string;
      runtimeProfile?: string;
      stage?: "preview_health" | "health" | "homepage" | "production_smoke" | "production_journey";
      env?: Record<string, string>;
    }
  | {
      kind: "http-check";
      id: string;
      label: string;
      url: string;
      cwd: string;
      runtimeProfile?: string;
      stage: "preview_health" | "health" | "homepage" | "production_smoke" | "production_journey";
      retries?: number;
      intervalMs?: number;
      timeoutMs?: number;
    };

type DeployPlan = {
  schemaVersion: 1;
  lane: string;
  provider: string;
  requiredCredentials: string[];
  releaseVersion?: string;
  steps: DeployStep[];
};

type DeployAdapter = {
  createPlan(request: DeployRequest): DeployPlan;
};

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, "..");
const PRODUCTION_URL = "https://ozby.dev";

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
            label:
              request.mode === "destroy"
                ? `Destroy ${request.lane} preview custom domain`
                : request.dryRun
                  ? `Validate ${request.lane} preview deploy without publishing`
                  : `Deploy ${request.lane} preview custom domain`,
            command: "bun",
            args: [
              resolve(scriptsDir, "deploy-preview.ts"),
              "--lane",
              previewLane,
              ...(request.mode === "destroy" ? ["--destroy"] : []),
              ...(request.dryRun ? ["--dry-run"] : []),
            ],
            cwd: repoRoot,
            runtimeProfile: request.dryRun ? undefined : "secrets-only",
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
      releaseVersion: request.releaseVersion,
      steps: request.dryRun
        ? [
            {
              kind: "command",
              id: "production-deploy",
              label: "Validate ozby.dev production deploy",
              command: "bun",
              args: [resolve(scriptsDir, "deploy-production.ts"), "--dry-run"],
              cwd: repoRoot,
            },
          ]
        : [
            {
              kind: "command",
              id: "production-deploy",
              label: "Deploy ozby.dev production",
              command: "bun",
              args: [resolve(scriptsDir, "deploy-production.ts"), "--skip-smoke"],
              cwd: repoRoot,
              runtimeProfile: "prd",
            },
            {
              kind: "http-check",
              id: "production-health",
              label: "Verify production /health",
              stage: "health",
              url: `${PRODUCTION_URL}/health`,
              cwd: repoRoot,
              runtimeProfile: "prd",
              retries: 24,
              intervalMs: 5_000,
              timeoutMs: 10_000,
            },
            {
              kind: "http-check",
              id: "production-homepage",
              label: "Verify production homepage",
              stage: "homepage",
              url: `${PRODUCTION_URL}/`,
              cwd: repoRoot,
              runtimeProfile: "prd",
              retries: 12,
              intervalMs: 5_000,
              timeoutMs: 10_000,
            },
          ],
    };
  },
};

export default webpressoDeployAdapter;
