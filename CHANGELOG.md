# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

## [4.0.0] - 2026-03-03

### 🚀 Nueva Característica Principal: Instalador npm Profesional

#### Añadido
- **Instalador npm profesional** con dos modos de operación:
  - **Modo Usuario**: Wizard interactivo para usuarios finales
  - **Modo Desarrollador**: Configuración completa para contribuidores
  
- **CLI mejorado** con nuevos comandos:
  - `genoma setup` - Instalación interactiva
  - `genoma setup --dev` - Modo desarrollador
  - `genoma setup --quick` - Instalación rápida
  - `genoma start/stop/status` - Control de servicios
  - `genoma doctor` - Diagnóstico del sistema
  - `genoma config` - Gestión de configuración

- **Estructura del instalador** (`installer/`):
  - `bin/setup.mjs` - Entry point del CLI
  - `cli/` - Implementación CLI con Commander.js
  - `modes/` - Lógica para modos dev y producción
  - `validators/` - Verificación de requisitos del sistema
  - `config/` - Generadores de .env y genoma.json
  - `utils/` - Utilidades y logger

- **Prompts interactivos** con @clack/prompts:
  - Selección de proveedor IA
  - Configuración de canales
  - Habilitación de PGA

- **Validación de sistema**:
  - Verifica Node.js >= 22.12.0
  - Verifica pnpm >= 10.0.0
  - Detecta dependencias opcionales (Docker, PostgreSQL)

- **Documentación**:
  - `INSTALL.md` - Guía de instalación completa
  - Actualización de README.md

#### Cambiado
- Versión actualizada a 4.0.0
- Nuevos scripts en package.json:
  - `pnpm setup` / `pnpm setup:dev` / `pnpm setup:quick`
  - `pnpm doctor`

#### Mejorado
- UX del instalador con spinners y barras de progreso
- Mensajes de error más descriptivos con sugerencias
- Compatibilidad con múltiples proveedores IA

---

## [3.0.0] - 2026-03-01

### 🧬 Sistema PGA (Prompt Genómico Autoevolutivo)

#### Añadido
- **PGA Core** - Sistema de evolución genómica:
  - GenomeV2 con 3 cromosomas (C0, C1, C2)
  - GenomeKernel para integridad de C0
  - FitnessTracker con métricas 6D
  - MutationOperator con estrategias LLM
  - GeneRegistry para genes compartidos

- **Memoria por capas** (LayeredMemory)
- **Evaluador híbrido** (heurístico + LLM)
- **Integración no invasiva** con GenomaAgentPGABridge
- **Hooks modulares** para agentes existentes
- **API simplificada** (PGAAPI)

---

## [2.0.0] - 2026-02-15

### Rebranding y Mejoras

#### Añadido
- Rebranding de OpenClaw a Genoma
- 42+ extensiones
- Browser automation con Playwright
- Múltiples canales (Telegram, WhatsApp, Discord, Slack)

---

## [1.0.0] - 2026-01-01

### Versión Inicial

- Base del proyecto (fork de OpenClaw)
- Gateway unificado
- Sistema de extensiones
- Soporte multi-proveedor IA
