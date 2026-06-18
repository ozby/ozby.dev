import { typescriptBaseConfig } from '@webpresso/agent-config/stryker'

export default {
  ...typescriptBaseConfig,
  plugins: [...typescriptBaseConfig.plugins, "@stryker-mutator/typescript-checker"],
  thresholds: {
    high: 0,
    low: 0,
    break: 0,
  },
  vitest: {
    ...typescriptBaseConfig.vitest,
    configFile: 'vitest.config.ts',
  },
}
