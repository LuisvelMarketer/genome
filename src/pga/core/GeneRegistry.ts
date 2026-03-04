/**
 * Gene Registry - Cross-genome knowledge sharing
 * CRUD operations for genes, search, versioning
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import type {
  GeneRegistryEntry,
  GeneSearchQuery,
  GeneSearchResult,
} from "../types/genoma-pga.types.js";
import type { FitnessVector, OperativeGene } from "../types/index.js";
import { generateUUID } from "../utils/hash.js";
import { estimateTokenCount } from "../utils/tokens.js";

export class GeneRegistry {
  private genes: Map<string, GeneRegistryEntry> = new Map();

  constructor(private storage: StorageAdapter) {}

  /**
   * Register a new gene in the registry
   */
  async registerGene(options: {
    name: string;
    category: string;
    content: string;
    sourceGenomeId: string;
    sourceGenomeName: string;
    fitness?: FitnessVector;
    public?: boolean;
  }): Promise<GeneRegistryEntry> {
    const now = new Date();
    const entry: GeneRegistryEntry = {
      id: generateUUID(),
      name: options.name,
      category: options.category,
      content: options.content,
      version: 1,
      fitness: options.fitness || this.createDefaultFitness(),
      usageCount: 0,
      sourceGenomeId: options.sourceGenomeId,
      sourceGenomeName: options.sourceGenomeName,
      validated: false,
      public: options.public ?? false,
      createdAt: now,
      updatedAt: now,
    };

    this.genes.set(entry.id, entry);
    return entry;
  }

  /**
   * Get a gene by ID
   */
  async getGene(geneId: string): Promise<GeneRegistryEntry | null> {
    return this.genes.get(geneId) || null;
  }

  /**
   * Update a gene
   */
  async updateGene(
    geneId: string,
    updates: Partial<
      Pick<GeneRegistryEntry, "name" | "content" | "fitness" | "validated" | "public">
    >,
  ): Promise<GeneRegistryEntry | null> {
    const gene = this.genes.get(geneId);
    if (!gene) {
      return null;
    }

    const updated: GeneRegistryEntry = {
      ...gene,
      ...updates,
      version: gene.version + 1,
      updatedAt: new Date(),
    };

    this.genes.set(geneId, updated);
    return updated;
  }

  /**
   * Delete a gene
   */
  async deleteGene(geneId: string): Promise<boolean> {
    return this.genes.delete(geneId);
  }

  /**
   * Search for genes
   */
  async searchGenes(query: GeneSearchQuery): Promise<GeneSearchResult> {
    let results = Array.from(this.genes.values());

    // Filter by category
    if (query.category) {
      results = results.filter((g) => g.category === query.category);
    }

    // Filter by minimum fitness
    if (query.minFitness !== undefined) {
      results = results.filter((g) => g.fitness.composite >= query.minFitness!);
    }

    // Filter by validated status
    if (query.validated !== undefined) {
      results = results.filter((g) => g.validated === query.validated);
    }

    // Filter by public status
    if (query.public !== undefined) {
      results = results.filter((g) => g.public === query.public);
    }

    // Sort by fitness (descending)
    results.sort((a, b) => b.fitness.composite - a.fitness.composite);

    const total = results.length;
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    // Paginate
    results = results.slice(offset, offset + limit);

    return {
      genes: results,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Inherit a gene into a genome
   */
  async inheritGene(geneId: string): Promise<OperativeGene | null> {
    const gene = this.genes.get(geneId);
    if (!gene) {
      return null;
    }

    // Increment usage count
    gene.usageCount += 1;
    gene.updatedAt = new Date();

    // Convert to OperativeGene
    const operativeGene: OperativeGene = {
      id: generateUUID(),
      category: gene.category as OperativeGene["category"],
      content: gene.content,
      fitness: { ...gene.fitness },
      origin: "inheritance",
      sourceGeneId: geneId,
      usageCount: 0,
      lastUsed: new Date(),
      successRate: gene.fitness.composite,
      tokenCount: estimateTokenCount(gene.content),
    };

    return operativeGene;
  }

  /**
   * Get top genes by category
   */
  async getTopGenes(category: string, limit: number = 5): Promise<GeneRegistryEntry[]> {
    const result = await this.searchGenes({
      category,
      validated: true,
      public: true,
      limit,
    });
    return result.genes;
  }

  /**
   * Validate a gene (mark as verified and safe to inherit)
   */
  async validateGene(geneId: string): Promise<boolean> {
    const gene = this.genes.get(geneId);
    if (!gene) {
      return false;
    }

    gene.validated = true;
    gene.updatedAt = new Date();
    return true;
  }

  // ─── Helpers ───────────────────────────────────────────────

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
}
