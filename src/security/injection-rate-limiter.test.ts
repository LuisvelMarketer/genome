import { afterEach, describe, expect, it, vi } from "vitest";
import { createInjectionRateLimiter } from "./injection-rate-limiter.js";

describe("injection-rate-limiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("allows requests by default", () => {
    const limiter = createInjectionRateLimiter({ pruneIntervalMs: 0 });
    try {
      const result = limiter.check("user-1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5); // default maxAttempts
    } finally {
      limiter.dispose();
    }
  });

  it("decrements remaining after each attempt", () => {
    const limiter = createInjectionRateLimiter({ maxAttempts: 3, pruneIntervalMs: 0 });
    try {
      limiter.recordAttempt("user-1");
      const result = limiter.check("user-1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    } finally {
      limiter.dispose();
    }
  });

  it("locks out after reaching max attempts", () => {
    const limiter = createInjectionRateLimiter({
      maxAttempts: 3,
      lockoutMs: 10_000,
      pruneIntervalMs: 0,
    });
    try {
      limiter.recordAttempt("user-1");
      limiter.recordAttempt("user-1");
      limiter.recordAttempt("user-1");

      const result = limiter.check("user-1");
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    } finally {
      limiter.dispose();
    }
  });

  it("isolates different keys", () => {
    const limiter = createInjectionRateLimiter({ maxAttempts: 2, pruneIntervalMs: 0 });
    try {
      limiter.recordAttempt("user-a");
      limiter.recordAttempt("user-a");

      expect(limiter.check("user-a").allowed).toBe(false);
      expect(limiter.check("user-b").allowed).toBe(true);
    } finally {
      limiter.dispose();
    }
  });

  it("unlocks after lockout expires", () => {
    vi.useFakeTimers();
    const limiter = createInjectionRateLimiter({
      maxAttempts: 2,
      lockoutMs: 5000,
      pruneIntervalMs: 0,
    });
    try {
      limiter.recordAttempt("user-1");
      limiter.recordAttempt("user-1");
      expect(limiter.check("user-1").allowed).toBe(false);

      // Advance past lockout
      vi.advanceTimersByTime(5001);
      const result = limiter.check("user-1");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    } finally {
      limiter.dispose();
      vi.useRealTimers();
    }
  });

  it("sliding window drops old attempts", () => {
    vi.useFakeTimers();
    const limiter = createInjectionRateLimiter({
      maxAttempts: 3,
      windowMs: 10_000,
      pruneIntervalMs: 0,
    });
    try {
      limiter.recordAttempt("user-1"); // t=0
      vi.advanceTimersByTime(4000);
      limiter.recordAttempt("user-1"); // t=4s

      vi.advanceTimersByTime(7000); // t=11s — first attempt is outside window
      const result = limiter.check("user-1");
      expect(result.remaining).toBe(2); // only the t=4s attempt remains
    } finally {
      limiter.dispose();
      vi.useRealTimers();
    }
  });

  it("reset clears a key", () => {
    const limiter = createInjectionRateLimiter({ maxAttempts: 2, pruneIntervalMs: 0 });
    try {
      limiter.recordAttempt("user-1");
      limiter.recordAttempt("user-1");
      expect(limiter.check("user-1").allowed).toBe(false);

      limiter.reset("user-1");
      expect(limiter.check("user-1").allowed).toBe(true);
    } finally {
      limiter.dispose();
    }
  });

  it("prune removes expired entries", () => {
    vi.useFakeTimers();
    const limiter = createInjectionRateLimiter({
      maxAttempts: 3,
      windowMs: 5000,
      pruneIntervalMs: 0,
    });
    try {
      limiter.recordAttempt("user-1");
      expect(limiter.size()).toBe(1);

      vi.advanceTimersByTime(6000);
      limiter.prune();
      expect(limiter.size()).toBe(0);
    } finally {
      limiter.dispose();
      vi.useRealTimers();
    }
  });

  it("dispose clears all state", () => {
    const limiter = createInjectionRateLimiter({ pruneIntervalMs: 0 });
    limiter.recordAttempt("user-1");
    limiter.dispose();
    expect(limiter.size()).toBe(0);
  });
});
