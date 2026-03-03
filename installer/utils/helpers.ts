/**
 * 🧬 Genoma Installer - Helper Utilities
 */

import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex').slice(0, length);
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

/**
 * Get the Genoma config directory path
 */
export function getConfigDir(): string {
  return join(os.homedir(), '.genoma');
}

/**
 * Get the Genoma state directory path
 */
export function getStateDir(): string {
  return join(getConfigDir(), 'state');
}

/**
 * Check if running as root/admin
 */
export function isRoot(): boolean {
  return process.getuid?.() === 0 || process.env.SUDO_USER !== undefined;
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a port is available
 */
export async function isPortAvailable(port: number): Promise<boolean> {
  const net = await import('node:net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
}
