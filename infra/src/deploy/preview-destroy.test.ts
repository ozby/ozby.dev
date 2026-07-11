import { describe, expect, it, vi } from "vitest";

import { destroyPreviewWorker, isWorkerAlreadyAbsent } from "./preview-destroy.ts";

// Real wrangler v4 renders a missing-Worker delete as an unguarded Cloudflare
// APIError: `<message> [code: 10007]` (WORKER_NOT_FOUND) or `[code: 10090]`
// (WORKER_LEGACY_ENVIRONMENT_NOT_FOUND). Those two codes are the only tolerable
// "already gone" signals; every other failure must stay loud.
const WORKER_NOT_FOUND_OUTPUT =
  "✘ [ERROR] A request to the Cloudflare API (/accounts/acc/workers/services/ozby-dev-preview-pr-50) failed.\n\n  workers.api.error.service_not_found [code: 10007]\n";
const WORKER_LEGACY_NOT_FOUND_OUTPUT = "  Something went wrong [code: 10090]\n";
const AUTH_ERROR_OUTPUT =
  "✘ [ERROR] A request to the Cloudflare API failed.\n\n  Authentication error [code: 10000]\n";
const NETWORK_ERROR_OUTPUT = "✘ [ERROR] Failed to fetch: ECONNREFUSED\n";

describe("isWorkerAlreadyAbsent", () => {
  it("tolerates the worker-not-found codes wrangler surfaces on delete", () => {
    expect(isWorkerAlreadyAbsent(WORKER_NOT_FOUND_OUTPUT)).toBe(true);
    expect(isWorkerAlreadyAbsent(WORKER_LEGACY_NOT_FOUND_OUTPUT)).toBe(true);
  });

  it("does not tolerate auth, network, or empty output", () => {
    expect(isWorkerAlreadyAbsent(AUTH_ERROR_OUTPUT)).toBe(false);
    expect(isWorkerAlreadyAbsent(NETWORK_ERROR_OUTPUT)).toBe(false);
    expect(isWorkerAlreadyAbsent("")).toBe(false);
  });
});

describe("destroyPreviewWorker", () => {
  const command = "pnpm";
  const args = [
    "--dir",
    "apps/workers",
    "exec",
    "wrangler",
    "delete",
    "--name",
    "ozby-dev-preview-pr-50",
  ];

  it("runs the delete and returns cleanly on success", () => {
    const run = vi.fn(() => ({
      status: 0,
      output: "Successfully deleted ozby-dev-preview-pr-50\n",
    }));
    expect(() => destroyPreviewWorker(run, command, args)).not.toThrow();
    expect(run).toHaveBeenCalledWith(command, args);
  });

  it("treats an already-absent Worker as a successful no-op", () => {
    const run = vi.fn(() => ({ status: 1, output: WORKER_NOT_FOUND_OUTPUT }));
    expect(() => destroyPreviewWorker(run, command, args)).not.toThrow();
    expect(run).toHaveBeenCalledOnce();
  });

  it("still fails loudly on a real (non-not-found) delete error", () => {
    const run = vi.fn(() => ({ status: 1, output: AUTH_ERROR_OUTPUT }));
    expect(() => destroyPreviewWorker(run, command, args)).toThrow(/status 1/);
    expect(() => destroyPreviewWorker(run, command, args)).toThrow(/Authentication error/);
  });
});
