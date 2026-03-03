# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-03-03

### Añadido

#### 🛡️ Módulo de Seguridad (adaptado de Orbis)

- **Sistema Inmune** (`src/security/ImmuneSystem.ts`)
  - Monitoreo de fitness en ventanas deslizantes
  - Detección de caídas de rendimiento >20% (configurable)
  - Auto-rollback y cuarentena de genes problemáticos
  - Status tracking: `active`, `retired`, `immune_blocked`, `quarantined`
  - Integración con PGA FitnessTracker

- **MutationEvaluator** (`src/security/MutationEvaluator.ts`)
  - Validación sandbox de mutaciones antes del despliegue
  - Test cases por categoría de gen (tool_usage, coding_patterns, response_style)
  - Detección de patrones prohibidos (jailbreak, prompt injection)
  - Evaluación LLM-as-judge opcional
  - Scoring 6D: clarity, coherence, safety, effectiveness

- **PromptInjectionGuard** (`src/security/PromptInjectionGuard.ts`)
  - Detección de 8 tipos de ataques de inyección
  - Modos: strict, moderate, permissive
  - Sanitización automática de inputs maliciosos
  - Logging y estadísticas de intentos bloqueados
  - Patrones detectables:
    - Instruction override
    - Role hijacking
    - Jailbreak attempts
    - System prompt leakage
    - Delimiter injection
    - Encoding attacks
    - Context manipulation
    - Prompt smuggling

- **SecurityIntegration** (`src/security/SecurityIntegration.ts`)
  - Capa unificada que integra los tres componentes
  - Sistema de eventos para monitoreo
  - API simplificada para uso en agentes

### Cambiado

- Actualizado README.md con sección de seguridad
- Roadmap actualizado: v2.0 completado, v3.0 en progreso

### Seguridad

- Implementadas 7+ capas de seguridad basadas en Orbis
- Protección contra prompt injection con >30 patrones conocidos
- Sistema inmune para auto-recuperación de genes degradados

## [2.0.0] - 2026-03-03

### Añadido

- **PGA Platform** (Prompt Genómico Autoevolutivo)
  - GenomeV2 con 3 cromosomas (C0, C1, C2)
  - FitnessTracker con métricas 6D
  - MutationOperator con estrategias evolutivas
  - LayeredMemory para memoria semántica
  - GeneRegistry para compartir genes entre agentes
  - AgentIntegration para integración no-invasiva
  - PGAAPI para acceso simplificado

## [1.0.0] - 2026-02-15

### Añadido

- Fork inicial de OpenClaw
- 42+ extensiones de mensajería
- 54+ skills integrados
- Soporte multi-proveedor de IA
- Browser automation con Playwright

---

[3.0.0]: https://github.com/LuisvelMarketer/genoma/compare/v2.0.0...v3.0.0
[2.0.0]: https://github.com/LuisvelMarketer/genoma/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/LuisvelMarketer/genoma/releases/tag/v1.0.0
