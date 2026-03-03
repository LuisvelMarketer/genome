/**
 * SecurityIntegration — Unified security layer for PGA Platform
 * 
 * Integrates ImmuneSystem, MutationEvaluator, and PromptInjectionGuard
 * with the PGA evolutionary system.
 * 
 * @author DeepAgent
 * @since 2026-03-03 | Genoma v3.0
 */

import type { StorageAdapter } from '../pga/interfaces/StorageAdapter.js';
import type { LLMAdapter } from '../pga/interfaces/LLMAdapter.js';
import type { GenomeV2, OperativeGene } from '../pga/types/index.js';

import { ImmuneSystem, ImmuneConfig, ImmuneEvent, GeneStatus } from './ImmuneSystem.js';
import { MutationEvaluator, EvaluatorConfig, EvaluationResult } from './MutationEvaluator.js';
import { PromptInjectionGuard, GuardConfig, ScanResult, ThreatLevel } from './PromptInjectionGuard.js';

export interface SecurityConfig {
    enabled: boolean;
    immune: Partial<ImmuneConfig>;
    evaluator: Partial<EvaluatorConfig>;
    guard: Partial<GuardConfig>;
}

export interface SecurityStatus {
    enabled: boolean;
    immuneSystem: {
        active: boolean;
        blockedGenes: number;
        quarantinedGenes: number;
    };
    injectionGuard: {
        mode: string;
        totalScans: number;
        blockedAttempts: number;
    };
    lastCheck: Date;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    enabled: true,
    immune: {},
    evaluator: {},
    guard: { mode: 'moderate' },
};

/**
 * Unified security integration for Genoma v3.0
 */
export class SecurityIntegration {
    private config: SecurityConfig;
    private immuneSystem: ImmuneSystem;
    private mutationEvaluator: MutationEvaluator;
    private injectionGuard: PromptInjectionGuard;
    private eventCallbacks: ((event: SecurityEvent) => void)[] = [];

    constructor(
        private storage: StorageAdapter,
        private genome: GenomeV2,
        private llmAdapter?: LLMAdapter,
        config: Partial<SecurityConfig> = {},
    ) {
        this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };

        // Initialize components
        this.immuneSystem = new ImmuneSystem(storage, genome, this.config.immune);
        this.mutationEvaluator = new MutationEvaluator(llmAdapter, this.config.evaluator);
        this.injectionGuard = new PromptInjectionGuard(this.config.guard);

        // Wire up immune events
        this.immuneSystem.onEvent((event) => {
            this.emitEvent({
                type: 'immune',
                source: 'ImmuneSystem',
                data: event,
                timestamp: new Date(),
            });
        });

        console.log('[SECURITY] 🛡️ Security integration initialized');
    }

    // ─── Input Protection ───────────────────────────────────────

    /**
     * Scan user input for injection attempts
     */
    scanInput(input: string): ScanResult {
        if (!this.config.enabled) {
            return {
                safe: true,
                threatLevel: 'none',
                threats: [],
                originalHash: '',
                scannedAt: new Date(),
            };
        }

        const result = this.injectionGuard.scan(input);

        if (!result.safe) {
            this.emitEvent({
                type: 'injection_attempt',
                source: 'PromptInjectionGuard',
                data: result,
                timestamp: new Date(),
            });
        }

        return result;
    }

    /**
     * Sanitize input (remove threats)
     */
    sanitizeInput(input: string): string {
        return this.injectionGuard.sanitize(input);
    }

    /**
     * Quick check if input is safe
     */
    isInputSafe(input: string): boolean {
        return this.injectionGuard.isSafe(input);
    }

    // ─── Mutation Validation ────────────────────────────────────

    /**
     * Validate a mutation before deployment
     */
    async validateMutation(mutation: OperativeGene): Promise<EvaluationResult> {
        if (!this.config.enabled) {
            return {
                passed: true,
                score: 1.0,
                safetyScore: 1.0,
                details: {
                    testResults: [],
                    securityFlags: [],
                    recommendations: [],
                },
                evaluatedAt: new Date(),
                duration: 0,
            };
        }

        const result = await this.mutationEvaluator.evaluate(mutation);

        if (!result.passed) {
            this.emitEvent({
                type: 'mutation_blocked',
                source: 'MutationEvaluator',
                data: { geneId: mutation.id, result },
                timestamp: new Date(),
            });
        }

        return result;
    }

    /**
     * Validate multiple mutations
     */
    async validateMutations(mutations: OperativeGene[]): Promise<Map<string, EvaluationResult>> {
        return this.mutationEvaluator.evaluateBatch(mutations);
    }

    // ─── Immune System ──────────────────────────────────────────

    /**
     * Record fitness score (triggers immune check)
     */
    async recordFitness(geneId: string, score: number): Promise<ImmuneEvent | null> {
        if (!this.config.enabled) return null;
        return this.immuneSystem.recordScore(geneId, score);
    }

    /**
     * Get gene availability status
     */
    isGeneAvailable(geneId: string): boolean {
        return this.immuneSystem.isGeneAvailable(geneId);
    }

    /**
     * Get gene status
     */
    getGeneStatus(geneId: string): GeneStatus {
        return this.immuneSystem.getGeneStatus(geneId);
    }

    /**
     * Get health report for all genes
     */
    getHealthReport() {
        return this.immuneSystem.getHealthReport();
    }

    /**
     * Manually block a gene
     */
    blockGene(geneId: string): void {
        this.immuneSystem.blockGene(geneId);
        this.emitEvent({
            type: 'gene_blocked',
            source: 'Admin',
            data: { geneId },
            timestamp: new Date(),
        });
    }

    /**
     * Manually unblock a gene
     */
    unblockGene(geneId: string): void {
        this.immuneSystem.unblockGene(geneId);
        this.emitEvent({
            type: 'gene_unblocked',
            source: 'Admin',
            data: { geneId },
            timestamp: new Date(),
        });
    }

    // ─── Status & Configuration ─────────────────────────────────

    /**
     * Get current security status
     */
    getStatus(): SecurityStatus {
        const healthReport = this.immuneSystem.getHealthReport();
        const guardStats = this.injectionGuard.getStatistics();

        return {
            enabled: this.config.enabled,
            immuneSystem: {
                active: this.config.enabled,
                blockedGenes: healthReport.filter(g => g.status === 'immune_blocked').length,
                quarantinedGenes: healthReport.filter(g => g.status === 'quarantined').length,
            },
            injectionGuard: {
                mode: this.injectionGuard.getConfig().mode,
                totalScans: guardStats.totalScans,
                blockedAttempts: guardStats.blockedAttempts,
            },
            lastCheck: new Date(),
        };
    }

    /**
     * Enable/disable security
     */
    setEnabled(enabled: boolean): void {
        this.config.enabled = enabled;
        console.log(`[SECURITY] ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...config };

        if (config.immune) {
            this.immuneSystem.updateConfig(config.immune);
        }
        if (config.evaluator) {
            this.mutationEvaluator.updateConfig(config.evaluator);
        }
        if (config.guard) {
            this.injectionGuard.updateConfig(config.guard);
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): SecurityConfig {
        return { ...this.config };
    }

    // ─── Event System ───────────────────────────────────────────

    /**
     * Subscribe to security events
     */
    onEvent(callback: (event: SecurityEvent) => void): void {
        this.eventCallbacks.push(callback);
    }

    private emitEvent(event: SecurityEvent): void {
        for (const callback of this.eventCallbacks) {
            try {
                callback(event);
            } catch (e) {
                console.error('[SECURITY] Event callback error:', e);
            }
        }
    }
}

export interface SecurityEvent {
    type: 'immune' | 'injection_attempt' | 'mutation_blocked' | 'gene_blocked' | 'gene_unblocked';
    source: string;
    data: unknown;
    timestamp: Date;
}
