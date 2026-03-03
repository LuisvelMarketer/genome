/**
 * ImmuneSystem — Auto-rollback system for genome variants
 * 
 * Monitors fitness in sliding windows and triggers rollback when
 * performance drops below threshold. Integrated with PGA FitnessTracker.
 * 
 * @author DeepAgent (adapted from Orbis security layer)
 * @since 2026-03-03 | Genoma v3.0
 */

import type { StorageAdapter } from '../pga/interfaces/StorageAdapter.js';
import type { GenomeV2, FitnessVector, OperativeGene } from '../pga/types/index.js';
import { sha256 } from '../pga/utils/hash.js';

// Immune system configuration
export interface ImmuneConfig {
    windowSize: number;           // Number of recent scores to consider (default: 5)
    dropThreshold: number;        // Max allowed fitness drop (default: 0.2 = 20%)
    minSamples: number;           // Minimum samples before immune activates (default: 3)
    autoRollback: boolean;        // Auto-rollback on immune trigger (default: true)
    quarantineDuration: number;   // Quarantine time in ms (default: 1 hour)
    notifyOnTrigger: boolean;     // Emit events on trigger (default: true)
}

export type GeneStatus = 'active' | 'retired' | 'immune_blocked' | 'quarantined';

export interface ImmuneEvent {
    type: 'immune_trigger' | 'quarantine' | 'rollback' | 'recovery';
    genomeId: string;
    geneId: string;
    timestamp: Date;
    details: {
        currentFitness: number;
        windowAvg: number;
        drop: number;
        status: GeneStatus;
    };
}

export interface GeneHealthStatus {
    geneId: string;
    status: GeneStatus;
    currentFitness: number;
    windowAvg: number;
    lastCheck: Date;
    quarantinedAt?: Date;
    quarantineExpiresAt?: Date;
}

const DEFAULT_IMMUNE_CONFIG: ImmuneConfig = {
    windowSize: 5,
    dropThreshold: 0.2,
    minSamples: 3,
    autoRollback: true,
    quarantineDuration: 3600000, // 1 hour
    notifyOnTrigger: true,
};

export class ImmuneSystem {
    private config: ImmuneConfig;
    private geneScores: Map<string, number[]> = new Map();
    private geneStatus: Map<string, GeneStatus> = new Map();
    private quarantineTimers: Map<string, Date> = new Map();
    private eventCallbacks: ((event: ImmuneEvent) => void)[] = [];

    constructor(
        private storage: StorageAdapter,
        private genome: GenomeV2,
        config: Partial<ImmuneConfig> = {},
    ) {
        this.config = { ...DEFAULT_IMMUNE_CONFIG, ...config };
        this.initializeGeneStatus();
    }

    /**
     * Initialize status for all genes in genome
     */
    private initializeGeneStatus(): void {
        for (const gene of this.genome.chromosomes.c1.operations) {
            if (!this.geneStatus.has(gene.id)) {
                this.geneStatus.set(gene.id, 'active');
                this.geneScores.set(gene.id, []);
            }
        }
    }

    /**
     * Record a fitness score and check immune response
     */
    async recordScore(geneId: string, score: number): Promise<ImmuneEvent | null> {
        const status = this.geneStatus.get(geneId);
        
        // Don't process quarantined or blocked genes
        if (status === 'quarantined' || status === 'immune_blocked') {
            await this.checkQuarantineExpiry(geneId);
            return null;
        }

        // Add score to window
        let scores = this.geneScores.get(geneId) || [];
        scores.push(score);
        
        // Keep only windowSize scores
        if (scores.length > this.config.windowSize) {
            scores = scores.slice(-this.config.windowSize);
        }
        this.geneScores.set(geneId, scores);

        // Check immune only if we have enough samples
        if (scores.length >= this.config.minSamples) {
            return this.checkImmune(geneId, score, scores);
        }

        return null;
    }

    /**
     * Check if immune response should trigger
     */
    private async checkImmune(
        geneId: string,
        currentScore: number,
        recentScores: number[],
    ): Promise<ImmuneEvent | null> {
        const windowAvg = recentScores.reduce((s, v) => s + v, 0) / recentScores.length;
        const drop = windowAvg - currentScore;

        // Immune triggered if drop exceeds threshold
        if (drop > this.config.dropThreshold) {
            const event = await this.triggerImmune(geneId, currentScore, windowAvg, drop);
            return event;
        }

        return null;
    }

    /**
     * Trigger immune response for a gene
     */
    private async triggerImmune(
        geneId: string,
        currentFitness: number,
        windowAvg: number,
        drop: number,
    ): Promise<ImmuneEvent> {
        const newStatus: GeneStatus = this.config.autoRollback ? 'quarantined' : 'immune_blocked';
        this.geneStatus.set(geneId, newStatus);

        // Set quarantine expiry
        if (this.config.autoRollback) {
            const expiresAt = new Date(Date.now() + this.config.quarantineDuration);
            this.quarantineTimers.set(geneId, expiresAt);
        }

        const event: ImmuneEvent = {
            type: 'immune_trigger',
            genomeId: this.genome.id,
            geneId,
            timestamp: new Date(),
            details: {
                currentFitness,
                windowAvg,
                drop,
                status: newStatus,
            },
        };

        // Log mutation event
        await this.storage.logMutation({
            genomeId: this.genome.id,
            layer: 1,
            gene: geneId,
            variant: null,
            mutationType: 'immune_trigger',
            parentVariant: null,
            triggerReason: 'fitness_drop',
            deployed: false,
            details: event.details,
            timestamp: new Date(),
            createdAt: new Date(),
        });

        // Notify listeners
        if (this.config.notifyOnTrigger) {
            this.emitEvent(event);
        }

        console.log(
            `[IMMUNE] 🛡️ Triggered: ${geneId} | drop=${(drop * 100).toFixed(1)}% | status=${newStatus}`
        );

        return event;
    }

    /**
     * Check and release quarantined genes
     */
    private async checkQuarantineExpiry(geneId: string): Promise<void> {
        const expiresAt = this.quarantineTimers.get(geneId);
        if (!expiresAt) return;

        if (new Date() >= expiresAt) {
            // Release from quarantine
            this.geneStatus.set(geneId, 'active');
            this.geneScores.set(geneId, []); // Reset scores
            this.quarantineTimers.delete(geneId);

            const event: ImmuneEvent = {
                type: 'recovery',
                genomeId: this.genome.id,
                geneId,
                timestamp: new Date(),
                details: {
                    currentFitness: 0,
                    windowAvg: 0,
                    drop: 0,
                    status: 'active',
                },
            };

            this.emitEvent(event);
            console.log(`[IMMUNE] ✅ Released from quarantine: ${geneId}`);
        }
    }

    /**
     * Get health status for all genes
     */
    getHealthReport(): GeneHealthStatus[] {
        const report: GeneHealthStatus[] = [];

        for (const gene of this.genome.chromosomes.c1.operations) {
            const scores = this.geneScores.get(gene.id) || [];
            const status = this.geneStatus.get(gene.id) || 'active';
            const quarantinedAt = status === 'quarantined' ? new Date() : undefined;

            report.push({
                geneId: gene.id,
                status,
                currentFitness: scores[scores.length - 1] || gene.fitness.composite,
                windowAvg: scores.length > 0 
                    ? scores.reduce((s, v) => s + v, 0) / scores.length 
                    : gene.fitness.composite,
                lastCheck: new Date(),
                quarantinedAt,
                quarantineExpiresAt: this.quarantineTimers.get(gene.id),
            });
        }

        return report;
    }

    /**
     * Get status for a specific gene
     */
    getGeneStatus(geneId: string): GeneStatus {
        return this.geneStatus.get(geneId) || 'active';
    }

    /**
     * Check if gene is available for use
     */
    isGeneAvailable(geneId: string): boolean {
        const status = this.geneStatus.get(geneId);
        return status === 'active' || status === undefined;
    }

    /**
     * Manually block a gene (admin action)
     */
    blockGene(geneId: string): void {
        this.geneStatus.set(geneId, 'immune_blocked');
        console.log(`[IMMUNE] ⛔ Gene manually blocked: ${geneId}`);
    }

    /**
     * Manually unblock a gene (admin action)
     */
    unblockGene(geneId: string): void {
        this.geneStatus.set(geneId, 'active');
        this.geneScores.set(geneId, []);
        this.quarantineTimers.delete(geneId);
        console.log(`[IMMUNE] ✅ Gene manually unblocked: ${geneId}`);
    }

    /**
     * Register callback for immune events
     */
    onEvent(callback: (event: ImmuneEvent) => void): void {
        this.eventCallbacks.push(callback);
    }

    private emitEvent(event: ImmuneEvent): void {
        for (const callback of this.eventCallbacks) {
            try {
                callback(event);
            } catch (e) {
                console.error('[IMMUNE] Event callback error:', e);
            }
        }
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<ImmuneConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): ImmuneConfig {
        return { ...this.config };
    }
}
