#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  parseSecretsConfigMetadata,
  type SecretsConfigMetadata,
} from "./lib/secrets-policy.ts";

const ROOT = process.cwd();
const PRODUCTION_URL = "https://ozby.dev";
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const skipSmoke = args.includes("--skip-smoke");
const dryRun = args.includes("--dry-run");

function runtimeConfigPath(root: string): string {
  return path.join(root, ".git", "webpresso", "secrets.json");
}

function readSecretsConfig(root: string): SecretsConfigMetadata {
  const runtimePath = runtimeConfigPath(root);
  if (existsSync(runtimePath)) {
    return parseSecretsConfigMetadata(readFileSync(runtimePath, "utf8"), runtimePath);
  }

  const committedPath = path.join(root, ".webpresso", "secrets.config.json");
  if (existsSync(committedPath)) {
    return parseSecretsConfigMetadata(readFileSync(committedPath, "utf8"), committedPath);
  }

  throw new Error(
    "Missing secret-manager metadata. Run `bun scripts/sync-webpresso-config.ts --force` first.",
  );
}

function run(command: string, commandArgs: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    env,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `"${[command, ...commandArgs].join(" ")}" exited with status ${result.status ?? 1}`,
    );
  }
}

function requireCommand(name: string, hint: string): void {
  const result = spawnSync("command", ["-v", name], { encoding: "utf8", shell: true });
  if (result.status !== 0) {
    console.error(`Missing required command: ${name}`);
    console.error(hint);
    process.exit(1);
  }
}

function hasCommand(name: string): boolean {
  const result = spawnSync("command", ["-v", name], { encoding: "utf8", shell: true });
  return result.status === 0;
}

function runWithSecrets(
  config: SecretsConfigMetadata,
  envProfile: string,
  command: string,
  commandArgs: string[],
  env: NodeJS.ProcessEnv = process.env,
) {
  if (hasCommand("with-secrets")) {
    run("with-secrets", ["--env-profile", envProfile, "--", command, ...commandArgs], env);
    return;
  }

  if (config.manager !== "doppler") {
    throw new Error(
      `Unsupported secret manager "${config.manager}" in ozby-dev deploy runner. ` +
        "Current DRY runner only supports Doppler metadata.",
    );
  }

  requireCommand(
    "doppler",
    "Install Doppler CLI and authenticate before deploying, or install `with-secrets`.",
  );
  run(
    "doppler",
    ["run", "--project", config.projectId, "--config", envProfile, "--", command, ...commandArgs],
    env,
  );
}

function waitForHttp(url: string, attempts: number, delaySeconds: number): void {
  const script = `
const url = ${JSON.stringify(url)};
const attempts = ${attempts};
const delayMs = ${delaySeconds} * 1000;
for (let i = 0; i < attempts; i += 1) {
  try {
    const res = await fetch(url, { headers: { "user-agent": "ozby-dev deploy smoke" } });
    if (res.ok) process.exit(0);
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}
process.exit(1);
`;
  const result = spawnSync("node", ["--input-type=module", "--eval", script], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Timed out waiting for ${url}`);
  }
}

const secretsConfig = readSecretsConfig(ROOT);

if (!skipBuild) {
  console.log("\n▶ Building ozby.dev…\n");
  run("pnpm", ["run", "build"]);
}

console.log("\n▶ Verifying deploy contract…\n");
run("pnpm", ["run", "verify:deploy-contract"]);

if (dryRun) {
  console.log("\n▶ Validating Wrangler deploy (dry-run, no secrets)…\n");
  run("wrangler", ["deploy", "--config", "wrangler.jsonc", "--dry-run"]);
  console.log("\n✅ Dry-run deploy contract validated.\n");
  process.exit(0);
}

console.log(
  `\n▶ Deploying ozby.dev via ${hasCommand("with-secrets") ? "with-secrets" : `${secretsConfig.manager}/${secretsConfig.projectId}`}…\n`,
);
runWithSecrets(secretsConfig, "prd", "wrangler", ["deploy", "--config", "wrangler.jsonc"]);

if (skipSmoke) {
  console.log(`\n✅ Production deploy finished (smoke skipped). Verify: ${PRODUCTION_URL}/health\n`);
  process.exit(0);
}

console.log("\n▶ Post-deploy smoke…\n");
waitForHttp(`${PRODUCTION_URL}/health`, 24, 5);
waitForHttp(`${PRODUCTION_URL}/`, 12, 5);

console.log(`\n✅ Production deploy healthy at ${PRODUCTION_URL}\n`);
