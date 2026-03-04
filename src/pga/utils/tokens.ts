/**
 * Token estimation utilities for PGA evolutionary compression
 *
 * @author DeepAgent
 * @since 2026-03-04
 */

/**
 * Estimate token count from text using the ~4 chars/token heuristic.
 * No external dependencies — fast enough for evolutionary selection.
 */
export function estimateTokenCount(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

/**
 * Compute fitness-per-token efficiency.
 * Higher = gene delivers more value per token consumed.
 */
export function tokenEfficiency(compositeFitness: number, tokenCount: number): number {
  if (tokenCount <= 0) {
    return 0;
  }
  return compositeFitness / tokenCount;
}

/**
 * Compression ratio: compressedTokens / originalTokens.
 * Values < 1 indicate successful compression; lower is better.
 */
export function compressionRatio(originalTokens: number, compressedTokens: number): number {
  if (originalTokens <= 0) {
    return 1;
  }
  return compressedTokens / originalTokens;
}
