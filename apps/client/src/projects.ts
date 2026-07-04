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
    why: `An engineering operating system for AI-assisted delivery. It turns planning, implementation, verification, secrets handling, docs, and lifecycle checks into repeatable workflows with evidence gates. The goal is not more automation for its own sake; it is senior engineering discipline made executable across teams and repositories.`,
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
    why: `A production-shaped reference application that exercises the full agent-kit toolchain against real infrastructure. Pulumi-managed cloud resources, Neon for Postgres, branch-per-PR preview environments, and checks that keep CI close to production reality. It is a proving ground for fast feedback loops, reproducible environments, and safe delivery under real operational constraints.`,
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
    why: `Background removal on the Cloudflare edge using the native \`cf.image segment: "foreground"\` (BiRefNet) transform — no external API key, no round-trips. The interesting part is the operating model: a hexagonal core pipeline (validate → upload → bg-removal → flip → store → respond), dependency-injected platform adapters, and domain logic that stays portable instead of leaking provider assumptions.`,
  },
] as const;
