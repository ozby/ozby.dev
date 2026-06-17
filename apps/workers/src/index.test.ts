import { describe, expect, it, vi } from "vitest";

import worker, { type WorkerEnv } from "./index";

describe("worker", () => {
  it("returns a no-store health response", async () => {
    const env: WorkerEnv = {
      ASSETS: {
        fetch: vi.fn(async () => new Response("asset")),
      },
    };

    const response = await worker.fetch(new Request("https://ozby.dev/health"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: true, service: "ozby.dev" });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("delegates non-health requests to the assets binding", async () => {
    const assetResponse = new Response("<html>ok</html>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    const env: WorkerEnv = {
      ASSETS: {
        fetch: vi.fn(async () => assetResponse),
      },
    };

    const request = new Request("https://ozby.dev/projects");
    const response = await worker.fetch(request, env);

    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(assetResponse);
  });
});
