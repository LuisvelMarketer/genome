/**
 * 🧬 Genoma Installer - Dependencies Check
 */

import { execSync } from 'node:child_process';

export interface DependencyStatus {
  name: string;
  installed: boolean;
  version?: string;
  optional: boolean;
}

function checkCommand(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

export function checkDependencies(): DependencyStatus[] {
  const deps: DependencyStatus[] = [];

  // Required dependencies
  const pnpm = checkCommand('pnpm --version');
  deps.push({ name: 'pnpm', installed: !!pnpm, version: pnpm || undefined, optional: false });

  const git = checkCommand('git --version');
  deps.push({
    name: 'git',
    installed: !!git,
    version: git?.match(/[\d.]+/)?.[0],
    optional: false,
  });

  // Optional dependencies
  const docker = checkCommand('docker --version');
  deps.push({
    name: 'docker',
    installed: !!docker,
    version: docker?.match(/[\d.]+/)?.[0],
    optional: true,
  });

  const postgres = checkCommand('psql --version');
  deps.push({
    name: 'postgresql',
    installed: !!postgres,
    version: postgres?.match(/[\d.]+/)?.[0],
    optional: true,
  });

  return deps;
}

export function getMissingRequired(): string[] {
  return checkDependencies()
    .filter((d) => !d.optional && !d.installed)
    .map((d) => d.name);
}
