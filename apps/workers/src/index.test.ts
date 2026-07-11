import { afterEach, describe, expect, it, vi } from "vitest";

import worker, { type WorkerEnv } from "./index";

function createAssetsBinding(response: Response): WorkerEnv["ASSETS"] {
  return {
    fetch: vi.fn(async () => response),
    connect: vi.fn(() => {
      throw new Error("connect should not be called in these tests");
    }),
  };
}

function createEnv(): WorkerEnv & { readonly emailSend: ReturnType<typeof vi.fn> } {
  const emailSend = vi.fn(async () => ({ messageId: "ok" }));
  return {
    ASSETS: createAssetsBinding(new Response("asset")),
    EMAIL: { send: emailSend },
    CONTACT_TURNSTILE_SITE_KEY: "turnstile-site",
    CONTACT_TURNSTILE_SECRET_KEY: "turnstile-secret",
    emailSend,
  };
}

function validContactBody(overrides: Record<string, string> = {}): URLSearchParams {
  return new URLSearchParams({
    _redirect: "/contact",
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "Hello from the website",
    "cf-turnstile-response": "turnstile-token",
    ...overrides,
  });
}

describe("worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
  it("returns a no-store health response", async () => {
    const env: WorkerEnv = {
      ASSETS: createAssetsBinding(new Response("asset")),
    };

    const response = await worker.fetch(new Request("https://ozby.dev/health"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ ok: true, service: "ozby.dev" });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("returns the runtime contact config without caching", async () => {
    const env = createEnv();

    const response = await worker.fetch(new Request("https://ozby.dev/api/contact/config"), env);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ turnstileSiteKey: "turnstile-site" });
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("delegates non-health requests to the assets binding", async () => {
    const assetResponse = new Response("<html>ok</html>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });

    const env: WorkerEnv = {
      ASSETS: createAssetsBinding(assetResponse),
    };

    const request = new Request("https://ozby.dev/projects");
    const response = await worker.fetch(request, env);

    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
    expect(response).toBe(assetResponse);
  });

  it("posts contact messages through Turnstile and Cloudflare Email", async () => {
    const env = createEnv();
    const turnstileFetch = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", turnstileFetch);

    const response = await worker.fetch(
      new Request("https://ozby.dev/api/contact", {
        method: "POST",
        body: validContactBody(),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      env,
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/contact?contact=success");
    expect(turnstileFetch).toHaveBeenCalledOnce();
    expect(env.emailSend).toHaveBeenCalledTimes(2);
    expect(env.emailSend.mock.calls[0]?.[0]).toMatchObject({
      from: "info@ozby.dev",
      to: ["ozberk@gmail.com"],
      replyTo: "ada@example.com",
      subject: "New ozby.dev contact message",
    });
    expect(env.emailSend.mock.calls[1]?.[0]).toMatchObject({
      from: "info@ozby.dev",
      to: "ada@example.com",
      replyTo: "info@ozby.dev",
      subject: "I received your message",
    });
  });

  it("redirects invalid contact submissions without captcha or email", async () => {
    const env = createEnv();
    const turnstileFetch = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", turnstileFetch);

    const response = await worker.fetch(
      new Request("https://ozby.dev/api/contact", {
        method: "POST",
        body: validContactBody({ email: "not-email", message: "" }),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      env,
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("/contact?contact=invalid");
    expect(turnstileFetch).not.toHaveBeenCalled();
    expect(env.emailSend).not.toHaveBeenCalled();
  });

  it("fails the contact request when the internal email fails", async () => {
    const env = createEnv();
    env.emailSend.mockRejectedValueOnce(new Error("internal failed"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: true }))),
    );

    const response = await worker.fetch(
      new Request("https://ozby.dev/api/contact", {
        method: "POST",
        body: validContactBody(),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      env,
    );

    expect(response.headers.get("location")).toBe("/contact?contact=email");
    expect(env.emailSend).toHaveBeenCalledTimes(1);
  });

  it("keeps success and logs non-PII when confirmation email fails", async () => {
    const env = createEnv();
    env.emailSend
      .mockResolvedValueOnce({ messageId: "internal" })
      .mockRejectedValueOnce(Object.assign(new Error("confirm failed"), { code: "E_SEND" }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: true }))),
    );

    const response = await worker.fetch(
      new Request("https://ozby.dev/api/contact", {
        method: "POST",
        body: validContactBody(),
        headers: { "content-type": "application/x-www-form-urlencoded" },
      }),
      env,
    );

    expect(response.headers.get("location")).toBe("/contact?contact=success");
    expect(env.emailSend).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("ada@example.com");
    warn.mockRestore();
  });
});
