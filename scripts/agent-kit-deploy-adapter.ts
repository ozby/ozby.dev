import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

type DeployRequest = {
  lane: string;
  dryRun: boolean;
};

type DeployStep = {
  kind: "managed-tool";
  id: string;
  label: string;
  tool: string;
  args: string[];
  cwd: string;
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

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptsDir, "..");

export const webpressoDeployAdapter: DeployAdapter = {
  createPlan(request): DeployPlan {
    return {
      schemaVersion: 1,
      lane: request.lane,
      provider: "cloudflare",
      requiredCredentials: request.dryRun ? [] : ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"],
      steps: [
        { kind: "managed-tool", id: "vite-build", label: "Build ozby.dev", tool: "vite", args: ["build"], cwd: repoRoot },
        { kind: "managed-tool", id: "wrangler-deploy", label: request.dryRun ? "Validate Worker deploy" : "Deploy Worker", tool: "wrangler", args: ["deploy", "--config", "wrangler.jsonc", ...(request.dryRun ? ["--dry-run"] : [])], cwd: repoRoot },
      ],
    };
  },
};

export default webpressoDeployAdapter;
