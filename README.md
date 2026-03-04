<div align="center">

<img src="icon/IMG_3094.PNG" alt="Genome Logo" width="200"/>

# Genome

### Agente Inteligente Autoevolutivo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)

**Un agente de IA que aprende, muta y mejora solo — como el ADN.**

Created by **Luis Alfredo Velasquez Duran**

[Inicio Rapido](#-inicio-rapido) · [PGA](#-pga---prompt-genomico-autoevolutivo) · [Extensiones](#-extensiones) · [Arquitectura](#-arquitectura) · [Contribuir](#-contribuir)

</div>

---

## Que es Genome?

**Genome** es un agente de IA autoevolutivo y gateway multi-canal de codigo abierto. Conecta multiples plataformas de mensajeria con proveedores de IA y evoluciona sus propios prompts automaticamente para mejorar con cada interaccion.

|    Prompt Estatico     |      Genome (Autoevolutivo)       |
| :--------------------: | :-------------------------------: |
|   Rigido y obsoleto    |         Vivo y adaptativo         |
| Mismo texto para todos |      Modular y personalizado      |
|      Sin memoria       | Memoria que mejora con cada tarea |
|         Manual         |        Autoajuste continuo        |
|      Tokens fijos      |  Compresion evolutiva de tokens   |

---

## Inicio Rapido

```bash
# Clonar el repositorio
git clone https://github.com/LuisvelMarketer/Genome.git
cd Genome

# Instalar dependencias
npm install

# Configurar
cp .env.example .env
nano .env  # Agregar tus API keys

# Construir e iniciar
npm run build
npm start
```

### Con Docker

```bash
docker build -t genome .
docker run -d --name genome \
  -v $(pwd)/.env:/app/.env \
  -p 3000:3000 \
  genome
```

---

## PGA - Prompt Genomico Autoevolutivo

El corazon de Genome. Un sistema de evolucion genomica que optimiza prompts automaticamente.

### Arquitectura de 3 Cromosomas

```
┌──────────────────────────────────────────────────────────┐
│                       GenomeV2                            │
├──────────────────────────────────────────────────────────┤
│  C0 (Inmutable)    │ Identidad, etica, seguridad         │
│  C1 (Operativo)    │ Genes mutables con fitness 6D       │
│  C2 (Epigenetico)  │ Adaptaciones por usuario            │
└──────────────────────────────────────────────────────────┘
```

### Componentes

| Componente           | Funcion                                                                            |
| :------------------- | :--------------------------------------------------------------------------------- |
| **GenomeKernel**     | Proteccion SHA-256 de C0, rollback automatico                                      |
| **FitnessTracker**   | Evaluacion 6D: precision, velocidad, costo, seguridad, satisfaccion, adaptabilidad |
| **MutationOperator** | 5 estrategias: `llm_rewrite`, `parameter_tweak`, `simplify`, `combine`, `compress` |
| **PromptAssembler**  | Ensamblado con presupuesto de tokens (2000 max) y ranking por eficiencia           |
| **LayeredMemory**    | Memoria semantica por usuario con expiracion                                       |
| **GeneRegistry**     | Repositorio central de genes compartidos                                           |

### Compresion Evolutiva de Tokens

Genome nunca descarta un gen funcional por ser costoso — lo **comprime evolutivamente**:

- **Estrategia `compress`**: LLM comprime instrucciones preservando funcionalidad
- **Presupuesto de tokens**: 2000 tokens max para C1 con ranking por valor-por-token
- **Compresion eager**: Genes grandes se comprimen al inicializar, no despues de 50 ejecuciones
- **Gate de compresion**: Rechaza si el resultado no es mas corto que el original

### Uso

```typescript
import { GenomaAgentPGABridge, getGlobalPGABridge } from "./src/pga";

const bridge = getGlobalPGABridge();

// Antes de ejecutar el agente
const evolvedPrompt = await bridge.beforeExecution({
  agentId: "mi-agente",
  userId: "user-123",
  originalPrompt: basePrompt,
});

// Despues de ejecutar
await bridge.afterExecution({
  agentId: "mi-agente",
  userId: "user-123",
  result: { response, tokensUsed, latencyMs },
});
```

---

## Extensiones

### Canales de Mensajeria (42+)

| Categoria       | Plataformas                                             |
| :-------------- | :------------------------------------------------------ |
| **Chat**        | WhatsApp, Telegram, Discord, Slack, Signal, Matrix, IRC |
| **Empresarial** | Microsoft Teams, Google Chat, Mattermost, Feishu        |
| **Social**      | Twitch, Line, Nostr                                     |
| **Otros**       | iMessage, BlueBubbles, Synology Chat, Nextcloud Talk    |

### Skills Integrados (54+)

| Categoria         | Skills                                                       |
| :---------------- | :----------------------------------------------------------- |
| **Productividad** | Notion, Linear, Todoist, Airtable                            |
| **Multimedia**    | Spotify, YouTube                                             |
| **Desarrollo**    | GitHub, GitLab                                               |
| **Hogar**         | Home Assistant                                               |
| **Utilidades**    | Busqueda web, generacion de imagenes, analisis de documentos |

### Proveedores de IA

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Modelos locales via Ollama
- Azure OpenAI
- DeepSeek, Mistral, y mas

---

## Arquitectura

```
Genome/
├── src/
│   ├── pga/                    # PGA - Sistema de evolucion genomica
│   │   ├── core/               # GenomeKernel, PromptAssembler, FitnessTracker
│   │   ├── evolution/          # MutationOperator (5 estrategias)
│   │   ├── evaluation/         # Evaluator hibrido (heuristico + LLM)
│   │   ├── integration/        # AgentIntegration, Bridge, API
│   │   ├── memory/             # LayeredMemory semantica
│   │   ├── types/              # GenomeV2, OperativeGene, FitnessVector
│   │   ├── utils/              # tokens.ts, hash.ts, serialization.ts
│   │   └── config/             # Configuracion PGA
│   ├── commands/               # Comandos CLI
│   ├── hooks/                  # Sistema de hooks
│   └── ...
├── extensions/                 # 42+ extensiones de mensajeria
├── apps/                       # Apps nativas (iOS, Android, macOS)
└── docs/                       # Documentacion
```

### Seguridad Multicapa

- **Sistema Inmune**: Auto-rollback cuando un gen tiene rendimiento degradado
- **MutationEvaluator**: Sandbox testing de mutaciones antes del deploy
- **Prompt Injection Guard**: Deteccion y sanitizacion de ataques
- **GenomeKernel**: Proteccion criptografica SHA-256 del cromosoma inmutable (C0)

---

## Configuracion

### Variables de Entorno

```env
# Proveedor de IA (requerido)
OPENAI_API_KEY=sk-...
# O usa otro proveedor
ANTHROPIC_API_KEY=sk-ant-...

# Extensiones (opcional)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
WHATSAPP_PHONE_NUMBER=...
```

### PGA Config

```typescript
// src/pga/config/pga-integration.config.ts
{
  features: {
    enabled: true,
    evolutionEnabled: true,
    autoMutation: true,
    autoRollback: true
  },
  evolution: {
    mutationInterval: 10,
    fitnessThreshold: 0.6,
    rollbackThreshold: 0.15,
    mutationStrategies: ['llm_rewrite', 'simplify', 'compress'],
    eagerCompress: true,
    c1TokenBudget: 2000
  }
}
```

---

## Roadmap

### v1.0 - Base

- [x] Gateway multi-canal
- [x] 42+ extensiones de mensajeria
- [x] 54+ skills integrados
- [x] Browser automation con Playwright

### v2.0 - PGA

- [x] Sistema PGA (Prompt Genomico Autoevolutivo)
- [x] Evolucion y aprendizaje automatico
- [x] Registro genomico de agentes

### v3.0 - Seguridad

- [x] Sistema Inmune con auto-rollback
- [x] MutationEvaluator con sandbox
- [x] Prompt Injection Guard

### v4.0 - Optimizacion (Actual)

- [x] Compresion evolutiva de tokens
- [x] Presupuesto de tokens con ranking por eficiencia
- [x] Compresion eager al inicializar
- [x] Estrategia `compress` en MutationOperator
- [ ] Instalador npm profesional (`npm create genome`)
- [ ] Wizard de configuracion interactivo

---

## Contribuir

Las contribuciones son bienvenidas! Lee la [guia de contribucion](CONTRIBUTING.md) antes de enviar un PR.

```bash
git checkout -b feature/mi-feature
git commit -m 'Add: mi nueva feature'
git push origin feature/mi-feature
# Abre un Pull Request
```

---

## Licencia

MIT License - Copyright (c) 2026 Luis Alfredo Velasquez Duran

Ver [LICENSE](LICENSE) para detalles.

---

<div align="center">

**Genome** — _Agentes que nunca se vuelven obsoletos_

Created by Luis Alfredo Velasquez Duran

[Volver arriba](#)

</div>
