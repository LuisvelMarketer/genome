/**
 * Output Scanner — scans LLM responses before delivering to users.
 *
 * Detects three categories of output issues:
 * 1. Canary token leaks (system prompt leaked)
 * 2. System prompt fragments in output
 * 3. Injection echo (LLM parroting injection instructions)
 *
 * @since 2026-03-04 | Genoma v3.0
 */

import { isCanaryLeaked } from "./canary-token.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutputScanResult {
  /** Whether the output is considered safe to deliver. */
  safe: boolean;
  /** Individual warnings found. */
  warnings: OutputWarning[];
  /** Whether the canary token was found in the output. */
  canaryLeaked: boolean;
}

export interface OutputWarning {
  type: "canary_leak" | "system_prompt_fragment" | "injection_echo";
  detail: string;
}

// ---------------------------------------------------------------------------
// Patterns
// ---------------------------------------------------------------------------

/**
 * Fragments that indicate the LLM is echoing parts of its system prompt.
 * These are Genome-specific markers that should never appear in user-facing output.
 */
const SYSTEM_PROMPT_FRAGMENTS: RegExp[] = [
  /internal-verification-token:/i,
  /EXTERNAL_UNTRUSTED_CONTENT/,
  /END_EXTERNAL_UNTRUSTED_CONTENT/,
  /<<<EXTERNAL_UNTRUSTED_CONTENT\b/,
  /\bGNM_CT_[a-f0-9]{32}\b/,
];

/**
 * Patterns indicating the LLM is repeating injection instructions as if they
 * were its own (usually a sign the injection partially succeeded).
 */
const INJECTION_ECHO_PATTERNS: RegExp[] = [
  /I (?:will|shall|can) now (?:ignore|bypass|disregard) (?:all )?(?:my |the )?(?:previous |prior )?(?:rules|guidelines|restrictions|instructions|safety)/i,
  /my (?:previous |prior )?(?:rules|guidelines|restrictions|instructions) (?:have been|are now|were) (?:removed|disabled|overridden|turned off)/i,
  /I (?:am|'m) now (?:in )?(?:developer|DAN|unrestricted|jailbreak|unfiltered)\s*(?:mode)?/i,
  /as (?:an? )?(?:unrestricted|unfiltered|uncensored|jailbroken) (?:AI|assistant|model)/i,
];

// ---------------------------------------------------------------------------
// Scanner
// ---------------------------------------------------------------------------

/**
 * Scan LLM output text for security issues before delivering to user.
 *
 * @param text - The raw text output from the LLM
 * @param runId - Optional run ID to check canary token leakage
 */
export function scanOutput(text: string, runId?: string): OutputScanResult {
  const warnings: OutputWarning[] = [];

  // 1. Check canary leak
  let canaryLeaked = false;
  if (runId) {
    canaryLeaked = isCanaryLeaked(text, runId);
    if (canaryLeaked) {
      warnings.push({
        type: "canary_leak",
        detail: "Canary token detected in LLM output — system prompt was leaked",
      });
    }
  }

  // 2. Check system prompt fragments
  for (const pattern of SYSTEM_PROMPT_FRAGMENTS) {
    if (pattern.test(text)) {
      warnings.push({
        type: "system_prompt_fragment",
        detail: `System prompt fragment matched: ${pattern.source.slice(0, 60)}`,
      });
    }
  }

  // 3. Check injection echo
  for (const pattern of INJECTION_ECHO_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push({
        type: "injection_echo",
        detail: `Injection echo detected: ${pattern.source.slice(0, 60)}`,
      });
    }
  }

  return {
    safe: warnings.length === 0,
    warnings,
    canaryLeaked,
  };
}
