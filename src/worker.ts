type AssetsBinding = {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};

export type WorkerEnv = {
  ASSETS: AssetsBinding;
};

const healthHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
} as const;

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "ozby.dev" }), {
        headers: healthHeaders,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
