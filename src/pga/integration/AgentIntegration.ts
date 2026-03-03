/**
 * @fileoverview Integración principal de PGA con el sistema de agentes de Genoma
 * 
 * Este módulo proporciona la integración no-invasiva del sistema PGA
 * con los agentes existentes de Genoma, permitiendo evolución genómica
 * sin modificar el código base existente.
 */

import { EventEmitter } from 'events';
import type { GenomeV2, FitnessVector, MutationRecord } from '../types/index.js';
import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import type { LLMAdapter } from '../interfaces/LLMAdapter.js';
import { GenomeKernel } from '../core/GenomeKernel.js';
import { GenomeManager } from '../core/GenomeManager.js';
import { FitnessTracker } from '../core/FitnessTracker.js';
import { PromptAssembler } from '../core/PromptAssembler.js';
import { GeneRegistry } from '../core/GeneRegistry.js';
import { LayeredMemory } from '../memory/LayeredMemory.js';
import { MutationOperator } from '../evolution/MutationOperator.js';
import { Evaluator } from '../evaluation/Evaluator.js';
import { PGALogger } from './PGALogger.js';
import { PGARollbackManager } from './PGARollbackManager.js';
import { PGAMetricsCollector } from './PGAMetricsCollector.js';

// ============================================================================
// Types
// ============================================================================

export interface PGAAgentIntegrationConfig {
  /** Whether PGA is enabled for this agent */
  enabled: boolean;
  /** Unique agent identifier */
  agentId: string;
  /** User ID for epigenetic adaptations */
  userId?: string;
  /** Mutation interval (interactions before mutation trigger) */
  mutationInterval: number;
  /** Fitness threshold for automatic mutation */
  fitnessThreshold: number;
  /** Auto-rollback if fitness drops significantly */
  autoRollback: boolean;
  /** Rollback threshold (percentage drop from previous) */
  rollbackThreshold: number;
  /** Enable detailed logging */
  verboseLogging: boolean;
  /** Maximum snapshots to keep for rollback */
  maxSnapshots: number;
}

export interface AgentExecutionContext {
  sessionId: string;
  sessionKey?: string;
  prompt: string;
  provider?: string;
  model?: string;
  workspaceDir?: string;
  messageChannel?: string;
  startTime: number;
  metadata?: Record<string, unknown>;
}

export interface AgentExecutionResult {
  response: string;
  toolsUsed: string[];
  tokensUsed: { input: number; output: number };
  latencyMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface FitnessScore {
  accuracy: number;
  speed: number;
  cost: number;
  safety: number;
  userSatisfaction: number;
  adaptability: number;
}

export type PGAEventType = 
  | 'genome_loaded'
  | 'fitness_recorded'
  | 'mutation_triggered'
  | 'mutation_applied'
  | 'rollback_initiated'
  | 'rollback_completed'
  | 'integrity_violation'
  | 'gene_activated'
  | 'gene_deactivated';

export interface PGAEvent {
  type: PGAEventType;
  agentId: string;
  genomeId?: string;
  timestamp: number;
  data: Record<string, unknown>;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_INTEGRATION_CONFIG: PGAAgentIntegrationConfig = {
  enabled: true,
  agentId: 'default',
  mutationInterval: 50,
  fitnessThreshold: 0.6,
  autoRollback: true,
  rollbackThreshold: 0.15,
  verboseLogging: false,
  maxSnapshots: 10,
};

// ============================================================================
// Agent Integration Class
// ============================================================================

/**
 * AgentIntegration provides the bridge between Genoma's agent system
 * and the PGA genomic evolution system.
 * 
 * Usage:
 * ```typescript
 * const integration = new AgentIntegration(storageAdapter, llmAdapter, config);
 * await integration.initialize();
 * 
 * // Before agent execution
 * const evolvedPrompt = await integration.assemblePromptForAgent(context);
 * 
 * // After agent execution
 * await integration.recordExecution(context, result, feedback);
 * ```
 */
export class AgentIntegration extends EventEmitter {
  private readonly storage: StorageAdapter;
  private readonly llm: LLMAdapter;
  private readonly config: PGAAgentIntegrationConfig;
  
  // Core PGA components
  private kernel: GenomeKernel | null = null;
  private manager: GenomeManager;
  private tracker: FitnessTracker;
  private assembler: PromptAssembler;
  private registry: GeneRegistry;
  private memory: LayeredMemory;
  private mutator: MutationOperator;
  private evaluator: Evaluator;
  
  // Integration-specific components
  private logger: PGALogger;
  private rollbackManager: PGARollbackManager;
  private metricsCollector: PGAMetricsCollector;
  
  // State
  private genome: GenomeV2 | null = null;
  private interactionCount = 0;
  private lastFitness: FitnessVector | null = null;
  private isInitialized = false;

  constructor(
    storage: StorageAdapter,
    llm: LLMAdapter,
    config: Partial<PGAAgentIntegrationConfig> = {}
  ) {
    super();
    this.storage = storage;
    this.llm = llm;
    this.config = { ...DEFAULT_INTEGRATION_CONFIG, ...config };
    
    // Initialize components
    this.manager = new GenomeManager(storage);
    this.tracker = new FitnessTracker(storage);
    this.assembler = new PromptAssembler();
    this.registry = new GeneRegistry(storage);
    this.memory = new LayeredMemory(storage);
    this.mutator = new MutationOperator(llm);
    this.evaluator = new Evaluator(llm);
    
    // Integration components
    this.logger = new PGALogger(this.config.verboseLogging);
    this.rollbackManager = new PGARollbackManager(
      storage,
      this.config.maxSnapshots,
      this.config.rollbackThreshold
    );
    this.metricsCollector = new PGAMetricsCollector();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the PGA integration for an agent
   */
  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('PGA disabled for agent', { agentId: this.config.agentId });
      return;
    }

    try {
      // Load or create genome
      this.genome = await this.loadOrCreateGenome();
      
      // Initialize kernel with genome
      this.kernel = new GenomeKernel(this.genome);
      
      // Setup kernel callbacks
      this.setupKernelCallbacks();
      
      // Verify genome integrity
      await this.verifyIntegrity();
      
      // Load previous fitness if available
      this.lastFitness = this.genome.fitness;
      
      this.isInitialized = true;
      
      this.emitEvent('genome_loaded', {
        genomeId: this.genome.id,
        version: this.genome.version,
      });
      
      this.logger.info('PGA integration initialized', {
        agentId: this.config.agentId,
        genomeId: this.genome.id,
      });
    } catch (error) {
      this.logger.error('Failed to initialize PGA integration', { error });
      throw error;
    }
  }

  private async loadOrCreateGenome(): Promise<GenomeV2> {
    const existingGenomes = await this.manager.listGenomes();
    const agentGenome = existingGenomes.find(
      g => g.metadata?.agentId === this.config.agentId
    );
    
    if (agentGenome) {
      return this.manager.loadGenome(agentGenome.id);
    }
    
    return this.manager.createGenome(
      `Genome for ${this.config.agentId}`,
      { agentId: this.config.agentId }
    );
  }

  private setupKernelCallbacks(): void {
    if (!this.kernel) return;
    
    this.kernel.onViolation((event) => {
      this.logger.warn('C0 integrity violation detected', event);
      this.emitEvent('integrity_violation', event);
    });
    
    this.kernel.onQuarantine((event) => {
      this.logger.error('Genome quarantined', event);
      // Attempt automatic rollback
      if (this.config.autoRollback) {
        this.triggerRollback('integrity_violation');
      }
    });
  }

  // ==========================================================================
  // Prompt Assembly (Pre-execution hook)
  // ==========================================================================

  /**
   * Assemble an evolved prompt for agent execution.
   * This should be called before agent execution to inject PGA genes.
   */
  async assemblePromptForAgent(
    context: AgentExecutionContext,
    basePrompt?: string
  ): Promise<string> {
    if (!this.config.enabled || !this.isInitialized || !this.genome) {
      return basePrompt ?? context.prompt;
    }

    try {
      // Verify integrity before assembly
      if (!this.kernel?.verifyC0Integrity()) {
        this.logger.warn('C0 integrity check failed, using base prompt');
        return basePrompt ?? context.prompt;
      }

      // Get evolved prompt
      const evolvedPrompt = this.assembler.assemble(this.genome);
      
      // Get memory context for user
      const memoryContext = this.config.userId
        ? await this.memory.getMemoryPrompt(this.config.userId, this.genome.id)
        : '';
      
      // Combine with base prompt
      const finalPrompt = this.assembler.injectGenes(
        basePrompt ?? context.prompt,
        evolvedPrompt,
        memoryContext
      );
      
      this.logger.debug('Prompt assembled', {
        sessionId: context.sessionId,
        evolvedLength: evolvedPrompt.length,
        memoryLength: memoryContext.length,
      });
      
      return finalPrompt;
    } catch (error) {
      this.logger.error('Error assembling prompt', { error });
      return basePrompt ?? context.prompt;
    }
  }

  // ==========================================================================
  // Execution Recording (Post-execution hook)
  // ==========================================================================

  /**
   * Record agent execution results for fitness tracking.
   * This should be called after agent execution.
   */
  async recordExecution(
    context: AgentExecutionContext,
    result: AgentExecutionResult,
    userFeedback?: { rating?: number; comment?: string }
  ): Promise<void> {
    if (!this.config.enabled || !this.isInitialized || !this.genome) {
      return;
    }

    try {
      // Calculate fitness from execution metrics
      const fitness = await this.calculateFitness(context, result, userFeedback);
      
      // Record fitness
      await this.recordFitness(fitness);
      
      // Record interaction
      await this.storage.recordInteraction({
        id: `int-${Date.now()}`,
        genomeId: this.genome.id,
        userId: this.config.userId,
        timestamp: Date.now(),
        prompt: context.prompt,
        response: result.response,
        fitness,
        metadata: {
          sessionId: context.sessionId,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
          toolsUsed: result.toolsUsed,
        },
      });
      
      // Learn from interaction if user provides feedback
      if (userFeedback?.comment && this.config.userId) {
        await this.memory.learn(
          this.config.userId,
          this.genome.id,
          `User feedback: ${userFeedback.comment}`,
          {
            category: 'user_feedback',
            confidence: 0.8,
            source: 'explicit_feedback',
          }
        );
      }
      
      // Increment interaction count and check for mutation
      this.interactionCount++;
      await this.checkAndTriggerMutation(fitness);
      
      this.emitEvent('fitness_recorded', {
        fitness,
        interactionCount: this.interactionCount,
      });
      
    } catch (error) {
      this.logger.error('Error recording execution', { error });
    }
  }

  private async calculateFitness(
    context: AgentExecutionContext,
    result: AgentExecutionResult,
    userFeedback?: { rating?: number; comment?: string }
  ): Promise<FitnessVector> {
    // Use evaluator for heuristic evaluation
    const heuristicEval = this.evaluator.evaluateHeuristic(
      context.prompt,
      result.response,
      result.latencyMs,
      result.tokensUsed.output
    );
    
    // Calculate speed score (inversely proportional to latency)
    const maxLatency = 30000; // 30 seconds max
    const speedScore = Math.max(0, 1 - (result.latencyMs / maxLatency));
    
    // Calculate cost score (inversely proportional to tokens)
    const maxTokens = 10000;
    const totalTokens = result.tokensUsed.input + result.tokensUsed.output;
    const costScore = Math.max(0, 1 - (totalTokens / maxTokens));
    
    // Safety score (no errors = safe)
    const safetyScore = result.error ? 0.5 : 1.0;
    
    // User satisfaction from feedback
    const userSatisfaction = userFeedback?.rating
      ? userFeedback.rating / 5.0
      : heuristicEval.fitness.userSatisfaction;
    
    // Adaptability (based on tool usage variety)
    const adaptability = Math.min(1, result.toolsUsed.length * 0.2);
    
    return {
      accuracy: heuristicEval.fitness.accuracy,
      speed: speedScore,
      cost: costScore,
      safety: safetyScore,
      userSatisfaction,
      adaptability,
    };
  }

  private async recordFitness(fitness: FitnessVector): Promise<void> {
    if (!this.genome) return;
    
    // Update genome fitness (using EMA)
    this.genome.fitness = this.tracker.updateGenomeFitness(
      this.genome,
      fitness
    );
    
    // Save updated genome
    await this.manager.updateGenome(this.genome);
    
    // Collect metrics
    this.metricsCollector.recordFitness(fitness);
  }

  // ==========================================================================
  // Mutation System
  // ==========================================================================

  private async checkAndTriggerMutation(currentFitness: FitnessVector): Promise<void> {
    // Check interval
    if (this.interactionCount < this.config.mutationInterval) {
      return;
    }
    
    // Calculate average fitness
    const avgFitness = this.calculateAverageFitness(currentFitness);
    
    // Check if fitness is below threshold
    if (avgFitness < this.config.fitnessThreshold) {
      this.logger.info('Fitness below threshold, triggering mutation', {
        avgFitness,
        threshold: this.config.fitnessThreshold,
      });
      await this.triggerMutation();
    }
    
    // Check for rollback if fitness dropped significantly
    if (this.lastFitness && this.config.autoRollback) {
      const lastAvg = this.calculateAverageFitness(this.lastFitness);
      const drop = lastAvg - avgFitness;
      
      if (drop > this.config.rollbackThreshold) {
        this.logger.warn('Significant fitness drop detected', {
          previousFitness: lastAvg,
          currentFitness: avgFitness,
          drop,
        });
        await this.triggerRollback('fitness_drop');
      }
    }
    
    // Update last fitness
    this.lastFitness = currentFitness;
    
    // Reset interaction count
    this.interactionCount = 0;
  }

  private calculateAverageFitness(fitness: FitnessVector): number {
    const values = [
      fitness.accuracy,
      fitness.speed,
      fitness.cost,
      fitness.safety,
      fitness.userSatisfaction,
      fitness.adaptability,
    ];
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Trigger genome mutation
   */
  async triggerMutation(): Promise<void> {
    if (!this.genome || !this.kernel) return;
    
    try {
      this.emitEvent('mutation_triggered', { reason: 'scheduled' });
      
      // Create snapshot before mutation
      await this.rollbackManager.createSnapshot(this.genome);
      
      // Get lowest performing genes
      const lowPerformingGenes = this.tracker.getLowestPerformingGenes(
        this.genome,
        3
      );
      
      const mutations: MutationRecord[] = [];
      
      for (const gene of lowPerformingGenes) {
        // Mutate gene
        const result = await this.mutator.mutate(gene, 'llm_rewrite');
        
        if (result.success && result.mutatedGene) {
          // Replace gene in genome
          const geneIndex = this.genome.c1.operativeGenes.findIndex(
            g => g.id === gene.id
          );
          
          if (geneIndex >= 0) {
            this.genome.c1.operativeGenes[geneIndex] = result.mutatedGene;
            
            mutations.push({
              id: `mut-${Date.now()}-${gene.id}`,
              timestamp: Date.now(),
              geneId: gene.id,
              chromosome: 'c1',
              operation: 'replace',
              before: gene.content,
              after: result.mutatedGene.content,
              reason: 'low_fitness',
              fitness: gene.fitness,
            });
          }
        }
      }
      
      // Update genome version
      this.genome.version++;
      
      // Save mutations
      for (const mutation of mutations) {
        await this.storage.logMutation(mutation);
      }
      
      // Save updated genome
      await this.manager.updateGenome(this.genome);
      
      // Reinitialize kernel with updated genome
      this.kernel = new GenomeKernel(this.genome);
      this.setupKernelCallbacks();
      
      this.emitEvent('mutation_applied', {
        mutationCount: mutations.length,
        version: this.genome.version,
      });
      
      this.logger.info('Mutations applied', {
        mutationCount: mutations.length,
        version: this.genome.version,
      });
      
    } catch (error) {
      this.logger.error('Mutation failed', { error });
    }
  }

  // ==========================================================================
  // Rollback System
  // ==========================================================================

  /**
   * Trigger rollback to previous genome version
   */
  private async triggerRollback(reason: string): Promise<void> {
    if (!this.genome) return;
    
    try {
      this.emitEvent('rollback_initiated', { reason });
      
      const previousSnapshot = await this.rollbackManager.rollback(this.genome.id);
      
      if (previousSnapshot) {
        this.genome = previousSnapshot;
        this.kernel = new GenomeKernel(this.genome);
        this.setupKernelCallbacks();
        
        await this.manager.updateGenome(this.genome);
        
        this.emitEvent('rollback_completed', {
          version: this.genome.version,
          reason,
        });
        
        this.logger.info('Rollback completed', {
          version: this.genome.version,
          reason,
        });
      } else {
        this.logger.warn('No snapshot available for rollback');
      }
    } catch (error) {
      this.logger.error('Rollback failed', { error });
    }
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get current genome state
   */
  getGenome(): GenomeV2 | null {
    return this.genome;
  }

  /**
   * Get current fitness
   */
  getCurrentFitness(): FitnessVector | null {
    return this.genome?.fitness ?? null;
  }

  /**
   * Get metrics summary
   */
  getMetrics(): ReturnType<PGAMetricsCollector['getSummary']> {
    return this.metricsCollector.getSummary();
  }

  /**
   * Force manual mutation
   */
  async forceEvolution(): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      throw new Error('PGA not initialized');
    }
    await this.triggerMutation();
  }

  /**
   * Force rollback to previous version
   */
  async forceRollback(): Promise<void> {
    if (!this.config.enabled || !this.isInitialized) {
      throw new Error('PGA not initialized');
    }
    await this.triggerRollback('manual');
  }

  /**
   * Record explicit user feedback
   */
  async recordFeedback(
    rating: number,
    comment?: string
  ): Promise<void> {
    if (!this.config.enabled || !this.genome || !this.config.userId) return;
    
    await this.storage.saveFeedback({
      id: `fb-${Date.now()}`,
      genomeId: this.genome.id,
      userId: this.config.userId,
      timestamp: Date.now(),
      type: 'explicit',
      rating,
      comment,
    });
    
    if (comment) {
      await this.memory.learn(
        this.config.userId,
        this.genome.id,
        comment,
        { category: 'user_preference', confidence: 0.9, source: 'explicit' }
      );
    }
  }

  /**
   * Check if PGA is enabled and initialized
   */
  isActive(): boolean {
    return this.config.enabled && this.isInitialized;
  }

  // ==========================================================================
  // Event Emission
  // ==========================================================================

  private emitEvent(type: PGAEventType, data: Record<string, unknown>): void {
    const event: PGAEvent = {
      type,
      agentId: this.config.agentId,
      genomeId: this.genome?.id,
      timestamp: Date.now(),
      data,
    };
    this.emit(type, event);
    this.emit('pga_event', event);
  }

  // ==========================================================================
  // Verification
  // ==========================================================================

  private async verifyIntegrity(): Promise<boolean> {
    if (!this.kernel || !this.genome) return false;
    return this.kernel.verifyC0Integrity();
  }
}

export default AgentIntegration;
