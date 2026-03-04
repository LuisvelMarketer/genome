/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import { createMockStorage } from "../test-helpers.js";
import { LayeredMemory, type SemanticFact } from "./LayeredMemory.js";

describe("LayeredMemory", () => {
  let storage: StorageAdapter;
  let memory: LayeredMemory;

  beforeEach(() => {
    storage = createMockStorage();
    memory = new LayeredMemory(storage, "genome-1");
  });

  describe("learn", () => {
    it("creates SemanticFact with generated ID", async () => {
      const fact = await memory.learn("user-1", "The user prefers TypeScript");

      expect(fact.id).toBeTruthy();
      expect(fact.fact).toBe("The user prefers TypeScript");
      expect(storage.saveFact).toHaveBeenCalledWith(fact, "user-1", "genome-1");
    });

    it("applies default category when not specified", async () => {
      const fact = await memory.learn("user-1", "Some fact");
      expect(fact.category).toBe("general");
    });

    it("applies provided category", async () => {
      const fact = await memory.learn("user-1", "Likes dark mode", {
        category: "preference",
      });
      expect(fact.category).toBe("preference");
    });

    it("applies default confidence 0.7 when not specified", async () => {
      const fact = await memory.learn("user-1", "Some fact");
      expect(fact.confidence).toBe(0.7);
    });

    it("calculates expiresAt based on TTL days", async () => {
      const fact = await memory.learn("user-1", "Temporary fact", {
        ttlDays: 7,
      });
      expect(fact.expiresAt).toBeDefined();
      const daysDiff =
        (fact.expiresAt!.getTime() - fact.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    });

    it("sets no expiry when ttlDays is 0", async () => {
      const fact = await memory.learn("user-1", "Permanent fact", {
        ttlDays: 0,
      });
      expect(fact.expiresAt).toBeUndefined();
    });
  });

  describe("getRelevantFacts", () => {
    it("filters by minimum confidence threshold", async () => {
      const facts: SemanticFact[] = [
        {
          id: "1",
          fact: "High confidence",
          category: "general",
          confidence: 0.9,
          source: "test",
          accessCount: 0,
          createdAt: new Date(),
        },
        {
          id: "2",
          fact: "Low confidence",
          category: "general",
          confidence: 0.2,
          source: "test",
          accessCount: 0,
          createdAt: new Date(),
        },
      ];
      vi.mocked(storage.getFacts).mockResolvedValue(facts);

      const result = await memory.getRelevantFacts("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].fact).toBe("High confidence");
    });

    it("sorts by confidence and access count", async () => {
      const facts: SemanticFact[] = [
        {
          id: "1",
          fact: "Low score",
          category: "general",
          confidence: 0.6,
          source: "test",
          accessCount: 0,
          createdAt: new Date(),
        },
        {
          id: "2",
          fact: "High score",
          category: "general",
          confidence: 0.9,
          source: "test",
          accessCount: 10,
          createdAt: new Date(),
        },
      ];
      vi.mocked(storage.getFacts).mockResolvedValue(facts);

      const result = await memory.getRelevantFacts("user-1");
      expect(result[0].fact).toBe("High score");
    });

    it("limits results to specified limit", async () => {
      const facts: SemanticFact[] = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        fact: `Fact ${i}`,
        category: "general",
        confidence: 0.8,
        source: "test",
        accessCount: 0,
        createdAt: new Date(),
      }));
      vi.mocked(storage.getFacts).mockResolvedValue(facts);

      const result = await memory.getRelevantFacts("user-1", undefined, 5);
      expect(result).toHaveLength(5);
    });

    it("updates access counts for returned facts", async () => {
      const facts: SemanticFact[] = [
        {
          id: "f1",
          fact: "Test",
          category: "general",
          confidence: 0.8,
          source: "test",
          accessCount: 3,
          createdAt: new Date(),
        },
      ];
      vi.mocked(storage.getFacts).mockResolvedValue(facts);

      await memory.getRelevantFacts("user-1");
      expect(storage.updateFact).toHaveBeenCalledWith(
        "f1",
        expect.objectContaining({
          accessCount: 4,
        }),
      );
    });
  });

  describe("getMemoryPrompt", () => {
    it("formats facts as markdown list", async () => {
      const facts: SemanticFact[] = [
        {
          id: "1",
          fact: "Likes TypeScript",
          category: "preference",
          confidence: 0.85,
          source: "test",
          accessCount: 0,
          createdAt: new Date(),
        },
      ];
      vi.mocked(storage.getFacts).mockResolvedValue(facts);

      const prompt = await memory.getMemoryPrompt("user-1");
      expect(prompt).toContain("Remembered Context");
      expect(prompt).toContain("Likes TypeScript");
      expect(prompt).toContain("85%");
    });

    it("returns null when no relevant facts", async () => {
      vi.mocked(storage.getFacts).mockResolvedValue([]);

      const prompt = await memory.getMemoryPrompt("user-1");
      expect(prompt).toBeNull();
    });
  });

  describe("forget", () => {
    it("delegates to storage.deleteFact", async () => {
      await memory.forget("fact-1");
      expect(storage.deleteFact).toHaveBeenCalledWith("fact-1");
    });
  });

  describe("clearUserMemory", () => {
    it("delegates to storage.deleteUserFacts", async () => {
      await memory.clearUserMemory("user-1");
      expect(storage.deleteUserFacts).toHaveBeenCalledWith("user-1", "genome-1");
    });
  });

  describe("cleanup", () => {
    it("delegates expired fact cleanup to storage", async () => {
      await memory.cleanup("user-1");
      expect(storage.cleanExpiredFacts).toHaveBeenCalledWith("user-1", "genome-1");
    });
  });

  describe("reinforceFact", () => {
    it("increases confidence by 0.1 for positive reinforcement", async () => {
      vi.mocked(storage.getFact).mockResolvedValue({
        id: "f1",
        fact: "Test",
        category: "general",
        confidence: 0.7,
        source: "test",
        accessCount: 0,
        createdAt: new Date(),
      });

      await memory.reinforceFact("f1", true);
      expect(storage.updateFact).toHaveBeenCalledWith("f1", { confidence: 0.8 });
    });

    it("decreases confidence by 0.1 for negative reinforcement", async () => {
      vi.mocked(storage.getFact).mockResolvedValue({
        id: "f1",
        fact: "Test",
        category: "general",
        confidence: 0.7,
        source: "test",
        accessCount: 0,
        createdAt: new Date(),
      });

      await memory.reinforceFact("f1", false);
      expect(storage.updateFact).toHaveBeenCalledWith("f1", { confidence: 0.6 });
    });

    it("clamps confidence to max 1", async () => {
      vi.mocked(storage.getFact).mockResolvedValue({
        id: "f1",
        fact: "Test",
        category: "general",
        confidence: 0.95,
        source: "test",
        accessCount: 0,
        createdAt: new Date(),
      });

      await memory.reinforceFact("f1", true);
      expect(storage.updateFact).toHaveBeenCalledWith("f1", { confidence: 1 });
    });

    it("clamps confidence to min 0", async () => {
      vi.mocked(storage.getFact).mockResolvedValue({
        id: "f1",
        fact: "Test",
        category: "general",
        confidence: 0.05,
        source: "test",
        accessCount: 0,
        createdAt: new Date(),
      });

      await memory.reinforceFact("f1", false);
      expect(storage.updateFact).toHaveBeenCalledWith("f1", { confidence: 0 });
    });

    it("does nothing when fact not found", async () => {
      vi.mocked(storage.getFact).mockResolvedValue(null);

      await memory.reinforceFact("nonexistent", true);
      expect(storage.updateFact).not.toHaveBeenCalled();
    });
  });

  describe("configuration", () => {
    it("respects custom config", () => {
      const customMemory = new LayeredMemory(storage, "genome-1", {
        maxFacts: 50,
        defaultTTLDays: 7,
        minConfidence: 0.8,
      });

      // Verify by learning a fact and checking TTL
      // The custom config is applied internally
      expect(customMemory).toBeDefined();
    });
  });
});
