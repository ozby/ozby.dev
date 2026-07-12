import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "..");

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8")) as unknown;
}

describe("consumer secrets authority contract", () => {
  it("pins the Webpresso secrets provider and deployment profile environments", () => {
    const config = readJson(".webpresso/secrets.config.json");

    expect(config).toMatchObject({
      schemaVersion: 1,
      providers: {
        default: {
          type: "doppler",
          workspace: "ozby",
          project: "ozby-dev",
        },
      },
      profiles: {
        preview: {
          provider: "default",
          environment: "stg",
        },
        production: {
          provider: "default",
          environment: "prd",
        },
      },
    });
  });

  it("uses only local agent config for setup", () => {
    const packageJson = readJson("package.json");

    expect(packageJson).toMatchObject({
      scripts: {
        "setup:agent": "wp setup",
      },
      devDependencies: {
        "@webpresso/agent-config": "catalog:",
      },
    });
    for (const dependencyField of ["dependencies", "devDependencies", "peerDependencies"]) {
      expect(packageJson).not.toMatchObject({
        [dependencyField]: {
          "@webpresso/agent-kit": expect.any(String),
        },
      });
    }
  });
});
