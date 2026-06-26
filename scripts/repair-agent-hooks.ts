import { existsSync, readFileSync, writeFileSync } from "node:fs";

type HookGroup = {
  hooks?: Array<{
    command?: string;
  }>;
};

type ClaudeSettings = {
  hooks?: Record<string, HookGroup[] | undefined>;
};

type CodexHooks = {
  hooks?: Record<string, HookGroup[] | undefined>;
};

const SESSIONSTART_MARKER = "# wp-sessionstart-routing";
const SESSIONSTART_ENTRYPOINT = "/dist/esm/hooks/sessionstart/index.js";

function extractQuotedPath(command: string, pattern: RegExp): string | null {
  const match = pattern.exec(command);
  return match?.[1] ?? null;
}

export function repairSessionStartCommand(command: string): string {
  if (!command.includes(SESSIONSTART_MARKER)) return command;
  if (command.includes(SESSIONSTART_ENTRYPOINT)) return command;

  const nodePath = extractQuotedPath(command, /-x '([^']+\/node)'/u);
  const wpPath = extractQuotedPath(command, /-f '([^']+\/bin\/wp(?:\.cmd)?)'/u);
  const repoRoot = extractQuotedPath(command, /\(cd '([^']+)' &&/u);

  if (!nodePath || !wpPath || !repoRoot) return command;

  const entrypointPath = wpPath.replace(/\/bin\/wp(?:\.cmd)?$/u, SESSIONSTART_ENTRYPOINT);

  return `payload="$(cat 2>/dev/null || true)"; if [ -x '${nodePath}' ] && [ -f '${entrypointPath}' ]; then printf '%s' "$payload" | (cd '${repoRoot}' && '${nodePath}' '${entrypointPath}'); status=$?; if [ "$status" -eq 2 ]; then exit 2; elif [ "$status" -ne 0 ]; then true; fi; else true; fi ${SESSIONSTART_MARKER}`;
}

function repairHookGroups(groups: HookGroup[] | undefined): boolean {
  if (!groups) return false;

  let changed = false;
  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (typeof hook.command !== "string") continue;
      const repaired = repairSessionStartCommand(hook.command);
      if (repaired !== hook.command) {
        hook.command = repaired;
        changed = true;
      }
    }
  }

  return changed;
}

export function repairClaudeSettingsDocument(document: ClaudeSettings): boolean {
  return repairHookGroups(document.hooks?.SessionStart);
}

export function repairCodexHooksDocument(document: CodexHooks): boolean {
  return repairHookGroups(document.hooks?.SessionStart);
}

function repairJsonFile<T>(path: string, repair: (document: T) => boolean): boolean {
  if (!existsSync(path)) return false;

  const raw = readFileSync(path, "utf8");
  const document = JSON.parse(raw) as T;
  const changed = repair(document);

  if (changed) {
    writeFileSync(path, `${JSON.stringify(document, null, 2)}\n`, "utf8");
  }

  return changed;
}

export function runRepair(cwd = process.cwd()) {
  const claudeChanged = repairJsonFile<ClaudeSettings>(
    `${cwd}/.claude/settings.json`,
    repairClaudeSettingsDocument,
  );
  const codexChanged = repairJsonFile<CodexHooks>(
    `${cwd}/.codex/hooks.json`,
    repairCodexHooksDocument,
  );

  return { claudeChanged, codexChanged };
}

if (import.meta.main) {
  const result = runRepair();
  const changed = [
    result.claudeChanged ? ".claude/settings.json" : null,
    result.codexChanged ? ".codex/hooks.json" : null,
  ].filter(Boolean);

  if (changed.length > 0) {
    console.log(`repair-agent-hooks: updated ${changed.join(", ")}`);
  } else {
    console.log("repair-agent-hooks: no changes");
  }
}
