export type WorkerEnv = Pick<Env, "ASSETS">;

const healthHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
} as const;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "ozby.dev" }), {
        headers: healthHeaders,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
