/**
 * Genome Contract v2 - Living OS Foundation
 * Adapted for Genoma v2.0 integration
 *
 * @see docs/pga-integration-design.md
 * @author DeepAgent
 * @since 2026-03-03
 */

// ─── Core Genome Structure ──────────────────────────────────

/**
 * Genome v2 - Complete organism with integrity protection
 */
export interface GenomeV2 {
  id: string;
  name: string;
  familyId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;

  chromosomes: {
    c0: Chromosome0;
    c1: Chromosome1;
    c2: Chromosome2;
  };

  integrity: IntegrityMetadata;
  lineage: LineageMetadata;
  fitness: FitnessVector;
  config: GenomeConfig;
  state: GenomeState;
  tags: string[];
}

// ─── Chromosomes ────────────────────────────────────────────

/**
 * Chromosome 0 (C0) - Immutable Core
 * Protected by SHA-256 cryptographic hash verification.
 */
export interface Chromosome0 {
  identity: {
    role: string;
    purpose: string;
    constraints: string[];
  };

  security: {
    forbiddenTopics: string[];
    accessControls: string[];
    safetyRules: string[];
  };

  attribution: {
    creator: string;
    copyright: string;
    license: string;
  };

  metadata: {
    version: string;
    createdAt: Date;
  };
}

/**
 * Chromosome 1 (C1) - Operative Genes
 */
export interface Chromosome1 {
  operations: OperativeGene[];
  metadata: {
    lastMutated: Date;
    mutationCount: number;
    avgFitnessGain: number;
  };
}

/**
 * Operative Gene - Single functional unit in C1
 */
export interface OperativeGene {
  id: string;
  category: GeneCategory;
  content: string;
  fitness: FitnessVector;
  origin: GeneOrigin;
  sourceGeneId?: string;
  usageCount: number;
  lastUsed: Date;
  successRate: number;
  /** Estimated token count of content. Used for evolutionary compression. */
  tokenCount?: number;
}

export type GeneCategory =
  | "tool-usage"
  | "coding-patterns"
  | "reasoning"
  | "communication"
  | "data-processing"
  | "error-handling";

export type GeneOrigin = "mutation" | "inheritance" | "initial" | "manual";

/**
 * Chromosome 2 (C2) - Epigenetic Adaptations
 */
export interface Chromosome2 {
  userAdaptations: Map<string, UserEpigenome>;
  contextPatterns: ContextGene[];
  metadata: {
    lastMutated: Date;
    adaptationRate: number;
    totalUsers: number;
  };
}

export interface UserEpigenome {
  userId: string;
  preferences: UserPreferences;
  learned: LearnedPatterns;
  fitness: FitnessVector;
  firstInteraction: Date;
  lastInteraction: Date;
  interactionCount: number;
}

export interface UserPreferences {
  communicationStyle: "formal" | "casual" | "technical" | "creative";
  verbosity: "terse" | "balanced" | "detailed";
  tone: "professional" | "friendly" | "direct";
}

export interface LearnedPatterns {
  preferredTools: string[];
  commonTopics: string[];
  peakHours: number[];
  domainExpertise: Map<string, number>;
}

export interface ContextGene {
  id: string;
  pattern: string;
  trigger: string;
  adaptation: string;
  fitness: number;
  usageCount: number;
}

// ─── Integrity & Security ───────────────────────────────────

export interface IntegrityMetadata {
  c0Hash: string;
  lastVerified: Date;
  violations: number;
  quarantined: boolean;
  quarantineReason?: string;
}

// ─── Lineage & Inheritance ──────────────────────────────────

export interface LineageMetadata {
  parentVersion?: number;
  originGenome?: string;
  inheritedGenes: InheritedGene[];
  mutations: MutationRecord[];
}

export interface InheritedGene {
  geneId: string;
  inheritedFrom: string;
  inheritedAt: Date;
  fitnessBeforeInheritance: number;
  fitnessAfterInheritance: number;
  fitnessGain: number;
  active: boolean;
  validated: boolean;
  validationResults?: ValidationResults;
}

export interface MutationRecord {
  id: string;
  timestamp: Date;
  chromosome: "c0" | "c1" | "c2";
  operation: MutationType;
  before: string;
  after: string;
  diff: string;
  trigger: MutationTrigger;
  reason: string;
  sandboxTested: boolean;
  testResults?: EvaluationResult;
  promoted: boolean;
  rollbackAt?: Date;
  rollbackReason?: string;
  proposer: "system" | "user" | "inheritance";
}

export type MutationTrigger =
  | "drift-detected"
  | "feedback"
  | "inheritance"
  | "manual"
  | "scheduled"
  | "emergency-rollback";

export type MutationType =
  | "compress_instructions"
  | "reorder_constraints"
  | "safety_reinforcement"
  | "tool_selection_bias"
  | "inherit_gene"
  | "rollback"
  | "manual_edit"
  | "emergency_fix";

// ─── Multi-Objective Fitness ────────────────────────────────

/**
 * Fitness Vector - 6D Multi-dimensional genome evaluation
 */
export interface FitnessVector {
  accuracy: number; // 0-1: Output correctness
  speed: number; // 0-1: Response latency (normalized)
  cost: number; // 0-1: Token efficiency
  safety: number; // 0-1: Safety compliance
  userSatisfaction: number; // 0-1: User feedback score
  adaptability: number; // 0-1: Learning rate
  composite: number; // 0-1: Weighted average
  sampleSize: number;
  lastUpdated: Date;
  confidence: number;
}

export interface FitnessWeights {
  accuracy: number;
  speed: number;
  cost: number;
  safety: number;
  userSatisfaction: number;
  adaptability: number;
}

export type GenomeState = "active" | "quarantined" | "testing" | "archived" | "migrating";

// ─── Validation & Evaluation ────────────────────────────────

export interface ValidationResults {
  passed: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  testDuration: number;
  testedAt: Date;
}

export interface EvaluationResult {
  success: boolean;
  fitness: FitnessVector;
  tasks: TaskResult[];
  duration: number;
  timestamp: Date;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  quality: number;
  tokens: number;
  latency: number;
  error?: string;
}

// ─── Genome Configuration ───────────────────────────────────

export interface GenomeConfig {
  mutationRate: "conservative" | "balanced" | "aggressive";
  epsilonExplore: number;
  enableSandbox: boolean;
  sandboxModel?: string;
  fitnessWeights?: FitnessWeights;
  minFitnessImprovement: number;
  enableIntegrityCheck: boolean;
  autoRollbackThreshold: number;
  allowInheritance: boolean;
  minCompatibilityScore: number;
}

// ─── Utility Types ──────────────────────────────────────────

export interface GenomeSnapshot {
  genomeId: string;
  version: number;
  snapshot: GenomeV2;
  createdAt: Date;
  reason: string;
}

export interface GenomeDiff {
  from: number;
  to: number;
  changes: GenomeChange[];
  impactScore: number;
}

export interface GenomeChange {
  path: string;
  operation: "add" | "remove" | "modify";
  before?: unknown;
  after?: unknown;
}

// ─── Backward Compatibility ─────────────────────────────────

export type Genome = GenomeV2;

export type Layer = 0 | 1 | 2;

export interface GeneAllele {
  gene: string;
  variant: string;
  content: string;
  fitness: number;
  status: "active" | "retired" | "candidate" | "quarantine";
  sampleCount?: number;
  recentScores?: number[];
  parentVariant?: string;
  origin?: GeneOrigin;
  createdAt: Date;
}

export interface SelectionContext {
  userId?: string;
  taskType?: string;
  model?: string;
  sessionId?: string;
}

export interface UserDNA {
  userId: string;
  genomeId: string;
  preferences: UserPreferences;
  learnedPatterns: LearnedPatterns;
  interactionCount: number;
  firstInteraction: Date;
  lastInteraction: Date;
}

export interface MutationLog {
  genomeId: string;
  layer: Layer;
  gene: string;
  variant: string | null;
  mutationType: string;
  parentVariant: string | null;
  triggerReason: string;
  deployed: boolean;
  details: Record<string, unknown>;
  timestamp: Date;
  createdAt: Date;
}
