/**
 * 🧬 Genoma Installer - Service Manager
 * Start, stop, and manage Genoma services
 */

import { spawn, execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import { displayInfo, displaySuccess, displayError } from './logger.js';
import { getStateDir, isPortAvailable } from './helpers.js';

interface StartOptions {
  gatewayOnly?: boolean;
  port?: string;
}

const PID_FILE = join(getStateDir(), 'genoma.pid');
const DEFAULT_PORT = 18789;

export async function startGenoma(options: StartOptions = {}): Promise<void> {
  console.log(chalk.cyan('\n🚀 Iniciando Genoma...\n'));

  // Check if already running
  if (isRunning()) {
    displayError('Genoma ya está en ejecución');
    console.log(chalk.gray('  Usa: genoma stop para detenerlo\n'));
    return;
  }

  // Check port availability
  const port = options.port ? parseInt(options.port) : DEFAULT_PORT;
  const portAvailable = await isPortAvailable(port);
  if (!portAvailable) {
    displayError(`Puerto ${port} no disponible`);
    console.log(chalk.gray(`  Usa: genoma start --port OTRO_PUERTO\n`));
    return;
  }

  // Find the main entry point
  const cwd = process.cwd();
  const mainScript = join(cwd, 'dist', 'index.js');
  const genomaScript = join(cwd, 'genoma.mjs');

  let script: string;
  let args: string[];

  if (existsSync(mainScript)) {
    script = 'node';
    args = [mainScript, 'gateway'];
  } else if (existsSync(genomaScript)) {
    script = 'node';
    args = [genomaScript, 'gateway'];
  } else {
    displayError('No se encontró el script principal');
    console.log(chalk.gray('  Ejecuta: pnpm build primero\n'));
    return;
  }

  if (options.gatewayOnly) {
    args.push('--gateway-only');
  }

  // Start the process
  const child = spawn(script, args, {
    cwd,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      GENOMA_GATEWAY_PORT: port.toString(),
    },
  });

  child.unref();

  // Save PID
  if (child.pid) {
    writeFileSync(PID_FILE, child.pid.toString());
    displaySuccess(`Genoma iniciado (PID: ${child.pid})`);
    console.log(chalk.gray(`  Gateway: http://localhost:${port}`));
    console.log(chalk.gray('  Usa: genoma stop para detener\n'));
  } else {
    displayError('No se pudo iniciar Genoma');
  }
}

export async function stopGenoma(): Promise<void> {
  console.log(chalk.cyan('\n🛑 Deteniendo Genoma...\n'));

  if (!isRunning()) {
    displayInfo('Genoma no está en ejecución');
    return;
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    process.kill(pid, 'SIGTERM');
    unlinkSync(PID_FILE);
    displaySuccess('Genoma detenido correctamente');
  } catch (error) {
    displayError('Error al detener Genoma');
    // Try to clean up PID file anyway
    if (existsSync(PID_FILE)) {
      unlinkSync(PID_FILE);
    }
  }
}

export async function getStatus(): Promise<void> {
  console.log(chalk.cyan('\n📊 Estado de Genoma\n'));

  const running = isRunning();

  if (running) {
    const pid = readFileSync(PID_FILE, 'utf-8').trim();
    console.log(chalk.green(`  ✓ Genoma está en ejecución (PID: ${pid})`));

    // Try to get more info
    try {
      const portAvailable = await isPortAvailable(DEFAULT_PORT);
      if (!portAvailable) {
        console.log(chalk.gray(`  ✓ Gateway escuchando en puerto ${DEFAULT_PORT}`));
      }
    } catch {}
  } else {
    console.log(chalk.yellow('  ✗ Genoma no está en ejecución'));
    console.log(chalk.gray('    Usa: genoma start para iniciar'));
  }

  // Show config info
  const configDir = join(os.homedir(), '.genoma');
  console.log();
  console.log(chalk.gray(`  Directorio de config: ${configDir}`));
  console.log(chalk.gray(`  Archivo PID: ${PID_FILE}`));
  console.log();
}

function isRunning(): boolean {
  if (!existsSync(PID_FILE)) {
    return false;
  }

  try {
    const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim());
    // Check if process exists
    process.kill(pid, 0);
    return true;
  } catch {
    // Process doesn't exist, clean up PID file
    try {
      unlinkSync(PID_FILE);
    } catch {}
    return false;
  }
}
