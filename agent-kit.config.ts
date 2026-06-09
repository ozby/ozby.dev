export const agentKitConfig = {
  deploy: {
    adapterModule: "./scripts/agent-kit-deploy-adapter.ts",
    cloudflare: {
      lanes: {
        dev: { wranglerEnvName: "dev" },
        preview_main: { wranglerEnvName: "preview-main" },
        preview_pr: { wranglerEnvNamePattern: "preview-pr-<n>" },
        prd: {
          wranglerEnvName: "production",
          deployedWorkerNameMode: "top_level_name",
        },
      },
      production: {
        metadataPath: "infra/release-metadata.production.json",
      },
      targets: [
        {
          id: "ozby-dev-site",
          type: "worker_plus_assets",
          topLevelWorkerName: "ozby-dev",
          previewTransport: "custom_domain_env",
          routeSpec: { pattern: "preview-main.ozby.dev" },
          vars: {},
          requiredSecrets: [],
          storageMode: "isolated",
          destroyMode: "wrangler_delete_env",
          productionStrategyDefault: "direct",
        },
      ],
    },
  },
} as const;

export default agentKitConfig;
