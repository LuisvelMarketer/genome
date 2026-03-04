/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { estimateTokenCount, tokenEfficiency, compressionRatio } from "./tokens.js";

describe("estimateTokenCount", () => {
  it("returns 0 for empty string", () => {
    expect(estimateTokenCount("")).toBe(0);
  });

  it("returns 0 for null/undefined input", () => {
    expect(estimateTokenCount(null as any)).toBe(0);
    expect(estimateTokenCount(undefined as any)).toBe(0);
  });

  it("returns 1 for 4 or fewer characters", () => {
    expect(estimateTokenCount("abcd")).toBe(1);
    expect(estimateTokenCount("ab")).toBe(1);
  });

  it("estimates tokens at ~4 chars per token", () => {
    expect(estimateTokenCount("hello world")).toBe(3); // 11 chars / 4 = 2.75 → ceil = 3
  });

  it("handles longer text", () => {
    const text = "Use tools efficiently and appropriately for each task.";
    // 54 chars / 4 = 13.5 → ceil = 14
    expect(estimateTokenCount(text)).toBe(14);
  });
});

describe("tokenEfficiency", () => {
  it("returns fitness per token", () => {
    expect(tokenEfficiency(0.8, 25)).toBeCloseTo(0.032, 4);
  });

  it("returns 0 when tokenCount is 0", () => {
    expect(tokenEfficiency(0.5, 0)).toBe(0);
  });

  it("returns 0 when tokenCount is negative", () => {
    expect(tokenEfficiency(0.5, -1)).toBe(0);
  });

  it("higher fitness with same tokens yields higher efficiency", () => {
    expect(tokenEfficiency(0.9, 10)).toBeGreaterThan(tokenEfficiency(0.5, 10));
  });
});

describe("compressionRatio", () => {
  it("returns ratio of compressed to original", () => {
    expect(compressionRatio(100, 50)).toBe(0.5);
  });

  it("returns 1 when original is 0", () => {
    expect(compressionRatio(0, 50)).toBe(1);
  });

  it("returns value > 1 when compressed is larger than original", () => {
    expect(compressionRatio(50, 100)).toBe(2);
  });

  it("returns 0 when compressed is 0", () => {
    expect(compressionRatio(100, 0)).toBe(0);
  });
});
