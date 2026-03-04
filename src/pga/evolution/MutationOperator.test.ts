/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import type { LLMAdapter } from "../interfaces/LLMAdapter.js";
import { createTestGene, createDefaultFitness } from "../test-helpers.js";
import { MutationOperator } from "./MutationOperator.js";

describe("MutationOperator", () => {
  describe("mutate - llm_rewrite strategy", () => {
    it("calls LLM adapter and returns mutated gene", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({
          content: "Improved instruction content",
        }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene({
        fitness: createDefaultFitness({ composite: 0.6 }),
      });

      const result = await operator.mutate(gene, { type: "llm_rewrite" });

      expect(result.success).toBe(true);
      expect(result.mutatedGene).toBeDefined();
      expect(result.mutatedGene!.content).toBe("Improved instruction content");
      expect(result.mutatedGene!.origin).toBe("mutation");
      expect(result.mutatedGene!.sourceGeneId).toBe(gene.id);
      expect(result.mutatedGene!.usageCount).toBe(0);
      expect(llm.chat).toHaveBeenCalled();
    });

    it("returns failure when no LLM adapter configured", async () => {
      const operator = new MutationOperator(); // no LLM
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "llm_rewrite" });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("No LLM adapter configured");
    });

    it("returns failure when LLM throws error", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockRejectedValue(new Error("LLM unavailable")),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "llm_rewrite" });

      expect(result.success).toBe(false);
      expect(result.reason).toContain("LLM error");
    });

    it("mutated gene has new ID different from original", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({ content: "New content" }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene({ id: "original-id" });

      const result = await operator.mutate(gene, { type: "llm_rewrite" });

      expect(result.mutatedGene!.id).not.toBe("original-id");
    });
  });

  describe("mutate - parameter_tweak strategy", () => {
    it("returns new gene with mutation origin", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({
        content: "This is important and you should do it.",
      });

      // Mock Math.random to ensure replacements happen
      vi.spyOn(Math, "random").mockReturnValue(0.1); // < 0.5, so replacements occur

      const result = await operator.mutate(gene, { type: "parameter_tweak" });

      expect(result.success).toBe(true);
      expect(result.mutatedGene).toBeDefined();
      expect(result.mutatedGene!.origin).toBe("mutation");
      expect(result.mutatedGene!.content).toContain("CRITICAL");
      expect(result.mutatedGene!.content).toContain("MUST");

      vi.restoreAllMocks();
    });

    it("inherits fitness with degradation", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({
        fitness: createDefaultFitness({ accuracy: 0.8 }),
      });

      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const result = await operator.mutate(gene, { type: "parameter_tweak" });

      // 5% degradation: 0.8 * 0.95 = 0.76
      expect(result.mutatedGene!.fitness.accuracy).toBeCloseTo(0.76, 4);
      expect(result.mutatedGene!.fitness.sampleSize).toBe(0);
      expect(result.mutatedGene!.fitness.confidence).toBe(0);

      vi.restoreAllMocks();
    });
  });

  describe("mutate - simplify strategy", () => {
    it("removes filler words", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({
        content: "You should basically essentially always actually really think carefully.",
      });

      const result = await operator.mutate(gene, { type: "simplify" });

      expect(result.success).toBe(true);
      expect(result.mutatedGene!.content).not.toContain("basically");
      expect(result.mutatedGene!.content).not.toContain("essentially");
      expect(result.mutatedGene!.content).not.toContain("actually");
      expect(result.mutatedGene!.content).not.toContain("really");
    });

    it("collapses multiple whitespace", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({
        content: "This  has   extra    spaces.",
      });

      const result = await operator.mutate(gene, { type: "simplify" });
      expect(result.mutatedGene!.content).not.toContain("  ");
    });
  });

  describe("mutate - combine strategy", () => {
    it("returns failure (placeholder)", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "combine" });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Combine requires multiple genes");
    });
  });

  describe("mutate - compress strategy", () => {
    it("compresses gene content and returns compression metrics", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({
          content: "Use tools well.",
        }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene({
        content:
          "Use tools efficiently and appropriately for each task. Prefer specialized tools over general approaches.",
        tokenCount: 25,
        fitness: createDefaultFitness({ composite: 0.8, accuracy: 0.8, safety: 0.9 }),
      });

      const result = await operator.mutate(gene, { type: "compress", temperature: 0.3 });

      expect(result.success).toBe(true);
      expect(result.mutatedGene).toBeDefined();
      expect(result.mutatedGene!.content).toBe("Use tools well.");
      expect(result.mutatedGene!.tokenCount).toBeLessThan(gene.tokenCount!);
      expect(result.compressionMetrics).toBeDefined();
      expect(result.compressionMetrics!.originalTokens).toBe(25);
      expect(result.compressionMetrics!.ratio).toBeLessThan(1);
    });

    it("rejects compression when output is not shorter", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({
          content:
            "This is a much longer version of the instruction that uses many more tokens than the original.",
        }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene({
        content: "Short gene.",
        tokenCount: 3,
      });

      const result = await operator.mutate(gene, { type: "compress" });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Compression did not reduce tokens");
      expect(result.compressionMetrics).toBeDefined();
      expect(result.compressionMetrics!.ratio).toBeGreaterThanOrEqual(1);
    });

    it("preserves fitness without degradation", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({ content: "Short." }),
      };
      const operator = new MutationOperator(llm);
      const fitness = createDefaultFitness({
        accuracy: 0.85,
        safety: 0.95,
        composite: 0.8,
      });
      const gene = createTestGene({
        content: "A much longer instruction that should be compressed down.",
        tokenCount: 15,
        fitness,
      });

      const result = await operator.mutate(gene, { type: "compress" });

      expect(result.success).toBe(true);
      // Compress preserves fitness dimensions (no 0.95 degradation)
      expect(result.mutatedGene!.fitness.accuracy).toBe(0.85);
      expect(result.mutatedGene!.fitness.safety).toBe(0.95);
      expect(result.mutatedGene!.fitness.composite).toBe(0.8);
      // But resets sample tracking for re-evaluation
      expect(result.mutatedGene!.fitness.sampleSize).toBe(0);
      expect(result.mutatedGene!.fitness.confidence).toBe(0);
    });

    it("returns failure when no LLM adapter configured", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "compress" });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("No LLM adapter configured");
    });

    it("returns failure on LLM error", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockRejectedValue(new Error("LLM unavailable")),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "compress" });

      expect(result.success).toBe(false);
      expect(result.reason).toContain("LLM error");
    });

    it("uses low temperature (0.3) for fidelity", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({ content: "Short." }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene({
        content: "A reasonably long instruction for compression testing.",
        tokenCount: 14,
      });

      await operator.mutate(gene, { type: "compress", temperature: 0.3 });

      expect(llm.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ temperature: 0.3 }),
      );
    });
  });

  describe("mutate - tokenCount in existing strategies", () => {
    it("llm_rewrite sets tokenCount on mutated gene", async () => {
      const llm: LLMAdapter = {
        name: "test",
        model: "test-model",
        chat: vi.fn().mockResolvedValue({ content: "New content here" }),
      };
      const operator = new MutationOperator(llm);
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "llm_rewrite" });

      expect(result.mutatedGene!.tokenCount).toBeDefined();
      expect(result.mutatedGene!.tokenCount).toBeGreaterThan(0);
    });

    it("simplify sets tokenCount on mutated gene", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({
        content: "This is basically a test.",
      });

      const result = await operator.mutate(gene, { type: "simplify" });

      expect(result.mutatedGene!.tokenCount).toBeDefined();
      expect(result.mutatedGene!.tokenCount).toBeGreaterThan(0);
    });

    it("parameter_tweak sets tokenCount on mutated gene", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene({ content: "Test content." });

      vi.spyOn(Math, "random").mockReturnValue(0.9); // skip replacements
      const result = await operator.mutate(gene, { type: "parameter_tweak" });

      expect(result.mutatedGene!.tokenCount).toBeDefined();
      vi.restoreAllMocks();
    });
  });

  describe("mutate - unknown strategy", () => {
    it("returns failure with unknown strategy reason", async () => {
      const operator = new MutationOperator();
      const gene = createTestGene();

      const result = await operator.mutate(gene, { type: "unknown" as any });

      expect(result.success).toBe(false);
      expect(result.reason).toBe("Unknown strategy");
    });
  });
});
