import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  resolveDefaultConfigCandidates,
  resolveConfigPathCandidate,
  resolveConfigPath,
  resolveOAuthDir,
  resolveOAuthPath,
  resolveStateDir,
} from "./paths.js";

describe("oauth paths", () => {
  it("prefers GENOMA_OAUTH_DIR over GENOMA_STATE_DIR", () => {
    const env = {
      GENOMA_OAUTH_DIR: "/custom/oauth",
      GENOMA_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.resolve("/custom/oauth"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join(path.resolve("/custom/oauth"), "oauth.json"),
    );
  });

  it("derives oauth path from GENOMA_STATE_DIR when unset", () => {
    const env = {
      GENOMA_STATE_DIR: "/custom/state",
    } as NodeJS.ProcessEnv;

    expect(resolveOAuthDir(env, "/custom/state")).toBe(path.join("/custom/state", "credentials"));
    expect(resolveOAuthPath(env, "/custom/state")).toBe(
      path.join("/custom/state", "credentials", "oauth.json"),
    );
  });
});

describe("state + config path candidates", () => {
  async function withTempRoot(prefix: string, run: (root: string) => Promise<void>): Promise<void> {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    try {
      await run(root);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  }

  function expectGenomaHomeDefaults(env: NodeJS.ProcessEnv): void {
    const configuredHome = env.GENOMA_HOME;
    if (!configuredHome) {
      throw new Error("GENOMA_HOME must be set for this assertion helper");
    }
    const resolvedHome = path.resolve(configuredHome);
    expect(resolveStateDir(env)).toBe(path.join(resolvedHome, ".genoma"));

    const candidates = resolveDefaultConfigCandidates(env);
    expect(candidates[0]).toBe(path.join(resolvedHome, ".genoma", "genoma.json"));
  }

  it("uses GENOMA_STATE_DIR when set", () => {
    const env = {
      GENOMA_STATE_DIR: "/new/state",
    } as NodeJS.ProcessEnv;

    expect(resolveStateDir(env, () => "/home/test")).toBe(path.resolve("/new/state"));
  });

  it("uses GENOMA_HOME for default state/config locations", () => {
    const env = {
      GENOMA_HOME: "/srv/genoma-home",
    } as NodeJS.ProcessEnv;
    expectGenomaHomeDefaults(env);
  });

  it("prefers GENOMA_HOME over HOME for default state/config locations", () => {
    const env = {
      GENOMA_HOME: "/srv/genoma-home",
      HOME: "/home/other",
    } as NodeJS.ProcessEnv;
    expectGenomaHomeDefaults(env);
  });

  it("orders default config candidates in a stable order", () => {
    const home = "/home/test";
    const resolvedHome = path.resolve(home);
    const candidates = resolveDefaultConfigCandidates({} as NodeJS.ProcessEnv, () => home);
    const expected = [
      path.join(resolvedHome, ".genoma", "genoma.json"),
      path.join(resolvedHome, ".genoma", "genome.json"),
      path.join(resolvedHome, ".genoma", "moldbot.json"),
      path.join(resolvedHome, ".genoma", "genome.json"),
      path.join(resolvedHome, ".genome", "genoma.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
      path.join(resolvedHome, ".genome", "moldbot.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
      path.join(resolvedHome, ".genome", "genoma.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
      path.join(resolvedHome, ".genome", "moldbot.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
      path.join(resolvedHome, ".genome", "genoma.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
      path.join(resolvedHome, ".genome", "moldbot.json"),
      path.join(resolvedHome, ".genome", "genome.json"),
    ];
    expect(candidates).toEqual(expected);
  });

  it("prefers ~/.genoma when it exists and legacy dir is missing", async () => {
    await withTempRoot("genoma-state-", async (root) => {
      const newDir = path.join(root, ".genoma");
      await fs.mkdir(newDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("falls back to existing legacy state dir when ~/.genoma is missing", async () => {
    await withTempRoot("genoma-state-legacy-", async (root) => {
      const legacyDir = path.join(root, ".genome");
      await fs.mkdir(legacyDir, { recursive: true });
      const resolved = resolveStateDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyDir);
    });
  });

  it("CONFIG_PATH prefers existing config when present", async () => {
    await withTempRoot("genoma-config-", async (root) => {
      const legacyDir = path.join(root, ".genoma");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyPath = path.join(legacyDir, "genoma.json");
      await fs.writeFile(legacyPath, "{}", "utf-8");

      const resolved = resolveConfigPathCandidate({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(legacyPath);
    });
  });

  it("respects state dir overrides when config is missing", async () => {
    await withTempRoot("genoma-config-override-", async (root) => {
      const legacyDir = path.join(root, ".genoma");
      await fs.mkdir(legacyDir, { recursive: true });
      const legacyConfig = path.join(legacyDir, "genoma.json");
      await fs.writeFile(legacyConfig, "{}", "utf-8");

      const overrideDir = path.join(root, "override");
      const env = { GENOMA_STATE_DIR: overrideDir } as NodeJS.ProcessEnv;
      const resolved = resolveConfigPath(env, overrideDir, () => root);
      expect(resolved).toBe(path.join(overrideDir, "genoma.json"));
    });
  });
});
