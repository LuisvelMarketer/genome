/**
 * Singleton PromptInjectionGuard instance shared across gateway and channels.
 *
 * All inbound message scanning shares this instance so that statistics
 * and attempt logs are unified.
 *
 * @since 2026-03-04 | Genoma v3.0
 */

import { PromptInjectionGuard, type GuardConfig } from "./PromptInjectionGuard.js";

let _instance: PromptInjectionGuard | undefined;

/**
 * Return the shared PromptInjectionGuard instance, creating it on first call.
 */
export function getInjectionGuard(config?: Partial<GuardConfig>): PromptInjectionGuard {
  if (!_instance) {
    _instance = new PromptInjectionGuard(config);
  }
  return _instance;
}

/**
 * Reset the shared instance (useful for tests or config changes at runtime).
 */
export function resetInjectionGuard(): void {
  _instance = undefined;
}
