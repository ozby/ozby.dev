import { useEffect, useRef, useState } from "react";

export type ContactStatus = "success" | "invalid" | "captcha" | "email";

type ContactRuntimeConfig = { readonly turnstileSiteKey?: string };

declare global {
  interface Window {
    turnstile?: {
      render(container: HTMLElement, options: { readonly sitekey: string }): string;
      remove?(widgetId: string): void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-api";
const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let turnstileScriptPromise: Promise<void> | null = null;

function ensureTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile != null) return Promise.resolve();
  if (turnstileScriptPromise != null) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing != null) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Cloudflare Turnstile failed to load")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Cloudflare Turnstile failed to load")),
      { once: true },
    );
    document.head.append(script);
  });

  return turnstileScriptPromise;
}

function contactStatusCopy(
  status?: ContactStatus | string | null,
): { readonly tone: "success" | "error"; readonly text: string } | null {
  if (status === "success")
    return {
      tone: "success",
      text: "Message received — thanks. I read everything and reply personally.",
    };
  if (status === "invalid")
    return { tone: "error", text: "Please check your name, email, and message before sending." };
  if (status === "captcha") return { tone: "error", text: "Turnstile verification failed." };
  if (status === "email")
    return {
      tone: "error",
      text: "I could not send the message. Please try again, or reach me through LinkedIn.",
    };
  return null;
}

function TurnstileWidget({ siteKey }: { readonly siteKey: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container == null || siteKey.length === 0) return undefined;

    let cancelled = false;
    let widgetId: string | null = null;

    ensureTurnstileScript()
      .then(() => {
        if (cancelled || containerRef.current == null || window.turnstile == null) return;
        containerRef.current.textContent = "";
        widgetId = window.turnstile.render(containerRef.current, { sitekey: siteKey });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (widgetId != null) window.turnstile?.remove?.(widgetId);
      container.textContent = "";
    };
  }, [siteKey]);

  return <div ref={containerRef} className="cf-turnstile" data-sitekey={siteKey} />;
}

export function ContactPage({
  status,
  turnstileSiteKey = "",
}: {
  readonly status?: ContactStatus | string | null;
  readonly turnstileSiteKey?: string;
}) {
  const banner = contactStatusCopy(status);
  const verificationReady = turnstileSiteKey.length > 0;

  return (
    <section className="contact-page">
      <p className="section-label">
        <span className="only-light label-light">
          Contact<span className="slash">/</span>
        </span>
        <span className="only-dark label-dark">$ mail ozberk</span>
      </p>
      <h1>Contact</h1>
      <p className="contact-intro">
        Building an AI product or a cloud platform — or a team that needs an engineering leader who
        still ships? Tell me what you&apos;re working on.
      </p>
      <form className="contact-form" method="post" action="/api/contact">
        {banner ? (
          <p className={`contact-status contact-status--${banner.tone}`} role="status">
            {banner.text}
          </p>
        ) : null}
        <input type="hidden" name="_redirect" value="/contact" />
        <label>
          Name
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          Message
          <textarea name="message" required />
        </label>
        {verificationReady ? (
          <TurnstileWidget siteKey={turnstileSiteKey} />
        ) : (
          <p className="contact-status contact-status--error" role="status">
            Security check is loading. It will finish automatically.
          </p>
        )}
        <button type="submit" className="contact-submit" disabled={!verificationReady}>
          Send message
        </button>
      </form>
    </section>
  );
}

export function Contact() {
  const params = new URLSearchParams(window.location.search);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/contact/config", { headers: { accept: "application/json" } })
      .then(
        async (response): Promise<ContactRuntimeConfig> =>
          response.ok ? ((await response.json()) as ContactRuntimeConfig) : {},
      )
      .then((config) => {
        if (!cancelled && typeof config.turnstileSiteKey === "string")
          setTurnstileSiteKey(config.turnstileSiteKey);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return <ContactPage status={params.get("contact")} turnstileSiteKey={turnstileSiteKey} />;
}
