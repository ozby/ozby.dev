import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { gitCommonDir, runtimeSecretsConfigPath } from "./git-paths.ts";

function createGitRepo(): string {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "ozby-dev-git-paths-"));
  mkdirSync(path.join(repoRoot, ".git"), { recursive: true });
  writeFileSync(path.join(repoRoot, ".git", "HEAD"), "ref: refs/heads/main\n");
  return repoRoot;
}

function createLinkedWorktreeMetadata(repoRoot: string, worktreeRoot: string): void {
  const gitDir = path.join(repoRoot, ".git", "worktrees", "fixture");
  mkdirSync(gitDir, { recursive: true });
  writeFileSync(path.join(worktreeRoot, ".git"), `gitdir: ${gitDir}\n`);
  writeFileSync(path.join(gitDir, "commondir"), "../..\n");
  writeFileSync(path.join(gitDir, "gitdir"), `${path.join(worktreeRoot, ".git")}\n`);
  writeFileSync(path.join(gitDir, "HEAD"), "ref: refs/heads/fixture\n");
}

describe("git path helpers", () => {
  it("resolves the main git dir for a regular checkout", () => {
    const repoRoot = createGitRepo();

    try {
      const commonDir = gitCommonDir(repoRoot);

      expect(realpathSync(commonDir)).toBe(realpathSync(path.join(repoRoot, ".git")));
      expect(path.normalize(runtimeSecretsConfigPath(repoRoot))).toBe(
        path.normalize(path.join(commonDir, "webpresso", "secrets.json")),
      );
    } finally {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });

  it("resolves the shared git common dir for linked worktrees", () => {
    const repoRoot = createGitRepo();
    const worktreeRoot = mkdtempSync(path.join(tmpdir(), "ozby-dev-worktree-"));

    try {
      createLinkedWorktreeMetadata(repoRoot, worktreeRoot);

      const commonDir = gitCommonDir(worktreeRoot);

      expect(realpathSync(commonDir)).toBe(realpathSync(path.join(repoRoot, ".git")));
      expect(path.normalize(runtimeSecretsConfigPath(worktreeRoot))).toBe(
        path.normalize(path.join(commonDir, "webpresso", "secrets.json")),
      );
    } finally {
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
