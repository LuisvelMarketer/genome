/**
 * @fileoverview Hooks para integración PGA con el sistema de agentes Genoma
 * 
 * Estos hooks permiten inyectar el sistema PGA en el flujo de ejecución
 * de agentes de forma no-invasiva.
 */

import type { AgentIntegration, AgentExecutionContext, AgentExecutionResult } from './AgentIntegration.js';
import type { FitnessVector } from '../types/index.js';

// ============================================================================
// Types
// ============================================================================

export interface PGAHookContext {
  integration: AgentIntegration;
  sessionId: string;
  sessionKey?: string;
  agentId: string;
  userId?: string;
}

export interface BeforeAgentStartHookResult {
  /** Modified prompt with PGA genes injected */
  prompt: string;
  /** Whether PGA was applied */
  pgaApplied: boolean;
  /** Genome version used */
  genomeVersion?: number;
}

export interface AfterAgentCompleteHookResult {
  /** Whether fitness was recorded */
  fitnessRecorded: boolean;
  /** Calculated fitness scores */
  fitness?: FitnessVector;
  /** Whether mutation was triggered */
  mutationTriggered?: boolean;
}

// ============================================================================
// Pre-execution Hook
// ============================================================================

/**
 * Hook to be called before agent execution.
 * Injects PGA genes into the prompt.
 */
export async function beforeAgentStartHook(
  ctx: PGAHookContext,
  originalPrompt: string,
  options?: {
    baseSystemPrompt?: string;
    includeMemory?: boolean;
  }
): Promise<BeforeAgentStartHookResult> {
  if (!ctx.integration.isActive()) {
    return {
      prompt: originalPrompt,
      pgaApplied: false,
    };
  }

  try {
    const evolvedPrompt = await ctx.integration.assemblePromptForAgent(
      {
        sessionId: ctx.sessionId,
        sessionKey: ctx.sessionKey,
        prompt: originalPrompt,
        startTime: Date.now(),
      },
      options?.baseSystemPrompt
    );

    const genome = ctx.integration.getGenome();

    return {
      prompt: evolvedPrompt,
      pgaApplied: true,
      genomeVersion: genome?.version,
    };
  } catch (error) {
    console.error('[PGA Hook] beforeAgentStart error:', error);
    return {
      prompt: originalPrompt,
      pgaApplied: false,
    };
  }
}

// ============================================================================
// Post-execution Hook
// ============================================================================

/**
 * Hook to be called after agent execution.
 * Records fitness and potentially triggers mutation.
 */
export async function afterAgentCompleteHook(
  ctx: PGAHookContext,
  executionContext: AgentExecutionContext,
  result: AgentExecutionResult,
  userFeedback?: { rating?: number; comment?: string }
): Promise<AfterAgentCompleteHookResult> {
  if (!ctx.integration.isActive()) {
    return {
      fitnessRecorded: false,
    };
  }

  try {
    // Record execution
    await ctx.integration.recordExecution(
      executionContext,
      result,
      userFeedback
    );

    const fitness = ctx.integration.getCurrentFitness();
    const metrics = ctx.integration.getMetrics();

    return {
      fitnessRecorded: true,
      fitness: fitness ?? undefined,
      mutationTriggered: metrics.totalMutations > 0, // Simplified check
    };
  } catch (error) {
    console.error('[PGA Hook] afterAgentComplete error:', error);
    return {
      fitnessRecorded: false,
    };
  }
}

// ============================================================================
// Tool Execution Hooks
// ============================================================================

/**
 * Hook to be called before tool execution.
 * Can track which tools are being used.
 */
export function beforeToolExecutionHook(
  ctx: PGAHookContext,
  toolName: string,
  toolInput: Record<string, unknown>
): { proceed: boolean; modifiedInput?: Record<string, unknown> } {
  // Log tool usage for fitness tracking
  console.debug(`[PGA Hook] Tool execution: ${toolName}`);
  
  return {
    proceed: true,
  };
}

/**
 * Hook to be called after tool execution.
 * Records tool success/failure for fitness calculation.
 */
export function afterToolExecutionHook(
  ctx: PGAHookContext,
  toolName: string,
  success: boolean,
  executionTimeMs: number
): void {
  console.debug(`[PGA Hook] Tool completed: ${toolName}, success: ${success}, time: ${executionTimeMs}ms`);
}

// ============================================================================
// Error Handling Hooks
// ============================================================================

/**
 * Hook to be called when agent encounters an error.
 */
export async function onAgentErrorHook(
  ctx: PGAHookContext,
  error: Error,
  context: AgentExecutionContext
): Promise<void> {
  console.warn(`[PGA Hook] Agent error: ${error.message}`);
  
  // Record as failed execution with low fitness
  await ctx.integration.recordExecution(
    context,
    {
      response: '',
      toolsUsed: [],
      tokensUsed: { input: 0, output: 0 },
      latencyMs: Date.now() - context.startTime,
      error: error.message,
    }
  );
}

// ============================================================================
// Stream Hooks
// ============================================================================

/**
 * Hook for streaming responses.
 * Called for each chunk of streamed output.
 */
export function onStreamChunkHook(
  ctx: PGAHookContext,
  chunk: string,
  totalLength: number
): void {
  // Could be used for real-time analysis
  // Currently just logs for debugging
}

// ============================================================================
// Session Hooks
// ============================================================================

/**
 * Hook called when a session starts.
 */
export async function onSessionStartHook(
  ctx: PGAHookContext
): Promise<void> {
  console.debug(`[PGA Hook] Session started: ${ctx.sessionId}`);
}

/**
 * Hook called when a session ends.
 */
export async function onSessionEndHook(
  ctx: PGAHookContext,
  summary: {
    totalInteractions: number;
    averageFitness: number;
    duration: number;
  }
): Promise<void> {
  console.debug(`[PGA Hook] Session ended: ${ctx.sessionId}`, summary);
}

// ============================================================================
// Feedback Hooks
// ============================================================================

/**
 * Hook for explicit user feedback.
 */
export async function onUserFeedbackHook(
  ctx: PGAHookContext,
  rating: number,
  comment?: string
): Promise<void> {
  await ctx.integration.recordFeedback(rating, comment);
}

/**
 * Hook for implicit feedback signals.
 */
export async function onImplicitFeedbackHook(
  ctx: PGAHookContext,
  signals: {
    responseAccepted: boolean;
    userEdited: boolean;
    responseTime: number;
    scrollDepth?: number;
  }
): Promise<void> {
  // Convert signals to a rough rating
  let rating = 3.0;
  
  if (signals.responseAccepted) rating += 0.5;
  if (signals.userEdited) rating -= 0.5;
  if (signals.responseTime < 5000) rating += 0.25;
  if (signals.scrollDepth && signals.scrollDepth > 0.8) rating += 0.25;
  
  rating = Math.max(1, Math.min(5, rating));
  
  await ctx.integration.recordFeedback(rating);
}

// ============================================================================
// Export Hook Registry
// ============================================================================

export const PGAHooks = {
  beforeAgentStart: beforeAgentStartHook,
  afterAgentComplete: afterAgentCompleteHook,
  beforeToolExecution: beforeToolExecutionHook,
  afterToolExecution: afterToolExecutionHook,
  onAgentError: onAgentErrorHook,
  onStreamChunk: onStreamChunkHook,
  onSessionStart: onSessionStartHook,
  onSessionEnd: onSessionEndHook,
  onUserFeedback: onUserFeedbackHook,
  onImplicitFeedback: onImplicitFeedbackHook,
};

export default PGAHooks;
