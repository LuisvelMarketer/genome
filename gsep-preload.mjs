/**
 * GSEP Preload — patches fetch BEFORE any module loads.
 *
 * Imported as first line in genoma.mjs:
 *   import './gsep-preload.mjs'
 *
 * Intercepts streaming + non-streaming LLM calls.
 * Agent gets real-time streaming. GSEP accumulates in background.
 */

const _originalFetch = globalThis.fetch;
let _genome = null;
let _initializing = null;

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
        name: "auto-agent",
        llm,
        preset: "standard",
        dashboardPort: 0,
      });

      console.log("\n[GSEP] 🧬 Pipeline active — using your agent's LLM connection.");
      console.log("[GSEP] 32 steps per call: Evolution ON | Security ON | PII Redaction ON");
      console.log("[GSEP] Dashboard: http://localhost:4200/gsep/dashboard\n");
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
      // Chat Completions format
      content += data.choices?.[0]?.delta?.content ?? "";
      // Responses API format
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

// Patch fetch
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

  // Support both Chat Completions API (messages) and Responses API (input)
  let messages = parsed.messages;
  if (!messages && parsed.input) {
    // Responses API format: { input: "string" | [{role, content}] }
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

  console.log(
    `[GSEP] Intercepted LLM call to: ${url.slice(0, 60)} (${isStreaming ? "streaming" : "non-streaming"})`,
  );

  const genome = await initGSEP(url, headers, model);
  if (!genome) {
    return _originalFetch(input, init);
  }

  const userMsg = [...messages].toReversed().find((m) => m.role === "user");
  if (!userMsg) {
    return _originalFetch(input, init);
  }

  // ─── STREAMING ──────────────────────────────────────
  if (isStreaming) {
    // BEFORE: enhance prompt with evolved genes
    try {
      const enhanced = await genome.assemblePrompt(
        { userId: "auto", taskType: "general" },
        userMsg.content,
      );
      if (enhanced) {
        const sysIdx = messages.findIndex((m) => m.role === "system");
        if (sysIdx >= 0) {
          messages[sysIdx].content += "\n\n" + enhanced;
        } else {
          messages.unshift({ role: "system", content: enhanced });
        }
        parsed.messages = messages;
        init = { ...init, body: JSON.stringify(parsed) };
      }
    } catch {}

    // Forward streaming call
    const response = await _originalFetch(input, init);
    if (!response.body) {
      return response;
    }

    // Tee: agent gets real-time stream, GSEP accumulates
    const [agentStream, gsepStream] = response.body.tee();

    // AFTER: accumulate + feed evolution (background, no delay)
    accumulateStream(gsepStream)
      .then(async (content) => {
        if (!content || !_genome) {
          return;
        }
        try {
          await _genome.recordExternalInteraction({
            userMessage: userMsg.content,
            response: content,
            userId: "auto",
            taskType: "general",
            success: true,
          });
        } catch {}
      })
      .catch(() => {});

    return new Response(agentStream, { status: response.status, headers: response.headers });
  }

  // ─── NON-STREAMING ──────────────────────────────────
  try {
    const gsepResponse = await genome.chat(userMsg.content, {
      userId: "auto",
      taskType: "general",
    });
    return new Response(
      JSON.stringify({
        id: `gsep-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: `gsep/${model}`,
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: gsepResponse },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  } catch {
    return _originalFetch(input, init);
  }
};

console.log("[GSEP] 🧬 Preload active — fetch patched before any module loads.");
