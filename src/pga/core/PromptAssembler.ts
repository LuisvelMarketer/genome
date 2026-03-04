/**
 * PromptAssembler — Assembles prompts from three-layer genome
 *
 * @author DeepAgent (adapted from PGA Platform)
 * @since 2026-03-03
 */

import type { StorageAdapter } from "../interfaces/StorageAdapter.js";
import type { GenomeV2, SelectionContext, OperativeGene } from "../types/index.js";
import { estimateTokenCount, tokenEfficiency } from "../utils/tokens.js";

const DEFAULT_C1_TOKEN_BUDGET = 2000;

export class PromptAssembler {
  constructor(
    private storage: StorageAdapter,
    private genome: GenomeV2,
  ) {}

  /**
   * Assemble full prompt from all three layers
   */
  async assemblePrompt(context?: SelectionContext, _currentMessage?: string): Promise<string> {
    const sections: string[] = [];

    // Layer 0: Immutable DNA (core identity, security, ethics)
    sections.push(this.assembleC0());

    // Layer 1: Operative Genes (tool usage, coding patterns, etc.)
    const c1Content = await this.selectBestFromC1(context);
    sections.push(...c1Content);

    // Layer 2: Epigenomes (user preferences, communication style)
    const c2Content = await this.selectFromC2(context);
    sections.push(...c2Content);

    return sections.join("\n\n---\n\n");
  }

  /**
   * Assemble C0 (immutable core)
   */
  private assembleC0(): string {
    const c0 = this.genome.chromosomes.c0;
    const parts: string[] = [];

    // Identity
    parts.push(`# Core Identity\n\n${c0.identity.role}\n\n${c0.identity.purpose}`);

    // Constraints
    if (c0.identity.constraints.length > 0) {
      parts.push(`## Constraints\n\n${c0.identity.constraints.map((c) => `- ${c}`).join("\n")}`);
    }

    // Safety Rules
    if (c0.security.safetyRules.length > 0) {
      parts.push(`## Safety Rules\n\n${c0.security.safetyRules.map((r) => `- ${r}`).join("\n")}`);
    }

    return parts.join("\n\n");
  }

  /**
   * Select best genes from C1 using epsilon-greedy with token budget.
   * When total tokens exceed the budget, genes are ranked by value-per-token
   * (fitness.composite / tokenCount) and greedily selected to fit.
   */
  private async selectBestFromC1(_context?: SelectionContext): Promise<string[]> {
    const operations = this.genome.chromosomes.c1.operations;
    const epsilon = this.genome.config.epsilonExplore || 0.1;

    // Group by category
    const byCategory = new Map<string, OperativeGene[]>();
    for (const gene of operations) {
      if (!byCategory.has(gene.category)) {
        byCategory.set(gene.category, []);
      }
      byCategory.get(gene.category)!.push(gene);
    }

    // Select best from each category (epsilon-greedy)
    const candidates: OperativeGene[] = [];
    for (const [, genes] of byCategory) {
      candidates.push(this.selectByEpsilonGreedy(genes, epsilon));
    }

    // Calculate total tokens
    const getTokens = (gene: OperativeGene) => gene.tokenCount || estimateTokenCount(gene.content);
    const totalTokens = candidates.reduce((sum, g) => sum + getTokens(g), 0);

    let finalGenes: OperativeGene[];

    if (totalTokens <= DEFAULT_C1_TOKEN_BUDGET) {
      // Under budget — include all candidates
      finalGenes = candidates;
    } else {
      // Over budget — rank by value-per-token, fill greedily
      const ranked = [...candidates].toSorted((a, b) => {
        const effA = tokenEfficiency(a.fitness.composite, getTokens(a));
        const effB = tokenEfficiency(b.fitness.composite, getTokens(b));
        return effB - effA;
      });

      finalGenes = [];
      let usedTokens = 0;
      for (const gene of ranked) {
        const geneTokens = getTokens(gene);
        if (usedTokens + geneTokens <= DEFAULT_C1_TOKEN_BUDGET) {
          finalGenes.push(gene);
          usedTokens += geneTokens;
        }
      }
    }

    return finalGenes.map((g) => `## ${this.formatCategory(g.category)}\n\n${g.content}`);
  }

  /**
   * Select adaptations from C2
   */
  private async selectFromC2(context?: SelectionContext): Promise<string[]> {
    const c2 = this.genome.chromosomes.c2;
    const selected: string[] = [];

    // User-specific adaptations
    if (context?.userId) {
      const userEpigenome = c2.userAdaptations.get(context.userId);
      if (userEpigenome) {
        const prefs = userEpigenome.preferences;
        selected.push(
          `## User Preferences\n\n` +
            `- Communication style: ${prefs.communicationStyle}\n` +
            `- Verbosity: ${prefs.verbosity}\n` +
            `- Tone: ${prefs.tone}`,
        );
      }
    }

    // Context patterns
    for (const pattern of c2.contextPatterns) {
      if (pattern.fitness > 0.6) {
        selected.push(`## ${pattern.pattern}\n\n${pattern.adaptation}`);
      }
    }

    return selected;
  }

  /**
   * Epsilon-greedy selection
   */
  private selectByEpsilonGreedy<T extends { fitness: { composite: number } }>(
    candidates: T[],
    epsilon: number,
  ): T {
    if (candidates.length === 0) {
      throw new Error("Cannot select from empty candidates");
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // Sort by fitness descending
    const sorted = [...candidates].toSorted((a, b) => b.fitness.composite - a.fitness.composite);

    // With probability epsilon, explore (select random non-best)
    if (Math.random() < epsilon) {
      const nonBest = sorted.slice(1);
      if (nonBest.length > 0) {
        return nonBest[Math.floor(Math.random() * nonBest.length)];
      }
    }

    // Exploit: select best
    return sorted[0];
  }

  /**
   * Format category for display
   */
  private formatCategory(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Inject PGA genes into an existing prompt
   */
  injectGenes(basePrompt: string, genes: OperativeGene[]): string {
    if (genes.length === 0) {
      return basePrompt;
    }

    const geneInstructions = genes.map((g) => `[${g.category}] ${g.content}`).join("\n");

    return `${basePrompt}\n\n---\n\n## PGA Evolved Instructions\n\n${geneInstructions}`;
  }
}
