<![CDATA[<div align="center">

```
   ██████╗ ███████╗███╗   ██╗ ██████╗ ███╗   ███╗ █████╗ 
  ██╔════╝ ██╔════╝████╗  ██║██╔═══██╗████╗ ████║██╔══██╗
  ██║  ███╗█████╗  ██╔██╗ ██║██║   ██║██╔████╔██║███████║
  ██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██║
  ╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║  ██║
   ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝
```

### 🧬 Agente Inteligente Autoevolutivo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)

**Un prompt que aprende, muta y mejora solo — como el ADN biológico.**

[Instalación](#-instalación) • [Características](#-características) • [Uso](#-uso) • [Roadmap](#-roadmap) • [Créditos](#-créditos)

</div>

---

## 🧬 ¿Qué es Genoma?

**Genoma** es un agente de IA autoevolutivo de código abierto que actúa como gateway multi-canal para tus interacciones con modelos de lenguaje. Conecta múltiples plataformas de mensajería (WhatsApp, Telegram, Discord, Slack y más) con proveedores de IA como OpenAI, Anthropic, Google y modelos locales.

A diferencia de los prompts estáticos tradicionales, Genoma está diseñado para **evolucionar y adaptarse** con cada interacción, mejorando continuamente su rendimiento y personalización.

### ¿Por qué Genoma?

| Prompt Estático Tradicional | Prompt Genómico Autoevolutivo |
|:---------------------------:|:-----------------------------:|
| Rígido y obsoleto | Vivo y adaptativo |
| Mismo texto para todos | Modular y personalizado |
| Sin memoria | Memoria que mejora con cada tarea |
| Manual | Autoajuste continuo |

---

## ✨ Características

### 🔌 42+ Extensiones de Mensajería
- **Chat**: WhatsApp, Telegram, Discord, Slack, Signal, Matrix, IRC
- **Empresarial**: Microsoft Teams, Google Chat, Mattermost, Feishu
- **Social**: Twitch, Line, Nostr
- **Más**: iMessage, BlueBubbles, Synology Chat, Nextcloud Talk

### 🛡️ Seguridad Multicapa (v3.0)
- **Sistema Inmune**: Auto-rollback automático cuando un gen tiene rendimiento degradado
- **MutationEvaluator**: Validación sandbox de mutaciones antes del despliegue
- **Prompt Injection Guard**: Detección y sanitización de ataques de inyección

### 🤖 54+ Skills Integrados
- **Productividad**: Notion, Linear, Todoist, Airtable
- **Multimedia**: Spotify, YouTube
- **Desarrollo**: GitHub, GitLab
- **Hogar Inteligente**: Home Assistant
- **Utilidades**: Búsqueda web, generación de imágenes, análisis de documentos

### 🌐 Browser Automation
- Automatización web completa con Playwright
- Captura de screenshots y análisis visual
- Interacción con páginas web complejas

### 🖥️ Terminal Execution
- Ejecución de comandos en terminal
- Gestión de archivos y directorios
- Integración con herramientas de desarrollo

### 🧠 Proveedores de IA Soportados
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Modelos locales vía Ollama
- Azure OpenAI
- DeepSeek, Mistral, y más

---

## 🧬 PGA - Prompt Genómico Autoevolutivo (v2.0)

**Nuevo en v2.0**: Sistema completo de evolución genómica para agentes de IA.

### Arquitectura Genómica de 3 Cromosomas

```
┌─────────────────────────────────────────────────────────┐
│                    GenomeV2                              │
├─────────────────────────────────────────────────────────┤
│  C0 (Inmutable)    │ Identidad, ética, seguridad        │
│  C1 (Operativo)    │ Genes mutables con fitness 6D      │
│  C2 (Epigenético)  │ Adaptaciones del usuario           │
└─────────────────────────────────────────────────────────┘
```

### Componentes Principales

| Componente | Descripción |
|:-----------|:------------|
| **GenomeKernel** | Protección criptográfica SHA-256 de C0, rollback automático |
| **FitnessTracker** | Evaluación 6D (precisión, velocidad, costo, seguridad, satisfacción, adaptabilidad) |
| **MutationOperator** | Estrategias: LLM rewrite, parameter tweak, simplify |
| **LayeredMemory** | Memoria semántica por usuario con expiración |
| **GeneRegistry** | Repositorio central de genes compartidos |

### Integración No Invasiva

```typescript
import { GenomaAgentPGABridge, getGlobalPGABridge } from './src/pga';

// Obtener bridge global
const bridge = getGlobalPGABridge();

// Antes de ejecutar agente
const evolvedPrompt = await bridge.beforeExecution({
  agentId: 'mi-agente',
  userId: 'user-123',
  originalPrompt: basePrompt
});

// Después de ejecutar
await bridge.afterExecution({
  agentId: 'mi-agente',
  userId: 'user-123',
  result: { response, tokensUsed, latencyMs }
});
```

### Configuración PGA

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
    rollbackThreshold: 0.15
  }
}
```

### Documentación PGA
- [Arquitectura Completa](docs/pga/ARCHITECTURE.md)
- [Guía de Integración](docs/pga/INTEGRATION.md)
- [API Reference](docs/pga/API.md)

---

## 🚀 Instalación

### Requisitos Previos
- Node.js 18 o superior
- npm o pnpm

### Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/your-org/genoma.git
cd genoma

# Instalar dependencias
npm install

# Copiar configuración de ejemplo
cp .env.example .env

# Editar configuración con tus API keys
nano .env

# Construir el proyecto
npm run build

# Iniciar Genoma
npm start
```

### Con Docker

```bash
# Construir imagen
docker build -t genoma .

# Ejecutar
docker run -d --name genoma \
  -v $(pwd)/.env:/app/.env \
  -p 3000:3000 \
  genoma
```

---

## ⚙️ Configuración

### Variables de Entorno Esenciales

```env
# Proveedor de IA (requerido)
OPENAI_API_KEY=sk-...
# O usa otro proveedor
ANTHROPIC_API_KEY=sk-ant-...

# Extensiones (opcional - según lo que uses)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
WHATSAPP_PHONE_NUMBER=...
```

### Archivo de Configuración

```yaml
# config.yaml
ai:
  provider: openai
  model: gpt-4
  
extensions:
  telegram:
    enabled: true
  discord:
    enabled: true
    
skills:
  notion:
    enabled: true
    api_key: ${NOTION_API_KEY}
```

---

## 📖 Uso

### CLI Básico

```bash
# Iniciar en modo interactivo
npx genoma

# Iniciar con extensión específica
npx genoma --extension telegram

# Ver ayuda
npx genoma --help
```

### Interfaz Web

Genoma incluye una interfaz web para gestión y monitoreo:

```bash
# Iniciar servidor web
npm run web

# Acceder en http://localhost:3000
```

### Ejemplo de Uso con Telegram

1. Crea un bot en [@BotFather](https://t.me/BotFather)
2. Configura `TELEGRAM_BOT_TOKEN` en tu `.env`
3. Inicia Genoma con `npx genoma --extension telegram`
4. ¡Habla con tu bot!

---

## 🗺️ Roadmap

### v1.0 (Actual) ✅
- [x] Fork y rebranding completo de OpenClaw
- [x] 42+ extensiones de mensajería
- [x] 54+ skills integrados
- [x] Browser automation con Playwright
- [x] Soporte multi-proveedor de IA

### v2.0 ✅
- [x] Integración con PGA Platform (Prompt Genómico Autoevolutivo)
- [x] Sistema de evolución y aprendizaje automático
- [x] Registro genómico de agentes
- [x] Detección de drift en rendimiento

### v3.0 (Actual) 🚧
- [x] **Sistema Inmune** — Auto-rollback de genes con bajo rendimiento
- [x] **MutationEvaluator** — Sandbox testing de mutaciones antes del deploy
- [x] **Prompt Injection Guard** — Protección contra ataques de inyección
- [ ] Auditoría y compliance
- [ ] Cifrado de datos sensibles
- [ ] Control de acceso granular

### v4.0 (Futuro) 📋
- [ ] Instalador npm profesional (`npm create genoma`)
- [ ] Wizard de configuración interactivo
- [ ] Templates predefinidos
- [ ] One-click deployment

---

## 📚 Documentación

- [Guía de Inicio](docs/start/genoma.md)
- [Configuración de Extensiones](docs/extensions/)
- [Desarrollo de Skills](docs/skills/)
- [API Reference](docs/api/)

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor lee nuestra [guía de contribución](CONTRIBUTING.md) antes de enviar un PR.

```bash
# Fork el repo
# Crea tu rama de feature
git checkout -b feature/mi-feature

# Commit tus cambios
git commit -m 'Add: mi nueva feature'

# Push a la rama
git push origin feature/mi-feature

# Abre un Pull Request
```

---

## 📜 Créditos

### Basado en OpenClaw

Genoma es un fork de [OpenClaw](https://github.com/openclaw/openclaw), un proyecto de código abierto creado por **Peter Steinberger** y contribuidores bajo la licencia MIT.

Agradecemos enormemente al equipo de OpenClaw por crear una base tan sólida y extensible que hace posible este proyecto.

### Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

```
MIT License - Copyright (c) 2024 OpenClaw Contributors
Fork y modificaciones - Copyright (c) 2026 Genoma Team
```

Ver [NOTICE.md](NOTICE.md) para información completa de atribución.

---

<div align="center">

**🧬 Genoma** — *Agentes que nunca se vuelven obsoletos*

[⬆ Volver arriba](#)

</div>
]]>