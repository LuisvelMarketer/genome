/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { PGAAPI } from "./PGAAPI.js";

// Mock AgentIntegration
const mockIntegration = {
  initialize: vi.fn().mockResolvedValue(undefined),
  isActive: vi.fn().mockReturnValue(true),
  getGenome: vi.fn(),
  getCurrentFitness: vi.fn(),
  getMetrics: vi.fn().mockReturnValue({ fitnessHistory: [], totalMutations: 0 }),
  recordExecution: vi.fn().mockResolvedValue(undefined),
  recordFeedback: vi.fn().mockResolvedValue(undefined),
  forceEvolution: vi.fn().mockResolvedValue(undefined),
  forceRollback: vi.fn().mockResolvedValue(undefined),
  assemblePromptForAgent: vi.fn().mockResolvedValue("evolved prompt"),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
};

vi.mock("./AgentIntegration.js", () => ({
  AgentIntegration: vi.fn().mockImplementation(() => mockIntegration),
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
}));

vi.mock("../core/GeneRegistry.js", () => ({
  GeneRegistry: vi.fn().mockImplementation(() => ({
    searchGenes: vi.fn().mockResolvedValue([]),
    inheritGene: vi.fn().mockResolvedValue(null),
    registerGene: vi.fn().mockResolvedValue("reg-1"),
  })),
}));

const mockStorage = {
  initialize: vi.fn(),
  saveGenome: vi.fn(),
  loadGenome: vi.fn(),
  deleteGenome: vi.fn(),
  listGenomes: vi.fn(),
  saveFeedback: vi.fn(),
};

const mockLLM = {
  name: "test",
  model: "test-model",
  chat: vi.fn(),
};

describe("PGAAPI", () => {
  let api: PGAAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIntegration.getGenome.mockReturnValue(null);
    mockIntegration.getCurrentFitness.mockReturnValue(null);
    mockIntegration.getMetrics.mockReturnValue({ fitnessHistory: [], totalMutations: 0 });
    mockIntegration.isActive.mockReturnValue(true);

    api = new PGAAPI({
      storage: mockStorage as any,
      llm: mockLLM as any,
    });
  });

  describe("initialize", () => {
    it("delegates to integration.initialize", async () => {
      await api.initialize();
      expect(mockIntegration.initialize).toHaveBeenCalled();
    });
  });

  describe("getActiveGenes", () => {
    it("returns empty array when no genome", () => {
      mockIntegration.getGenome.mockReturnValue(null);
      expect(api.getActiveGenes()).toEqual([]);
    });

    it("maps operative genes to GeneInfo", () => {
      mockIntegration.getGenome.mockReturnValue({
        id: "genome-1",
        c1: {
          operativeGenes: [
            {
              id: "gene-1",
              name: "Tool Usage",
              category: "tool-usage",
              content: "Use tools efficiently",
              fitness: {
                accuracy: 0.8,
                speed: 0.7,
                cost: 0.6,
                safety: 0.9,
                userSatisfaction: 0.75,
                adaptability: 0.65,
              },
              usageCount: 10,
              active: true,
            },
            {
              id: "gene-2",
              name: "Coding",
              category: "coding-patterns",
              content: "Follow clean code",
              fitness: {
                accuracy: 0.7,
                speed: 0.6,
                cost: 0.5,
                safety: 0.8,
                userSatisfaction: 0.65,
                adaptability: 0.55,
              },
              usageCount: 5,
              active: false,
            },
          ],
        },
      });

      const genes = api.getActiveGenes();
      expect(genes).toHaveLength(2);
      expect(genes[0]).toEqual({
        id: "gene-1",
        name: "Tool Usage",
        category: "tool-usage",
        content: "Use tools efficiently",
        fitness: expect.objectContaining({ accuracy: 0.8 }),
        usageCount: 10,
        isActive: true,
      });
      expect(genes[1].isActive).toBe(false);
    });
  });

  describe("getGene", () => {
    it("returns null when no genome", () => {
      expect(api.getGene("gene-1")).toBeNull();
    });

    it("returns null when gene not found", () => {
      mockIntegration.getGenome.mockReturnValue({
        c1: { operativeGenes: [] },
      });
      expect(api.getGene("nonexistent")).toBeNull();
    });

    it("returns gene info when found", () => {
      mockIntegration.getGenome.mockReturnValue({
        c1: {
          operativeGenes: [
            {
              id: "gene-1",
              name: "Test Gene",
              category: "test",
              content: "Test content",
              fitness: { accuracy: 0.9 },
              usageCount: 3,
              active: true,
            },
          ],
        },
      });

      const gene = api.getGene("gene-1");
      expect(gene).not.toBeNull();
      expect(gene!.id).toBe("gene-1");
      expect(gene!.isActive).toBe(true);
    });
  });

  describe("getGenesByCategory", () => {
    it("filters genes by category", () => {
      mockIntegration.getGenome.mockReturnValue({
        c1: {
          operativeGenes: [
            {
              id: "1",
              name: "A",
              category: "tool-usage",
              content: "a",
              fitness: {},
              usageCount: 0,
              active: true,
            },
            {
              id: "2",
              name: "B",
              category: "coding",
              content: "b",
              fitness: {},
              usageCount: 0,
              active: true,
            },
            {
              id: "3",
              name: "C",
              category: "tool-usage",
              content: "c",
              fitness: {},
              usageCount: 0,
              active: true,
            },
          ],
        },
      });

      const toolGenes = api.getGenesByCategory("tool-usage");
      expect(toolGenes).toHaveLength(2);
      expect(toolGenes.every((g) => g.category === "tool-usage")).toBe(true);
    });
  });

  describe("recordImplicitFeedback", () => {
    it("converts positive signals to high rating", async () => {
      await api.recordImplicitFeedback({
        responseAccepted: true,
        toolUsageSuccess: true,
        userEdited: false,
        responseTime: 3000,
      });

      // base 3.0 + 0.5 accepted + 0.5 tool + 0.25 fast = 4.25
      expect(mockIntegration.recordFeedback).toHaveBeenCalledWith(4.25);
    });

    it("converts negative signals to low rating", async () => {
      await api.recordImplicitFeedback({
        responseAccepted: false,
        toolUsageSuccess: false,
        userEdited: true,
        responseTime: 20000,
      });

      // base 3.0 - 0.5 edited - 0.25 slow = 2.25
      expect(mockIntegration.recordFeedback).toHaveBeenCalledWith(2.25);
    });

    it("clamps rating to [1, 5]", async () => {
      await api.recordImplicitFeedback({
        responseAccepted: true,
        toolUsageSuccess: true,
        userEdited: false,
        responseTime: 1000,
      });

      const call = vi.mocked(mockIntegration.recordFeedback).mock.calls[0];
      expect(call[0]).toBeGreaterThanOrEqual(1);
      expect(call[0]).toBeLessThanOrEqual(5);
    });
  });

  describe("recordFeedback", () => {
    it("delegates to integration.recordFeedback", async () => {
      await api.recordFeedback(4.5, "Great!");
      expect(mockIntegration.recordFeedback).toHaveBeenCalledWith(4.5, "Great!");
    });
  });

  describe("forceEvolution / forceRollback", () => {
    it("delegates forceEvolution", async () => {
      await api.forceEvolution();
      expect(mockIntegration.forceEvolution).toHaveBeenCalled();
    });

    it("delegates forceRollback", async () => {
      await api.forceRollback();
      expect(mockIntegration.forceRollback).toHaveBeenCalled();
    });
  });

  describe("getCurrentFitness", () => {
    it("returns null when no fitness", () => {
      expect(api.getCurrentFitness()).toBeNull();
    });

    it("returns fitness from integration", () => {
      const fitness = {
        accuracy: 0.8,
        speed: 0.7,
        cost: 0.6,
        safety: 0.9,
        userSatisfaction: 0.75,
        adaptability: 0.65,
      };
      mockIntegration.getCurrentFitness.mockReturnValue(fitness);
      expect(api.getCurrentFitness()).toEqual(fitness);
    });
  });

  describe("getAverageFitness", () => {
    it("returns 0 when no fitness", () => {
      expect(api.getAverageFitness()).toBe(0);
    });

    it("calculates average of 6 dimensions", () => {
      mockIntegration.getCurrentFitness.mockReturnValue({
        accuracy: 0.6,
        speed: 0.6,
        cost: 0.6,
        safety: 0.6,
        userSatisfaction: 0.6,
        adaptability: 0.6,
      });
      expect(api.getAverageFitness()).toBeCloseTo(0.6, 4);
    });
  });

  describe("getEvolutionStatus", () => {
    it("returns status with trend stable when no history", () => {
      mockIntegration.isActive.mockReturnValue(true);
      mockIntegration.getGenome.mockReturnValue({
        id: "genome-1",
        version: 3,
        fitness: {
          accuracy: 0.8,
          speed: 0.7,
          cost: 0.6,
          safety: 0.9,
          userSatisfaction: 0.75,
          adaptability: 0.65,
        },
      });

      const status = api.getEvolutionStatus();
      expect(status.enabled).toBe(true);
      expect(status.genomeId).toBe("genome-1");
      expect(status.genomeVersion).toBe(3);
      expect(status.fitnessTrend).toBe("stable");
    });

    it("determines improving trend", () => {
      const lowFitness = {
        accuracy: 0.3,
        speed: 0.3,
        cost: 0.3,
        safety: 0.3,
        userSatisfaction: 0.3,
        adaptability: 0.3,
      };
      const highFitness = {
        accuracy: 0.9,
        speed: 0.9,
        cost: 0.9,
        safety: 0.9,
        userSatisfaction: 0.9,
        adaptability: 0.9,
      };

      mockIntegration.getMetrics.mockReturnValue({
        fitnessHistory: [
          { timestamp: 1, fitness: lowFitness },
          { timestamp: 2, fitness: lowFitness },
          { timestamp: 3, fitness: highFitness },
          { timestamp: 4, fitness: highFitness },
        ],
        totalMutations: 0,
      });

      mockIntegration.getGenome.mockReturnValue({ id: "g1", version: 1, fitness: highFitness });

      const status = api.getEvolutionStatus();
      expect(status.fitnessTrend).toBe("improving");
    });

    it("determines declining trend", () => {
      const highFitness = {
        accuracy: 0.9,
        speed: 0.9,
        cost: 0.9,
        safety: 0.9,
        userSatisfaction: 0.9,
        adaptability: 0.9,
      };
      const lowFitness = {
        accuracy: 0.3,
        speed: 0.3,
        cost: 0.3,
        safety: 0.3,
        userSatisfaction: 0.3,
        adaptability: 0.3,
      };

      mockIntegration.getMetrics.mockReturnValue({
        fitnessHistory: [
          { timestamp: 1, fitness: highFitness },
          { timestamp: 2, fitness: highFitness },
          { timestamp: 3, fitness: lowFitness },
          { timestamp: 4, fitness: lowFitness },
        ],
        totalMutations: 0,
      });

      mockIntegration.getGenome.mockReturnValue({ id: "g1", version: 1, fitness: lowFitness });

      const status = api.getEvolutionStatus();
      expect(status.fitnessTrend).toBe("declining");
    });
  });

  describe("isActive", () => {
    it("delegates to integration.isActive", () => {
      mockIntegration.isActive.mockReturnValue(false);
      expect(api.isActive()).toBe(false);

      mockIntegration.isActive.mockReturnValue(true);
      expect(api.isActive()).toBe(true);
    });
  });

  describe("event subscription", () => {
    it("delegates on to integration", () => {
      const listener = vi.fn();
      api.on("mutation_applied", listener);
      expect(mockIntegration.on).toHaveBeenCalledWith("mutation_applied", listener);
    });

    it("delegates off to integration", () => {
      const listener = vi.fn();
      api.off("mutation_applied", listener);
      expect(mockIntegration.off).toHaveBeenCalledWith("mutation_applied", listener);
    });
  });

  describe("recordExecution", () => {
    it("increments interaction count and delegates", async () => {
      await api.recordExecution(
        { sessionId: "sess-1", prompt: "test" },
        {
          response: "response",
          toolsUsed: ["read"],
          tokensUsed: { input: 100, output: 200 },
          latencyMs: 1500,
        },
        { rating: 4 },
      );

      expect(mockIntegration.recordExecution).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "sess-1", prompt: "test" }),
        expect.objectContaining({ response: "response" }),
        { rating: 4 },
      );
    });
  });

  describe("getEvolvedPrompt", () => {
    it("delegates to integration.assemblePromptForAgent", async () => {
      const result = await api.getEvolvedPrompt(
        { sessionId: "sess-1", prompt: "test prompt" },
        "base prompt",
      );

      expect(result).toBe("evolved prompt");
      expect(mockIntegration.assemblePromptForAgent).toHaveBeenCalled();
    });
  });
});
