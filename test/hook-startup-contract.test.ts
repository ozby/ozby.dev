import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  repairClaudeSettingsDocument,
  repairCodexHooksDocument,
  repairSessionStartCommand,
} from "../scripts/repair-agent-hooks.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

function readRepoFile(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function readJson<T>(path: string): T {
  return JSON.parse(readRepoFile(path)) as T;
}

const generatedSessionStartCommand =
  "if [ -x '/tmp/node/bin/node' ] && [ -f '/tmp/agent-kit/bin/wp' ]; then (cd '/repo' && '/tmp/node/bin/node' '/tmp/agent-kit/bin/wp' hook sessionstart-routing); status=$?; if [ \"$status\" -eq 2 ]; then exit 2; elif [ \"$status\" -ne 0 ]; then true; fi; else true; fi # wp-sessionstart-routing";

describe("hook startup contract", () => {
  it("records the repo-owned setup command and preserved surfaces", () => {
    const config = readJson<{
      scripts?: Record<string, string>;
      setup?: {
        preservePaths?: string[];
      };
    }>(".webpressorc.json");

    expect(config.scripts?.["setup-agent"]).toBeUndefined();
    expect(config.setup?.preservePaths).toBeUndefined();
  });

  it("rewrites the generated SessionStart command to a direct JS entrypoint", () => {
    const repaired = repairSessionStartCommand(generatedSessionStartCommand);

    expect(repaired).toContain('payload="$(cat 2>/dev/null || true)"');
    expect(repaired).toContain("/tmp/agent-kit/dist/esm/hooks/sessionstart/index.js");
    expect(repaired).not.toContain("/tmp/agent-kit/bin/wp' hook sessionstart-routing");
    expect(repaired).toContain("# wp-sessionstart-routing");
  });

  it("repairs Claude and Codex SessionStart documents idempotently", () => {
    const claude = {
      hooks: {
        SessionStart: [{ hooks: [{ command: generatedSessionStartCommand }] }],
      },
    };
    const codex = {
      hooks: {
        SessionStart: [{ hooks: [{ command: generatedSessionStartCommand }] }],
      },
    };

    expect(repairClaudeSettingsDocument(claude)).toBe(true);
    expect(repairCodexHooksDocument(codex)).toBe(true);
    expect(repairClaudeSettingsDocument(claude)).toBe(false);
    expect(repairCodexHooksDocument(codex)).toBe(false);

    const claudeCommand = claude.hooks.SessionStart[0]?.hooks?.[0]?.command;
    const codexCommand = codex.hooks.SessionStart[0]?.hooks?.[0]?.command;

    expect(claudeCommand).toContain("dist/esm/hooks/sessionstart/index.js");
    expect(codexCommand).toContain("dist/esm/hooks/sessionstart/index.js");
  });
});
