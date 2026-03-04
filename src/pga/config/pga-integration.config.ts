/**
 * @fileoverview Configuración de integración PGA con Genoma
 *
 * Este archivo define las configuraciones para habilitar/deshabilitar
 * y ajustar el comportamiento del sistema PGA en Genoma.
 */

import type { PGAAgentIntegrationConfig } from "../integration/AgentIntegration.js";

// ============================================================================
// Feature Flags
// ============================================================================

export interface PGAFeatureFlags {
  /** Master switch for PGA system */
  enabled: boolean;
  /** Enable genomic evolution */
  evolutionEnabled: boolean;
  /** Enable fitness tracking */
  fitnessTrackingEnabled: boolean;
  /** Enable automatic mutations */
  autoMutationEnabled: boolean;
  /** Enable automatic rollback */
  autoRollbackEnabled: boolean;
  /** Enable layered memory */
  memoryEnabled: boolean;
  /** Enable gene registry */
  registryEnabled: boolean;
  /** Enable verbose logging */
  verboseLogging: boolean;
  /** Enable metrics collection */
  metricsEnabled: boolean;
}

export const DEFAULT_FEATURE_FLAGS: PGAFeatureFlags = {
  enabled: false, // Disabled by default for safety
  evolutionEnabled: true,
  fitnessTrackingEnabled: true,
  autoMutationEnabled: true,
  autoRollbackEnabled: true,
  memoryEnabled: true,
  registryEnabled: true,
  verboseLogging: false,
  metricsEnabled: true,
};

// ============================================================================
// Evolution Configuration
// ============================================================================

export interface EvolutionConfig {
  /** Number of interactions before mutation is considered */
  mutationInterval: number;
  /** Minimum fitness score to avoid mutation trigger */
  fitnessThreshold: number;
  /** Percentage drop that triggers rollback */
  rollbackThreshold: number;
  /** Maximum mutations per evolution cycle */
  maxMutationsPerCycle: number;
  /** Mutation strategies to use */
  mutationStrategies: ("llm_rewrite" | "parameter_tweak" | "simplify" | "combine" | "compress")[];
  /** Cooldown period between mutations (ms) */
  mutationCooldownMs: number;
  /** Maximum tokens for C1 gene injection */
  c1TokenBudget: number;
  /** Genes above this token count are candidates for compression */
  compressionTokenThreshold: number;
  /** Minimum functional fitness to trigger compress instead of rewrite */
  compressionFitnessThreshold: number;
  /** Compress token-heavy genes at initialization (before first execution) */
  eagerCompress: boolean;
}

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  mutationInterval: 50,
  fitnessThreshold: 0.6,
  rollbackThreshold: 0.15,
  maxMutationsPerCycle: 3,
  mutationStrategies: ["llm_rewrite", "simplify", "compress"],
  mutationCooldownMs: 60000, // 1 minute
  c1TokenBudget: 2000,
  compressionTokenThreshold: 100,
  compressionFitnessThreshold: 0.7,
  eagerCompress: true,
};

// ============================================================================
// Fitness Configuration
// ============================================================================

export interface FitnessConfig {
  /** Weights for 6D fitness calculation */
  weights: {
    accuracy: number;
    speed: number;
    cost: number;
    safety: number;
    userSatisfaction: number;
    adaptability: number;
  };
  /** EMA alpha for fitness updates */
  emaAlpha: number;
  /** Minimum samples before fitness is considered stable */
  minSamplesForStability: number;
}

export const DEFAULT_FITNESS_CONFIG: FitnessConfig = {
  weights: {
    accuracy: 0.25,
    speed: 0.15,
    cost: 0.1,
    safety: 0.2,
    userSatisfaction: 0.2,
    adaptability: 0.1,
  },
  emaAlpha: 0.3,
  minSamplesForStability: 10,
};

// ============================================================================
// Storage Configuration
// ============================================================================

export interface StorageConfig {
  /** Storage backend type */
  type: "memory" | "file" | "database";
  /** File path for file storage */
  filePath?: string;
  /** Database connection string */
  connectionString?: string;
  /** Maximum snapshots to keep for rollback */
  maxSnapshots: number;
  /** Maximum interactions to store */
  maxInteractions: number;
  /** Maximum mutations to store */
  maxMutations: number;
}

export const DEFAULT_STORAGE_CONFIG: StorageConfig = {
  type: "memory",
  maxSnapshots: 10,
  maxInteractions: 1000,
  maxMutations: 500,
};

// ============================================================================
// Complete PGA Configuration
// ============================================================================

export interface PGAConfig {
  featureFlags: PGAFeatureFlags;
  evolution: EvolutionConfig;
  fitness: FitnessConfig;
  storage: StorageConfig;
}

export const DEFAULT_PGA_CONFIG: PGAConfig = {
  featureFlags: DEFAULT_FEATURE_FLAGS,
  evolution: DEFAULT_EVOLUTION_CONFIG,
  fitness: DEFAULT_FITNESS_CONFIG,
  storage: DEFAULT_STORAGE_CONFIG,
};

// ============================================================================
// Environment-specific Configurations
// ============================================================================

export const DEVELOPMENT_PGA_CONFIG: Partial<PGAConfig> = {
  featureFlags: {
    ...DEFAULT_FEATURE_FLAGS,
    enabled: true,
    verboseLogging: true,
  },
  evolution: {
    ...DEFAULT_EVOLUTION_CONFIG,
    mutationInterval: 10, // More frequent for testing
  },
};

export const PRODUCTION_PGA_CONFIG: Partial<PGAConfig> = {
  featureFlags: {
    ...DEFAULT_FEATURE_FLAGS,
    enabled: true,
    verboseLogging: false,
  },
  evolution: {
    ...DEFAULT_EVOLUTION_CONFIG,
    mutationInterval: 100, // Less frequent in production
    mutationCooldownMs: 300000, // 5 minutes
  },
};

export const TESTING_PGA_CONFIG: Partial<PGAConfig> = {
  featureFlags: {
    ...DEFAULT_FEATURE_FLAGS,
    enabled: true,
    autoMutationEnabled: false, // Manual control in tests
    autoRollbackEnabled: false,
  },
  evolution: {
    ...DEFAULT_EVOLUTION_CONFIG,
    mutationInterval: 5,
  },
};

// ============================================================================
// Configuration Helpers
// ============================================================================

/**
 * Get PGA configuration for current environment
 */
export function getPGAConfigForEnvironment(env?: string): PGAConfig {
  const environment = env ?? process.env.NODE_ENV ?? "development";

  let config: PGAConfig;
  switch (environment) {
    case "production":
      config = mergeConfigs(DEFAULT_PGA_CONFIG, PRODUCTION_PGA_CONFIG);
      break;
    case "test":
    case "testing":
      config = mergeConfigs(DEFAULT_PGA_CONFIG, TESTING_PGA_CONFIG);
      break;
    case "development":
    default:
      config = mergeConfigs(DEFAULT_PGA_CONFIG, DEVELOPMENT_PGA_CONFIG);
      break;
  }

  // GENOMA_PGA_ENABLED env var overrides the environment default
  const pgaEnv = process.env.GENOMA_PGA_ENABLED;
  if (pgaEnv !== undefined) {
    config.featureFlags.enabled = pgaEnv === "true" || pgaEnv === "1";
  }

  return config;
}

/**
 * Merge partial config with defaults
 */
export function mergeConfigs(base: PGAConfig, override: Partial<PGAConfig>): PGAConfig {
  return {
    featureFlags: { ...base.featureFlags, ...override.featureFlags },
    evolution: { ...base.evolution, ...override.evolution },
    fitness: { ...base.fitness, ...override.fitness },
    storage: { ...base.storage, ...override.storage },
  };
}

/**
 * Convert PGAConfig to PGAAgentIntegrationConfig
 */
export function toPGAAgentIntegrationConfig(
  config: PGAConfig,
  agentId: string,
  userId?: string,
): PGAAgentIntegrationConfig {
  return {
    enabled: config.featureFlags.enabled,
    agentId,
    userId,
    mutationInterval: config.evolution.mutationInterval,
    fitnessThreshold: config.evolution.fitnessThreshold,
    autoRollback: config.featureFlags.autoRollbackEnabled,
    rollbackThreshold: config.evolution.rollbackThreshold,
    verboseLogging: config.featureFlags.verboseLogging,
    maxSnapshots: config.storage.maxSnapshots,
  };
}

/**
 * Validate PGA configuration
 */
export function validatePGAConfig(config: PGAConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate evolution config
  if (config.evolution.mutationInterval < 1) {
    errors.push("mutationInterval must be at least 1");
  }
  if (config.evolution.fitnessThreshold < 0 || config.evolution.fitnessThreshold > 1) {
    errors.push("fitnessThreshold must be between 0 and 1");
  }
  if (config.evolution.rollbackThreshold < 0 || config.evolution.rollbackThreshold > 1) {
    errors.push("rollbackThreshold must be between 0 and 1");
  }

  // Validate fitness weights sum
  const weights = Object.values(config.fitness.weights);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  if (Math.abs(weightSum - 1) > 0.01) {
    errors.push(`Fitness weights must sum to 1, got ${weightSum}`);
  }

  // Validate storage config
  if (config.storage.maxSnapshots < 1) {
    errors.push("maxSnapshots must be at least 1");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
