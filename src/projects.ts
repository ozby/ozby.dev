import type { Project } from './lib/types'

export type { Project }

export const projects: readonly Project[] = [
  {
    slug: 'agent-kit',
    name: 'agent-kit',
    summary: 'CLI tooling for AI-assisted development — blueprints, audits, vitest preset.',
    url: 'https://github.com/webpresso/agent-kit',
    tech: ['TypeScript', 'Node.js', 'Cloudflare Workers', 'Vitest'],
    why: `A CLI for AI-assisted development workflows. Blueprint-driven planning, a vitest preset tuned for Cloudflare Workers, and audit commands for catalog drift, docs, and blueprint lifecycle. Built to standardise the development workflow across projects that use AI coding agents.`,
  },
  {
    slug: 'ingest-lens',
    name: 'ingest-lens',
    summary: 'Production reference app — Cloudflare Workers, Pulumi, Neon, branch-per-PR.',
    url: 'https://github.com/ozby/ingest-lens',
    tech: ['TypeScript', 'React Router', 'Cloudflare Workers', 'Hono', 'Pulumi', 'Neon'],
    why: `A reference application that exercises the full agent-kit toolchain against real infrastructure. Cloudflare Workers for compute, Pulumi for infrastructure-as-code, Neon for Postgres with branch-per-PR preview environments. The integration test for agent-kit's claims.`,
  },
  {
    slug: 'edge-matte',
    name: 'edge-matte',
    summary: 'Image background removal at the CDN edge — no third-party API.',
    url: 'https://github.com/ozby/edge-matte',
    demoUrl: 'https://edge-matte.ozby.dev',
    tech: ['TypeScript', 'Cloudflare Workers', 'Hono', 'BiRefNet', 'Pulumi'],
    why: `Background removal on the Cloudflare edge using the native \`cf.image segment: "foreground"\` (BiRefNet) transform — no external API key, no round-trips. Architecture: hexagonal core pipeline (validate → upload → bg-removal → flip → store → respond) with Cloudflare adapters dependency-injected. The domain logic is infrastructure-agnostic.`,
  },
] as const
