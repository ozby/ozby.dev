import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { buildChildEnv, findRepoRoot } from "./deploy-runner.ts";
import { readSecretsConfig } from "./deploy-production.ts";

describe("buildChildEnv", () => {
  it("prepends the repo-local node_modules bin directory to PATH", () => {
    const env = buildChildEnv("/repo", { PATH: "/usr/bin:/bin" });

    expect(env.PATH?.split(":").at(0)).toBe("/repo/node_modules/.bin");
    expect(env.PATH).toContain("/usr/bin:/bin");
  });

  it("preserves other environment variables while adding a PATH when missing", () => {
    const env = buildChildEnv("/repo", { HOME: "/tmp/home" });

    expect(env.HOME).toBe("/tmp/home");
    expect(env.PATH).toBe("/repo/node_modules/.bin");
  });

  it("fails loudly when runtime secrets metadata exists but is invalid", () => {
    const root = mkdtempSync(path.join(tmpdir(), "ozby-dev-runtime-secrets-"));

    try {
      const runGit = (...args: string[]) => {
        const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
        if (result.error) throw result.error;
        if (result.status !== 0) {
          throw new Error((result.stderr || result.stdout || "git command failed").trim());
        }
      };

      runGit("init", "-b", "main");
      writeFileSync(path.join(root, "package.json"), '{"name":"fixture","private":true}\n');
      writeFileSync(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n  - "infra"\n');
      writeFileSync(path.join(root, "AGENTS.md"), "# fixture\n");

      mkdirSync(path.join(root, ".webpresso"), { recursive: true });
      writeFileSync(
        path.join(root, ".webpresso", "secrets.config.json"),
        '{"manager":"doppler","projectId":"ozby-shell"}\n',
      );

      const gitDir = spawnSync("git", ["rev-parse", "--git-common-dir"], {
        cwd: root,
        encoding: "utf8",
      }).stdout.trim();
      mkdirSync(path.join(root, gitDir, "webpresso"), { recursive: true });
      writeFileSync(
        path.join(root, gitDir, "webpresso", "secrets.json"),
        '{"manager":"doppler","projectId":123}\n',
      );

      expect(() => readSecretsConfig(root)).toThrow(/projectId/u);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("finds the workspace root without depending on AGENTS.md", () => {
    const root = mkdtempSync(path.join(tmpdir(), "ozby-dev-root-markers-"));

    try {
      mkdirSync(path.join(root, "apps"), { recursive: true });
      writeFileSync(path.join(root, "package.json"), '{"name":"fixture","private":true}\n');
      writeFileSync(path.join(root, "pnpm-workspace.yaml"), 'packages:\n  - "apps/*"\n  - "infra"\n');

      expect(findRepoRoot(path.join(root, "apps"))).toBe(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
