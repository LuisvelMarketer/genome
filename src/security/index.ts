/**
 * Security Module — High-priority security components for Genoma v3.0
 * 
 * Adapted from Orbis security layers for PGA Platform integration.
 * 
 * @author DeepAgent
 * @since 2026-03-03 | Genoma v3.0
 */

// Immune System — Auto-rollback for underperforming genes
export {
    ImmuneSystem,
    type ImmuneConfig,
    type GeneStatus,
    type ImmuneEvent,
    type GeneHealthStatus,
} from './ImmuneSystem.js';

// Mutation Evaluator — Sandbox testing before deployment
export {
    MutationEvaluator,
    type EvaluatorConfig,
    type TestCase,
    type EvaluationResult,
    type TestResult,
    type LLMEvaluationResult,
} from './MutationEvaluator.js';

// Prompt Injection Guard — Input sanitization and threat detection
export {
    PromptInjectionGuard,
    type GuardConfig,
    type ThreatLevel,
    type ScanResult,
    type ThreatDetail,
    type InjectionType,
} from './PromptInjectionGuard.js';
