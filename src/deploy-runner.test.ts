import { describe, expect, it } from "vitest";

import { buildChildEnv } from "../scripts/lib/deploy-runner.ts";

describe("buildChildEnv", () => {
  it("prepends the repo-local node_modules bin directory to PATH", () => {
    const env = buildChildEnv("/repo", { PATH: "/usr/bin:/bin" });

    expect(env.PATH?.split(":").at(0)).toBe("/repo/node_modules/.bin");
    expect(env.PATH).toContain("/usr/bin:/bin");
  });

  it("preserves other environment variables while adding a PATH when missing", () => {
    const env = buildChildEnv("/repo", { HOME: "/tmp/home" });

    expect(env.HOME).toBe("/tmp/home");
    expect(env.PATH).toBe("/repo/node_modules/.bin");
  });
});
