/**
 * PGA (Prompt Genomico Autoevolutivo) Extension Plugin
 *
 * Integrates the PGA evolutionary system with Genoma's agent lifecycle
 * via three hooks:
 *   - before_prompt_build: injects evolved genes into the prompt
 *   - llm_output: accumulates response metrics per session
 *   - agent_end: records execution for fitness tracking, then cleans up
 *
 * Activation: set GENOMA_PGA_ENABLED=true (disabled by default, zero overhead).
 */

import type { GenomaPluginApi } from "genoma/plugin-sdk";
import { emptyPluginConfigSchema } from "genoma/plugin-sdk";
import {
  getGlobalPGABridge,
  type GenomaAgentContext,
  type GenomaRunResult,
} from "../../src/pga/integration/GenomaAgentPGABridge.js";

// ---------------------------------------------------------------------------
// Session state accumulated between llm_output and agent_end
// ---------------------------------------------------------------------------

interface SessionState {
  assistantTexts: string[];
  toolsUsed: string[];
  totalInputTokens: number;
  totalOutputTokens: number;
  provider: string;
  model: string;
  startTime: number;
}

const sessions = new Map<string, SessionState>();

// ---------------------------------------------------------------------------
// Plugin definition
// ---------------------------------------------------------------------------

const plugin = {
  id: "pga",
  name: "PGA",
  description: "Prompt Genomico Autoevolutivo – self-evolving prompt system for agents",
  configSchema: emptyPluginConfigSchema(),

  register(api: GenomaPluginApi) {
    const bridge = getGlobalPGABridge();

    if (!bridge.isEnabled()) {
      api.logger.info("[PGA Plugin] PGA is disabled – skipping hook registration");
      return;
    }

    api.logger.info("[PGA Plugin] Registering PGA hooks");

    // -----------------------------------------------------------------------
    // 1. before_prompt_build – inject evolved genes
    //    Priority -10 so other plugins prepend their context first.
    // -----------------------------------------------------------------------
    api.on(
      "before_prompt_build",
      async (event, ctx) => {
        try {
          const agentCtx = buildAgentContext(ctx);
          const evolvedPrompt = await bridge.beforeExecution({
            prompt: event.prompt,
            context: agentCtx,
          });

          // If the bridge returned the same prompt, nothing was injected
          if (evolvedPrompt === event.prompt) {
            return;
          }

          // Initialise session state for metrics accumulation
          const sessionKey = ctx.sessionId ?? ctx.sessionKey ?? "unknown";
          if (!sessions.has(sessionKey)) {
            sessions.set(sessionKey, {
              assistantTexts: [],
              toolsUsed: [],
              totalInputTokens: 0,
              totalOutputTokens: 0,
              provider: ctx.messageProvider ?? "",
              model: "",
              startTime: Date.now(),
            });
          }

          return { prependContext: evolvedPrompt };
        } catch (err) {
          api.logger.warn(`[PGA Plugin] before_prompt_build error: ${String(err)}`);
        }
      },
      { priority: -10 },
    );

    // -----------------------------------------------------------------------
    // 2. llm_output – accumulate response metrics
    // -----------------------------------------------------------------------
    api.on("llm_output", (event, ctx) => {
      const sessionKey = ctx.sessionId ?? ctx.sessionKey ?? "unknown";
      let state = sessions.get(sessionKey);

      if (!state) {
        state = {
          assistantTexts: [],
          toolsUsed: [],
          totalInputTokens: 0,
          totalOutputTokens: 0,
          provider: event.provider,
          model: event.model,
          startTime: Date.now(),
        };
        sessions.set(sessionKey, state);
      }

      state.provider = event.provider;
      state.model = event.model;

      if (event.assistantTexts) {
        state.assistantTexts.push(...event.assistantTexts);
      }

      if (event.usage) {
        state.totalInputTokens += event.usage.input ?? 0;
        state.totalOutputTokens += event.usage.output ?? 0;
      }
    });

    // -----------------------------------------------------------------------
    // 3. agent_end – record execution for fitness, then clean up
    // -----------------------------------------------------------------------
    api.on("agent_end", async (event, ctx) => {
      const sessionKey = ctx.sessionId ?? ctx.sessionKey ?? "unknown";
      const state = sessions.get(sessionKey);

      if (!state) {
        return;
      }

      try {
        const agentCtx = buildAgentContext(ctx);
        const latencyMs = Date.now() - state.startTime;

        const result: GenomaRunResult = {
          response: state.assistantTexts.join("\n"),
          assistantTexts: state.assistantTexts,
          toolsUsed: state.toolsUsed,
          usage: {
            input: state.totalInputTokens,
            output: state.totalOutputTokens,
            total: state.totalInputTokens + state.totalOutputTokens,
          },
          latencyMs,
          error: event.error,
        };

        await bridge.afterExecution({ ...agentCtx, prompt: "" }, result);
      } catch (err) {
        api.logger.warn(`[PGA Plugin] agent_end error: ${String(err)}`);
      } finally {
        // Prevent memory leaks
        sessions.delete(sessionKey);
      }
    });
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildAgentContext(ctx: {
  agentId?: string;
  sessionKey?: string;
  sessionId?: string;
  workspaceDir?: string;
  messageProvider?: string;
}): GenomaAgentContext {
  return {
    agentId: ctx.agentId ?? "default",
    sessionId: ctx.sessionId ?? ctx.sessionKey ?? "unknown",
    sessionKey: ctx.sessionKey,
    workspaceDir: ctx.workspaceDir,
    provider: ctx.messageProvider,
  };
}

export default plugin;
