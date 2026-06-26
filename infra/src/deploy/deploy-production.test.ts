import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  assertProductionReleaseVersion,
  resolveReleaseVersion,
  resolveRequiredWranglerSecrets,
  writeWranglerSecretsFile,
} from "./deploy-production.ts";
import { readFileSync, rmSync } from "node:fs";

describe("resolveReleaseVersion", () => {
  it("prefers the --release-version argument over env vars", () => {
    const resolved = resolveReleaseVersion({
      releaseVersionArg: "1.2.3",
      env: { RELEASE_VERSION: "9.9.9", RELEASE_VERSION_INPUT: "8.8.8" },
    });

    expect(resolved).toBe("1.2.3");
  });

  it("falls back to RELEASE_VERSION when no argument is given", () => {
    const resolved = resolveReleaseVersion({
      env: { RELEASE_VERSION: "2.0.0", RELEASE_VERSION_INPUT: "8.8.8" },
    });

    expect(resolved).toBe("2.0.0");
  });

  it("falls back to RELEASE_VERSION_INPUT when RELEASE_VERSION is absent", () => {
    const resolved = resolveReleaseVersion({
      env: { RELEASE_VERSION_INPUT: "3.1.4" },
    });

    expect(resolved).toBe("3.1.4");
  });

  it("returns an empty string when no source provides a version", () => {
    const resolved = resolveReleaseVersion({ env: {} });

    expect(resolved).toBe("");
  });
});

describe("assertProductionReleaseVersion", () => {
  it("rejects a missing release version before any deploy mutation", () => {
    expect(() =>
      assertProductionReleaseVersion({ releaseVersion: "", metadataReleaseVersion: "0.1.1" }),
    ).toThrow(/requires an explicit semantic release version; received <missing>/u);
  });

  it("rejects a non-semantic release version", () => {
    expect(() =>
      assertProductionReleaseVersion({
        releaseVersion: "not-a-version",
        metadataReleaseVersion: "0.1.1",
      }),
    ).toThrow(/requires an explicit semantic release version; received not-a-version/u);
  });

  it("rejects a release version that does not match the production metadata", () => {
    expect(() =>
      assertProductionReleaseVersion({
        releaseVersion: "1.2.3",
        metadataReleaseVersion: "0.1.1",
      }),
    ).toThrow(/version mismatch: metadata releaseVersion=0\.1\.1, requested=1\.2\.3/u);
  });

  it("rejects when the production metadata has no releaseVersion field", () => {
    expect(() =>
      assertProductionReleaseVersion({
        releaseVersion: "1.2.3",
        metadataReleaseVersion: undefined,
      }),
    ).toThrow(/version mismatch: metadata releaseVersion=undefined, requested=1\.2\.3/u);
  });

  it("accepts a semantic version that matches the production metadata", () => {
    expect(() =>
      assertProductionReleaseVersion({
        releaseVersion: "0.1.1",
        metadataReleaseVersion: "0.1.1",
      }),
    ).not.toThrow();
  });

  it("accepts a semantic version carrying a prerelease/build suffix when it matches", () => {
    expect(() =>
      assertProductionReleaseVersion({
        releaseVersion: "1.4.0-rc.1",
        metadataReleaseVersion: "1.4.0-rc.1",
      }),
    ).not.toThrow();
  });
});

describe("resolveRequiredWranglerSecrets", () => {
  it("returns the required Wrangler secrets from env", () => {
    expect(
      resolveRequiredWranglerSecrets({
        CONTACT_TURNSTILE_SITE_KEY: "site-key",
        CONTACT_TURNSTILE_SECRET_KEY: "secret-key",
      }),
    ).toEqual({
      CONTACT_TURNSTILE_SITE_KEY: "site-key",
      CONTACT_TURNSTILE_SECRET_KEY: "secret-key",
    });
  });

  it("fails loudly when a required Wrangler secret is missing", () => {
    expect(() =>
      resolveRequiredWranglerSecrets({
        CONTACT_TURNSTILE_SECRET_KEY: "secret-key",
      }),
    ).toThrow(/Production deploy requires CI\/runtime values for: CONTACT_TURNSTILE_SITE_KEY/u);
  });
});

describe("writeWranglerSecretsFile", () => {
  it("writes a JSON secrets file consumable by Wrangler", () => {
    const secretsFilePath = writeWranglerSecretsFile({
      CONTACT_TURNSTILE_SITE_KEY: "site-key",
      CONTACT_TURNSTILE_SECRET_KEY: "secret-key",
    });

    try {
      expect(JSON.parse(readFileSync(secretsFilePath, "utf8"))).toEqual({
        CONTACT_TURNSTILE_SITE_KEY: "site-key",
        CONTACT_TURNSTILE_SECRET_KEY: "secret-key",
      });
    } finally {
      rmSync(secretsFilePath, { force: true });
      rmSync(path.dirname(secretsFilePath), { force: true, recursive: true });
    }
  });
});
