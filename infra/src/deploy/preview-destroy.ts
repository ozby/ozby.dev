export type PreviewCommandResult = {
  readonly status: number | null;
  readonly output: string;
};

export type PreviewCommandRunner = (
  command: string,
  args: readonly string[],
) => PreviewCommandResult;

// Cloudflare API error codes wrangler surfaces when a Worker service does not
// exist. `wrangler delete` issues an unguarded `DELETE /workers/services/<name>`
// and lets the APIError propagate, rendered as `<message> [code: <n>]`.
// 10007 = WORKER_NOT_FOUND, 10090 = WORKER_LEGACY_ENVIRONMENT_NOT_FOUND.
// These are the only signals we treat as "already gone"; auth (10000), zone,
// quota, and network failures deliberately fall through and stay loud.
const WORKER_ABSENT_SIGNALS: readonly RegExp[] = [/\[code:\s*10007\]/, /\[code:\s*10090\]/];

export function isWorkerAlreadyAbsent(output: string): boolean {
  return WORKER_ABSENT_SIGNALS.some((signal) => signal.test(output));
}

/**
 * Destroy a preview Worker idempotently. Deleting a Worker that was never
 * created — e.g. the deploy was cancelled by concurrency before publishing —
 * is the desired end state on PR close, not a failure. Any error that is not a
 * Worker-not-found signal is rethrown with the captured output.
 */
export function destroyPreviewWorker(
  run: PreviewCommandRunner,
  command: string,
  args: readonly string[],
): void {
  const { status, output } = run(command, args);
  if (status === 0) return;
  if (isWorkerAlreadyAbsent(output)) {
    console.log("▶ Preview Worker already absent; nothing to destroy.");
    return;
  }
  throw new Error(`"${[command, ...args].join(" ")}" exited with status ${status ?? 1}\n${output}`);
}
