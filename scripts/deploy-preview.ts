#!/usr/bin/env bun
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

import { assertNoConflictingCustomDomainCname } from "./lib/custom-domain-preflight.ts";
import { resolvePreviewLane } from "./lib/deploy-lanes.ts";

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
  throw new Error("Usage: deploy-preview.ts --lane preview-main|preview-pr-<n> [--dry-run] [--destroy]");
}

if (destroy && dryRun) {
  throw new Error("--destroy and --dry-run cannot be combined");
}

const repoRoot = process.cwd();
const lane = resolvePreviewLane(laneArg);
const baseConfig = JSON.parse(readFileSync(join(repoRoot, "wrangler.jsonc"), "utf8")) as WranglerConfig;

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

function hasCommand(command: string): boolean {
  const result = spawnSync("command", ["-v", command], {
    shell: true,
    stdio: "ignore",
  });
  return result.status === 0;
}

function runSecretScoped(command: string, commandArgs: string[]) {
  if (hasCommand("with-secrets")) {
    run("with-secrets", ["--", command, ...commandArgs]);
    return;
  }
  run(command, commandArgs);
}

function writePreviewConfig(): string {
  const tempDir = mkdtempSync(join(tmpdir(), "ozby-dev-preview-"));
  const configPath = join(tempDir, "wrangler.preview.jsonc");
  const previewConfig = {
    $schema: baseConfig.$schema,
    name: lane.workerName,
    main: join(repoRoot, baseConfig.main),
    compatibility_date: baseConfig.compatibility_date,
    assets: {
      ...baseConfig.assets,
      directory: join(repoRoot, baseConfig.assets.directory),
    },
    routes: [{ pattern: lane.hostname, custom_domain: true }],
  };
  writeFileSync(configPath, `${JSON.stringify(previewConfig, null, 2)}\n`, { mode: 0o600 });
  return configPath;
}

async function runDnsPreflight(): Promise<void> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !apiToken) {
    throw new Error(
      "Preview deploy requires CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN for the custom-domain conflict preflight.",
    );
  }
  await assertNoConflictingCustomDomainCname({
    hostname: lane.hostname,
    zoneId,
    apiToken,
  });
}

if (!skipBuild) {
  console.log(`\n▶ Building ${lane.hostname} preview assets…\n`);
  run("pnpm", ["run", "build"]);
}

const previewConfigPath = writePreviewConfig();

if (destroy) {
  console.log(`\n▶ Destroying preview Worker ${lane.workerName}\n`);
  runSecretScoped("wrangler", ["delete", "--name", lane.workerName]);
  process.exit(0);
}

if (dryRun) {
  console.log(`\n▶ Validating preview lane ${lane.lane} without publishing\n`);
  run("wrangler", ["deploy", "--config", previewConfigPath, "--dry-run"]);
  console.log(`\n✅ Preview dry-run validated: ${lane.url}\n`);
  process.exit(0);
}

console.log(`\n▶ Checking for conflicting custom-domain CNAMEs on ${lane.hostname}\n`);
await runDnsPreflight();

console.log(`\n▶ Deploying preview Worker ${lane.workerName}\n`);
runSecretScoped("wrangler", ["deploy", "--config", previewConfigPath]);

console.log(`\n✅ Preview deployed: ${lane.url}\n`);
