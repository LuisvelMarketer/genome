/**
 * Inbound message scanner — unified entry point for injection detection.
 *
 * Combines the PromptInjectionGuard (pattern matching) with the injection
 * rate limiter (per-sender throttling) into a single function that the
 * gateway and channel dispatchers call before processing user messages.
 *
 * @since 2026-03-04 | Genoma v3.0
 */

import { getInjectionGuard } from "./injection-guard-singleton.js";
import { createInjectionRateLimiter, type InjectionRateLimiter } from "./injection-rate-limiter.js";
import type { ScanResult } from "./PromptInjectionGuard.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InboundScanResult =
  | { allowed: true; scanResult: ScanResult }
  | { allowed: false; scanResult: ScanResult; reason: string };

// ---------------------------------------------------------------------------
// Module-level rate limiter (shared across all callers)
// ---------------------------------------------------------------------------

let _limiter: InjectionRateLimiter | undefined;

function getLimiter(): InjectionRateLimiter {
  if (!_limiter) {
    _limiter = createInjectionRateLimiter();
  }
  return _limiter;
}

/** Reset the module-level limiter (for tests). */
export function resetInboundScanner(): void {
  if (_limiter) {
    _limiter.dispose();
    _limiter = undefined;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scan an inbound user message for injection attempts.
 *
 * @param input     - The raw user message text
 * @param senderKey - A stable identifier for the sender (user ID, IP, etc.).
 *                    Used for rate limiting. If omitted, rate limiting is skipped.
 * @returns An object with `allowed: true/false` and the underlying `ScanResult`.
 */
export function scanInboundMessage(input: string, senderKey?: string): InboundScanResult {
  const limiter = getLimiter();

  // 1. Rate limit check — if the sender is already locked out, reject early.
  if (senderKey) {
    const rateCheck = limiter.check(senderKey);
    if (!rateCheck.allowed) {
      const guard = getInjectionGuard();
      const scanResult = guard.scan(input);
      return {
        allowed: false,
        scanResult,
        reason: `Too many injection attempts. Try again in ${Math.ceil(rateCheck.retryAfterMs / 1000)}s.`,
      };
    }
  }

  // 2. Pattern-based scan
  const guard = getInjectionGuard();
  const scanResult = guard.scan(input);

  if (!scanResult.safe) {
    // Record the injection attempt for rate limiting
    if (senderKey) {
      limiter.recordAttempt(senderKey);
    }

    return {
      allowed: false,
      scanResult,
      reason: `Message blocked: potential prompt injection detected (${scanResult.threatLevel} severity).`,
    };
  }

  return { allowed: true, scanResult };
}
