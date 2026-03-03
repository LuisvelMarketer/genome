# PGA - Prompt Genómico Autoevolutivo

## Descripción

PGA (Prompt Genómico Autoevolutivo) es un sistema de evolución automática de prompts para agentes de IA. Inspirado en la genética biológica, PGA permite que los agentes mejoren continuamente a través de mutaciones adaptativas basadas en métricas de rendimiento.

## Arquitectura

### Estructura de Cromosomas

```
GenomeV2
├── C0 (Inmutable) - Núcleo de identidad y seguridad
│   ├── identity: Identidad del agente
│   ├── ethics: Reglas éticas inviolables
│   └── security: Restricciones de seguridad
├── C1 (Operativo) - Genes mutables
│   └── operativeGenes[]: Patrones de comportamiento
│       ├── tool_usage: Cómo usar herramientas
│       ├── coding_patterns: Patrones de código
│       └── communication: Estilos de comunicación
└── C2 (Epigenético) - Adaptaciones de usuario
    ├── userEpigenome: Preferencias del usuario
    ├── contextPatterns: Patrones de contexto
    └── learnedBehaviors: Comportamientos aprendidos
```

### Componentes Core

- **GenomeKernel**: Protección de integridad de C0 mediante hashing criptográfico
- **GenomeManager**: CRUD de genomas
- **FitnessTracker**: Seguimiento de métricas de rendimiento 6D
- **PromptAssembler**: Ensamblaje de prompts desde genes
- **GeneRegistry**: Repositorio compartido de genes
- **MutationOperator**: Estrategias de mutación
- **Evaluator**: Evaluación de calidad de respuestas

### Métricas de Fitness 6D

1. **Accuracy** (Precisión): Correctitud de las respuestas
2. **Speed** (Velocidad): Tiempo de respuesta
3. **Cost** (Costo): Eficiencia en uso de tokens
4. **Safety** (Seguridad): Cumplimiento de políticas
5. **User Satisfaction** (Satisfacción): Feedback del usuario
6. **Adaptability** (Adaptabilidad): Variedad de herramientas usadas

## Integración con Genoma

### Uso Básico

```typescript
import { getGlobalPGABridge } from './src/pga/integration/GenomaAgentPGABridge';

const bridge = getGlobalPGABridge();

// Antes de ejecutar el agente
const evolvedPrompt = await bridge.beforeExecution({
  prompt: userPrompt,
  systemPrompt: baseSystemPrompt,
  context: {
    agentId: 'my-agent',
    sessionId: session.id,
    userId: user.id,
  }
});

// Ejecutar agente con prompt evolucionado
const result = await runAgent(evolvedPrompt);

// Después de la ejecución
await bridge.afterExecution(
  { ...context, prompt: userPrompt },
  {
    response: result.text,
    toolsUsed: result.tools,
    latencyMs: result.time,
    usage: result.tokens,
  },
  userFeedback
);
```

### API Interna

```typescript
import { PGAAPI, GenomaStorageAdapter, GenomaLLMAdapter } from './src/pga';

const api = new PGAAPI({
  storage: new GenomaStorageAdapter(),
  llm: new GenomaLLMAdapter(),
  config: { agentId: 'my-agent' }
});

await api.initialize();

// Obtener genes activos
const genes = api.getActiveGenes();

// Registrar feedback
await api.recordFeedback(4.5, 'Excelente respuesta');

// Forzar evolución
await api.forceEvolution();

// Obtener estado
const status = api.getEvolutionStatus();
```

## Configuración

### Feature Flags

```typescript
import { getPGAConfigForEnvironment } from './src/pga/config';

const config = getPGAConfigForEnvironment('production');

// Deshabilitar PGA completamente
config.featureFlags.enabled = false;

// Deshabilitar mutación automática
config.featureFlags.autoMutationEnabled = false;
```

### Parámetros de Evolución

```typescript
config.evolution = {
  mutationInterval: 50,      // Interacciones entre mutaciones
  fitnessThreshold: 0.6,     // Umbral para trigger de mutación
  rollbackThreshold: 0.15,   // Caída de fitness que activa rollback
  maxMutationsPerCycle: 3,   // Máximo de genes mutados por ciclo
  mutationCooldownMs: 60000, // Enfriamiento entre mutaciones
};
```

## Sistema de Rollback

PGA incluye un sistema de rollback automático que:

1. Crea snapshots antes de cada mutación
2. Monitorea el fitness después de mutaciones
3. Revierte automáticamente si el fitness cae significativamente
4. Mantiene historial de versiones para rollback manual

```typescript
// Rollback manual
await api.forceRollback();
```

## Logging y Monitoreo

```typescript
import { PGALogger } from './src/pga/integration/PGALogger';

const logger = new PGALogger(true); // verbose mode

// Los logs incluyen:
// - Mutaciones aplicadas
// - Fitness tracking
// - Rollbacks
// - Violaciones de integridad

const recentLogs = logger.getRecentLogs(100);
const errorLogs = logger.getLogsByLevel('error');
```

## Estructura de Archivos

```
src/pga/
├── index.ts                 # Entry point principal
├── types/                   # Definiciones de tipos
│   ├── GenomeV2.ts
│   └── genoma-pga.types.ts
├── interfaces/              # Contratos de adaptadores
│   ├── StorageAdapter.ts
│   └── LLMAdapter.ts
├── core/                    # Componentes fundamentales
│   ├── GenomeKernel.ts
│   ├── GenomeManager.ts
│   ├── FitnessTracker.ts
│   ├── PromptAssembler.ts
│   └── GeneRegistry.ts
├── memory/                  # Sistema de memoria
│   └── LayeredMemory.ts
├── evolution/               # Sistema de evolución
│   └── MutationOperator.ts
├── evaluation/              # Evaluación de respuestas
│   └── Evaluator.ts
├── integration/             # Integración con Genoma
│   ├── AgentIntegration.ts
│   ├── PGAAgentWrapper.ts
│   ├── PGAAPI.ts
│   ├── GenomaAgentPGABridge.ts
│   ├── hooks.ts
│   ├── PGALogger.ts
│   ├── PGARollbackManager.ts
│   └── PGAMetricsCollector.ts
├── adapters/                # Adaptadores externos
│   ├── GenomaStorageAdapter.ts
│   └── GenomaLLMAdapter.ts
├── config/                  # Configuración
│   ├── default-config.ts
│   └── pga-integration.config.ts
├── utils/                   # Utilidades
│   ├── hash.ts
│   └── serialization.ts
└── database/                # Esquema de BD
    └── schema.sql
```

## Seguridad

- **C0 Inmutable**: El núcleo de identidad y seguridad no puede ser modificado
- **Verificación Criptográfica**: SHA-256 para validar integridad
- **Cuarentena Automática**: Genomas comprometidos son aislados
- **Rollback de Emergencia**: Reversión instantánea ante violaciones

## Licencia

Propietario - © Orbis Global Dynamics
