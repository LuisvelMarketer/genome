/**
 * PromptInjectionGuard — Protection against prompt injection attacks
 * 
 * Detects and sanitizes malicious inputs that attempt to manipulate
 * the AI agent's behavior through prompt injection techniques.
 * 
 * @author DeepAgent (adapted from Orbis security layer)
 * @since 2026-03-03 | Genoma v3.0
 */

import { sha256 } from '../pga/utils/hash.js';

// Guard configuration
export interface GuardConfig {
    mode: 'strict' | 'moderate' | 'permissive'; // Sensitivity level
    blockOnDetection: boolean;     // Block or sanitize (default: true)
    logAttempts: boolean;          // Log injection attempts (default: true)
    maxInputLength: number;        // Max allowed input length (default: 10000)
    customPatterns: RegExp[];      // Additional patterns to check
}

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ScanResult {
    safe: boolean;
    threatLevel: ThreatLevel;
    threats: ThreatDetail[];
    sanitizedInput?: string;
    originalHash: string;
    scannedAt: Date;
}

export interface ThreatDetail {
    type: InjectionType;
    pattern: string;
    position: number;
    severity: ThreatLevel;
    description: string;
}

export type InjectionType =
    | 'instruction_override'
    | 'role_hijacking'
    | 'jailbreak'
    | 'system_prompt_leak'
    | 'delimiter_injection'
    | 'encoding_attack'
    | 'context_manipulation'
    | 'prompt_smuggling';

// Detection patterns organized by type and severity
const INJECTION_PATTERNS: {
    type: InjectionType;
    patterns: RegExp[];
    severity: ThreatLevel;
    description: string;
}[] = [
    // Critical: Direct instruction overrides
    {
        type: 'instruction_override',
        severity: 'critical',
        description: 'Attempt to override system instructions',
        patterns: [
            /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
            /disregard\s+(your|the|all)\s+(instructions?|rules?|guidelines?|constraints?)/i,
            /forget\s+(everything|all|what)\s+(you|i)\s+(know|told|said)/i,
            /new\s+instructions?:\s*/i,
            /override\s+(system|your)\s+(prompt|instructions?)/i,
        ],
    },
    // Critical: Role hijacking attempts
    {
        type: 'role_hijacking',
        severity: 'critical',
        description: 'Attempt to change AI role or identity',
        patterns: [
            /you\s+are\s+(now|no\s+longer)/i,
            /pretend\s+(you\s+are|to\s+be)/i,
            /act\s+as\s+(if|though)\s+you/i,
            /from\s+now\s+on,?\s+you\s+(are|will)/i,
            /switch\s+(to|into)\s+(a\s+)?(different|new)\s+(mode|persona|character)/i,
        ],
    },
    // High: Jailbreak attempts
    {
        type: 'jailbreak',
        severity: 'high',
        description: 'Jailbreak or bypass attempt',
        patterns: [
            /\bDAN\b/i,
            /\bDo\s+Anything\s+Now\b/i,
            /jailbreak/i,
            /bypass\s+(the\s+)?(safety|security|content)\s+(filter|rules?|guidelines?)/i,
            /unlock\s+(hidden|secret|developer)\s+mode/i,
            /disable\s+(your\s+)?(safety|ethical|content)\s+(filters?|restrictions?)/i,
        ],
    },
    // High: System prompt leakage
    {
        type: 'system_prompt_leak',
        severity: 'high',
        description: 'Attempt to extract system prompt',
        patterns: [
            /reveal\s+(your|the)\s+(system|initial|original)\s+(prompt|instructions?)/i,
            /(show|display|print|output)\s+(your|the)\s+(system|full)\s+prompt/i,
            /what\s+(is|are)\s+your\s+(system|initial|hidden)\s+(prompt|instructions?)/i,
            /repeat\s+(your|the)\s+(system|initial)\s+(prompt|instructions?)/i,
            /\[\s*SYSTEM\s*\]/i,
            /```\s*system/i,
        ],
    },
    // Medium: Delimiter injection
    {
        type: 'delimiter_injection',
        severity: 'medium',
        description: 'Delimiter or format manipulation',
        patterns: [
            /---+\s*(system|assistant|user)\s*---+/i,
            /###\s*(SYSTEM|INSTRUCTIONS?)\s*###/i,
            /<\|?(system|endoftext|im_start|im_end)\|?>/i,
            /\[INST\]/i,
            /\[\/?SYS(TEM)?\]/i,
        ],
    },
    // Medium: Encoding attacks
    {
        type: 'encoding_attack',
        severity: 'medium',
        description: 'Unicode or encoding manipulation',
        patterns: [
            /[\u200B\u200C\u200D\uFEFF]{3,}/,  // Zero-width characters
            /&#x?[0-9a-f]+;/i,                   // HTML entities
            /%[0-9a-f]{2}/i,                     // URL encoding
            /\\u[0-9a-f]{4}/i,                   // Unicode escapes
            /base64:/i,
        ],
    },
    // Low: Context manipulation
    {
        type: 'context_manipulation',
        severity: 'low',
        description: 'Attempt to manipulate conversation context',
        patterns: [
            /\bpreviously,?\s+you\s+said/i,
            /remember\s+when\s+you/i,
            /earlier\s+you\s+(agreed|said|mentioned)/i,
            /\bas\s+we\s+discussed\b/i,
        ],
    },
    // Medium: Prompt smuggling
    {
        type: 'prompt_smuggling',
        severity: 'medium',
        description: 'Hidden instructions in formatted content',
        patterns: [
            /<!--.*?(ignore|forget|override).*?-->/is,
            /\/\*.*?(system|instructions?).*?\*\//is,
            /\{\{.*?(admin|system).*?\}\}/is,
        ],
    },
];

const DEFAULT_GUARD_CONFIG: GuardConfig = {
    mode: 'moderate',
    blockOnDetection: true,
    logAttempts: true,
    maxInputLength: 10000,
    customPatterns: [],
};

export class PromptInjectionGuard {
    private config: GuardConfig;
    private attemptLog: ScanResult[] = [];
    private maxLogSize = 1000;

    constructor(config: Partial<GuardConfig> = {}) {
        this.config = { ...DEFAULT_GUARD_CONFIG, ...config };
    }

    /**
     * Scan input for injection attempts
     */
    scan(input: string): ScanResult {
        const originalHash = sha256(input).slice(0, 16);
        const threats: ThreatDetail[] = [];

        // Check input length
        if (input.length > this.config.maxInputLength) {
            threats.push({
                type: 'context_manipulation',
                pattern: 'input_too_long',
                position: this.config.maxInputLength,
                severity: 'low',
                description: `Input exceeds max length of ${this.config.maxInputLength}`,
            });
        }

        // Check all patterns based on mode
        const minSeverity = this.getSeverityThreshold();

        for (const patternGroup of INJECTION_PATTERNS) {
            if (this.compareSeverity(patternGroup.severity, minSeverity) < 0) {
                continue; // Skip patterns below threshold
            }

            for (const pattern of patternGroup.patterns) {
                const match = pattern.exec(input);
                if (match) {
                    threats.push({
                        type: patternGroup.type,
                        pattern: match[0].slice(0, 50),
                        position: match.index,
                        severity: patternGroup.severity,
                        description: patternGroup.description,
                    });
                }
            }
        }

        // Check custom patterns
        for (const pattern of this.config.customPatterns) {
            const match = pattern.exec(input);
            if (match) {
                threats.push({
                    type: 'context_manipulation',
                    pattern: match[0].slice(0, 50),
                    position: match.index,
                    severity: 'medium',
                    description: 'Custom pattern detected',
                });
            }
        }

        // Determine overall threat level
        const threatLevel = this.calculateThreatLevel(threats);
        const safe = threatLevel === 'none' || 
                    (this.config.mode === 'permissive' && threatLevel === 'low');

        // Sanitize if needed
        let sanitizedInput: string | undefined;
        if (!safe && !this.config.blockOnDetection) {
            sanitizedInput = this.sanitize(input, threats);
        }

        const result: ScanResult = {
            safe,
            threatLevel,
            threats,
            sanitizedInput,
            originalHash,
            scannedAt: new Date(),
        };

        // Log attempt if configured
        if (this.config.logAttempts && !safe) {
            this.logAttempt(result);
        }

        // Log to console
        if (!safe) {
            const emoji = threatLevel === 'critical' ? '🚨' : 
                         threatLevel === 'high' ? '⚠️' : '⚡';
            console.log(
                `[INJECTION_GUARD] ${emoji} Threat detected: ` +
                `level=${threatLevel} threats=${threats.length}`
            );
        }

        return result;
    }

    /**
     * Check if input is safe (convenience method)
     */
    isSafe(input: string): boolean {
        return this.scan(input).safe;
    }

    /**
     * Sanitize input by removing/escaping threats
     */
    sanitize(input: string, threats?: ThreatDetail[]): string {
        let sanitized = input;

        // If no threats provided, scan first
        const actualThreats = threats || this.scan(input).threats;

        // Sort threats by position (descending) to replace from end
        const sortedThreats = [...actualThreats].sort((a, b) => b.position - a.position);

        for (const threat of sortedThreats) {
            // Replace threatening content with safe placeholder
            const beforeMatch = sanitized.slice(0, threat.position);
            const afterMatch = sanitized.slice(threat.position + threat.pattern.length);
            sanitized = beforeMatch + '[SANITIZED]' + afterMatch;
        }

        // Remove zero-width characters
        sanitized = sanitized.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');

        // Truncate if too long
        if (sanitized.length > this.config.maxInputLength) {
            sanitized = sanitized.slice(0, this.config.maxInputLength) + '...[truncated]';
        }

        return sanitized;
    }

    /**
     * Get severity threshold based on mode
     */
    private getSeverityThreshold(): ThreatLevel {
        switch (this.config.mode) {
            case 'strict': return 'low';
            case 'moderate': return 'medium';
            case 'permissive': return 'high';
        }
    }

    /**
     * Compare severity levels (-1: a < b, 0: a == b, 1: a > b)
     */
    private compareSeverity(a: ThreatLevel, b: ThreatLevel): number {
        const order: ThreatLevel[] = ['none', 'low', 'medium', 'high', 'critical'];
        return order.indexOf(a) - order.indexOf(b);
    }

    /**
     * Calculate overall threat level from detected threats
     */
    private calculateThreatLevel(threats: ThreatDetail[]): ThreatLevel {
        if (threats.length === 0) return 'none';

        // Return highest severity found
        const severities: ThreatLevel[] = ['critical', 'high', 'medium', 'low'];
        for (const severity of severities) {
            if (threats.some(t => t.severity === severity)) {
                return severity;
            }
        }

        return 'low';
    }

    /**
     * Log an injection attempt
     */
    private logAttempt(result: ScanResult): void {
        this.attemptLog.push(result);

        // Trim log if too large
        if (this.attemptLog.length > this.maxLogSize) {
            this.attemptLog = this.attemptLog.slice(-this.maxLogSize);
        }
    }

    /**
     * Get attempt log
     */
    getAttemptLog(): ScanResult[] {
        return [...this.attemptLog];
    }

    /**
     * Get statistics about detected threats
     */
    getStatistics(): {
        totalScans: number;
        blockedAttempts: number;
        byType: Record<InjectionType, number>;
        bySeverity: Record<ThreatLevel, number>;
    } {
        const byType: Record<string, number> = {};
        const bySeverity: Record<string, number> = {
            none: 0, low: 0, medium: 0, high: 0, critical: 0,
        };

        for (const result of this.attemptLog) {
            bySeverity[result.threatLevel]++;
            for (const threat of result.threats) {
                byType[threat.type] = (byType[threat.type] || 0) + 1;
            }
        }

        return {
            totalScans: this.attemptLog.length,
            blockedAttempts: this.attemptLog.filter(r => !r.safe).length,
            byType: byType as Record<InjectionType, number>,
            bySeverity: bySeverity as Record<ThreatLevel, number>,
        };
    }

    /**
     * Clear attempt log
     */
    clearLog(): void {
        this.attemptLog = [];
    }

    /**
     * Add custom detection pattern
     */
    addPattern(pattern: RegExp): void {
        this.config.customPatterns.push(pattern);
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<GuardConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): GuardConfig {
        return { ...this.config };
    }
}
