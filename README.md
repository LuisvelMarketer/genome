<div align="center">

<img src="icon/IMG_3094.PNG" alt="Genome Logo" width="200"/>

# Genome

### The Secure AI Agent for Your Personal Computer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)
[![Security](https://img.shields.io/badge/Security-Genome%20Shield-blueviolet.svg)](#genome-shield--enterprise-security)

**An AI agent that learns, evolves, and protects itself — like DNA.**

Created by **Luis Alfredo Velasquez Duran**

[Quick Start](#quick-start) · [Security](#genome-shield--enterprise-security) · [Channels](#messaging-channels-42) · [Skills](#integrated-skills-54) · [GSEP](#gsep--genomic-self-evolving-prompts) · [Architecture](#architecture) · [Contributing](#contributing)

</div>

---

## What is Genome?

**Genome** is an open-source, self-evolving AI agent that runs **directly on your computer** — not in the cloud. It connects your messaging platforms, productivity tools, and AI providers into a single intelligent assistant that improves with every interaction.

|    Static Prompt Agent    |          Genome (Self-Evolving)           |
| :-----------------------: | :---------------------------------------: |
|    Rigid and outdated     |            Living and adaptive            |
| Same instructions for all |         Modular and personalized          |
|         No memory         |    Memory that improves with each task    |
|      Manual updates       |          Autonomous self-tuning           |
|     Fixed token cost      |      Evolutionary token compression       |
|    No security layers     | 7-layer Genome Shield (Secure by default) |

### Key Features

- **42+ Messaging Channels** — Telegram, Discord, WhatsApp, Slack, Signal, Matrix, iMessage, MS Teams, and more
- **54+ Integrated Skills** — Apple Notes, 1Password, GitHub, Notion, Obsidian, browser automation, shell, and more
- **Multi-LLM Support** — OpenAI, Anthropic Claude, Google Gemini, Ollama (local), AWS Bedrock, Perplexity
- **Self-Evolving Prompts** — Powered by [GSEP](https://github.com/gsepcore/gsep) (Genomic Self-Evolving Prompts)
- **Enterprise Security** — Genome Shield: 7 layers, 22 modules, secure by default
- **Web Dashboard** — Real-time monitoring, chat interface, channel management
- **Cross-Platform** — macOS, Linux, Windows (via Docker)

---

## Genome Shield — Enterprise Security

Genome runs on your personal computer with access to your files, messages, credentials, and apps. **Genome Shield** ensures every operation is validated, every secret is encrypted, and every action is audited.

**Secure by default. Zero configuration required. Zero new dependencies.**

### What's Active and What's Optional

Genome Shield has 3 levels. You choose what you need:

| Level           | What activates                                                                                                                             | Who needs it                                                | Config needed                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Automatic**   | Prompt firewall (53 patterns), output infection detection (6 checks), PII redaction (9 categories), data classification, anomaly detection | **Everyone** — active on every `chat()` call                | **None.** Works out of the box.                                                  |
| **Full Shield** | Everything above + macOS Keychain vault, filesystem boundary, command execution guard, outbound network allowlist, tamper-proof audit log  | **Professionals & SMBs** — personal Mac with sensitive data | One line: `initGenomeShield({ profile: 'secure' })`                              |
| **Enterprise**  | Everything above + RBAC (5 roles), MFA (TOTP), enterprise policies (YAML), secret rotation, GDPR compliance, SOC 2 controls                | **Companies with teams, compliance requirements**           | `initGenomeShield({ profile: 'secure', enterprise: { rbac: true, mfa: true } })` |

**In short:**

- **Install and run** → you're already protected (prompt firewall + PII redaction + output scanning)
- **Add one line** → full 7-layer protection with encrypted credentials and audit trail
- **Add enterprise config** → RBAC, MFA, GDPR, SOC 2 for teams and compliance

### 7-Layer Security Architecture

```
+---------------------------------------------+
|  Layer 7: Audit & Compliance                |
|  Hash-chain log, data tracking, export      |
+---------------------------------------------+
|  Layer 6: Network Control                   |
|  Outbound allowlist, traffic audit          |
+---------------------------------------------+
|  Layer 5: Execution Control                 |
|  Command guard, filesystem boundary         |
+---------------------------------------------+
|  Layer 4: Skill Security                    |
|  Manifest permissions, Ed25519 signing      |
+---------------------------------------------+
|  Layer 3: Credential Vault                  |
|  macOS Keychain, AES-256-GCM, HKDF keys    |
+---------------------------------------------+
|  Layer 2: Data Protection (DLP)             |
|  PII redaction, LLM proxy, data classifier  |
+---------------------------------------------+
|  Layer 1: GSEP Prompt Firewall              |
|  C3 (53 patterns), C4 (6 checks), anomaly  |
+---------------------------------------------+
```

### What It Protects Against

| Threat                                       | Protection                       | How                                                                               |
| -------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| Prompt injection via Telegram/Discord        | C3 Content Firewall              | 53 regex patterns across 7 categories, SHA-256 immutable core                     |
| Your credit card number sent to OpenAI       | PII Redaction Engine             | 9 categories with Luhn validation, IBAN mod-97, re-hydration vault                |
| LLM response infected with instructions      | C4 Behavioral Immune System      | 6 deterministic output checks, quarantine pipeline                                |
| Agent executes `rm -rf /`                    | Command Execution Guard          | Allowlist + blocklist, `execFile` only (no shell), user approval                  |
| Agent reads `~/.ssh/id_rsa`                  | Filesystem Boundary              | Path ACL, symlink escape prevention, denied paths always enforced                 |
| Agent contacts malicious server              | Outbound Allowlist               | Domain whitelist with wildcards, SSRF prevention (blocks private IPs)             |
| Credentials stored in plaintext              | Keychain Vault                   | macOS Keychain + AES-256-GCM + HKDF key hierarchy                                 |
| Unsigned plugin runs malicious code          | Skill Signer + Capability Broker | Ed25519 signing, JIT capability grants, deny by default                           |
| No record of what the agent did              | Tamper-Proof Audit Log           | Hash chain (blockchain-like), root hash in Keychain, encrypted entries            |
| Sensitive data sent to cloud without consent | Data Classifier + LLM Proxy      | Classifies as public/internal/confidential/restricted, routes sensitive to Ollama |

### 4 Security Profiles

| Feature            | Paranoid            | Secure (DEFAULT)            | Standard             | Developer    |
| ------------------ | ------------------- | --------------------------- | -------------------- | ------------ |
| C3/C4 Firewall     | Full + quarantine   | Full + sanitize             | Structural           | Log-only     |
| PII Redaction      | All 9 categories    | All 9 categories            | CC/SSN/API keys      | Off          |
| LLM Routing        | Local only (Ollama) | Local preferred             | Cloud with filter    | Cloud direct |
| Credentials        | Keychain required   | Keychain required           | Keychain recommended | .env allowed |
| Skill Verification | Signed + manifest   | Signed + manifest           | Manifest only        | None         |
| Command Execution  | Ask every command   | Allowlist + ask destructive | Allowlist            | Unrestricted |
| Filesystem         | Minimal whitelist   | Configured paths            | Home directory       | Unrestricted |
| Network            | Localhost only      | LLM + channels only         | Broad allowlist      | Unrestricted |
| Audit Log          | Verbose + encrypted | Standard + signed           | Standard             | Basic        |
| Session Timeout    | 1 hour              | 8 hours                     | 24 hours             | Never        |

> **Secure** is the default profile. Users must explicitly opt into less security.

### vs. Other AI Agents

| Feature                    |    Genome Shield    | ChatGPT Desktop | Claude Desktop | Cursor | Copilot |
| -------------------------- | :-----------------: | :-------------: | :------------: | :----: | :-----: |
| PII redaction before LLM   |         Yes         |       No        |       No       |   No   |   No    |
| Prompt injection firewall  |     53 patterns     |      Basic      |     Basic      |   No   |   No    |
| Output infection detection |      6 checks       |       No        |       No       |   No   |   No    |
| Encrypted credentials      |      Keychain       |      .env       |      .env      |  .env  |  OAuth  |
| Tamper-proof audit log     |     Hash chain      |       No        |       No       |   No   |   No    |
| Execution sandboxing       | Allowlist + signing |       N/A       |      N/A       | Basic  |   N/A   |
| Network allowlist          |     Per-domain      |       No        |       No       |   No   |   No    |
| Security profiles          |      4 levels       |       No        |       No       |   No   |   No    |

---

## Quick Start

### For Users

```bash
# Interactive setup
npx genoma-setup

# Or quick setup with OpenAI
npx genoma-setup --quick --provider openai
```

### For Developers

```bash
git clone https://github.com/LuisvelMarketer/genome.git
cd genome
pnpm install
cp .env.example .env
nano .env  # Add your API key (one provider is enough)
pnpm dev
```

### With Docker

```bash
docker build -t genome .
docker run -d --name genome \
  -v $(pwd)/.env:/app/.env \
  -p 127.0.0.1:3000:3000 \
  genome
```

> Detailed installation guide: [INSTALL.md](INSTALL.md)

---

## Web Interface

Genome includes a complete web dashboard for managing the agent and all services.

```bash
cd ui && pnpm install && pnpm dev
# Access at http://localhost:5173
```

| Module       | Description                                             |
| ------------ | ------------------------------------------------------- |
| **Chat**     | Real-time conversation with streaming                   |
| **Channels** | Manage integrations (Telegram, Discord, WhatsApp, etc.) |
| **Agents**   | Configure agents, tools, skills, and cron jobs          |
| **Sessions** | User session history and management                     |
| **Usage**    | Consumption metrics and analytics                       |
| **Config**   | System settings and security profiles                   |
| **Cron**     | Scheduled task management                               |
| **Logs**     | Real-time log viewer with filtering                     |

---

## GSEP — Genomic Self-Evolving Prompts

The evolution engine behind Genome. Powered by [`@gsep/core`](https://github.com/gsepcore/gsep).

### 5-Chromosome Architecture

```
+-----------------------------------------------------------+
|  C0: Immutable DNA (Identity, Ethics, Security) SHA-256   |
+-----------------------------------------------------------+
|  C1: Operative Genes (Tools, Patterns) Slow mutation      |
+-----------------------------------------------------------+
|  C2: Epigenomes (User Preferences) Fast mutation           |
+-----------------------------------------------------------+
|  C3: Content Firewall (53 patterns, 7 categories)         |
+-----------------------------------------------------------+
|  C4: Behavioral Immune System (6 output checks)           |
+-----------------------------------------------------------+
```

### Integration

Genome uses GSEP via middleware — two hooks that wrap the agent:

```typescript
import { GSEPMiddleware } from "@gsep/core";

const mw = await GSEPMiddleware.create({
  llm: myLLMAdapter,
  name: "genome-agent",
});

// Before LLM call — enhances prompt + scans for threats
const { prompt, rejected } = await mw.before(systemPrompt, {
  message: userMessage,
  userId: "user-123",
});

// After LLM call — records feedback + triggers evolution
await mw.after(response, { userId: "user-123", feedback: score });
```

> Full documentation: [gsepcore.com](https://gsepcore.com) | [GitHub](https://github.com/gsepcore/gsep)

---

## Messaging Channels (42+)

| Category       | Platforms                                               |
| -------------- | ------------------------------------------------------- |
| **Chat**       | WhatsApp, Telegram, Discord, Slack, Signal, Matrix, IRC |
| **Enterprise** | Microsoft Teams, Google Chat, Mattermost, Feishu/Lark   |
| **Social**     | Twitch, Line, Nostr                                     |
| **Apple**      | iMessage, BlueBubbles                                   |
| **Other**      | Synology Chat, Nextcloud Talk, Zalo                     |

All channels are protected by Genome Shield — every inbound message passes through C3 firewall and PII redaction before reaching the LLM.

---

## Integrated Skills (54+)

| Category          | Skills                                                                       |
| ----------------- | ---------------------------------------------------------------------------- |
| **Productivity**  | Notion, Linear, Todoist, Airtable, Trello, Things                            |
| **Notes**         | Apple Notes, Obsidian, Bear Notes                                            |
| **Communication** | iMessage, Gmail (himalaya), Slack messages                                   |
| **Development**   | GitHub, GitLab, code execution, git operations                               |
| **Multimedia**    | Spotify, YouTube, image generation                                           |
| **System**        | Shell execution, file management, clipboard, browser automation              |
| **Security**      | 1Password (with Genome Shield gating)                                        |
| **AI**            | Web search (Brave), URL reading, PDF processing                              |
| **Voice**         | Speech-to-text (Deepgram), text-to-speech (ElevenLabs), phone calls (Twilio) |

---

## AI Provider Support

| Provider           | Models                      | Adapter  |
| ------------------ | --------------------------- | -------- |
| **OpenAI**         | GPT-4o, GPT-4, GPT-3.5      | Built-in |
| **Anthropic**      | Claude Opus, Sonnet, Haiku  | Built-in |
| **Google**         | Gemini Pro, Flash           | Built-in |
| **Ollama**         | Llama, Mistral, Phi (local) | Built-in |
| **AWS Bedrock**    | Claude, Titan, Llama        | Built-in |
| **Perplexity**     | Sonar                       | Built-in |
| **OpenRouter**     | Multi-model proxy           | Built-in |
| **GitHub Copilot** | GPT-4o via Copilot          | Built-in |
| **Qwen**           | Qwen-Max, Plus              | Built-in |

---

## Architecture

```
User Input (CLI/Web/Telegram/Discord/...)
     |
     v
+---------------------------+
|      GATEWAY SERVER       |
|  Auth | Router | Sessions |
+----------+----------------+
           |
           v
+---------------------------+
|     GENOME SHIELD         |    <-- 7 layers active
|  C3 Firewall (53 patterns)|
|  PII Redaction (9 types)  |
|  Data Classification      |
+----------+----------------+
           |
           v
+---------------------------+
|     AGENT RUNTIME         |
|  GSEP Evolution Engine    |
|  Skill Router | MCP       |
+----------+----------------+
           |
           v
+---------------------------+
|    EXECUTION LAYER        |
|  Command Guard (allowlist)|
|  FS Boundary (path ACL)   |
|  Network Allowlist        |
+----------+----------------+
           |
           v
+---------------------------+
|     AUDIT LAYER           |
|  Hash-chain log           |
|  Data access tracking     |
|  Compliance export        |
+---------------------------+
```

### Project Structure

```
genome/
+-- src/
|   +-- gsep/                   # GSEP + Genome Shield integration
|   +-- security/               # Security modules (ImmuneSystem, MutationEvaluator, etc.)
|   +-- agents/                 # Agent runtime and tools
|   +-- channels/               # Messaging channel implementations
|   +-- gateway/                # HTTP/WebSocket gateway server
|   +-- skills/                 # Bundled skills
|   +-- browser/                # Playwright browser automation
|   +-- process/                # Command execution
|   +-- hooks/                  # Hook system
|   +-- memory/                 # Memory and vector search
|   +-- media/                  # Media processing (images, audio, video)
|   +-- tts/                    # Text-to-speech
|   +-- cron/                   # Scheduled tasks
|   +-- config/                 # Configuration management
|   +-- cli/                    # CLI commands
|   +-- tui/                    # Terminal UI
|   +-- web/                    # Web interface backend
+-- ui/                         # Web dashboard (Lit + Vite)
+-- extensions/                 # 42+ messaging channel extensions
+-- apps/                       # Native apps (iOS, Android, macOS)
+-- skills/                     # Bundled skill definitions
+-- docs/                       # Documentation
```

---

## Configuration

### Environment Variables

```env
# AI Provider (one is enough)
OPENAI_API_KEY=sk-...
# Or
ANTHROPIC_API_KEY=sk-ant-...

# Messaging Channels (optional)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...

# GSEP Security
GSEP_ENABLED=true
GSEP_AUTO_MUTATION=true
GSEP_STORAGE_TYPE=database
```

### Security Profile

The default security profile is **Secure**. To change:

```typescript
// In src/gsep/index.ts
const shield = await initGenomeShield({ profile: "paranoid" });
```

Or set in genome config:

```json
{
  "securityProfile": "secure"
}
```

---

## Roadmap

### v1.0 — Base

- [x] Multi-channel gateway
- [x] 42+ messaging extensions
- [x] Browser automation with Playwright
- [x] 54+ integrated skills

### v2.0 — Evolution

- [x] Genomic self-evolution (legacy PGA, now GSEP)
- [x] Automatic learning and adaptation
- [x] Gene registry for agent knowledge sharing

### v3.0 — Security

- [x] Immune system with auto-rollback
- [x] MutationEvaluator with sandbox testing
- [x] Prompt Injection Guard (77 patterns, 15 types)
- [x] Canary tokens with leak detection
- [x] Output scanner (system prompt fragments, injection echoes)

### v4.0 — Optimization (Current)

- [x] Evolutionary token compression
- [x] Professional npm installer
- [x] Enhanced CLI commands

### v5.0 — Genome Shield (Current)

- [x] 7-layer enterprise security architecture
- [x] 22 security modules via @gsep/core
- [x] PII redaction with 9 categories + Luhn validation
- [x] macOS Keychain + AES-256-GCM credential vault
- [x] Tamper-proof audit log with hash chain
- [x] Ed25519 skill signing + capability broker
- [x] Command execution guard + filesystem boundary
- [x] Outbound network allowlist with SSRF prevention
- [x] 4 security profiles (Secure by default)
- [x] Compliance export (JSON/CSV) for GDPR Art. 15

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Current priorities:

- **GSEP**: Integrating Genomic Self-Evolving Prompts (`@gsep/core`) for autonomous prompt evolution
- **Stability**: Fixing edge cases in channel connections
- **UX**: Improving the onboarding wizard and error messages
- **Performance**: Optimizing token usage and compaction logic

---

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

Genome Shield is active by default with the **Secure** profile. For detailed security architecture, see the [Genome Shield section](#genome-shield--enterprise-security).

---

## License

[MIT](LICENSE) — Created by **Luis Alfredo Velasquez Duran**

---

<div align="center">

**Genome** — The AI agent that evolves, protects, and works for you.

[Website](https://gsepcore.com) · [Documentation](https://docs.gsepcore.com) · [Issues](https://github.com/LuisvelMarketer/genome/issues) · [Discussions](https://github.com/LuisvelMarketer/genome/discussions)

</div>
