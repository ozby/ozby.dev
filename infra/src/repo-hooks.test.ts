import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const repoRoot = new URL("../../", import.meta.url).pathname;

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

describe("husky pre-commit hook", () => {
  // A pre-commit format-write must be scoped to the staged/affected set, never a
  // whole-repo rewrite. An unscoped `wp format` reformats every file in the tree
  // on every commit, dirtying dozens of unrelated files and risking sweeping
  // in-flight WIP. Both the managed block and the user-owned block must scope it.
  it("scopes every format write to --affected (no whole-repo rewrite)", () => {
    const hook = readRepoFile(".husky/pre-commit");

    const formatWrites = hook
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /(^|\s)wp format(\s|$)/.test(line) && !line.startsWith("#"))
      .filter((line) => !line.includes("--check"));

    expect(formatWrites.length).toBeGreaterThan(0);
    for (const line of formatWrites) {
      expect(line, `unscoped format write in .husky/pre-commit: "${line}"`).toContain("--affected");
    }
  });
});
