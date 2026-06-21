import { createCloudflareContactFormHandler, type CloudflareEmailBinding } from "@ozby/cloudflare/contact-form";

export type WorkerEnv = Pick<Env, "ASSETS"> & {
  readonly EMAIL?: CloudflareEmailBinding;
  readonly CONTACT_TURNSTILE_SITE_KEY?: string;
  readonly CONTACT_TURNSTILE_SECRET_KEY?: string;
};


const contactFormHandler = createCloudflareContactFormHandler({
  siteName: "ozby.dev",
  from: "info@ozby.dev",
  internalRecipients: ["ozberk@gmail.com"],
  customerEmailField: "email",
  customerNameField: "name",
  redirectPath: "/contact",
  subjects: {
    internal: "New ozby.dev contact message",
    confirmation: "I received your message",
  },
  internalIntro: "New ozby.dev contact form message.",
  confirmationText: (values) => [
    `Hi ${values.name || "there"},`,
    "",
    "I received your message and will reply when I can.",
  ].join("\n"),
  fields: [
    { name: "name", label: "Name", required: true, maxLength: 120 },
    { name: "email", label: "Email", required: true, type: "email", maxLength: 254 },
    { name: "message", label: "Message", required: true, type: "textarea", maxLength: 2_000 },
  ],
}, { logger: console });

const noStoreJsonHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
} as const;

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return contactFormHandler(request, env);
    }

    if (request.method === "GET" && url.pathname === "/api/contact/config") {
      return new Response(JSON.stringify({ turnstileSiteKey: env.CONTACT_TURNSTILE_SITE_KEY ?? "" }), {
        headers: noStoreJsonHeaders,
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, service: "ozby.dev" }), {
        headers: noStoreJsonHeaders,
      });
    }

    return env.ASSETS.fetch(request);
  },
};
