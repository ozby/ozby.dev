import { existsSync, lstatSync, readFileSync } from "node:fs";
import path from "node:path";

function resolveGitDirReference(root: string, value: string): string {
  const match = /^gitdir:\s*(.+)$/u.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid .git file in ${root}: expected gitdir reference`);
  }
  const gitDir = match[1];
  if (gitDir === undefined || gitDir.length === 0) {
    throw new Error(`Invalid .git file in ${root}: empty gitdir reference`);
  }
  return path.isAbsolute(gitDir) ? gitDir : path.resolve(root, gitDir);
}

function readCommonDir(gitDir: string): string {
  const commonDirPath = path.join(gitDir, "commondir");
  if (!existsSync(commonDirPath)) {
    return gitDir;
  }

  const commonDir = readFileSync(commonDirPath, "utf8").trim();
  if (commonDir.length === 0) {
    throw new Error(`Invalid git commondir in ${gitDir}: empty value`);
  }
  return path.isAbsolute(commonDir) ? commonDir : path.resolve(gitDir, commonDir);
}

export function gitCommonDir(root: string): string {
  const dotGitPath = path.join(root, ".git");
  try {
    if (!existsSync(dotGitPath)) {
      throw new Error("missing .git entry");
    }

    const dotGit = lstatSync(dotGitPath);
    if (dotGit.isDirectory()) {
      return dotGitPath;
    }
    if (dotGit.isFile()) {
      return readCommonDir(resolveGitDirReference(root, readFileSync(dotGitPath, "utf8")));
    }

    throw new Error(".git entry is neither a directory nor a file");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to resolve git common dir from ${root}: ${detail}`);
  }
}

export function runtimeSecretsConfigPath(root: string): string {
  return path.join(gitCommonDir(root), "webpresso", "secrets.json");
}
