/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  GenomaAgentPGABridge,
  getGlobalPGABridge,
  resetGlobalPGABridge,
} from "./GenomaAgentPGABridge.js";

// Mock the dependencies
vi.mock("../adapters/GenomaStorageAdapter.js", () => ({
  GenomaStorageAdapter: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../adapters/GenomaLLMAdapter.js", () => ({
  GenomaLLMAdapter: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockResolvedValue({ content: "mocked" }),
  })),
}));

vi.mock("./AgentIntegration.js", () => {
  const EventEmitter = require("events");
  return {
    AgentIntegration: vi.fn().mockImplementation(() => {
      const _emitter = new EventEmitter();
      return {
        initialize: vi.fn().mockResolvedValue(undefined),
        isActive: vi.fn().mockReturnValue(true),
        assemblePromptForAgent: vi.fn().mockResolvedValue("evolved prompt"),
        recordExecution: vi.fn().mockResolvedValue(undefined),
        getGenome: vi.fn().mockReturnValue({ id: "genome-1", version: 1 }),
        getCurrentFitness: vi.fn().mockReturnValue(null),
        getMetrics: vi.fn().mockReturnValue({ fitnessHistory: [], totalMutations: 0 }),
        recordFeedback: vi.fn().mockResolvedValue(undefined),
        forceEvolution: vi.fn().mockResolvedValue(undefined),
        forceRollback: vi.fn().mockResolvedValue(undefined),
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      };
    }),
    DEFAULT_INTEGRATION_CONFIG: {
      enabled: true,
      agentId: "default",
      mutationInterval: 50,
      fitnessThreshold: 0.6,
      autoRollback: true,
      rollbackThreshold: 0.15,
      verboseLogging: false,
      maxSnapshots: 10,
    },
  };
});

vi.mock("./PGAAPI.js", () => ({
  PGAAPI: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    isActive: vi.fn().mockReturnValue(true),
    getEvolutionStatus: vi.fn().mockReturnValue({
      enabled: true,
      initialized: true,
      genomeId: "genome-1",
      genomeVersion: 1,
      currentFitness: {
        accuracy: 0.8,
        speed: 0.7,
        cost: 0.6,
        safety: 0.9,
        userSatisfaction: 0.75,
        adaptability: 0.65,
      },
      interactionsSinceMutation: 5,
      totalMutations: 2,
      totalRollbacks: 0,
      fitnessTrend: "stable",
    }),
    recordFeedback: vi.fn().mockResolvedValue(undefined),
    forceEvolution: vi.fn().mockResolvedValue(undefined),
    forceRollback: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("../config/pga-integration.config.js", () => ({
  getPGAConfigForEnvironment: vi.fn().mockReturnValue({
    featureFlags: {
      enabled: false,
      evolutionEnabled: true,
      fitnessTrackingEnabled: true,
      autoMutationEnabled: true,
      autoRollbackEnabled: true,
      memoryEnabled: true,
      registryEnabled: true,
      verboseLogging: false,
      metricsEnabled: true,
    },
    evolution: {
      mutationInterval: 50,
      fitnessThreshold: 0.6,
      rollbackThreshold: 0.15,
      maxMutationsPerCycle: 3,
      mutationStrategies: ["llm_rewrite", "simplify"],
      mutationCooldownMs: 60000,
    },
    fitness: {
      weights: {
        accuracy: 0.25,
        speed: 0.15,
        cost: 0.1,
        safety: 0.2,
        userSatisfaction: 0.2,
        adaptability: 0.1,
      },
      emaAlpha: 0.3,
      minSamplesForStability: 10,
    },
    storage: { type: "memory", maxSnapshots: 10, maxInteractions: 1000, maxMutations: 500 },
  }),
  toPGAAgentIntegrationConfig: vi.fn().mockReturnValue({
    enabled: true,
    agentId: "test-agent",
    mutationInterval: 50,
    fitnessThreshold: 0.6,
    autoRollback: true,
    rollbackThreshold: 0.15,
    verboseLogging: false,
    maxSnapshots: 10,
  }),
}));

vi.mock("./hooks.js", () => ({
  PGAHooks: {
    beforeAgentStart: vi.fn().mockResolvedValue({
      prompt: "evolved prompt from hook",
      pgaApplied: true,
      genomeVersion: 1,
    }),
    afterAgentComplete: vi.fn().mockResolvedValue({
      fitnessRecorded: true,
    }),
    onAgentError: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("GenomaAgentPGABridge", () => {
  let bridge: GenomaAgentPGABridge;

  const testContext = {
    agentId: "test-agent",
    sessionId: "session-1",
    sessionKey: "key-1",
    userId: "user-1",
    provider: "anthropic",
    model: "claude-3",
  };

  const testResult = {
    response: "Test response",
    assistantTexts: ["Test response"],
    toolsUsed: ["read_file", "write_file"],
    usage: { input: 100, output: 200, total: 300 },
    latencyMs: 1500,
  };

  beforeEach(() => {
    resetGlobalPGABridge();
    bridge = new GenomaAgentPGABridge();
  });

  describe("singleton", () => {
    it("getGlobalPGABridge returns the same instance", () => {
      const a = getGlobalPGABridge();
      const b = getGlobalPGABridge();
      expect(a).toBe(b);
    });

    it("resetGlobalPGABridge creates new instance", () => {
      const a = getGlobalPGABridge();
      resetGlobalPGABridge();
      const b = getGlobalPGABridge();
      expect(a).not.toBe(b);
    });
  });

  describe("isEnabled / setEnabled", () => {
    it("defaults to disabled (from config)", () => {
      expect(bridge.isEnabled()).toBe(false);
    });

    it("can be enabled at runtime", () => {
      bridge.setEnabled(true);
      expect(bridge.isEnabled()).toBe(true);
    });

    it("can be disabled at runtime", () => {
      bridge.setEnabled(true);
      bridge.setEnabled(false);
      expect(bridge.isEnabled()).toBe(false);
    });
  });

  describe("beforeExecution", () => {
    it("returns original prompt when PGA is disabled", async () => {
      const result = await bridge.beforeExecution({
        prompt: "original prompt",
        context: testContext,
      });
      expect(result).toBe("original prompt");
    });

    it("returns evolved prompt when PGA is enabled", async () => {
      bridge.setEnabled(true);

      const result = await bridge.beforeExecution({
        prompt: "original prompt",
        systemPrompt: "system prompt",
        context: testContext,
      });

      expect(result).toBe("evolved prompt from hook");
    });

    it("falls back to original prompt on error", async () => {
      bridge.setEnabled(true);
      const { PGAHooks } = await import("./hooks.js");
      vi.mocked(PGAHooks.beforeAgentStart).mockRejectedValueOnce(new Error("Hook error"));

      const result = await bridge.beforeExecution({
        prompt: "fallback prompt",
        context: testContext,
      });

      expect(result).toBe("fallback prompt");
    });
  });

  describe("afterExecution", () => {
    it("does nothing when PGA is disabled", async () => {
      const { PGAHooks } = await import("./hooks.js");

      await bridge.afterExecution({ ...testContext, prompt: "test" }, testResult);

      expect(PGAHooks.afterAgentComplete).not.toHaveBeenCalled();
    });

    it("records execution when PGA is enabled", async () => {
      bridge.setEnabled(true);
      const { PGAHooks } = await import("./hooks.js");

      await bridge.afterExecution({ ...testContext, prompt: "test" }, testResult, { rating: 4 });

      expect(PGAHooks.afterAgentComplete).toHaveBeenCalled();
    });

    it("handles errors gracefully", async () => {
      bridge.setEnabled(true);
      const { PGAHooks } = await import("./hooks.js");
      vi.mocked(PGAHooks.afterAgentComplete).mockRejectedValueOnce(new Error("fail"));

      // Should not throw
      await expect(
        bridge.afterExecution({ ...testContext, prompt: "test" }, testResult),
      ).resolves.toBeUndefined();
    });
  });

  describe("onError", () => {
    it("does nothing when PGA is disabled", async () => {
      const { PGAHooks } = await import("./hooks.js");

      await bridge.onError({ ...testContext, prompt: "test" }, new Error("agent error"));

      expect(PGAHooks.onAgentError).not.toHaveBeenCalled();
    });

    it("records error when PGA is enabled", async () => {
      bridge.setEnabled(true);
      const { PGAHooks } = await import("./hooks.js");

      await bridge.onError({ ...testContext, prompt: "test" }, new Error("agent error"));

      expect(PGAHooks.onAgentError).toHaveBeenCalled();
    });
  });

  describe("getStatus", () => {
    it("returns disabled status when PGA is off", async () => {
      const status = await bridge.getStatus(testContext);
      expect(status.enabled).toBe(false);
    });

    it("returns status with fitness when PGA is enabled", async () => {
      bridge.setEnabled(true);

      const status = await bridge.getStatus(testContext);
      expect(status.enabled).toBe(true);
      expect(status.genomeId).toBe("genome-1");
      expect(status.version).toBe(1);
      expect(status.fitness).toBeCloseTo(0.7333, 2);
    });
  });

  describe("getConfig / updateConfig", () => {
    it("returns a copy of config", () => {
      const config = bridge.getConfig();
      expect(config.featureFlags).toBeDefined();
      expect(config.evolution).toBeDefined();
    });

    it("updates config at runtime", () => {
      bridge.updateConfig({
        featureFlags: { enabled: true } as any,
      });
      expect(bridge.isEnabled()).toBe(true);
    });
  });

  describe("recordFeedback", () => {
    it("does nothing when PGA is disabled", async () => {
      await bridge.recordFeedback(testContext, 4.5, "Great!");
      // No error thrown
    });

    it("delegates to API when enabled", async () => {
      bridge.setEnabled(true);
      await bridge.recordFeedback(testContext, 4.5, "Great!");
      // Verifies it didn't throw
    });
  });

  describe("forceEvolution / forceRollback", () => {
    it("forceEvolution does nothing when disabled", async () => {
      await bridge.forceEvolution(testContext);
      // No error thrown
    });

    it("forceRollback does nothing when disabled", async () => {
      await bridge.forceRollback(testContext);
      // No error thrown
    });

    it("forceEvolution delegates when enabled", async () => {
      bridge.setEnabled(true);
      await bridge.forceEvolution(testContext);
      // No error thrown
    });

    it("forceRollback delegates when enabled", async () => {
      bridge.setEnabled(true);
      await bridge.forceRollback(testContext);
      // No error thrown
    });
  });
});
