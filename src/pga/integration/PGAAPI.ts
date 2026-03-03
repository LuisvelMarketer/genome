/**
 * @fileoverview API interna de PGA para agentes
 * 
 * Proporciona una API simple para que los agentes puedan
 * consultar y actualizar genes, registrar feedback, y más.
 */

import type { GenomeV2, FitnessVector, OperativeGene, MutationRecord } from '../types/index.js';
import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import type { LLMAdapter } from '../interfaces/LLMAdapter.js';
import { AgentIntegration, type PGAAgentIntegrationConfig } from './AgentIntegration.js';
import { GeneRegistry, type GeneRegistryEntry } from '../core/GeneRegistry.js';

export interface PGAAPIOptions {
  storage: StorageAdapter;
  llm: LLMAdapter;
  config?: Partial<PGAAgentIntegrationConfig>;
}

export interface GeneInfo {
  id: string;
  name: string;
  category: string;
  content: string;
  fitness: FitnessVector;
  usageCount: number;
  isActive: boolean;
}

export interface FitnessHistoryEntry {
  timestamp: number;
  fitness: FitnessVector;
  average: number;
}

export interface EvolutionStatus {
  enabled: boolean;
  initialized: boolean;
  genomeId: string | null;
  genomeVersion: number;
  currentFitness: FitnessVector | null;
  interactionsSinceMutation: number;
  totalMutations: number;
  totalRollbacks: number;
  fitnessTrend: 'improving' | 'declining' | 'stable';
}

/**
 * PGAAPI provides a simple interface for agents to interact with PGA.
 * 
 * Usage:
 * ```typescript
 * const api = new PGAAPI({ storage, llm, config });
 * await api.initialize();
 * 
 * // Get current genes
 * const genes = api.getActiveGenes();
 * 
 * // Record feedback
 * await api.recordFeedback(4.5, 'Great response!');
 * 
 * // Force mutation
 * await api.forceEvolution();
 * ```
 */
export class PGAAPI {
  private readonly integration: AgentIntegration;
  private readonly registry: GeneRegistry;
  private readonly storage: StorageAdapter;
  
  private interactionCount = 0;
  private mutationCount = 0;
  private rollbackCount = 0;

  constructor(options: PGAAPIOptions) {
    this.storage = options.storage;
    this.integration = new AgentIntegration(
      options.storage,
      options.llm,
      options.config
    );
    this.registry = new GeneRegistry(options.storage);
    
    // Track events
    this.integration.on('mutation_applied', () => this.mutationCount++);
    this.integration.on('rollback_completed', () => this.rollbackCount++);
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the PGA API
   */
  async initialize(): Promise<void> {
    await this.integration.initialize();
  }

  // ==========================================================================
  // Gene Operations
  // ==========================================================================

  /**
   * Get all active genes for the current genome
   */
  getActiveGenes(): GeneInfo[] {
    const genome = this.integration.getGenome();
    if (!genome) return [];

    return genome.c1.operativeGenes.map(gene => ({
      id: gene.id,
      name: gene.name,
      category: gene.category,
      content: gene.content,
      fitness: gene.fitness,
      usageCount: gene.usageCount,
      isActive: gene.active,
    }));
  }

  /**
   * Get a specific gene by ID
   */
  getGene(geneId: string): GeneInfo | null {
    const genome = this.integration.getGenome();
    if (!genome) return null;

    const gene = genome.c1.operativeGenes.find(g => g.id === geneId);
    if (!gene) return null;

    return {
      id: gene.id,
      name: gene.name,
      category: gene.category,
      content: gene.content,
      fitness: gene.fitness,
      usageCount: gene.usageCount,
      isActive: gene.active,
    };
  }

  /**
   * Get genes by category
   */
  getGenesByCategory(category: string): GeneInfo[] {
    return this.getActiveGenes().filter(g => g.category === category);
  }

  /**
   * Activate or deactivate a gene
   */
  async setGeneActive(geneId: string, active: boolean): Promise<boolean> {
    const genome = this.integration.getGenome();
    if (!genome) return false;

    const gene = genome.c1.operativeGenes.find(g => g.id === geneId);
    if (!gene) return false;

    gene.active = active;
    return true;
  }

  // ==========================================================================
  // Feedback Operations
  // ==========================================================================

  /**
   * Record explicit user feedback
   */
  async recordFeedback(rating: number, comment?: string): Promise<void> {
    await this.integration.recordFeedback(rating, comment);
  }

  /**
   * Record implicit feedback signals
   */
  async recordImplicitFeedback(signals: {
    responseAccepted: boolean;
    toolUsageSuccess: boolean;
    userEdited: boolean;
    responseTime: number;
  }): Promise<void> {
    // Convert implicit signals to a rating
    let rating = 3.0; // Base rating
    
    if (signals.responseAccepted) rating += 0.5;
    if (signals.toolUsageSuccess) rating += 0.5;
    if (signals.userEdited) rating -= 0.5;
    if (signals.responseTime < 5000) rating += 0.25;
    if (signals.responseTime > 15000) rating -= 0.25;
    
    rating = Math.max(1, Math.min(5, rating));
    
    await this.integration.recordFeedback(rating);
  }

  // ==========================================================================
  // Evolution Operations
  // ==========================================================================

  /**
   * Force manual mutation/evolution
   */
  async forceEvolution(): Promise<void> {
    await this.integration.forceEvolution();
  }

  /**
   * Force rollback to previous version
   */
  async forceRollback(): Promise<void> {
    await this.integration.forceRollback();
  }

  // ==========================================================================
  // Fitness Operations
  // ==========================================================================

  /**
   * Get current fitness vector
   */
  getCurrentFitness(): FitnessVector | null {
    return this.integration.getCurrentFitness();
  }

  /**
   * Get fitness history
   */
  getFitnessHistory(): FitnessHistoryEntry[] {
    const metrics = this.integration.getMetrics();
    return metrics.fitnessHistory.map(entry => ({
      timestamp: entry.timestamp,
      fitness: entry.fitness,
      average: this.calculateAverageFitness(entry.fitness),
    }));
  }

  /**
   * Get average fitness score
   */
  getAverageFitness(): number {
    const fitness = this.getCurrentFitness();
    if (!fitness) return 0;
    return this.calculateAverageFitness(fitness);
  }

  // ==========================================================================
  // Status Operations
  // ==========================================================================

  /**
   * Get comprehensive evolution status
   */
  getEvolutionStatus(): EvolutionStatus {
    const genome = this.integration.getGenome();
    const metrics = this.integration.getMetrics();
    
    return {
      enabled: this.integration.isActive(),
      initialized: this.integration.isActive(),
      genomeId: genome?.id ?? null,
      genomeVersion: genome?.version ?? 0,
      currentFitness: genome?.fitness ?? null,
      interactionsSinceMutation: this.interactionCount % 50, // Assuming 50 mutation interval
      totalMutations: this.mutationCount,
      totalRollbacks: this.rollbackCount,
      fitnessTrend: this.determineTrend(metrics.fitnessHistory),
    };
  }

  /**
   * Check if PGA is active
   */
  isActive(): boolean {
    return this.integration.isActive();
  }

  // ==========================================================================
  // Gene Registry Operations
  // ==========================================================================

  /**
   * Search for genes in the registry
   */
  async searchRegistryGenes(criteria: {
    category?: string;
    minFitness?: number;
    validatedOnly?: boolean;
  }): Promise<GeneRegistryEntry[]> {
    return this.registry.searchGenes(criteria);
  }

  /**
   * Inherit a gene from the registry
   */
  async inheritGene(registryGeneId: string): Promise<OperativeGene | null> {
    return this.registry.inheritGene(registryGeneId);
  }

  /**
   * Register a gene to the shared registry
   */
  async registerGene(gene: OperativeGene, isPublic = true): Promise<string> {
    return this.registry.registerGene(gene, isPublic);
  }

  // ==========================================================================
  // Prompt Operations
  // ==========================================================================

  /**
   * Get evolved prompt for agent execution
   */
  async getEvolvedPrompt(
    context: {
      sessionId: string;
      prompt: string;
    },
    basePrompt?: string
  ): Promise<string> {
    return this.integration.assemblePromptForAgent(
      {
        ...context,
        startTime: Date.now(),
      },
      basePrompt
    );
  }

  /**
   * Record agent execution for fitness tracking
   */
  async recordExecution(
    context: {
      sessionId: string;
      prompt: string;
    },
    result: {
      response: string;
      toolsUsed: string[];
      tokensUsed: { input: number; output: number };
      latencyMs: number;
      error?: string;
    },
    feedback?: { rating?: number; comment?: string }
  ): Promise<void> {
    this.interactionCount++;
    await this.integration.recordExecution(
      {
        ...context,
        startTime: Date.now(),
      },
      result,
      feedback
    );
  }

  // ==========================================================================
  // Event Subscription
  // ==========================================================================

  /**
   * Subscribe to PGA events
   */
  on(event: string, listener: (...args: unknown[]) => void): void {
    this.integration.on(event, listener);
  }

  /**
   * Unsubscribe from PGA events
   */
  off(event: string, listener: (...args: unknown[]) => void): void {
    this.integration.off(event, listener);
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private calculateAverageFitness(fitness: FitnessVector): number {
    return (
      fitness.accuracy +
      fitness.speed +
      fitness.cost +
      fitness.safety +
      fitness.userSatisfaction +
      fitness.adaptability
    ) / 6;
  }

  private determineTrend(
    history: Array<{ timestamp: number; fitness: FitnessVector }>
  ): 'improving' | 'declining' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history.slice(-10);
    const averages = recent.map(h => this.calculateAverageFitness(h.fitness));
    
    const first = averages.slice(0, Math.floor(averages.length / 2));
    const second = averages.slice(Math.floor(averages.length / 2));
    
    const firstAvg = first.reduce((a, b) => a + b, 0) / first.length;
    const secondAvg = second.reduce((a, b) => a + b, 0) / second.length;
    
    const diff = secondAvg - firstAvg;
    
    if (diff > 0.05) return 'improving';
    if (diff < -0.05) return 'declining';
    return 'stable';
  }
}

export default PGAAPI;
