import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ContactPage } from "./Contact";

describe("ContactPage", () => {
  it("renders a simple active contact form with Turnstile and success banner", () => {
    const html = renderToStaticMarkup(ContactPage({ status: "success", turnstileSiteKey: "site-key" }));

    expect(html).toContain('method="post"');
    expect(html).toContain('action="/api/contact"');
    expect(html).toContain('name="name"');
    expect(html).toContain('name="email"');
    expect(html).toContain('name="message"');
    expect(html).toContain('class="cf-turnstile"');
    expect(html).toContain('data-sitekey="site-key"');
    expect(html).toContain('Message received.');
  });

  it("blocks submission until the runtime Turnstile site key loads", () => {
    const html = renderToStaticMarkup(ContactPage({ status: null }));

    expect(html).toContain("Security check is loading.");
    expect(html).toContain('disabled=""');
    expect(html).not.toContain("cf-turnstile");
  });

  it("renders clear failure banners", () => {
    const html = renderToStaticMarkup(ContactPage({ status: "captcha", turnstileSiteKey: "site-key" }));

    expect(html).toContain('class="contact-status contact-status--error"');
    expect(html).toContain('Turnstile verification failed.');
  });
});
