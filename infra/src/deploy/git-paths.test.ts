import { mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { gitCommonDir, runtimeSecretsConfigPath } from "./git-paths.ts";

function runGit(cwd: string, ...args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "git command failed").trim());
  }
  return result.stdout.trim();
}

function createCommittedRepo(): string {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "ozby-dev-git-paths-"));
  runGit(repoRoot, "init", "-b", "main");
  runGit(repoRoot, "config", "user.name", "Test User");
  runGit(repoRoot, "config", "user.email", "test@example.com");
  writeFileSync(path.join(repoRoot, "README.md"), "fixture\n");
  runGit(repoRoot, "add", "README.md");
  runGit(repoRoot, "commit", "-m", "init");
  return repoRoot;
}

describe("git path helpers", () => {
  it("resolves the main git dir for a regular checkout", () => {
    const repoRoot = createCommittedRepo();

    try {
      expect(realpathSync(gitCommonDir(repoRoot))).toBe(realpathSync(path.join(repoRoot, ".git")));
      expect(path.normalize(runtimeSecretsConfigPath(repoRoot))).toBe(
        path.normalize(path.join(gitCommonDir(repoRoot), "webpresso", "secrets.json")),
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("resolves the shared git common dir for linked worktrees", () => {
    const repoRoot = createCommittedRepo();
    const worktreeRoot = mkdtempSync(path.join(tmpdir(), "ozby-dev-worktree-"));

    try {
      runGit(repoRoot, "worktree", "add", "-b", "feature/test", worktreeRoot);

      expect(realpathSync(gitCommonDir(worktreeRoot))).toBe(realpathSync(path.join(repoRoot, ".git")));
      expect(path.normalize(runtimeSecretsConfigPath(worktreeRoot))).toBe(
        path.normalize(path.join(gitCommonDir(worktreeRoot), "webpresso", "secrets.json")),
      );
    } finally {
      spawnSync("git", ["worktree", "remove", "--force", worktreeRoot], {
        cwd: repoRoot,
        stdio: "ignore",
      });
      rmSync(worktreeRoot, { recursive: true, force: true });
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("fails loudly outside a git checkout", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "ozby-dev-nongit-"));

    try {
      expect(() => gitCommonDir(dir)).toThrow(/Failed to resolve git common dir/u);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
