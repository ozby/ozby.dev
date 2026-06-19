#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseSecretsConfigMetadata, type SecretsConfigMetadata } from "./secrets-policy.ts";
import { runtimeSecretsConfigPath } from "./git-paths.ts";
import { buildChildEnv, findRepoRoot } from "./deploy-runner.ts";

const ROOT = findRepoRoot(process.cwd());
const PRODUCTION_URL = "https://ozby.dev";
const args = process.argv.slice(2);
const skipBuild = args.includes("--skip-build");
const skipSmoke = args.includes("--skip-smoke");
const dryRun = args.includes("--dry-run");

function runtimeConfigPath(root: string): string {
  return runtimeSecretsConfigPath(root);
}

export function readSecretsConfig(root: string): SecretsConfigMetadata {
  let runtimePath: string | null = null;
  try {
    runtimePath = runtimeConfigPath(root);
  } catch {
    // Fall through to the committed metadata path when git metadata is unavailable.
  }

  if (runtimePath && existsSync(runtimePath)) {
    return parseSecretsConfigMetadata(readFileSync(runtimePath, "utf8"), runtimePath);
  }

  const committedPath = path.join(root, ".webpresso", "secrets.config.json");
  if (existsSync(committedPath)) {
    return parseSecretsConfigMetadata(readFileSync(committedPath, "utf8"), committedPath);
  }

  throw new Error(
    "Missing secret-manager metadata. Run `wp secrets doctor --profile preview --json` and commit a valid `.webpresso/secrets.config.json` first.",
  );
}

function run(command: string, commandArgs: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    env: buildChildEnv(ROOT, env),
    shell: false,
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
    env: buildChildEnv(ROOT, process.env),
  });
  if (result.status !== 0) {
    throw new Error(`Timed out waiting for ${url}`);
  }
}

function verifyReleaseVersion(): void {
  const releaseVersion = process.env.RELEASE_VERSION ?? process.env.RELEASE_VERSION_INPUT ?? "";
  if (releaseVersion.length === 0) return;
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u.test(releaseVersion)) {
    throw new Error(`Invalid semantic release version: ${releaseVersion}`);
  }
}

export function main(): void {
  readSecretsConfig(ROOT);
  verifyReleaseVersion();

  if (!skipBuild) {
    console.log("\n▶ Building ozby.dev…\n");
    run("pnpm", ["--filter", "@ozby-dev/workers", "run", "build"]);
  }

  console.log("\n▶ Verifying deploy contract…\n");
  run("pnpm", ["run", "verify:deploy-contract"]);

  if (dryRun) {
    console.log("\n▶ Validating Wrangler deploy (dry-run, no secrets)…\n");
    runWorkersWrangler(["deploy", "--config", "wrangler.jsonc", "--dry-run"]);
    console.log("\n✅ Dry-run deploy contract validated.\n");
    process.exit(0);
  }

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    throw new Error(
      "Production deploy requires CLOUDFLARE_API_TOKEN in the environment. Invoke via `wp secrets run --sink deploy-wrangler --profile production -- bun infra/src/deploy/deploy-production.ts`.",
    );
  }

  console.log(`\n▶ Deploying ozby.dev via the shared Webpresso secret surface…\n`);
  run("pnpm", [
    "--dir",
    "apps/workers",
    "exec",
    "wrangler",
    "deploy",
    "--config",
    "wrangler.jsonc",
  ]);

  if (skipSmoke) {
    console.log(
      `\n✅ Production deploy finished (smoke skipped). Verify: ${PRODUCTION_URL}/health\n`,
    );
    process.exit(0);
  }

  console.log("\n▶ Post-deploy smoke…\n");
  waitForHttp(`${PRODUCTION_URL}/health`, 24, 5);
  waitForHttp(`${PRODUCTION_URL}/`, 12, 5);

  console.log(`\n✅ Production deploy healthy at ${PRODUCTION_URL}\n`);
}

if (import.meta.main) {
  main();
}
