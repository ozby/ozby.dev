import { describe, expect, it } from "vitest";

import { projects } from "./projects";

describe("projects", () => {
  it("contains the dogfood repos and stable slugs", () => {
    expect(projects.map((project) => project.slug)).toEqual(["agent-kit", "ingest-lens", "edge-matte"]);
  });
});
