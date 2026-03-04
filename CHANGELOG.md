# Changelog

Todos los cambios notables de este proyecto seran documentados en este archivo.

## [4.0.0] - 2026-03-03

### Nueva Caracteristica Principal: Compresion Evolutiva de Tokens

#### Agregado

- **Compresion evolutiva de tokens** en PGA:
  - Estrategia `compress` en MutationOperator con gate de compresion
  - Presupuesto de tokens (2000 max) en PromptAssembler con ranking por eficiencia
  - Compresion eager al inicializar (`eagerCompressGenes`)
  - Utilidades de tokens: `estimateTokenCount`, `tokenEfficiency`, `compressionRatio`
  - Campo `tokenCount` en OperativeGene

- **Instalador npm profesional** con dos modos de operacion:
  - **Modo Usuario**: Wizard interactivo para usuarios finales
  - **Modo Desarrollador**: Configuracion completa para contribuidores

- **CLI mejorado** con nuevos comandos:
  - `genoma setup` - Instalacion interactiva
  - `genoma setup --dev` - Modo desarrollador
  - `genoma setup --quick` - Instalacion rapida
  - `genoma start/stop/status` - Control de servicios
  - `genoma doctor` - Diagnostico del sistema
  - `genoma config` - Gestion de configuracion

---

## [3.0.0] - 2026-03-01

### Sistema PGA (Prompt Genomico Autoevolutivo)

#### Agregado

- **PGA Core** - Sistema de evolucion genomica:
  - GenomeV2 con 3 cromosomas (C0, C1, C2)
  - GenomeKernel para integridad de C0
  - FitnessTracker con metricas 6D
  - MutationOperator con estrategias LLM
  - GeneRegistry para genes compartidos

- **Memoria por capas** (LayeredMemory)
- **Evaluador hibrido** (heuristico + LLM)
- **Integracion no invasiva** con GenomaAgentPGABridge
- **Hooks modulares** para agentes existentes
- **API simplificada** (PGAAPI)

---

## [2.0.0] - 2026-02-15

### Gateway Multi-Canal

#### Agregado

- 42+ extensiones de mensajeria
- Browser automation con Playwright
- Multiples canales (Telegram, WhatsApp, Discord, Slack)
- Soporte multi-proveedor IA

---

## [1.0.0] - 2026-01-01

### Version Inicial

- Gateway unificado
- Sistema de extensiones
- Soporte multi-proveedor IA
