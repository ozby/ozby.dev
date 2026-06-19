#!/usr/bin/env bun
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path, { join } from "node:path";
import { spawnSync } from "node:child_process";

import { assertNoConflictingCustomDomainCname } from "./custom-domain-preflight.ts";
import { findRepoRoot } from "./deploy-runner.ts";
import { resolvePreviewLane } from "./deploy-lanes.ts";

type WranglerConfig = {
  readonly $schema?: string;
  readonly main: string;
  readonly tsconfig?: string;
  readonly compatibility_date: string;
  readonly assets: {
    readonly directory: string;
    readonly binding: string;
    readonly not_found_handling: string;
  };
};

const args = process.argv.slice(2);
const destroy = args.includes("--destroy");
const dryRun = args.includes("--dry-run");
const skipBuild = args.includes("--skip-build");
const laneArg = args[args.indexOf("--lane") + 1];

if (!laneArg) {
  throw new Error(
    "Usage: deploy-preview.ts --lane preview-main|preview-pr-<n> [--dry-run] [--destroy]",
  );
}

if (destroy && dryRun) {
  throw new Error("--destroy and --dry-run cannot be combined");
}

const repoRoot = findRepoRoot(process.cwd());
const workersRoot = join(repoRoot, "apps", "workers");
const lane = resolvePreviewLane(laneArg);
const baseConfig = JSON.parse(
  readFileSync(join(workersRoot, "wrangler.jsonc"), "utf8"),
) as WranglerConfig;

function run(command: string, commandArgs: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    env,
    shell: false,
    cwd: repoRoot,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `"${[command, ...commandArgs].join(" ")}" exited with status ${result.status ?? 1}`,
    );
  }
}

function runWorkersWrangler(wranglerArgs: string[], env: NodeJS.ProcessEnv = process.env) {
  run("pnpm", ["--dir", "apps/workers", "exec", "wrangler", ...wranglerArgs], env);
}

function runSecretScoped(command: string, commandArgs: string[]) {
  run(command, commandArgs);
}

function loadPreviewCredentials(): {
  zoneId: string;
  apiToken: string;
} {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (zoneId && apiToken) {
    return { zoneId, apiToken };
  }

  throw new Error(
    "Preview deploy requires CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN. Invoke via `wp secrets run --sink deploy-wrangler --profile preview -- bun infra/src/deploy/deploy-preview.ts --lane <preview-main|preview-pr-<n>>`.",
  );
}

function writePreviewConfig(): string {
  const tempDir = mkdtempSync(join(workersRoot, ".ozby-dev-preview-"));
  const configPath = join(tempDir, "wrangler.preview.jsonc");
  const relativeFromConfig = (targetPath: string) => {
    const relativePath = path.relative(tempDir, targetPath);
    return relativePath.startsWith(".") ? relativePath : `./${relativePath}`;
  };
  const previewConfig = {
    $schema: baseConfig.$schema,
    name: lane.workerName,
    main: relativeFromConfig(join(workersRoot, baseConfig.main)),
    compatibility_date: baseConfig.compatibility_date,
    assets: {
      ...baseConfig.assets,
      directory: relativeFromConfig(join(workersRoot, baseConfig.assets.directory)),
    },
    routes: [{ pattern: lane.hostname, custom_domain: true }],
  };
  writeFileSync(configPath, `${JSON.stringify(previewConfig, null, 2)}\n`, { mode: 0o600 });
  return configPath;
}

async function runDnsPreflight(): Promise<void> {
  const { zoneId, apiToken } = loadPreviewCredentials();
  await assertNoConflictingCustomDomainCname({
    hostname: lane.hostname,
    zoneId,
    apiToken,
  });
}

if (destroy) {
  console.log(`\n▶ Destroying preview Worker ${lane.workerName}\n`);
  runSecretScoped("pnpm", [
    "--dir",
    "apps/workers",
    "exec",
    "wrangler",
    "delete",
    "--name",
    lane.workerName,
  ]);
  process.exit(0);
}

if (!skipBuild) {
  console.log(`\n▶ Building ${lane.hostname} preview assets…\n`);
  run("pnpm", ["--filter", "@ozby-dev/client", "run", "build"]);
}

const previewConfigPath = writePreviewConfig();
try {
  if (dryRun) {
    console.log(`\n▶ Validating preview lane ${lane.lane} without publishing\n`);
    runWorkersWrangler(["deploy", "--config", previewConfigPath, "--dry-run"]);
    console.log(`\n✅ Preview dry-run validated: ${lane.url}\n`);
    process.exit(0);
  }

  console.log(`\n▶ Checking for conflicting custom-domain CNAMEs on ${lane.hostname}\n`);
  await runDnsPreflight();

  console.log(`\n▶ Deploying preview Worker ${lane.workerName}\n`);
  runSecretScoped("pnpm", [
    "--dir",
    "apps/workers",
    "exec",
    "wrangler",
    "deploy",
    "--config",
    previewConfigPath,
  ]);

  console.log(`\n✅ Preview deployed: ${lane.url}\n`);
} finally {
  rmSync(path.dirname(previewConfigPath), { recursive: true, force: true });
}
