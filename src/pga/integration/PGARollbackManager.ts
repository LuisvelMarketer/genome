/**
 * @fileoverview Manager de rollback para el sistema PGA
 * 
 * Gestiona snapshots del genoma para permitir rollbacks cuando
 * las mutaciones empeoran el rendimiento.
 */

import type { GenomeV2 } from '../types/index.js';
import type { StorageAdapter } from '../interfaces/StorageAdapter.js';
import { deepClone } from '../utils/serialization.js';

export interface GenomeSnapshot {
  id: string;
  genomeId: string;
  version: number;
  timestamp: number;
  genome: GenomeV2;
  fitness: number; // Average fitness at snapshot time
  reason: string;
}

/**
 * PGARollbackManager manages genome snapshots for rollback capability.
 */
export class PGARollbackManager {
  private readonly storage: StorageAdapter;
  private readonly maxSnapshots: number;
  private readonly rollbackThreshold: number;
  private readonly snapshots: Map<string, GenomeSnapshot[]> = new Map();

  constructor(
    storage: StorageAdapter,
    maxSnapshots = 10,
    rollbackThreshold = 0.15
  ) {
    this.storage = storage;
    this.maxSnapshots = maxSnapshots;
    this.rollbackThreshold = rollbackThreshold;
  }

  /**
   * Create a snapshot of the current genome state
   */
  async createSnapshot(
    genome: GenomeV2,
    reason = 'pre_mutation'
  ): Promise<GenomeSnapshot> {
    const avgFitness = this.calculateAverageFitness(genome);
    
    const snapshot: GenomeSnapshot = {
      id: `snap-${genome.id}-${Date.now()}`,
      genomeId: genome.id,
      version: genome.version,
      timestamp: Date.now(),
      genome: deepClone(genome),
      fitness: avgFitness,
      reason,
    };

    // Store in memory
    const genomeSnapshots = this.snapshots.get(genome.id) || [];
    genomeSnapshots.push(snapshot);
    
    // Trim to max snapshots
    while (genomeSnapshots.length > this.maxSnapshots) {
      genomeSnapshots.shift();
    }
    
    this.snapshots.set(genome.id, genomeSnapshots);
    
    console.log(`[PGA] Snapshot created: ${snapshot.id} (v${genome.version}, fitness: ${avgFitness.toFixed(3)})`);
    
    return snapshot;
  }

  /**
   * Rollback to the previous snapshot
   */
  async rollback(genomeId: string): Promise<GenomeV2 | null> {
    const genomeSnapshots = this.snapshots.get(genomeId);
    
    if (!genomeSnapshots || genomeSnapshots.length === 0) {
      console.warn(`[PGA] No snapshots available for rollback: ${genomeId}`);
      return null;
    }

    // Get the previous snapshot (not the most recent one, which is current state)
    const snapshotIndex = genomeSnapshots.length >= 2 
      ? genomeSnapshots.length - 2 
      : genomeSnapshots.length - 1;
    
    const snapshot = genomeSnapshots[snapshotIndex];
    
    // Remove all snapshots after the rollback point
    genomeSnapshots.splice(snapshotIndex + 1);
    this.snapshots.set(genomeId, genomeSnapshots);
    
    console.log(`[PGA] Rolled back to snapshot: ${snapshot.id} (v${snapshot.version})`);
    
    return deepClone(snapshot.genome);
  }

  /**
   * Rollback to a specific version
   */
  async rollbackToVersion(genomeId: string, version: number): Promise<GenomeV2 | null> {
    const genomeSnapshots = this.snapshots.get(genomeId);
    
    if (!genomeSnapshots || genomeSnapshots.length === 0) {
      return null;
    }

    const snapshot = genomeSnapshots.find(s => s.version === version);
    
    if (!snapshot) {
      console.warn(`[PGA] No snapshot found for version ${version}`);
      return null;
    }

    // Remove all snapshots after the rollback point
    const index = genomeSnapshots.indexOf(snapshot);
    genomeSnapshots.splice(index + 1);
    this.snapshots.set(genomeId, genomeSnapshots);
    
    console.log(`[PGA] Rolled back to version: ${version}`);
    
    return deepClone(snapshot.genome);
  }

  /**
   * Check if rollback is recommended based on fitness drop
   */
  shouldRollback(
    genomeId: string,
    currentFitness: number
  ): { shouldRollback: boolean; previousFitness?: number; drop?: number } {
    const genomeSnapshots = this.snapshots.get(genomeId);
    
    if (!genomeSnapshots || genomeSnapshots.length === 0) {
      return { shouldRollback: false };
    }

    const latestSnapshot = genomeSnapshots[genomeSnapshots.length - 1];
    const previousFitness = latestSnapshot.fitness;
    const drop = previousFitness - currentFitness;

    return {
      shouldRollback: drop > this.rollbackThreshold,
      previousFitness,
      drop,
    };
  }

  /**
   * Get all snapshots for a genome
   */
  getSnapshots(genomeId: string): GenomeSnapshot[] {
    return this.snapshots.get(genomeId) || [];
  }

  /**
   * Get the best performing snapshot
   */
  getBestSnapshot(genomeId: string): GenomeSnapshot | null {
    const genomeSnapshots = this.snapshots.get(genomeId);
    
    if (!genomeSnapshots || genomeSnapshots.length === 0) {
      return null;
    }

    return genomeSnapshots.reduce((best, current) => 
      current.fitness > best.fitness ? current : best
    );
  }

  /**
   * Clear all snapshots for a genome
   */
  clearSnapshots(genomeId: string): void {
    this.snapshots.delete(genomeId);
  }

  private calculateAverageFitness(genome: GenomeV2): number {
    const f = genome.fitness;
    return (
      f.accuracy +
      f.speed +
      f.cost +
      f.safety +
      f.userSatisfaction +
      f.adaptability
    ) / 6;
  }
}
