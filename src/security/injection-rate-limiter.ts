/**
 * In-memory sliding-window rate limiter for prompt injection attempts.
 *
 * Tracks detected injection attempts by sender key. After exceeding the
 * threshold within the window, the sender is locked out for a configurable
 * duration. Follows the same architectural pattern as `auth-rate-limit.ts`.
 *
 * @since 2026-03-04 | Genoma v3.0
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InjectionRateLimitConfig {
  /** Maximum injection attempts before lockout.  @default 5 */
  maxAttempts: number;
  /** Sliding window duration in milliseconds.     @default 60_000 (1 min) */
  windowMs: number;
  /** Lockout duration in milliseconds.            @default 600_000 (10 min) */
  lockoutMs: number;
  /** Background prune interval in milliseconds; <= 0 disables.  @default 60_000 */
  pruneIntervalMs: number;
}

export interface InjectionRateLimitEntry {
  /** Timestamps (epoch ms) of recent injection attempts inside the window. */
  attempts: number[];
  /** If set, requests from this key are blocked until this epoch-ms instant. */
  lockedUntil?: number;
}

export interface InjectionRateLimitCheckResult {
  /** Whether the sender is allowed to continue. */
  allowed: boolean;
  /** Remaining attempts before lockout. */
  remaining: number;
  /** Milliseconds until the lockout expires (0 when not locked). */
  retryAfterMs: number;
}

export interface InjectionRateLimiter {
  /** Check whether `key` is currently allowed. */
  check(key: string): InjectionRateLimitCheckResult;
  /** Record an injection attempt for `key`. */
  recordAttempt(key: string): void;
  /** Reset the rate-limit state for `key`. */
  reset(key: string): void;
  /** Return the current number of tracked keys. */
  size(): number;
  /** Remove expired entries. */
  prune(): void;
  /** Dispose the limiter and cancel periodic cleanup timers. */
  dispose(): void;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: InjectionRateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60_000, // 1 minute
  lockoutMs: 600_000, // 10 minutes
  pruneIntervalMs: 60_000,
};

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export function createInjectionRateLimiter(
  config?: Partial<InjectionRateLimitConfig>,
): InjectionRateLimiter {
  const maxAttempts = config?.maxAttempts ?? DEFAULT_CONFIG.maxAttempts;
  const windowMs = config?.windowMs ?? DEFAULT_CONFIG.windowMs;
  const lockoutMs = config?.lockoutMs ?? DEFAULT_CONFIG.lockoutMs;
  const pruneIntervalMs = config?.pruneIntervalMs ?? DEFAULT_CONFIG.pruneIntervalMs;

  const entries = new Map<string, InjectionRateLimitEntry>();

  const pruneTimer = pruneIntervalMs > 0 ? setInterval(() => prune(), pruneIntervalMs) : null;
  if (pruneTimer && typeof pruneTimer === "object" && "unref" in pruneTimer) {
    pruneTimer.unref();
  }

  function slideWindow(entry: InjectionRateLimitEntry, now: number): void {
    const cutoff = now - windowMs;
    entry.attempts = entry.attempts.filter((ts) => ts > cutoff);
  }

  function check(key: string): InjectionRateLimitCheckResult {
    const now = Date.now();
    const entry = entries.get(key);

    if (!entry) {
      return { allowed: true, remaining: maxAttempts, retryAfterMs: 0 };
    }

    // Still locked out?
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: entry.lockedUntil - now,
      };
    }

    // Lockout expired — clear it.
    if (entry.lockedUntil && now >= entry.lockedUntil) {
      entry.lockedUntil = undefined;
      entry.attempts = [];
    }

    slideWindow(entry, now);
    const remaining = Math.max(0, maxAttempts - entry.attempts.length);
    return { allowed: remaining > 0, remaining, retryAfterMs: 0 };
  }

  function recordAttempt(key: string): void {
    const now = Date.now();
    let entry = entries.get(key);

    if (!entry) {
      entry = { attempts: [] };
      entries.set(key, entry);
    }

    // If currently locked, do nothing (already blocked).
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return;
    }

    slideWindow(entry, now);
    entry.attempts.push(now);

    if (entry.attempts.length >= maxAttempts) {
      entry.lockedUntil = now + lockoutMs;
    }
  }

  function reset(key: string): void {
    entries.delete(key);
  }

  function prune(): void {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.lockedUntil && now < entry.lockedUntil) {
        continue;
      }
      slideWindow(entry, now);
      if (entry.attempts.length === 0) {
        entries.delete(key);
      }
    }
  }

  function size(): number {
    return entries.size;
  }

  function dispose(): void {
    if (pruneTimer) {
      clearInterval(pruneTimer);
    }
    entries.clear();
  }

  return { check, recordAttempt, reset, size, prune, dispose };
}
