import { spawnSync } from "node:child_process";
import path from "node:path";

export function gitCommonDir(root: string): string {
  const result = spawnSync("git", ["rev-parse", "--git-common-dir"], {
    cwd: root,
    encoding: "utf8",
  });

  if (result.error) {
    throw new Error(
      `Failed to resolve git common dir from ${root}: ${result.error.message}`,
    );
  }

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || "unknown git error").trim();
    throw new Error(`Failed to resolve git common dir from ${root}: ${details}`);
  }

  const gitDir = result.stdout.trim();
  if (gitDir.length === 0) {
    throw new Error(`Failed to resolve git common dir from ${root}: empty git dir output`);
  }

  return path.isAbsolute(gitDir) ? gitDir : path.resolve(root, gitDir);
}

export function runtimeSecretsConfigPath(root: string): string {
  return path.join(gitCommonDir(root), "webpresso", "secrets.json");
}
