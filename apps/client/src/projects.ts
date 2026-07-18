import type { Project } from "./lib/types";

export type { Project };

export const projects: readonly Project[] = [
  {
    slug: "agent-kit",
    name: "agent-kit",
    summary:
      "Engineering operating system for AI-assisted delivery — blueprints, audits, evidence gates.",
    url: "https://github.com/webpresso/agent-kit",
    tech: ["TypeScript", "Node.js", "Platform engineering", "Vitest"],
    why: `A repository-native workflow for AI-assisted delivery: planning, implementation, verification, secrets, docs, and lifecycle checks with evidence gates. It makes disciplined engineering repeatable across teams and repositories.`,
  },
  {
    slug: "ingest-lens",
    name: "ingest-lens",
    summary: "Production reference app — IaC, preview environments, CI close to production.",
    url: "https://github.com/ozby/ingest-lens",
    tech: [
      "TypeScript",
      "React Router",
      "Cloudflare Workers",
      "Hono",
      "Pulumi",
      "Neon",
      "IaC",
      "Preview environments",
    ],
    why: `A production-shaped reference app for the agent-kit toolchain: Pulumi-managed resources, Neon Postgres, branch-per-PR previews, and checks that keep CI close to production.`,
  },
  {
    slug: "edge-matte",
    name: "edge-matte",
    summary:
      "Edge-native image pipeline — architecture-first background removal, no third-party API.",
    url: "https://github.com/ozby/edge-matte",
    demoUrl: "https://edge-matte.ozby.dev",
    tech: [
      "TypeScript",
      "Cloudflare Workers",
      "Hono",
      "BiRefNet",
      "Pulumi",
      "Hexagonal architecture",
    ],
    why: `Background removal on Cloudflare using the native \`cf.image segment: "foreground"\` (BiRefNet) transform. The hexagonal pipeline validates, uploads, removes the background, stores the result, and returns a URL while keeping provider adapters separate from domain logic.`,
  },
] as const;
