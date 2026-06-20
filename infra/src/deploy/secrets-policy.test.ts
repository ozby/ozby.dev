import { describe, expect, it } from "vitest";

import { parseSecretsConfigMetadata } from "./secrets-policy.ts";

describe("parseSecretsConfigMetadata", () => {
  it("accepts schemaVersion 1 secret metadata", () => {
    expect(
      parseSecretsConfigMetadata(
        JSON.stringify({
          schemaVersion: 1,
          providers: {
            default: {
              type: "infisical",
              project: "ozby-dev",
            },
          },
          profiles: {
            production: { provider: "default", environment: "prd" },
          },
          sinks: {},
        }),
        ".webpresso/secrets.config.json",
      ),
    ).toEqual({
      manager: "infisical",
      projectId: "ozby-dev",
      profiles: {
        production: { environment: "prd" },
      },
    });
  });

  it("keeps accepting the legacy runtime override shape", () => {
    expect(
      parseSecretsConfigMetadata(
        JSON.stringify({
          manager: "doppler",
          projectId: "ozby-dev",
          projectLabel: "Ozby Dev",
        }),
        ".git/webpresso/secrets.json",
      ),
    ).toEqual({
      manager: "doppler",
      projectId: "ozby-dev",
      projectLabel: "Ozby Dev",
    });
  });
});
