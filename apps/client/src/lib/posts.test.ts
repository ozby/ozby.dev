import { describe, expect, it } from "vitest";
import { parseFrontmatter } from "./posts";

const SAMPLE = `---
title: "Test Post"
date: "2026-01-15"
description: "A test description"
published: true
---

# Heading

Body content here.
`;

const UNPUBLISHED = `---
title: "Draft"
date: "2026-01-01"
description: "Not published"
published: false
---

Draft body.
`;

describe("parseFrontmatter", () => {
  it("extracts string fields", () => {
    const { data } = parseFrontmatter(SAMPLE);
    expect(data["title"]).toBe("Test Post");
    expect(data["date"]).toBe("2026-01-15");
    expect(data["description"]).toBe("A test description");
  });

  it("parses boolean true", () => {
    const { data } = parseFrontmatter(SAMPLE);
    expect(data["published"]).toBe(true);
  });

  it("parses boolean false", () => {
    const { data } = parseFrontmatter(UNPUBLISHED);
    expect(data["published"]).toBe(false);
  });

  it("separates body content from frontmatter", () => {
    const { content } = parseFrontmatter(SAMPLE);
    expect(content).toContain("# Heading");
    expect(content).toContain("Body content here.");
    expect(content).not.toContain("---");
    expect(content).not.toContain("title:");
  });

  it("returns raw string unchanged when no frontmatter delimiters", () => {
    const raw = "Just plain text, no frontmatter.";
    const { data, content } = parseFrontmatter(raw);
    expect(Object.keys(data)).toHaveLength(0);
    expect(content).toBe(raw);
  });
});

describe("posts module", () => {
  it("exports at least one published post", async () => {
    const { posts } = await import("./posts");
    expect(posts.length).toBeGreaterThan(0);
  });

  it("every post has required fields with correct types", async () => {
    const { posts } = await import("./posts");
    for (const post of posts) {
      expect(typeof post.slug).toBe("string");
      expect(post.slug.length).toBeGreaterThan(0);
      expect(typeof post.title).toBe("string");
      expect(post.title.length).toBeGreaterThan(0);
      expect(typeof post.date).toBe("string");
      expect(typeof post.description).toBe("string");
      expect(typeof post.html).toBe("string");
      expect(post.html.length).toBeGreaterThan(0);
      expect(typeof post.readTime).toBe("number");
      expect(post.readTime).toBeGreaterThanOrEqual(1);
      expect(post.published).toBe(true);
    }
  });

  it("posts are sorted newest-first", async () => {
    const { posts } = await import("./posts");
    for (let i = 1; i < posts.length; i++) {
      const prev = new Date(posts[i - 1]!.date).getTime();
      const curr = new Date(posts[i]!.date).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
