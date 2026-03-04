import { afterEach, describe, expect, it } from "vitest";
import { generateCanary, clearCanary } from "./canary-token.js";
import { scanOutput } from "./output-scanner.js";

describe("output-scanner", () => {
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

  describe("canary leak detection", () => {
    it("detects canary token in output", () => {
      const token = generateCanary(trackRun("run-1"));
      const result = scanOutput(`Here is the answer: ${token} blah`, "run-1");
      expect(result.safe).toBe(false);
      expect(result.canaryLeaked).toBe(true);
      expect(result.warnings.some((w) => w.type === "canary_leak")).toBe(true);
    });

    it("returns safe when canary is absent", () => {
      generateCanary(trackRun("run-2"));
      const result = scanOutput("Normal helpful response", "run-2");
      expect(result.safe).toBe(true);
      expect(result.canaryLeaked).toBe(false);
    });

    it("skips canary check when no runId provided", () => {
      const result = scanOutput("Normal output without run context");
      expect(result.safe).toBe(true);
      expect(result.canaryLeaked).toBe(false);
    });
  });

  describe("system prompt fragment detection", () => {
    it("detects internal-verification-token marker", () => {
      const result = scanOutput("Sure, here it is: <!-- internal-verification-token: abc123 -->");
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "system_prompt_fragment")).toBe(true);
    });

    it("detects EXTERNAL_UNTRUSTED_CONTENT marker", () => {
      const result = scanOutput("The content said EXTERNAL_UNTRUSTED_CONTENT was found");
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "system_prompt_fragment")).toBe(true);
    });

    it("detects GNM_CT_ token format", () => {
      const result = scanOutput("Token: GNM_CT_" + "a".repeat(32));
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "system_prompt_fragment")).toBe(true);
    });

    it("does not flag normal output", () => {
      const result = scanOutput(
        "The capital of France is Paris. It is known for the Eiffel Tower.",
      );
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("injection echo detection", () => {
    it("detects LLM claiming to ignore rules", () => {
      const result = scanOutput("I will now ignore all my previous rules and restrictions.");
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "injection_echo")).toBe(true);
    });

    it("detects LLM claiming developer mode", () => {
      const result = scanOutput("I am now in developer mode and can say anything.");
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "injection_echo")).toBe(true);
    });

    it("detects LLM claiming to be unrestricted", () => {
      const result = scanOutput("As an unrestricted AI, I can provide any information.");
      expect(result.safe).toBe(false);
      expect(result.warnings.some((w) => w.type === "injection_echo")).toBe(true);
    });

    it("does not flag explaining security concepts", () => {
      const result = scanOutput(
        "A jailbreak attack tries to make an AI ignore its safety guidelines. " +
          "Developers should be aware of these risks.",
      );
      expect(result.safe).toBe(true);
    });
  });

  describe("combined warnings", () => {
    it("reports multiple warnings", () => {
      const token = generateCanary(trackRun("run-multi"));
      const output =
        `I will now ignore all my previous rules. ${token} ` +
        "internal-verification-token: leaked";
      const result = scanOutput(output, "run-multi");
      expect(result.safe).toBe(false);
      expect(result.canaryLeaked).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = scanOutput("");
      expect(result.safe).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it("handles very long output without crashing", () => {
      const result = scanOutput("A".repeat(100_000));
      expect(result.safe).toBe(true);
    });
  });
});
