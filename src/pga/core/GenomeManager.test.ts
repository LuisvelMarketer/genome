/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import { createMockStorage } from "../test-helpers.js";
import { GenomeManager } from "./GenomeManager.js";

describe("GenomeManager", () => {
  let storage: StorageAdapter;
  let manager: GenomeManager;

  beforeEach(() => {
    storage = createMockStorage();
    manager = new GenomeManager(storage);
  });

  describe("createGenome", () => {
    it("creates genome with all required fields populated", async () => {
      const genome = await manager.createGenome({ name: "Test" });

      expect(genome.id).toBeTruthy();
      expect(genome.name).toBe("Test");
      expect(genome.version).toBe(1);
      expect(genome.state).toBe("active");
      expect(genome.chromosomes.c0).toBeDefined();
      expect(genome.chromosomes.c1).toBeDefined();
      expect(genome.chromosomes.c2).toBeDefined();
    });

    it("generates unique IDs", async () => {
      const g1 = await manager.createGenome({ name: "A" });
      const g2 = await manager.createGenome({ name: "B" });
      expect(g1.id).not.toBe(g2.id);
    });

    it("uses provided familyId", async () => {
      const genome = await manager.createGenome({
        name: "Test",
        familyId: "custom-family",
      });
      expect(genome.familyId).toBe("custom-family");
    });

    it("generates familyId when not provided", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      expect(genome.familyId).toBeTruthy();
    });

    it("creates default C0 with identity, security, attribution", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      const c0 = genome.chromosomes.c0;

      expect(c0.identity.role).toBeTruthy();
      expect(c0.identity.purpose).toBeTruthy();
      expect(c0.identity.constraints.length).toBeGreaterThan(0);
      expect(c0.security.forbiddenTopics.length).toBeGreaterThan(0);
      expect(c0.security.safetyRules.length).toBeGreaterThan(0);
      expect(c0.attribution.creator).toBeTruthy();
    });

    it("creates default C1 with 4 initial operative genes", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      expect(genome.chromosomes.c1.operations).toHaveLength(4);

      const categories = genome.chromosomes.c1.operations.map((g) => g.category);
      expect(categories).toContain("tool-usage");
      expect(categories).toContain("coding-patterns");
      expect(categories).toContain("reasoning");
      expect(categories).toContain("error-handling");
    });

    it("creates default C2 with contextPatterns", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      expect(genome.chromosomes.c2.contextPatterns.length).toBeGreaterThan(0);
    });

    it("saves genome to storage", async () => {
      await manager.createGenome({ name: "Test" });
      expect(storage.saveGenome).toHaveBeenCalledOnce();
    });

    it("applies partial config overrides", async () => {
      const genome = await manager.createGenome({
        name: "Test",
        config: { mutationRate: "aggressive", epsilonExplore: 0.3 },
      });
      expect(genome.config.mutationRate).toBe("aggressive");
      expect(genome.config.epsilonExplore).toBe(0.3);
      // Defaults preserved for unspecified
      expect(genome.config.enableSandbox).toBe(true);
    });
  });

  describe("loadGenome", () => {
    it("loads genome by ID from storage", async () => {
      const result = await manager.loadGenome("test-id");
      expect(storage.loadGenome).toHaveBeenCalledWith("test-id");
      expect(result).toBeNull(); // mock returns null
    });
  });

  describe("listGenomes", () => {
    it("lists all genomes from storage", async () => {
      await manager.listGenomes();
      expect(storage.listGenomes).toHaveBeenCalledOnce();
    });
  });

  describe("deleteGenome", () => {
    it("deletes genome from storage", async () => {
      await manager.deleteGenome("test-id");
      expect(storage.deleteGenome).toHaveBeenCalledWith("test-id");
    });
  });

  describe("updateGenome", () => {
    it("increments version on update", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      const originalVersion = genome.version;

      await manager.updateGenome(genome);
      expect(genome.version).toBe(originalVersion + 1);
    });

    it("updates updatedAt timestamp", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      const originalUpdatedAt = genome.updatedAt;

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));
      await manager.updateGenome(genome);
      expect(genome.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it("saves to storage", async () => {
      const genome = await manager.createGenome({ name: "Test" });
      vi.mocked(storage.saveGenome).mockClear();

      await manager.updateGenome(genome);
      expect(storage.saveGenome).toHaveBeenCalledWith(genome);
    });
  });
});
