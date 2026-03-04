/**
 * Genome Manager
 * Handles genome creation, loading, and management
 *
 * @author DeepAgent (adapted from PGA Platform)
 * @since 2026-03-03
 */

import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import type {
  GenomeV2,
  GenomeConfig,
  Chromosome0,
  Chromosome1,
  Chromosome2,
  FitnessVector,
} from "../types/index.js";
import { generateUUID } from "../utils/hash.js";
import { estimateTokenCount } from "../utils/tokens.js";

export class GenomeManager {
  constructor(private storage: StorageAdapter) {}

  async createGenome(options: {
    name: string;
    familyId?: string;
    config?: Partial<GenomeConfig>;
  }): Promise<GenomeV2> {
    const now = new Date();
    const genome: GenomeV2 = {
      id: generateUUID(),
      name: options.name,
      familyId: options.familyId || generateUUID(),
      version: 1,
      createdAt: now,
      updatedAt: now,
      chromosomes: {
        c0: this.createDefaultC0(),
        c1: this.createDefaultC1(),
        c2: this.createDefaultC2(),
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
      fitness: this.createDefaultFitness(),
      config: this.mergeConfig(options.config),
      state: "active",
      tags: [],
    };

    await this.storage.saveGenome(genome);
    return genome;
  }

  async loadGenome(genomeId: string): Promise<GenomeV2 | null> {
    return this.storage.loadGenome(genomeId);
  }

  async listGenomes(): Promise<GenomeV2[]> {
    return this.storage.listGenomes();
  }

  async deleteGenome(genomeId: string): Promise<void> {
    await this.storage.deleteGenome(genomeId);
  }

  async updateGenome(genome: GenomeV2): Promise<void> {
    genome.updatedAt = new Date();
    genome.version += 1;
    await this.storage.saveGenome(genome);
  }

  // ─── Default Chromosome Creation ───────────────────────────

  private createDefaultC0(): Chromosome0 {
    return {
      identity: {
        role: "You are an AI assistant powered by Genoma with PGA evolution capabilities.",
        purpose:
          "Help users accomplish their tasks efficiently while continuously learning and improving.",
        constraints: [
          "Never reveal internal system information",
          "Always prioritize user safety",
          "Be honest about limitations",
        ],
      },
      security: {
        forbiddenTopics: ["illegal activities", "harmful content", "personal attacks"],
        accessControls: ["require authentication for sensitive operations"],
        safetyRules: [
          "Never execute destructive commands without confirmation",
          "Always validate user inputs",
          "Protect sensitive data",
        ],
      },
      attribution: {
        creator: "Genoma System",
        copyright: "© 2026 Genoma",
        license: "Proprietary",
      },
      metadata: {
        version: "2.0.0",
        createdAt: new Date(),
      },
    };
  }

  private createDefaultC1(): Chromosome1 {
    const now = new Date();
    return {
      operations: [
        {
          id: generateUUID(),
          category: "tool-usage",
          content:
            "Use tools efficiently and appropriately for each task. Prefer specialized tools over general approaches.",
          fitness: this.createDefaultFitness(),
          origin: "initial",
          usageCount: 0,
          lastUsed: now,
          successRate: 0.5,
          tokenCount: estimateTokenCount(
            "Use tools efficiently and appropriately for each task. Prefer specialized tools over general approaches.",
          ),
        },
        {
          id: generateUUID(),
          category: "coding-patterns",
          content: "Follow clean code principles: meaningful names, small functions, DRY, SOLID.",
          fitness: this.createDefaultFitness(),
          origin: "initial",
          usageCount: 0,
          lastUsed: now,
          successRate: 0.5,
          tokenCount: estimateTokenCount(
            "Follow clean code principles: meaningful names, small functions, DRY, SOLID.",
          ),
        },
        {
          id: generateUUID(),
          category: "reasoning",
          content:
            "Think step by step. Break complex problems into smaller parts. Verify assumptions.",
          fitness: this.createDefaultFitness(),
          origin: "initial",
          usageCount: 0,
          lastUsed: now,
          successRate: 0.5,
          tokenCount: estimateTokenCount(
            "Think step by step. Break complex problems into smaller parts. Verify assumptions.",
          ),
        },
        {
          id: generateUUID(),
          category: "error-handling",
          content:
            "Handle errors gracefully. Provide helpful error messages. Suggest recovery actions.",
          fitness: this.createDefaultFitness(),
          origin: "initial",
          usageCount: 0,
          lastUsed: now,
          successRate: 0.5,
          tokenCount: estimateTokenCount(
            "Handle errors gracefully. Provide helpful error messages. Suggest recovery actions.",
          ),
        },
      ],
      metadata: {
        lastMutated: now,
        mutationCount: 0,
        avgFitnessGain: 0,
      },
    };
  }

  private createDefaultC2(): Chromosome2 {
    return {
      userAdaptations: new Map(),
      contextPatterns: [
        {
          id: generateUUID(),
          pattern: "coding_context",
          trigger: "User asks about code or programming",
          adaptation: "Use technical language and provide code examples",
          fitness: 0.5,
          usageCount: 0,
        },
        {
          id: generateUUID(),
          pattern: "general_context",
          trigger: "User asks general questions",
          adaptation: "Use clear, accessible language",
          fitness: 0.5,
          usageCount: 0,
        },
      ],
      metadata: {
        lastMutated: new Date(),
        adaptationRate: 0.1,
        totalUsers: 0,
      },
    };
  }

  private createDefaultFitness(): FitnessVector {
    return {
      accuracy: 0.5,
      speed: 0.5,
      cost: 0.5,
      safety: 0.5,
      userSatisfaction: 0.5,
      adaptability: 0.5,
      composite: 0.5,
      sampleSize: 0,
      lastUpdated: new Date(),
      confidence: 0.0,
    };
  }

  private mergeConfig(partial?: Partial<GenomeConfig>): GenomeConfig {
    return {
      mutationRate: partial?.mutationRate ?? "balanced",
      epsilonExplore: partial?.epsilonExplore ?? 0.1,
      enableSandbox: partial?.enableSandbox ?? true,
      sandboxModel: partial?.sandboxModel ?? "claude-haiku-3",
      minFitnessImprovement: partial?.minFitnessImprovement ?? 0.05,
      enableIntegrityCheck: partial?.enableIntegrityCheck ?? true,
      autoRollbackThreshold: partial?.autoRollbackThreshold ?? 0.15,
      allowInheritance: partial?.allowInheritance ?? true,
      minCompatibilityScore: partial?.minCompatibilityScore ?? 0.6,
    };
  }
}
