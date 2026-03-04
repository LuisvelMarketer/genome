/**
 * Shared test helpers for PGA module tests
 */

import { vi } from "vitest";
import type { StorageAdapter } from "./interfaces/StorageAdapter.js";
import type { GenomeV2, FitnessVector, OperativeGene } from "./types/index.js";
import { estimateTokenCount } from "./utils/tokens.js";

export function createDefaultFitness(overrides?: Partial<FitnessVector>): FitnessVector {
  return {
    accuracy: 0.5,
    speed: 0.5,
    cost: 0.5,
    safety: 0.5,
    userSatisfaction: 0.5,
    adaptability: 0.5,
    composite: 0.5,
    sampleSize: 0,
    lastUpdated: new Date("2026-01-01"),
    confidence: 0,
    ...overrides,
  };
}

export function createTestGene(overrides?: Partial<OperativeGene>): OperativeGene {
  return {
    id: "gene-1",
    category: "tool-usage",
    content: "Use tools efficiently.",
    fitness: createDefaultFitness(),
    origin: "initial",
    usageCount: 0,
    lastUsed: new Date("2026-01-01"),
    successRate: 0.5,
    tokenCount: estimateTokenCount("Use tools efficiently."),
    ...overrides,
  };
}

export function createTestGenome(overrides?: Partial<GenomeV2>): GenomeV2 {
  const now = new Date("2026-01-01");
  return {
    id: "genome-test-1",
    name: "Test Genome",
    familyId: "family-1",
    version: 1,
    createdAt: now,
    updatedAt: now,
    chromosomes: {
      c0: {
        identity: {
          role: "Test AI assistant",
          purpose: "Help with testing",
          constraints: ["Be safe", "Be honest"],
        },
        security: {
          forbiddenTopics: ["illegal"],
          accessControls: ["auth required"],
          safetyRules: ["No destructive commands"],
        },
        attribution: {
          creator: "Test",
          copyright: "2026 Test",
          license: "MIT",
        },
        metadata: {
          version: "1.0.0",
          createdAt: now,
        },
      },
      c1: {
        operations: [
          createTestGene({ id: "gene-1", category: "tool-usage" }),
          createTestGene({
            id: "gene-2",
            category: "coding-patterns",
            content: "Follow clean code.",
          }),
        ],
        metadata: {
          lastMutated: now,
          mutationCount: 0,
          avgFitnessGain: 0,
        },
      },
      c2: {
        userAdaptations: new Map(),
        contextPatterns: [
          {
            id: "ctx-1",
            pattern: "coding_context",
            trigger: "User asks about code",
            adaptation: "Use technical language",
            fitness: 0.8,
            usageCount: 5,
          },
        ],
        metadata: {
          lastMutated: now,
          adaptationRate: 0.1,
          totalUsers: 0,
        },
      },
    },
    integrity: {
      c0Hash: "",
      lastVerified: now,
      violations: 0,
      quarantined: false,
    },
    lineage: {
      inheritedGenes: [],
      mutations: [],
    },
    fitness: createDefaultFitness(),
    config: {
      mutationRate: "balanced",
      epsilonExplore: 0.1,
      enableSandbox: true,
      sandboxModel: "claude-haiku-3",
      minFitnessImprovement: 0.05,
      enableIntegrityCheck: true,
      autoRollbackThreshold: 0.15,
      allowInheritance: true,
      minCompatibilityScore: 0.6,
    },
    state: "active",
    tags: [],
    ...overrides,
  };
}

export function createMockStorage(): StorageAdapter {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    saveGenome: vi.fn().mockResolvedValue(undefined),
    loadGenome: vi.fn().mockResolvedValue(null),
    deleteGenome: vi.fn().mockResolvedValue(undefined),
    listGenomes: vi.fn().mockResolvedValue([]),
    saveDNA: vi.fn().mockResolvedValue(undefined),
    loadDNA: vi.fn().mockResolvedValue(null),
    logMutation: vi.fn().mockResolvedValue(undefined),
    getMutationHistory: vi.fn().mockResolvedValue([]),
    getGeneMutationHistory: vi.fn().mockResolvedValue([]),
    recordInteraction: vi.fn().mockResolvedValue(undefined),
    getRecentInteractions: vi.fn().mockResolvedValue([]),
    recordFeedback: vi.fn().mockResolvedValue(undefined),
    getAnalytics: vi.fn().mockResolvedValue({
      totalMutations: 0,
      totalInteractions: 0,
      avgFitnessImprovement: 0,
      userSatisfaction: 0,
      topGenes: [],
    }),
    saveFact: vi.fn().mockResolvedValue(undefined),
    getFacts: vi.fn().mockResolvedValue([]),
    getFact: vi.fn().mockResolvedValue(null),
    updateFact: vi.fn().mockResolvedValue(undefined),
    deleteFact: vi.fn().mockResolvedValue(undefined),
    deleteUserFacts: vi.fn().mockResolvedValue(undefined),
    cleanExpiredFacts: vi.fn().mockResolvedValue(0),
  };
}
