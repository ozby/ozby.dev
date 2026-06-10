import path from "node:path";

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
