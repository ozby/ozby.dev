#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseSecretsConfigMetadata, type SecretsConfigMetadata } from "./lib/secrets-policy.ts";

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, ".webpresso", "secrets.config.json");

type Mode = "seed" | "force" | "check-only";

function parseArgs(argv: string[]): Mode {
  if (argv.includes("--check-only")) return "check-only";
  if (argv.includes("--force")) return "force";
  return "seed";
}

function runtimeConfigPath(root: string): string {
  return path.join(root, ".git", "webpresso", "secrets.json");
}

function readRuntimeConfig(root: string): SecretsConfigMetadata | null {
  const runtimePath = runtimeConfigPath(root);
  if (!existsSync(runtimePath)) return null;
  try {
    return parseSecretsConfigMetadata(
      readFileSync(runtimePath, "utf8"),
      path.relative(root, runtimePath),
    );
  } catch {
    return null;
  }
}

function writeRuntimeConfig(root: string, config: SecretsConfigMetadata): void {
  const runtimePath = runtimeConfigPath(root);
  mkdirSync(path.dirname(runtimePath), { recursive: true });
  writeFileSync(runtimePath, `${JSON.stringify(config, null, 2)}\n`);
}

function configsMatch(left: SecretsConfigMetadata, right: SecretsConfigMetadata): boolean {
  return (
    left.manager === right.manager &&
    left.projectId === right.projectId &&
    (left.projectLabel ?? "") === (right.projectLabel ?? "")
  );
}

function applyConfig(config: SecretsConfigMetadata, mode: Mode): void {
  const runtime = readRuntimeConfig(ROOT);
  if (runtime && configsMatch(runtime, config)) {
    console.log("webpresso secrets config already applied");
    return;
  }
  if (runtime && mode === "seed") {
    console.log("preserving existing secret-manager selection (use --force to overwrite)");
    return;
  }
  writeRuntimeConfig(ROOT, config);
  console.log(
    `Applied repo secrets default to ${path.relative(ROOT, runtimeConfigPath(ROOT))}`,
  );
}

function main() {
  const mode = parseArgs(process.argv.slice(2));
  if (!existsSync(SOURCE)) {
    console.error(`Missing ${path.relative(ROOT, SOURCE)}`);
    process.exit(1);
  }

  const config = parseSecretsConfigMetadata(
    readFileSync(SOURCE, "utf8"),
    path.relative(ROOT, SOURCE),
  );

  if (mode === "check-only") {
    console.log("webpresso secrets config valid (metadata-only, no secret values)");
    return;
  }

  applyConfig(config, mode);
}

main();
