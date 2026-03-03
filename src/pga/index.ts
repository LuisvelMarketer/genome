/**
 * @fileoverview PGA (Prompt Genómico Autoevolutivo) Main Entry Point
 * 
 * This module provides the complete PGA system for self-evolving AI agents
 * within the Genoma platform.
 * 
 * ## Architecture Overview
 * 
 * The PGA system is organized in layers:
 * 
 * 1. **Core** - Fundamental genomic operations
 *    - GenomeKernel: C0 integrity and security
 *    - GenomeManager: CRUD operations for genomes
 *    - FitnessTracker: 6D fitness evaluation
 *    - PromptAssembler: Prompt construction from genes
 *    - GeneRegistry: Shared gene repository
 * 
 * 2. **Memory** - Contextual learning
 *    - LayeredMemory: User-specific semantic facts
 * 
 * 3. **Evolution** - Mutation and adaptation
 *    - MutationOperator: Gene mutation strategies
 * 
 * 4. **Evaluation** - Response quality assessment
 *    - Evaluator: Heuristic and LLM-based evaluation
 * 
 * 5. **Integration** - Agent system connection
 *    - AgentIntegration: Main integration class
 *    - PGAAgentWrapper: Simple wrapper for agents
 *    - PGAAPI: Internal API for agents
 *    - Hooks: Pre/post execution hooks
 * 
 * 6. **Adapters** - External system integration
 *    - GenomaStorageAdapter: Storage backend
 *    - GenomaLLMAdapter: LLM provider
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { PGAAPI, GenomaStorageAdapter, GenomaLLMAdapter, getPGAConfigForEnvironment } from './pga';
 * 
 * // Initialize adapters
 * const storage = new GenomaStorageAdapter();
 * const llm = new GenomaLLMAdapter();
 * const config = getPGAConfigForEnvironment();
 * 
 * // Create API instance
 * const api = new PGAAPI({ storage, llm, config });
 * await api.initialize();
 * 
 * // Use in agent execution
 * const evolvedPrompt = await api.getEvolvedPrompt({
 *   sessionId: 'session-123',
 *   prompt: 'User message'
 * });
 * 
 * // Record execution results
 * await api.recordExecution(context, result, feedback);
 * ```
 * 
 * @module pga
 */

// Types
export * from './types/index.js';

// Interfaces
export * from './interfaces/index.js';

// Core components
export * from './core/index.js';

// Memory system
export * from './memory/index.js';

// Evolution system
export * from './evolution/index.js';

// Evaluation system
export * from './evaluation/index.js';

// Integration with Genoma agents
export * from './integration/index.js';

// Adapters for external systems
export * from './adapters/index.js';

// Configuration
export * from './config/index.js';

// Utilities
export * from './utils/index.js';
