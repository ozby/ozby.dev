import { renderMarkdown } from "./markdown";
import type { Post } from "./types";

const rawFiles = import.meta.glob<string>("../content/posts/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function parseFrontmatter(raw: string): {
  data: Record<string, string | boolean>;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)/.exec(raw);
  if (!match) return { data: {}, content: raw };

  const yamlBlock = match[1] ?? "";
  const body = match[2] ?? "";
  const data: Record<string, string | boolean> = {};

  for (const line of yamlBlock.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    if (!key) continue;
    let value = line.slice(colon + 1).trim();
    if (value === "true") {
      data[key] = true;
    } else if (value === "false") {
      data[key] = false;
    } else {
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
  }

  return { data, content: body };
}

function buildPosts(): Post[] {
  return Object.entries(rawFiles)
    .map(([path, raw]) => {
      const { data, content } = parseFrontmatter(raw);
      const slug = path.replace("../content/posts/", "").replace(".md", "");
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const readTime = Math.max(1, Math.ceil(wordCount / 200));
      const html = renderMarkdown(content);
      return {
        slug,
        title: typeof data["title"] === "string" ? data["title"] : slug,
        date: typeof data["date"] === "string" ? data["date"] : "",
        description: typeof data["description"] === "string" ? data["description"] : "",
        published: data["published"] !== false,
        html,
        readTime,
      } satisfies Post;
    })
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const posts: Post[] = buildPosts();
