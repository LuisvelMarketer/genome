/**
 * 🧬 Genoma Installer - System Validators
 * Check system requirements before installation
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import chalk from 'chalk';
import { showStepResult, showWarning } from '../cli/progress.js';

export interface SystemRequirements {
  nodeVersion: string;
  nodeOk: boolean;
  pnpmVersion: string;
  pnpmOk: boolean;
  gitInstalled: boolean;
  osSupported: boolean;
  osName: string;
  diskSpace: number; // GB
  memoryAvailable: number; // GB
}

export interface OptionalRequirements {
  dockerInstalled: boolean;
  dockerVersion?: string;
  postgresInstalled: boolean;
  postgresVersion?: string;
  playwrightBrowsers: boolean;
}

function execCommand(cmd: string): string | null {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function parseVersion(version: string): number[] {
  return version.replace(/^v/, '').split('.').map(Number);
}

function compareVersions(current: string, required: string): boolean {
  const curr = parseVersion(current);
  const req = parseVersion(required);
  for (let i = 0; i < req.length; i++) {
    if ((curr[i] || 0) > req[i]) return true;
    if ((curr[i] || 0) < req[i]) return false;
  }
  return true;
}

export function checkSystemRequirements(): SystemRequirements {
  // Node.js
  const nodeVersion = process.version.replace('v', '');
  const nodeOk = compareVersions(nodeVersion, '22.12.0');

  // pnpm
  const pnpmVersionRaw = execCommand('pnpm --version');
  const pnpmVersion = pnpmVersionRaw || 'not installed';
  const pnpmOk = pnpmVersionRaw ? compareVersions(pnpmVersionRaw, '10.0.0') : false;

  // Git
  const gitVersion = execCommand('git --version');
  const gitInstalled = !!gitVersion;

  // OS
  const platform = os.platform();
  const osSupported = ['linux', 'darwin', 'win32'].includes(platform);
  const osName = `${platform} ${os.arch()}`;

  // Disk space (simplified)
  const diskSpace = 50; // Placeholder - would need OS-specific checks

  // Memory
  const memoryAvailable = Math.round(os.totalmem() / (1024 * 1024 * 1024));

  return {
    nodeVersion,
    nodeOk,
    pnpmVersion,
    pnpmOk,
    gitInstalled,
    osSupported,
    osName,
    diskSpace,
    memoryAvailable,
  };
}

export function checkOptionalRequirements(): OptionalRequirements {
  // Docker
  const dockerVersion = execCommand('docker --version');
  const dockerInstalled = !!dockerVersion;

  // PostgreSQL
  const postgresVersion = execCommand('psql --version');
  const postgresInstalled = !!postgresVersion;

  // Playwright browsers
  const playwrightPath = process.platform === 'win32'
    ? `${process.env.LOCALAPPDATA}\\ms-playwright`
    : `${process.env.HOME}/.cache/ms-playwright`;
  const playwrightBrowsers = existsSync(playwrightPath);

  return {
    dockerInstalled,
    dockerVersion: dockerVersion || undefined,
    postgresInstalled,
    postgresVersion: postgresVersion || undefined,
    playwrightBrowsers,
  };
}

export async function validateSystem(skipValidation = false): Promise<boolean> {
  if (skipValidation) {
    showWarning('Validación de sistema omitida');
    return true;
  }

  console.log(chalk.bold('\n🔍 Verificando sistema...\n'));

  const req = checkSystemRequirements();
  let allOk = true;

  // Node.js
  showStepResult(
    `Node.js v${req.nodeVersion}`,
    req.nodeOk,
    req.nodeOk ? undefined : 'Requerido: >= 22.12.0'
  );
  if (!req.nodeOk) allOk = false;

  // pnpm
  showStepResult(
    `pnpm ${req.pnpmVersion}`,
    req.pnpmOk,
    req.pnpmOk ? undefined : 'Instala con: npm install -g pnpm'
  );
  if (!req.pnpmOk) allOk = false;

  // Git
  showStepResult('Git', req.gitInstalled);
  if (!req.gitInstalled) allOk = false;

  // OS
  showStepResult(`Sistema operativo: ${req.osName}`, req.osSupported);

  // Memory
  showStepResult(`${req.memoryAvailable} GB RAM disponible`, req.memoryAvailable >= 4);

  return allOk;
}

export async function runDiagnostics(): Promise<void> {
  console.log(chalk.bold('\n🩺 Diagnóstico de Genoma\n'));

  // System requirements
  console.log(chalk.cyan('\n─── Requisitos del Sistema ───\n'));
  const sysReq = checkSystemRequirements();

  showStepResult(`Node.js v${sysReq.nodeVersion}`, sysReq.nodeOk);
  showStepResult(`pnpm ${sysReq.pnpmVersion}`, sysReq.pnpmOk);
  showStepResult('Git instalado', sysReq.gitInstalled);
  showStepResult(`OS: ${sysReq.osName}`, sysReq.osSupported);
  showStepResult(`RAM: ${sysReq.memoryAvailable} GB`, sysReq.memoryAvailable >= 4);

  // Optional requirements
  console.log(chalk.cyan('\n─── Requisitos Opcionales ───\n'));
  const optReq = checkOptionalRequirements();

  showStepResult('Docker', optReq.dockerInstalled, optReq.dockerVersion);
  showStepResult('PostgreSQL', optReq.postgresInstalled, optReq.postgresVersion);
  showStepResult('Playwright browsers', optReq.playwrightBrowsers);

  // Configuration files
  console.log(chalk.cyan('\n─── Archivos de Configuración ───\n'));

  const homeDir = os.homedir();
  const configDir = `${homeDir}/.genoma`;
  const envFile = `${configDir}/.env`;
  const configFile = `${configDir}/genoma.json`;

  showStepResult('Directorio de configuración', existsSync(configDir), configDir);
  showStepResult('Archivo .env', existsSync(envFile));
  showStepResult('Archivo genoma.json', existsSync(configFile));

  // Summary
  console.log(chalk.cyan('\n─── Resumen ───\n'));

  const criticalOk = sysReq.nodeOk && sysReq.pnpmOk && sysReq.gitInstalled;
  if (criticalOk) {
    console.log(chalk.green('✓ Sistema listo para ejecutar Genoma'));
  } else {
    console.log(chalk.red('✗ Hay problemas críticos que resolver'));
    console.log(chalk.yellow('  Ejecuta: genoma setup para configurar'));
  }

  console.log();
}
