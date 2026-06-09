export type Project = {
  readonly slug: string
  readonly name: string
  readonly summary: string
  readonly url: string
}

export const projects: readonly Project[] = [
  { slug: "agent-kit", name: "agent-kit", summary: "Agent-native planning, QA, and repo workflow tooling.", url: "https://github.com/webpresso/agent-kit" },
  { slug: "ingest-lens", name: "ingest-lens", summary: "Cloudflare/Pulumi/Neon reference app for agent-kit dogfood.", url: "https://github.com/ozby/ingest-lens" },
  { slug: "edge-matte", name: "edge-matte", summary: "Cloudflare Workers image-background removal app.", url: "https://github.com/ozby/edge-matte" },
] as const
