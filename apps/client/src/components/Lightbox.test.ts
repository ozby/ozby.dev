import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Lightbox } from "./Lightbox";

describe("Lightbox", () => {
  it("renders a modal dialog wired for enlarged images", () => {
    const html = renderToStaticMarkup(createElement(Lightbox));

    // The dialog is always mounted (empty until an image is clicked in the
    // browser); interaction is covered by browser verification, since the
    // client test env has no DOM to exercise <dialog>.showModal().
    expect(html).toContain('class="lightbox"');
    expect(html).toContain('aria-label="Enlarged image"');
  });
});
