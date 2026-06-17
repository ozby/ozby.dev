import path from "node:path";
import { existsSync } from "node:fs";

export function buildChildEnv(
  root: string,
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const localBin = path.join(root, "node_modules", ".bin");
  const nextPath = env.PATH ? `${localBin}:${env.PATH}` : localBin;
  return {
    ...env,
    PATH: nextPath,
  };
}

const REPO_ROOT_MARKERS = ["package.json", "pnpm-workspace.yaml"];

function hasRepoMarkers(dir: string): boolean {
  return REPO_ROOT_MARKERS.every((marker) => existsSync(path.join(dir, marker)));
}

export function findRepoRoot(startDir = process.cwd()): string {
  let current = path.resolve(startDir);

  while (true) {
    if (hasRepoMarkers(current)) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new Error(
        `Could not find repo root from ${startDir}. Expected markers: ${REPO_ROOT_MARKERS.join(", ")}`,
      );
    }
    current = parent;
  }
}
