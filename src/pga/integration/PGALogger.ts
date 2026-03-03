/**
 * @fileoverview Logger para el sistema PGA
 * 
 * Proporciona logging estructurado para monitorear la evolución genómica.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  timestamp: number;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * PGALogger provides structured logging for the PGA system.
 */
export class PGALogger {
  private readonly verbose: boolean;
  private readonly logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.verbose) {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      timestamp: Date.now(),
      message,
      context,
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    const formattedMessage = `[PGA][${level.toUpperCase()}] ${message}${contextStr}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): string {
    return this.logs
      .map(log => {
        const date = new Date(log.timestamp).toISOString();
        const context = log.context ? ` ${JSON.stringify(log.context)}` : '';
        return `${date} [${log.level.toUpperCase()}] ${log.message}${context}`;
      })
      .join('\n');
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs.length = 0;
  }
}
