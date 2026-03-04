/**
 * MutationOperator - Handles gene mutations
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import type { LLMAdapter } from "../interfaces/LLMAdapter.js";
import type { OperativeGene, FitnessVector } from "../types/index.js";
import { generateUUID } from "../utils/hash.js";
import { estimateTokenCount } from "../utils/tokens.js";

export interface MutationStrategy {
  type: "llm_rewrite" | "parameter_tweak" | "combine" | "simplify" | "compress";
  temperature?: number;
  context?: string;
}

export interface CompressionMetrics {
  originalTokens: number;
  compressedTokens: number;
  ratio: number;
}

export interface MutationResult {
  success: boolean;
  originalGene: OperativeGene;
  mutatedGene?: OperativeGene;
  strategy: MutationStrategy;
  reason?: string;
  compressionMetrics?: CompressionMetrics;
}

export class MutationOperator {
  constructor(private llm?: LLMAdapter) {}

  /**
   * Generate a mutation for a gene
   */
  async mutate(
    gene: OperativeGene,
    strategy: MutationStrategy,
    context?: string,
  ): Promise<MutationResult> {
    switch (strategy.type) {
      case "llm_rewrite":
        return this.llmRewrite(gene, strategy, context);
      case "parameter_tweak":
        return this.parameterTweak(gene, strategy);
      case "simplify":
        return this.simplify(gene, strategy);
      case "combine":
        return this.combine(gene, strategy);
      case "compress":
        return this.compress(gene, strategy, context);
      default:
        return {
          success: false,
          originalGene: gene,
          strategy,
          reason: "Unknown strategy",
        };
    }
  }

  /**
   * LLM-based rewrite of gene content
   */
  private async llmRewrite(
    gene: OperativeGene,
    strategy: MutationStrategy,
    context?: string,
  ): Promise<MutationResult> {
    if (!this.llm) {
      return {
        success: false,
        originalGene: gene,
        strategy,
        reason: "No LLM adapter configured",
      };
    }

    try {
      const prompt = `You are improving an AI instruction gene.

Original instruction:
${gene.content}

Category: ${gene.category}
Current fitness: ${gene.fitness.composite.toFixed(3)}
${context ? `Context: ${context}` : ""}

Rewrite this instruction to be more effective. Keep the same intent but improve clarity and effectiveness.

Respond with ONLY the improved instruction, no explanation.`;

      const response = await this.llm.chat([{ role: "user", content: prompt }], {
        temperature: strategy.temperature ?? 0.7,
        maxTokens: 500,
      });

      const content = response.content.trim();
      const mutatedGene: OperativeGene = {
        ...gene,
        id: generateUUID(),
        content,
        origin: "mutation",
        sourceGeneId: gene.id,
        usageCount: 0,
        lastUsed: new Date(),
        fitness: this.inheritFitness(gene.fitness),
        tokenCount: estimateTokenCount(content),
      };

      return {
        success: true,
        originalGene: gene,
        mutatedGene,
        strategy,
      };
    } catch (error) {
      return {
        success: false,
        originalGene: gene,
        strategy,
        reason: `LLM error: ${String(error)}`,
      };
    }
  }

  /**
   * Parameter-based tweaking (non-LLM)
   */
  private async parameterTweak(
    gene: OperativeGene,
    strategy: MutationStrategy,
  ): Promise<MutationResult> {
    // Simple text modifications
    let content = gene.content;

    // Add emphasis
    if (Math.random() < 0.5) {
      content = content.replace(/\bimportant\b/gi, "CRITICAL");
      content = content.replace(/\bshould\b/gi, "MUST");
    }

    const mutatedGene: OperativeGene = {
      ...gene,
      id: generateUUID(),
      content,
      origin: "mutation",
      sourceGeneId: gene.id,
      usageCount: 0,
      lastUsed: new Date(),
      fitness: this.inheritFitness(gene.fitness),
      tokenCount: estimateTokenCount(content),
    };

    return {
      success: true,
      originalGene: gene,
      mutatedGene,
      strategy,
    };
  }

  /**
   * Simplify a gene
   */
  private async simplify(gene: OperativeGene, strategy: MutationStrategy): Promise<MutationResult> {
    // Remove redundant phrases
    let content = gene.content;
    content = content.replace(/\b(basically|essentially|actually|really)\b/gi, "");
    content = content.replace(/\s+/g, " ").trim();

    const mutatedGene: OperativeGene = {
      ...gene,
      id: generateUUID(),
      content,
      origin: "mutation",
      sourceGeneId: gene.id,
      usageCount: 0,
      lastUsed: new Date(),
      fitness: this.inheritFitness(gene.fitness),
      tokenCount: estimateTokenCount(content),
    };

    return {
      success: true,
      originalGene: gene,
      mutatedGene,
      strategy,
    };
  }

  /**
   * Compress a gene: reduce token count while preserving ALL functional capabilities.
   * This is evolutionary compression — never discard a functional gene, compress it.
   */
  private async compress(
    gene: OperativeGene,
    strategy: MutationStrategy,
    _context?: string,
  ): Promise<MutationResult> {
    if (!this.llm) {
      return {
        success: false,
        originalGene: gene,
        strategy,
        reason: "No LLM adapter configured",
      };
    }

    try {
      const originalTokens = gene.tokenCount || estimateTokenCount(gene.content);

      const prompt = `You are compressing an AI instruction gene to use fewer tokens.

Original instruction (${originalTokens} estimated tokens):
${gene.content}

Category: ${gene.category}

Compress this instruction to use FEWER tokens while preserving ALL functional capabilities. The compressed version must produce identical behavior. Remove filler words, use concise phrasing, and merge redundant clauses.

Respond with ONLY the compressed instruction, no explanation.`;

      const response = await this.llm.chat([{ role: "user", content: prompt }], {
        temperature: strategy.temperature ?? 0.3,
        maxTokens: 500,
      });

      const compressedContent = response.content.trim();
      const compressedTokens = estimateTokenCount(compressedContent);

      // Compression gate: reject if compressed version is not actually smaller
      if (compressedTokens >= originalTokens) {
        return {
          success: false,
          originalGene: gene,
          strategy,
          reason: "Compression did not reduce tokens",
          compressionMetrics: {
            originalTokens,
            compressedTokens,
            ratio: compressedTokens / originalTokens,
          },
        };
      }

      // Compression preserves fitness — same intent, fewer tokens.
      // Only reset sampleSize and confidence for re-evaluation.
      const mutatedGene: OperativeGene = {
        ...gene,
        id: generateUUID(),
        content: compressedContent,
        origin: "mutation",
        sourceGeneId: gene.id,
        usageCount: 0,
        lastUsed: new Date(),
        fitness: {
          ...gene.fitness,
          sampleSize: 0,
          confidence: 0,
          lastUpdated: new Date(),
        },
        tokenCount: compressedTokens,
      };

      return {
        success: true,
        originalGene: gene,
        mutatedGene,
        strategy,
        compressionMetrics: {
          originalTokens,
          compressedTokens,
          ratio: compressedTokens / originalTokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        originalGene: gene,
        strategy,
        reason: `LLM error: ${String(error)}`,
      };
    }
  }

  /**
   * Combine genes (placeholder)
   */
  private async combine(gene: OperativeGene, strategy: MutationStrategy): Promise<MutationResult> {
    // Would combine multiple genes - placeholder
    return {
      success: false,
      originalGene: gene,
      strategy,
      reason: "Combine requires multiple genes",
    };
  }

  /**
   * Inherit fitness with slight degradation
   */
  private inheritFitness(parentFitness: FitnessVector): FitnessVector {
    const degradation = 0.95; // 5% degradation for new mutations
    return {
      ...parentFitness,
      accuracy: parentFitness.accuracy * degradation,
      speed: parentFitness.speed * degradation,
      cost: parentFitness.cost * degradation,
      safety: parentFitness.safety * degradation,
      userSatisfaction: parentFitness.userSatisfaction * degradation,
      adaptability: parentFitness.adaptability * degradation,
      composite: parentFitness.composite * degradation,
      sampleSize: 0,
      confidence: 0,
      lastUpdated: new Date(),
    };
  }
}
