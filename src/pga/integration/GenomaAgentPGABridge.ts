/**
 * @fileoverview Bridge entre el sistema de agentes de Genoma y PGA
 * 
 * Este archivo proporciona el punto de integración principal entre
 * el runner de agentes de Genoma (pi-embedded-runner) y el sistema PGA.
 * 
 * La integración es no-invasiva: Genoma puede funcionar con o sin PGA.
 */

import { AgentIntegration, type PGAAgentIntegrationConfig, type AgentExecutionContext, type AgentExecutionResult } from './AgentIntegration.js';
import { PGAAPI } from './PGAAPI.js';
import { PGAHooks, type PGAHookContext } from './hooks.js';
import { GenomaStorageAdapter } from '../adapters/GenomaStorageAdapter.js';
import { GenomaLLMAdapter } from '../adapters/GenomaLLMAdapter.js';
import { getPGAConfigForEnvironment, toPGAAgentIntegrationConfig, type PGAConfig } from '../config/pga-integration.config.js';

// ============================================================================
// Types
// ============================================================================

export interface GenomaAgentContext {
  agentId: string;
  sessionId: string;
  sessionKey?: string;
  workspaceDir?: string;
  provider?: string;
  model?: string;
  messageChannel?: string;
  userId?: string;
}

export interface GenomaRunParams {
  prompt: string;
  systemPrompt?: string;
  context: GenomaAgentContext;
}

export interface GenomaRunResult {
  response: string;
  assistantTexts: string[];
  toolsUsed: string[];
  usage?: {
    input: number;
    output: number;
    total: number;
  };
  latencyMs: number;
  error?: string;
}

// ============================================================================
// Singleton Instance Management
// ============================================================================

let globalBridge: GenomaAgentPGABridge | null = null;

/**
 * Get or create the global PGA bridge instance
 */
export function getGlobalPGABridge(): GenomaAgentPGABridge {
  if (!globalBridge) {
    globalBridge = new GenomaAgentPGABridge();
  }
  return globalBridge;
}

/**
 * Reset the global PGA bridge (useful for testing)
 */
export function resetGlobalPGABridge(): void {
  globalBridge = null;
}

// ============================================================================
// Bridge Class
// ============================================================================

/**
 * GenomaAgentPGABridge provides the integration layer between
 * Genoma's agent system and the PGA evolutionary system.
 * 
 * This bridge is designed to be non-invasive - the agent system
 * can operate normally without PGA, and PGA features are only
 * activated when explicitly enabled.
 * 
 * ## Usage in Genoma Agent Runner
 * 
 * ```typescript
 * import { getGlobalPGABridge } from '../pga/integration/GenomaAgentPGABridge';
 * 
 * // In runEmbeddedPiAgent function:
 * const pgaBridge = getGlobalPGABridge();
 * 
 * // Before execution - inject evolved genes
 * const evolvedPrompt = await pgaBridge.beforeExecution({
 *   prompt: params.prompt,
 *   systemPrompt: systemPrompt,
 *   context: {
 *     agentId: params.agentId,
 *     sessionId: params.sessionId,
 *     sessionKey: params.sessionKey,
 *   }
 * });
 * 
 * // ... run agent with evolvedPrompt ...
 * 
 * // After execution - record for fitness
 * await pgaBridge.afterExecution(
 *   { ...context, prompt: params.prompt },
 *   {
 *     response: assistantText,
 *     toolsUsed: tools,
 *     latencyMs: Date.now() - started,
 *     usage: { input: tokens.input, output: tokens.output }
 *   },
 *   userFeedback
 * );
 * ```
 */
export class GenomaAgentPGABridge {
  private config: PGAConfig;
  private storage: GenomaStorageAdapter;
  private llm: GenomaLLMAdapter;
  private integrations: Map<string, AgentIntegration> = new Map();
  private apis: Map<string, PGAAPI> = new Map();
  private initialized = false;

  constructor(config?: Partial<PGAConfig>) {
    this.config = getPGAConfigForEnvironment();
    if (config) {
      this.config = {
        ...this.config,
        featureFlags: { ...this.config.featureFlags, ...config.featureFlags },
        evolution: { ...this.config.evolution, ...config.evolution },
        fitness: { ...this.config.fitness, ...config.fitness },
        storage: { ...this.config.storage, ...config.storage },
      };
    }
    
    this.storage = new GenomaStorageAdapter();
    this.llm = new GenomaLLMAdapter();
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Check if PGA is enabled
   */
  isEnabled(): boolean {
    return this.config.featureFlags.enabled;
  }

  /**
   * Enable or disable PGA at runtime
   */
  setEnabled(enabled: boolean): void {
    this.config.featureFlags.enabled = enabled;
  }

  /**
   * Get or initialize integration for an agent
   */
  private async getIntegration(context: GenomaAgentContext): Promise<AgentIntegration | null> {
    if (!this.isEnabled()) return null;

    const key = `${context.agentId}:${context.userId ?? 'default'}`;
    
    if (!this.integrations.has(key)) {
      const integrationConfig = toPGAAgentIntegrationConfig(
        this.config,
        context.agentId,
        context.userId
      );
      
      const integration = new AgentIntegration(
        this.storage,
        this.llm,
        integrationConfig
      );
      
      await integration.initialize();
      this.integrations.set(key, integration);
    }
    
    return this.integrations.get(key) ?? null;
  }

  // ==========================================================================
  // Execution Hooks
  // ==========================================================================

  /**
   * Called before agent execution to inject PGA genes into the prompt.
   * Returns the original prompt if PGA is disabled or not initialized.
   */
  async beforeExecution(params: GenomaRunParams): Promise<string> {
    if (!this.isEnabled()) {
      return params.prompt;
    }

    try {
      const integration = await this.getIntegration(params.context);
      if (!integration || !integration.isActive()) {
        return params.prompt;
      }

      const hookCtx: PGAHookContext = {
        integration,
        sessionId: params.context.sessionId,
        sessionKey: params.context.sessionKey,
        agentId: params.context.agentId,
        userId: params.context.userId,
      };

      const result = await PGAHooks.beforeAgentStart(
        hookCtx,
        params.prompt,
        { baseSystemPrompt: params.systemPrompt }
      );

      if (this.config.featureFlags.verboseLogging) {
        console.log(`[PGA Bridge] Prompt evolved: ${result.pgaApplied}`);
      }

      return result.prompt;
    } catch (error) {
      console.error('[PGA Bridge] beforeExecution error:', error);
      return params.prompt;
    }
  }

  /**
   * Called after agent execution to record fitness metrics.
   */
  async afterExecution(
    context: GenomaAgentContext & { prompt: string },
    result: GenomaRunResult,
    userFeedback?: { rating?: number; comment?: string }
  ): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const integration = await this.getIntegration(context);
      if (!integration || !integration.isActive()) return;

      const executionContext: AgentExecutionContext = {
        sessionId: context.sessionId,
        sessionKey: context.sessionKey,
        prompt: context.prompt,
        provider: context.provider,
        model: context.model,
        workspaceDir: context.workspaceDir,
        messageChannel: context.messageChannel,
        startTime: Date.now() - result.latencyMs,
      };

      const executionResult: AgentExecutionResult = {
        response: result.response,
        toolsUsed: result.toolsUsed,
        tokensUsed: {
          input: result.usage?.input ?? 0,
          output: result.usage?.output ?? 0,
        },
        latencyMs: result.latencyMs,
        error: result.error,
      };

      const hookCtx: PGAHookContext = {
        integration,
        sessionId: context.sessionId,
        sessionKey: context.sessionKey,
        agentId: context.agentId,
        userId: context.userId,
      };

      await PGAHooks.afterAgentComplete(
        hookCtx,
        executionContext,
        executionResult,
        userFeedback
      );

      if (this.config.featureFlags.verboseLogging) {
        console.log('[PGA Bridge] Execution recorded');
      }
    } catch (error) {
      console.error('[PGA Bridge] afterExecution error:', error);
    }
  }

  /**
   * Called when an error occurs during agent execution.
   */
  async onError(
    context: GenomaAgentContext & { prompt: string },
    error: Error
  ): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const integration = await this.getIntegration(context);
      if (!integration || !integration.isActive()) return;

      const executionContext: AgentExecutionContext = {
        sessionId: context.sessionId,
        sessionKey: context.sessionKey,
        prompt: context.prompt,
        provider: context.provider,
        model: context.model,
        startTime: Date.now(),
      };

      const hookCtx: PGAHookContext = {
        integration,
        sessionId: context.sessionId,
        sessionKey: context.sessionKey,
        agentId: context.agentId,
        userId: context.userId,
      };

      await PGAHooks.onAgentError(hookCtx, error, executionContext);
    } catch (err) {
      console.error('[PGA Bridge] onError handling failed:', err);
    }
  }

  // ==========================================================================
  // API Access
  // ==========================================================================

  /**
   * Get the PGA API for an agent
   */
  async getAPI(context: GenomaAgentContext): Promise<PGAAPI | null> {
    if (!this.isEnabled()) return null;

    const key = `${context.agentId}:${context.userId ?? 'default'}`;
    
    if (!this.apis.has(key)) {
      const integrationConfig = toPGAAgentIntegrationConfig(
        this.config,
        context.agentId,
        context.userId
      );
      
      const api = new PGAAPI({
        storage: this.storage,
        llm: this.llm,
        config: integrationConfig,
      });
      
      await api.initialize();
      this.apis.set(key, api);
    }
    
    return this.apis.get(key) ?? null;
  }

  // ==========================================================================
  // Feedback
  // ==========================================================================

  /**
   * Record explicit user feedback
   */
  async recordFeedback(
    context: GenomaAgentContext,
    rating: number,
    comment?: string
  ): Promise<void> {
    if (!this.isEnabled()) return;

    const api = await this.getAPI(context);
    if (api) {
      await api.recordFeedback(rating, comment);
    }
  }

  // ==========================================================================
  // Manual Evolution Control
  // ==========================================================================

  /**
   * Force evolution/mutation for an agent
   */
  async forceEvolution(context: GenomaAgentContext): Promise<void> {
    if (!this.isEnabled()) return;

    const api = await this.getAPI(context);
    if (api) {
      await api.forceEvolution();
    }
  }

  /**
   * Force rollback for an agent
   */
  async forceRollback(context: GenomaAgentContext): Promise<void> {
    if (!this.isEnabled()) return;

    const api = await this.getAPI(context);
    if (api) {
      await api.forceRollback();
    }
  }

  // ==========================================================================
  // Status
  // ==========================================================================

  /**
   * Get evolution status for an agent
   */
  async getStatus(context: GenomaAgentContext): Promise<{
    enabled: boolean;
    genomeId?: string;
    version?: number;
    fitness?: number;
  }> {
    if (!this.isEnabled()) {
      return { enabled: false };
    }

    const api = await this.getAPI(context);
    if (!api || !api.isActive()) {
      return { enabled: false };
    }

    const status = api.getEvolutionStatus();
    return {
      enabled: status.enabled,
      genomeId: status.genomeId ?? undefined,
      version: status.genomeVersion,
      fitness: status.currentFitness
        ? (status.currentFitness.accuracy +
           status.currentFitness.speed +
           status.currentFitness.cost +
           status.currentFitness.safety +
           status.currentFitness.userSatisfaction +
           status.currentFitness.adaptability) / 6
        : undefined,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): PGAConfig {
    return { ...this.config };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(config: Partial<PGAConfig>): void {
    if (config.featureFlags) {
      this.config.featureFlags = { ...this.config.featureFlags, ...config.featureFlags };
    }
    if (config.evolution) {
      this.config.evolution = { ...this.config.evolution, ...config.evolution };
    }
    if (config.fitness) {
      this.config.fitness = { ...this.config.fitness, ...config.fitness };
    }
    if (config.storage) {
      this.config.storage = { ...this.config.storage, ...config.storage };
    }
  }
}

export default GenomaAgentPGABridge;
