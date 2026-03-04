/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import {
  createTestGenome,
  createMockStorage,
  createTestGene,
  createDefaultFitness,
} from "../test-helpers.js";
import type { GenomeV2 } from "../types/index.js";
import { PromptAssembler } from "./PromptAssembler.js";

describe("PromptAssembler", () => {
  let genome: GenomeV2;
  let storage: StorageAdapter;
  let assembler: PromptAssembler;

  beforeEach(() => {
    genome = createTestGenome();
    storage = createMockStorage();
    assembler = new PromptAssembler(storage, genome);
  });

  describe("assemblePrompt", () => {
    it("includes C0 identity section", async () => {
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("Core Identity");
      expect(prompt).toContain("Test AI assistant");
      expect(prompt).toContain("Help with testing");
    });

    it("includes C0 constraints", async () => {
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("Constraints");
      expect(prompt).toContain("Be safe");
      expect(prompt).toContain("Be honest");
    });

    it("includes C0 safety rules", async () => {
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("Safety Rules");
      expect(prompt).toContain("No destructive commands");
    });

    it("includes C1 operative genes grouped by category", async () => {
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("Tool Usage");
      expect(prompt).toContain("Use tools efficiently.");
      expect(prompt).toContain("Coding Patterns");
    });

    it("includes C2 context patterns with fitness > 0.6", async () => {
      const prompt = await assembler.assemblePrompt();
      // coding_context has fitness 0.8, should be included
      expect(prompt).toContain("coding_context");
      expect(prompt).toContain("Use technical language");
    });

    it("excludes C2 context patterns with fitness <= 0.6", async () => {
      genome.chromosomes.c2.contextPatterns[0].fitness = 0.3;
      const prompt = await assembler.assemblePrompt();
      expect(prompt).not.toContain("Use technical language");
    });

    it("includes C2 user adaptations when userId context provided", async () => {
      genome.chromosomes.c2.userAdaptations.set("user-1", {
        userId: "user-1",
        preferences: {
          communicationStyle: "technical",
          verbosity: "detailed",
          tone: "professional",
        },
        learned: {
          preferredTools: [],
          commonTopics: [],
          peakHours: [],
          domainExpertise: new Map(),
        },
        fitness: createDefaultFitness(),
        firstInteraction: new Date(),
        lastInteraction: new Date(),
        interactionCount: 10,
      });

      const prompt = await assembler.assemblePrompt({ userId: "user-1" });
      expect(prompt).toContain("User Preferences");
      expect(prompt).toContain("technical");
      expect(prompt).toContain("detailed");
    });

    it("separates sections with --- delimiter", async () => {
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("---");
    });
  });

  describe("selectByEpsilonGreedy", () => {
    it("handles single candidate", () => {
      const gene = createTestGene({ fitness: createDefaultFitness({ composite: 0.8 }) });
      // Access private method via any cast for testing
      const selected = (assembler as any).selectByEpsilonGreedy([gene], 0.1);
      expect(selected).toBe(gene);
    });

    it("throws for empty candidates", () => {
      expect(() => {
        (assembler as any).selectByEpsilonGreedy([], 0.1);
      }).toThrow("Cannot select from empty candidates");
    });

    it("selects best gene when not exploring", () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5); // > epsilon (0.1), so exploit
      const low = createTestGene({ id: "low", fitness: createDefaultFitness({ composite: 0.3 }) });
      const high = createTestGene({
        id: "high",
        fitness: createDefaultFitness({ composite: 0.9 }),
      });

      const selected = (assembler as any).selectByEpsilonGreedy([low, high], 0.1);
      expect(selected.id).toBe("high");
      vi.restoreAllMocks();
    });
  });

  describe("injectGenes", () => {
    it("appends gene instructions to base prompt", () => {
      const genes = [createTestGene({ category: "reasoning", content: "Think step by step." })];
      const result = assembler.injectGenes("Base prompt", genes);
      expect(result).toContain("Base prompt");
      expect(result).toContain("PGA Evolved Instructions");
      expect(result).toContain("[reasoning] Think step by step.");
    });

    it("returns base prompt unchanged when genes array is empty", () => {
      const result = assembler.injectGenes("Base prompt", []);
      expect(result).toBe("Base prompt");
    });
  });

  describe("formatCategory", () => {
    it("capitalizes hyphenated categories", () => {
      const result = (assembler as any).formatCategory("tool-usage");
      expect(result).toBe("Tool Usage");
    });

    it("capitalizes single word", () => {
      const result = (assembler as any).formatCategory("reasoning");
      expect(result).toBe("Reasoning");
    });
  });

  describe("token budget selection", () => {
    it("includes all genes when under budget", async () => {
      // Default test genes are small (~6 tokens each), well under 2000 budget
      const prompt = await assembler.assemblePrompt();
      expect(prompt).toContain("Tool Usage");
      expect(prompt).toContain("Coding Patterns");
    });

    it("selects genes by efficiency when over budget", async () => {
      // Create genome with a mix of efficient and bloated genes
      const bloatedContent = "x".repeat(8000); // ~2000 tokens
      const efficientGene = createTestGene({
        id: "efficient",
        category: "tool-usage",
        content: "Use tools well.",
        tokenCount: 4,
        fitness: createDefaultFitness({ composite: 0.8 }),
      });
      const bloatedGene = createTestGene({
        id: "bloated",
        category: "coding-patterns",
        content: bloatedContent,
        tokenCount: 2000,
        fitness: createDefaultFitness({ composite: 0.81 }),
      });

      genome.chromosomes.c1.operations = [efficientGene, bloatedGene];
      assembler = new PromptAssembler(storage, genome);

      // Force exploit (no exploration)
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const prompt = await assembler.assemblePrompt();

      // Efficient gene (0.8 fitness / 4 tokens = 0.2 eff) included
      expect(prompt).toContain("Use tools well.");
      // Bloated gene (0.81 / 2000 = 0.000405 eff) excluded by budget
      expect(prompt).not.toContain(bloatedContent);

      vi.restoreAllMocks();
    });

    it("prefers high-efficiency genes over high-fitness genes", async () => {
      const efficient = createTestGene({
        id: "efficient",
        category: "tool-usage",
        content: "Concise instruction.",
        tokenCount: 5,
        fitness: createDefaultFitness({ composite: 0.7 }),
      });
      const medium = createTestGene({
        id: "medium",
        category: "reasoning",
        content: "A".repeat(7996), // ~1999 tokens, just under budget alone
        tokenCount: 1999,
        fitness: createDefaultFitness({ composite: 0.75 }),
      });

      genome.chromosomes.c1.operations = [efficient, medium];
      assembler = new PromptAssembler(storage, genome);

      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const prompt = await assembler.assemblePrompt();

      // Both together = 2004 tokens > 2000 budget
      // Efficient: 0.7/5 = 0.14, Medium: 0.75/1999 = 0.000375
      // Efficient added first (higher eff), then medium would exceed budget
      expect(prompt).toContain("Concise instruction.");

      vi.restoreAllMocks();
    });
  });
});
