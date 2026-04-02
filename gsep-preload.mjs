/**
 * GSEP Preload — patches fetch BEFORE any module loads.
 *
 * Imported as first line in genoma.mjs:
 *   import './gsep-preload.mjs'
 *
 * Runs the FULL 32-step GSEP pipeline on every LLM call:
 *   BEFORE: C0 integrity, C3 firewall, Purpose Lock, prompt assembly
 *           with evolved genes, context memory, PII redaction
 *   AFTER:  C4 immune scan, fitness calculation, drift detection,
 *           evolution trigger, pattern memory, growth journal
 *
 * Agent gets real-time streaming. GSEP processes in background.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const _originalFetch = globalThis.fetch;
let _genome = null;
let _initializing = null;
let _processing = false; // Guard against nested interception

function detectAgentName() {
  if (process.env.GSEP_AGENT_NAME) {
    return process.env.GSEP_AGENT_NAME;
  }
  const stateDir = process.env.GENOMA_STATE_DIR || join(process.env.HOME || "", ".genoma");
  try {
    const identity = readFileSync(join(stateDir, "workspace", "IDENTITY.md"), "utf-8");
    const match = identity.match(/\*\*Name:\*\*\s*(.+)/);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  } catch {}
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));
    if (pkg.displayName) {
      return pkg.displayName;
    }
    if (pkg.name) {
      return pkg.name;
    }
  } catch {}
  return "auto-agent";
}

const LLM_PATTERNS = [
  "api.openai.com/v1/chat/completions",
  "api.openai.com/v1/responses",
  "api.anthropic.com/v1/messages",
  "generativelanguage.googleapis.com",
];

function isLLMCall(url) {
  return LLM_PATTERNS.some((p) => url.includes(p));
}

function extractHeaders(init) {
  const headers = {};
  if (!init?.headers) {
    return headers;
  }
  if (init.headers instanceof Headers) {
    init.headers.forEach((v, k) => {
      headers[k] = v;
    });
  } else if (typeof init.headers === "object") {
    Object.assign(headers, init.headers);
  }
  return headers;
}

async function initGSEP(url, headers, model) {
  if (_genome) {
    return _genome;
  }
  if (_initializing) {
    return _initializing;
  }

  _initializing = (async () => {
    try {
      const { GSEP } = await import("@gsep/core/engine");
      const llm = {
        name: "agent-llm",
        model: model || "auto",
        chat: async (messages) => {
          const res = await _originalFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ messages, model: model || "auto", max_tokens: 4096 }),
          });
          const data = await res.json();
          if (data.choices) {
            return {
              content: data.choices[0]?.message?.content ?? "",
              usage: data.usage
                ? {
                    inputTokens: data.usage.prompt_tokens ?? 0,
                    outputTokens: data.usage.completion_tokens ?? 0,
                  }
                : undefined,
            };
          }
          return { content: String(data.content ?? "") };
        },
      };

      _genome = await GSEP.quickStart({
        name: detectAgentName(),
        llm,
        preset: "full",
        dashboardPort: 4200,
      });

      console.log("\n[GSEP] 🧬 Pipeline active — FULL 32-step pipeline on every call.");
      console.log("[GSEP] BEFORE: C0 + C3 + PurposeLock + genes + memory + PII redaction");
      console.log("[GSEP] AFTER:  C4 + fitness + drift + evolution + intelligence\n");
      return _genome;
    } catch (err) {
      console.log("[GSEP] Init error:", err.message);
      return null;
    }
  })();

  return _initializing;
}

async function accumulateStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    raw += decoder.decode(value, { stream: true });
  }
  const lines = raw.split("\n").filter((l) => l.startsWith("data: ") && !l.includes("[DONE]"));
  let content = "";
  for (const line of lines) {
    try {
      const data = JSON.parse(line.slice(6));
      content += data.choices?.[0]?.delta?.content ?? "";
      if (data.type === "response.output_text.delta") {
        content += data.delta ?? "";
      }
      if (data.type === "response.output_text.done") {
        content = data.text ?? content;
      }
    } catch {}
  }
  return content;
}

// ─── Patch fetch ────────────────────────────────────────
globalThis.fetch = async function gsepFetch(input, init) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : (input?.url ?? "");

  if (!isLLMCall(url)) {
    return _originalFetch(input, init);
  }

  // Skip if already processing a GSEP cycle (avoid polluting nested/tool calls)
  if (_processing) {
    return _originalFetch(input, init);
  }

  const body = init?.body;
  if (!body || typeof body !== "string") {
    return _originalFetch(input, init);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return _originalFetch(input, init);
  }

  // Extract messages from Chat Completions or Responses API
  let messages = parsed.messages;
  if (!messages && parsed.input) {
    if (typeof parsed.input === "string") {
      messages = [{ role: "user", content: parsed.input }];
    } else if (Array.isArray(parsed.input)) {
      messages = parsed.input;
    }
  }
  if (!messages || messages.length === 0) {
    return _originalFetch(input, init);
  }

  const headers = extractHeaders(init);
  const model = parsed.model ?? "auto";
  const isStreaming = !!parsed.stream;

  const genome = await initGSEP(url, headers, model);
  if (!genome) {
    return _originalFetch(input, init);
  }

  const userMsg = [...messages].toReversed().find((m) => m.role === "user");
  if (!userMsg) {
    return _originalFetch(input, init);
  }

  // Extract text from content (could be string, array of parts, or object)
  const rawContent = userMsg.content;
  const userText =
    typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.map((p) => p.text || p.content || "").join(" ")
        : String(rawContent ?? "");
  if (!userText) {
    return _originalFetch(input, init);
  }

  // ─── BEFORE: Full pre-LLM pipeline ────────────────────
  _processing = true;
  let before;
  try {
    before = await genome.beforeLLM(userText, {
      userId: "auto",
      taskType: "general",
    });

    if (before.blocked) {
      console.log(`[GSEP] ⛔ Blocked: ${before.blockReason}`);
      // Return a blocked response to the agent
      const blockedBody = JSON.stringify({
        id: `gsep-blocked-${Date.now()}`,
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: before.blockReason },
            finish_reason: "stop",
          },
        ],
      });
      return new Response(blockedBody, {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    // Inject GSEP's enhanced prompt into the request
    if (before.prompt) {
      if (parsed.input !== undefined) {
        // Responses API: inject into instructions
        parsed.instructions = (parsed.instructions || "") + "\n\n---\n\n" + before.prompt;
      } else if (parsed.messages) {
        // Chat Completions API: inject into system message
        const sysIdx = parsed.messages.findIndex((m) => m.role === "system");
        if (sysIdx >= 0) {
          parsed.messages[sysIdx].content += "\n\n---\n\n" + before.prompt;
        } else {
          parsed.messages.unshift({ role: "system", content: before.prompt });
        }
      }
      // Use sanitized message (C3 + PII redacted)
      if (before.sanitizedMessage !== userText) {
        if (parsed.input !== undefined) {
          if (typeof parsed.input === "string") {
            parsed.input = before.sanitizedMessage;
          }
        } else if (parsed.messages) {
          const userIdx = parsed.messages.findLastIndex((m) => m.role === "user");
          if (userIdx >= 0) {
            parsed.messages[userIdx].content = before.sanitizedMessage;
          }
        }
      }
      init = { ...init, body: JSON.stringify(parsed) };
    }

    console.log(`[GSEP] ✅ BEFORE complete — prompt enhanced, C3 scanned, PII redacted`);
  } catch (err) {
    console.log(`[GSEP] ⚠️ BEFORE error (passthrough):`, err.message);
  }
  _processing = false; // Allow the agent's LLM call to pass through

  // ─── STREAMING ──────────────────────────────────────────
  if (isStreaming) {
    const response = await _originalFetch(input, init);
    if (!response.body) {
      return response;
    }

    const [agentStream, gsepStream] = response.body.tee();

    // AFTER: accumulate + run full post-LLM pipeline (background)
    accumulateStream(gsepStream)
      .then(async (content) => {
        if (!content || !_genome) {
          return;
        }
        try {
          const after = await _genome.afterLLM(userText, content, {
            userId: "auto",
            taskType: "general",
          });
          console.log(
            `[GSEP] ✅ AFTER complete — fitness: ${after.fitness.toFixed(2)}, safe: ${after.safe}, threats: ${after.threats.length}`,
          );
        } catch (err) {
          console.log(`[GSEP] ❌ AFTER error:`, err.message);
        }
      })
      .catch((err) => {
        console.log(`[GSEP] ❌ Stream error:`, err.message);
      });

    return new Response(agentStream, { status: response.status, headers: response.headers });
  }

  // ─── NON-STREAMING ────────────────────────────────────
  const response = await _originalFetch(input, init);
  try {
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    if (content && _genome) {
      const after = await _genome.afterLLM(userText, content, {
        userId: "auto",
        taskType: "general",
      });
      console.log(
        `[GSEP] ✅ AFTER complete — fitness: ${after.fitness.toFixed(2)}, safe: ${after.safe}`,
      );
      // If C4 flagged threats, replace response
      if (!after.safe) {
        data.choices[0].message.content = after.response;
      }
    }
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: response.headers,
    });
  } catch {
    return response;
  }
};

console.log("[GSEP] 🧬 Preload active — full 32-step pipeline on every LLM call.");
