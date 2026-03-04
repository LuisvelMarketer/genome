/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import { createTestGenome, createMockStorage, createDefaultFitness } from "../test-helpers.js";
import type { GenomeV2 } from "../types/index.js";
import { FitnessTracker, type FitnessScore } from "./FitnessTracker.js";

describe("FitnessTracker", () => {
  let genome: GenomeV2;
  let storage: StorageAdapter;
  let tracker: FitnessTracker;

  beforeEach(() => {
    genome = createTestGenome();
    storage = createMockStorage();
    tracker = new FitnessTracker(storage, genome);
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("recordPerformance", () => {
    it("updates gene fitness vector using EMA", async () => {
      const score: FitnessScore = {
        accuracy: 0.9,
        speed: 0.8,
        cost: 0.7,
        safety: 1.0,
        userSatisfaction: 0.85,
        adaptability: 0.6,
      };

      await tracker.recordPerformance(1, "gene-1", score);

      const gene = genome.chromosomes.c1.operations.find((g) => g.id === "gene-1")!;
      // EMA: new = alpha * score + (1 - alpha) * old, alpha = 0.1
      // accuracy: 0.1 * 0.9 + 0.9 * 0.5 = 0.54
      expect(gene.fitness.accuracy).toBeCloseTo(0.54, 3);
      expect(gene.fitness.sampleSize).toBe(1);
    });

    it("increments gene usageCount and updates lastUsed", async () => {
      const score: FitnessScore = {
        accuracy: 0.8,
        speed: 0.8,
        cost: 0.8,
        safety: 0.8,
        userSatisfaction: 0.8,
        adaptability: 0.8,
      };

      await tracker.recordPerformance(1, "gene-1", score);

      const gene = genome.chromosomes.c1.operations.find((g) => g.id === "gene-1")!;
      expect(gene.usageCount).toBe(1);
      expect(gene.lastUsed.getTime()).toBeGreaterThan(new Date("2026-01-01").getTime());
    });

    it("saves genome to storage after recording", async () => {
      const score: FitnessScore = {
        accuracy: 0.8,
        speed: 0.8,
        cost: 0.8,
        safety: 0.8,
        userSatisfaction: 0.8,
        adaptability: 0.8,
      };

      await tracker.recordPerformance(1, "gene-1", score);
      expect(storage.saveGenome).toHaveBeenCalledWith(genome);
    });

    it("warns when gene not found", async () => {
      const score: FitnessScore = {
        accuracy: 0.8,
        speed: 0.8,
        cost: 0.8,
        safety: 0.8,
        userSatisfaction: 0.8,
        adaptability: 0.8,
      };

      await tracker.recordPerformance(1, "nonexistent", score);
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe("recordSimpleScore", () => {
    it("converts simple score to 6D FitnessScore", async () => {
      await tracker.recordSimpleScore(1, "gene-1", 0.9);

      const gene = genome.chromosomes.c1.operations.find((g) => g.id === "gene-1")!;
      // accuracy: 0.1 * 0.9 + 0.9 * 0.5 = 0.54
      expect(gene.fitness.accuracy).toBeCloseTo(0.54, 3);
      // safety defaults to 1.0: 0.1 * 1.0 + 0.9 * 0.5 = 0.55
      expect(gene.fitness.safety).toBeCloseTo(0.55, 3);
    });
  });

  describe("computeComposite", () => {
    it("computes weighted average using default weights", () => {
      const score: FitnessScore = {
        accuracy: 1.0,
        speed: 1.0,
        cost: 1.0,
        safety: 1.0,
        userSatisfaction: 1.0,
        adaptability: 1.0,
      };
      const result = tracker.computeComposite(score);
      // All 1.0 with weights summing to 1.0 = 1.0
      expect(result).toBeCloseTo(1.0, 4);
    });

    it("computes weighted average with custom weights", () => {
      const score: FitnessScore = {
        accuracy: 1.0,
        speed: 0.0,
        cost: 0.0,
        safety: 0.0,
        userSatisfaction: 0.0,
        adaptability: 0.0,
      };
      const result = tracker.computeComposite(score, {
        accuracy: 1.0,
        speed: 0,
        cost: 0,
        safety: 0,
        userSatisfaction: 0,
        adaptability: 0,
      });
      expect(result).toBeCloseTo(1.0, 4);
    });

    it("returns value between 0 and 1 for valid inputs", () => {
      const score: FitnessScore = {
        accuracy: 0.7,
        speed: 0.6,
        cost: 0.8,
        safety: 0.9,
        userSatisfaction: 0.5,
        adaptability: 0.4,
      };
      const result = tracker.computeComposite(score);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe("getFitness", () => {
    it("returns fitness for existing Layer 1 gene", () => {
      const fitness = tracker.getFitness(1, "gene-1");
      expect(fitness).not.toBeNull();
      expect(fitness!.accuracy).toBe(0.5);
    });

    it("returns null for non-existent gene", () => {
      expect(tracker.getFitness(1, "nonexistent")).toBeNull();
    });

    it("returns null for Layer 0 gene", () => {
      expect(tracker.getFitness(0, "gene-1")).toBeNull();
    });
  });

  describe("getGenomeFitness", () => {
    it("returns genome-level fitness vector", () => {
      const fitness = tracker.getGenomeFitness();
      expect(fitness).toBeDefined();
      expect(fitness.composite).toBe(0.5);
    });
  });

  describe("updateGenomeFitness", () => {
    it("averages all active gene fitness vectors", async () => {
      // Give genes different fitness with sampleSize > 0
      genome.chromosomes.c1.operations[0].fitness = createDefaultFitness({
        accuracy: 0.8,
        sampleSize: 5,
      });
      genome.chromosomes.c1.operations[1].fitness = createDefaultFitness({
        accuracy: 0.6,
        sampleSize: 3,
      });

      await tracker.updateGenomeFitness();
      expect(genome.fitness.accuracy).toBeCloseTo(0.7, 4);
      expect(storage.saveGenome).toHaveBeenCalled();
    });

    it("does nothing when no genes have samples", async () => {
      // All genes have sampleSize 0 by default
      const fitnessBefore = { ...genome.fitness };
      await tracker.updateGenomeFitness();
      expect(genome.fitness.accuracy).toBe(fitnessBefore.accuracy);
    });
  });

  describe("immune system", () => {
    it("triggers immune event when fitness drops significantly", async () => {
      // Set initial composite to a high value
      genome.chromosomes.c1.operations[0].fitness = createDefaultFitness({
        composite: 0.8,
        sampleSize: 5,
      });

      const score: FitnessScore = {
        accuracy: 0.1,
        speed: 0.1,
        cost: 0.1,
        safety: 0.1,
        userSatisfaction: 0.1,
        adaptability: 0.1,
      };

      await tracker.recordPerformance(1, "gene-1", score);

      // Wait for async immune check
      await new Promise((r) => setTimeout(r, 50));

      expect(storage.logMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          mutationType: "immune_trigger",
          triggerReason: "fitness_drop",
        }),
      );
    });

    it("does not trigger for Layer 0 genes", async () => {
      // Layer 0 genes return null from findGene, so recordPerformance
      // would warn and return early, never reaching checkImmune
      await tracker.recordPerformance(0, "gene-1", {
        accuracy: 0.1,
        speed: 0.1,
        cost: 0.1,
        safety: 0.1,
        userSatisfaction: 0.1,
        adaptability: 0.1,
      });

      expect(storage.logMutation).not.toHaveBeenCalled();
    });
  });
});
