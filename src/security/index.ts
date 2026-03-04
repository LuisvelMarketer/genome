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
} from "./ImmuneSystem.js";

// Mutation Evaluator — Sandbox testing before deployment
export {
  MutationEvaluator,
  type EvaluatorConfig,
  type TestCase,
  type EvaluationResult,
  type TestResult,
  type LLMEvaluationResult,
} from "./MutationEvaluator.js";

// Prompt Injection Guard — Input sanitization and threat detection
export {
  PromptInjectionGuard,
  type GuardConfig,
  type ThreatLevel,
  type ScanResult,
  type ThreatDetail,
  type InjectionType,
} from "./PromptInjectionGuard.js";

// Guard Singleton — Shared instance for unified stats
export { getInjectionGuard, resetInjectionGuard } from "./injection-guard-singleton.js";

// Inbound Message Scanner — Unified scan for gateway + channels
export {
  scanInboundMessage,
  resetInboundScanner,
  type InboundScanResult,
} from "./scan-inbound-message.js";

// Canary Tokens — System prompt leakage detection
export {
  generateCanary,
  getCanary,
  clearCanary,
  isCanaryLeaked,
  buildCanarySection,
} from "./canary-token.js";

// Output Scanner — LLM response security scanning
export { scanOutput, type OutputScanResult, type OutputWarning } from "./output-scanner.js";

// Injection Rate Limiter — Per-sender throttling
export {
  createInjectionRateLimiter,
  type InjectionRateLimiter,
  type InjectionRateLimitConfig,
  type InjectionRateLimitCheckResult,
} from "./injection-rate-limiter.js";
