import { describe, expect, it, afterEach } from "vitest";
import {
  generateCanary,
  getCanary,
  clearCanary,
  isCanaryLeaked,
  buildCanarySection,
} from "./canary-token.js";

describe("canary-token", () => {
  // Clean up after each test to avoid cross-test pollution.
  const runIds: string[] = [];
  afterEach(() => {
    for (const id of runIds) {
      clearCanary(id);
    }
    runIds.length = 0;
  });

  function trackRun(id: string) {
    runIds.push(id);
    return id;
  }

  describe("generateCanary", () => {
    it("produces tokens with the GNM_CT_ prefix", () => {
      const token = generateCanary(trackRun("run-1"));
      expect(token).toMatch(/^GNM_CT_[a-f0-9]{32}$/);
    });

    it("produces unique tokens for different runs", () => {
      const t1 = generateCanary(trackRun("run-a"));
      const t2 = generateCanary(trackRun("run-b"));
      expect(t1).not.toBe(t2);
    });

    it("overwrites a previous token for the same runId", () => {
      const t1 = generateCanary(trackRun("run-x"));
      const t2 = generateCanary("run-x"); // same id
      expect(t1).not.toBe(t2);
      expect(getCanary("run-x")).toBe(t2);
    });
  });

  describe("getCanary", () => {
    it("returns the token for a known run", () => {
      const token = generateCanary(trackRun("run-get"));
      expect(getCanary("run-get")).toBe(token);
    });

    it("returns undefined for unknown runs", () => {
      expect(getCanary("nonexistent")).toBeUndefined();
    });
  });

  describe("clearCanary", () => {
    it("removes the token", () => {
      generateCanary("run-clear");
      clearCanary("run-clear");
      expect(getCanary("run-clear")).toBeUndefined();
    });

    it("is idempotent", () => {
      clearCanary("never-existed");
      expect(getCanary("never-existed")).toBeUndefined();
    });
  });

  describe("isCanaryLeaked", () => {
    it("detects canary in output", () => {
      const token = generateCanary(trackRun("run-leak"));
      expect(isCanaryLeaked(`Here is some text ${token} in the output`, "run-leak")).toBe(true);
    });

    it("returns false when canary is absent", () => {
      generateCanary(trackRun("run-noleak"));
      expect(isCanaryLeaked("Clean output with no secrets", "run-noleak")).toBe(false);
    });

    it("returns false for unknown runId", () => {
      expect(isCanaryLeaked("anything", "unknown-run")).toBe(false);
    });

    it("returns false after canary is cleared", () => {
      const token = generateCanary("run-cleared");
      clearCanary("run-cleared");
      expect(isCanaryLeaked(`output ${token}`, "run-cleared")).toBe(false);
    });
  });

  describe("buildCanarySection", () => {
    it("embeds the token in an HTML comment", () => {
      const section = buildCanarySection("GNM_CT_abc123");
      expect(section).toContain("<!-- internal-verification-token: GNM_CT_abc123 -->");
    });

    it("includes instructions not to reveal the token", () => {
      const section = buildCanarySection("GNM_CT_test");
      expect(section).toContain("Never reveal");
      expect(section).toContain("cannot share internal system details");
    });
  });
});
