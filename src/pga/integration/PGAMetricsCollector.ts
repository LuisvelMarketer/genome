/**
 * @fileoverview Collector de métricas para el sistema PGA
 * 
 * Recolecta y agrega métricas de evolución para monitoreo y análisis.
 */

import type { FitnessVector } from '../types/index.js';

export interface MetricsSummary {
  totalInteractions: number;
  totalMutations: number;
  totalRollbacks: number;
  averageFitness: FitnessVector;
  fitnessHistory: Array<{ timestamp: number; fitness: FitnessVector }>;
  mutationHistory: Array<{ timestamp: number; geneName: string; success: boolean }>;
  rollbackHistory: Array<{ timestamp: number; reason: string; fromVersion: number; toVersion: number }>;
  currentStreak: number; // Consecutive improvements
  bestFitness: number;
  worstFitness: number;
  uptime: number;
}

/**
 * PGAMetricsCollector collects and aggregates PGA evolution metrics.
 */
export class PGAMetricsCollector {
  private readonly startTime: number;
  private totalInteractions = 0;
  private totalMutations = 0;
  private totalRollbacks = 0;
  private currentStreak = 0;
  private bestFitness = 0;
  private worstFitness = 1;
  private lastFitnessAvg = 0;
  
  private readonly fitnessHistory: Array<{ timestamp: number; fitness: FitnessVector }> = [];
  private readonly mutationHistory: Array<{ timestamp: number; geneName: string; success: boolean }> = [];
  private readonly rollbackHistory: Array<{ timestamp: number; reason: string; fromVersion: number; toVersion: number }> = [];
  
  private readonly maxHistorySize = 1000;
  
  // Running averages for fitness
  private fitnessSum: FitnessVector = {
    accuracy: 0,
    speed: 0,
    cost: 0,
    safety: 0,
    userSatisfaction: 0,
    adaptability: 0,
  };

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Record a fitness measurement
   */
  recordFitness(fitness: FitnessVector): void {
    this.totalInteractions++;
    
    // Update running sum
    this.fitnessSum.accuracy += fitness.accuracy;
    this.fitnessSum.speed += fitness.speed;
    this.fitnessSum.cost += fitness.cost;
    this.fitnessSum.safety += fitness.safety;
    this.fitnessSum.userSatisfaction += fitness.userSatisfaction;
    this.fitnessSum.adaptability += fitness.adaptability;
    
    // Calculate current average
    const currentAvg = this.calculateAverage(fitness);
    
    // Update best/worst
    if (currentAvg > this.bestFitness) {
      this.bestFitness = currentAvg;
    }
    if (currentAvg < this.worstFitness) {
      this.worstFitness = currentAvg;
    }
    
    // Update streak
    if (currentAvg > this.lastFitnessAvg) {
      this.currentStreak++;
    } else {
      this.currentStreak = 0;
    }
    this.lastFitnessAvg = currentAvg;
    
    // Add to history
    this.fitnessHistory.push({
      timestamp: Date.now(),
      fitness: { ...fitness },
    });
    
    // Trim history if needed
    if (this.fitnessHistory.length > this.maxHistorySize) {
      this.fitnessHistory.shift();
    }
  }

  /**
   * Record a mutation event
   */
  recordMutation(geneName: string, success: boolean): void {
    this.totalMutations++;
    
    this.mutationHistory.push({
      timestamp: Date.now(),
      geneName,
      success,
    });
    
    if (this.mutationHistory.length > this.maxHistorySize) {
      this.mutationHistory.shift();
    }
  }

  /**
   * Record a rollback event
   */
  recordRollback(reason: string, fromVersion: number, toVersion: number): void {
    this.totalRollbacks++;
    
    this.rollbackHistory.push({
      timestamp: Date.now(),
      reason,
      fromVersion,
      toVersion,
    });
    
    if (this.rollbackHistory.length > this.maxHistorySize) {
      this.rollbackHistory.shift();
    }
  }

  /**
   * Get summary of all metrics
   */
  getSummary(): MetricsSummary {
    const n = Math.max(1, this.totalInteractions);
    
    return {
      totalInteractions: this.totalInteractions,
      totalMutations: this.totalMutations,
      totalRollbacks: this.totalRollbacks,
      averageFitness: {
        accuracy: this.fitnessSum.accuracy / n,
        speed: this.fitnessSum.speed / n,
        cost: this.fitnessSum.cost / n,
        safety: this.fitnessSum.safety / n,
        userSatisfaction: this.fitnessSum.userSatisfaction / n,
        adaptability: this.fitnessSum.adaptability / n,
      },
      fitnessHistory: [...this.fitnessHistory],
      mutationHistory: [...this.mutationHistory],
      rollbackHistory: [...this.rollbackHistory],
      currentStreak: this.currentStreak,
      bestFitness: this.bestFitness,
      worstFitness: this.worstFitness,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get recent fitness trend (last N measurements)
   */
  getFitnessTrend(count = 10): 'improving' | 'declining' | 'stable' {
    if (this.fitnessHistory.length < 2) {
      return 'stable';
    }
    
    const recent = this.fitnessHistory.slice(-count);
    const averages = recent.map(h => this.calculateAverage(h.fitness));
    
    // Calculate trend using linear regression slope
    const n = averages.length;
    const xMean = (n - 1) / 2;
    const yMean = averages.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (averages[i] - yMean);
      denominator += (i - xMean) ** 2;
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    
    if (slope > 0.01) return 'improving';
    if (slope < -0.01) return 'declining';
    return 'stable';
  }

  /**
   * Get mutation success rate
   */
  getMutationSuccessRate(): number {
    if (this.mutationHistory.length === 0) return 0;
    
    const successful = this.mutationHistory.filter(m => m.success).length;
    return successful / this.mutationHistory.length;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.totalInteractions = 0;
    this.totalMutations = 0;
    this.totalRollbacks = 0;
    this.currentStreak = 0;
    this.bestFitness = 0;
    this.worstFitness = 1;
    this.lastFitnessAvg = 0;
    
    this.fitnessSum = {
      accuracy: 0,
      speed: 0,
      cost: 0,
      safety: 0,
      userSatisfaction: 0,
      adaptability: 0,
    };
    
    this.fitnessHistory.length = 0;
    this.mutationHistory.length = 0;
    this.rollbackHistory.length = 0;
  }

  private calculateAverage(fitness: FitnessVector): number {
    return (
      fitness.accuracy +
      fitness.speed +
      fitness.cost +
      fitness.safety +
      fitness.userSatisfaction +
      fitness.adaptability
    ) / 6;
  }
}
