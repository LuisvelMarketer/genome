import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks — must be declared before the plugin import
// ---------------------------------------------------------------------------

const mockBridge = {
  isEnabled: vi.fn().mockReturnValue(false),
  setEnabled: vi.fn(),
  beforeExecution: vi.fn().mockResolvedValue("original prompt"),
  afterExecution: vi.fn().mockResolvedValue(undefined),
  onError: vi.fn().mockResolvedValue(undefined),
  getStatus: vi.fn().mockResolvedValue({ enabled: false }),
  getConfig: vi.fn().mockReturnValue({}),
};

vi.mock("../../src/pga/integration/GenomaAgentPGABridge.js", () => ({
  getGlobalPGABridge: () => mockBridge,
  resetGlobalPGABridge: vi.fn(),
}));

vi.mock("genoma/plugin-sdk", () => ({
  emptyPluginConfigSchema: () => ({}),
}));

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

type HookHandler = (...args: unknown[]) => unknown;

function createMockApi() {
  const hooks = new Map<string, { handler: HookHandler; opts?: { priority?: number } }>();

  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
    on: vi.fn((hookName: string, handler: HookHandler, opts?: { priority?: number }) => {
      hooks.set(hookName, { handler, opts });
    }),
    _hooks: hooks,
    _getHook(name: string) {
      return hooks.get(name);
    },
  };
}

function createHookContext(overrides?: Record<string, unknown>) {
  return {
    agentId: "test-agent",
    sessionId: "session-1",
    sessionKey: "key-1",
    workspaceDir: "/tmp/test",
    messageProvider: "anthropic",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PGA Extension Plugin", () => {
  let pluginModule: typeof import("./index.js");

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import to get fresh module with mocks applied
    pluginModule = await import("./index.js");
  });

  describe("plugin metadata", () => {
    it("has correct id and name", () => {
      expect(pluginModule.default.id).toBe("pga");
      expect(pluginModule.default.name).toBe("PGA");
    });

    it("has a register function", () => {
      expect(typeof pluginModule.default.register).toBe("function");
    });
  });

  describe("when PGA is disabled", () => {
    it("does not register any hooks", () => {
      mockBridge.isEnabled.mockReturnValue(false);
      const api = createMockApi();

      pluginModule.default.register!(api as any);

      expect(api.on).not.toHaveBeenCalled();
      expect(api.logger.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
    });
  });

  describe("when PGA is enabled", () => {
    beforeEach(() => {
      mockBridge.isEnabled.mockReturnValue(true);
    });

    it("registers 3 hooks", () => {
      const api = createMockApi();
      pluginModule.default.register!(api as any);

      expect(api.on).toHaveBeenCalledTimes(3);
      expect(api._hooks.has("before_prompt_build")).toBe(true);
      expect(api._hooks.has("llm_output")).toBe(true);
      expect(api._hooks.has("agent_end")).toBe(true);
    });

    it("before_prompt_build has priority -10", () => {
      const api = createMockApi();
      pluginModule.default.register!(api as any);

      const hook = api._getHook("before_prompt_build");
      expect(hook?.opts?.priority).toBe(-10);
    });

    describe("before_prompt_build hook", () => {
      it("returns prependContext with evolved prompt", async () => {
        mockBridge.beforeExecution.mockResolvedValue("evolved genes content");

        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const handler = api._getHook("before_prompt_build")!.handler;
        const result = await handler({ prompt: "user prompt", messages: [] }, createHookContext());

        expect(result).toEqual({ prependContext: "evolved genes content" });
        expect(mockBridge.beforeExecution).toHaveBeenCalledWith(
          expect.objectContaining({ prompt: "user prompt" }),
        );
      });

      it("returns undefined when bridge returns unchanged prompt", async () => {
        mockBridge.beforeExecution.mockResolvedValue("same prompt");

        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const handler = api._getHook("before_prompt_build")!.handler;
        const result = await handler({ prompt: "same prompt", messages: [] }, createHookContext());

        expect(result).toBeUndefined();
      });

      it("handles errors gracefully", async () => {
        mockBridge.beforeExecution.mockRejectedValue(new Error("bridge error"));

        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const handler = api._getHook("before_prompt_build")!.handler;
        const result = await handler({ prompt: "test", messages: [] }, createHookContext());

        expect(result).toBeUndefined();
        expect(api.logger.warn).toHaveBeenCalledWith(expect.stringContaining("bridge error"));
      });
    });

    describe("llm_output hook", () => {
      it("accumulates response metrics", () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const handler = api._getHook("llm_output")!.handler;

        handler(
          {
            runId: "run-1",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Hello world"],
            usage: { input: 100, output: 50 },
          },
          createHookContext(),
        );

        // Call again to accumulate
        handler(
          {
            runId: "run-2",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Second response"],
            usage: { input: 80, output: 40 },
          },
          createHookContext(),
        );

        // State is internal; we verify via agent_end
      });
    });

    describe("agent_end hook", () => {
      it("calls bridge.afterExecution with accumulated data", async () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const llmHandler = api._getHook("llm_output")!.handler;
        const endHandler = api._getHook("agent_end")!.handler;
        const ctx = createHookContext();

        // Accumulate metrics
        llmHandler(
          {
            runId: "r1",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Response one"],
            usage: { input: 100, output: 50 },
          },
          ctx,
        );

        llmHandler(
          {
            runId: "r2",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Response two"],
            usage: { input: 80, output: 30 },
          },
          ctx,
        );

        // End session
        await endHandler({ messages: [], success: true }, ctx);

        expect(mockBridge.afterExecution).toHaveBeenCalledWith(
          expect.objectContaining({
            agentId: "test-agent",
            sessionId: "session-1",
          }),
          expect.objectContaining({
            assistantTexts: ["Response one", "Response two"],
            usage: expect.objectContaining({
              input: 180,
              output: 80,
              total: 260,
            }),
          }),
        );
      });

      it("cleans up session state after recording", async () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const llmHandler = api._getHook("llm_output")!.handler;
        const endHandler = api._getHook("agent_end")!.handler;
        const ctx = createHookContext();

        llmHandler(
          {
            runId: "r1",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Hello"],
            usage: { input: 10, output: 10 },
          },
          ctx,
        );

        await endHandler({ messages: [], success: true }, ctx);

        // Second call should NOT call afterExecution (session cleaned up)
        mockBridge.afterExecution.mockClear();
        await endHandler({ messages: [], success: true }, ctx);
        expect(mockBridge.afterExecution).not.toHaveBeenCalled();
      });

      it("does nothing when no session state exists", async () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const endHandler = api._getHook("agent_end")!.handler;

        await endHandler(
          { messages: [], success: true },
          createHookContext({ sessionId: "nonexistent" }),
        );

        expect(mockBridge.afterExecution).not.toHaveBeenCalled();
      });

      it("handles bridge errors gracefully and still cleans up", async () => {
        mockBridge.afterExecution.mockRejectedValue(new Error("bridge fail"));

        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const llmHandler = api._getHook("llm_output")!.handler;
        const endHandler = api._getHook("agent_end")!.handler;
        const ctx = createHookContext();

        llmHandler(
          {
            runId: "r1",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: ["Hello"],
            usage: { input: 10, output: 10 },
          },
          ctx,
        );

        // Should not throw
        await endHandler({ messages: [], success: true }, ctx);

        expect(api.logger.warn).toHaveBeenCalledWith(expect.stringContaining("bridge fail"));

        // Session state should still be cleaned up
        mockBridge.afterExecution.mockClear();
        await endHandler({ messages: [], success: true }, ctx);
        expect(mockBridge.afterExecution).not.toHaveBeenCalled();
      });

      it("passes error from event to result", async () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const llmHandler = api._getHook("llm_output")!.handler;
        const endHandler = api._getHook("agent_end")!.handler;
        const ctx = createHookContext();

        llmHandler(
          {
            runId: "r1",
            sessionId: "session-1",
            provider: "anthropic",
            model: "claude-3",
            assistantTexts: [],
            usage: { input: 10, output: 0 },
          },
          ctx,
        );

        await endHandler({ messages: [], success: false, error: "Agent crashed" }, ctx);

        expect(mockBridge.afterExecution).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ error: "Agent crashed" }),
        );
      });
    });

    describe("multiple independent sessions", () => {
      it("tracks separate session states", async () => {
        const api = createMockApi();
        pluginModule.default.register!(api as any);

        const llmHandler = api._getHook("llm_output")!.handler;
        const endHandler = api._getHook("agent_end")!.handler;

        // Session A
        llmHandler(
          {
            runId: "r1",
            sessionId: "s-A",
            provider: "a",
            model: "m",
            assistantTexts: ["From A"],
            usage: { input: 10, output: 5 },
          },
          createHookContext({ sessionId: "s-A" }),
        );

        // Session B
        llmHandler(
          {
            runId: "r2",
            sessionId: "s-B",
            provider: "b",
            model: "m",
            assistantTexts: ["From B"],
            usage: { input: 20, output: 15 },
          },
          createHookContext({ sessionId: "s-B" }),
        );

        // End session A
        await endHandler({ messages: [], success: true }, createHookContext({ sessionId: "s-A" }));

        expect(mockBridge.afterExecution).toHaveBeenCalledTimes(1);
        expect(mockBridge.afterExecution).toHaveBeenCalledWith(
          expect.objectContaining({ sessionId: "s-A" }),
          expect.objectContaining({
            assistantTexts: ["From A"],
            usage: expect.objectContaining({ input: 10, output: 5 }),
          }),
        );

        // End session B
        await endHandler({ messages: [], success: true }, createHookContext({ sessionId: "s-B" }));

        expect(mockBridge.afterExecution).toHaveBeenCalledTimes(2);
        expect(mockBridge.afterExecution).toHaveBeenLastCalledWith(
          expect.objectContaining({ sessionId: "s-B" }),
          expect.objectContaining({
            assistantTexts: ["From B"],
            usage: expect.objectContaining({ input: 20, output: 15 }),
          }),
        );
      });
    });
  });
});
