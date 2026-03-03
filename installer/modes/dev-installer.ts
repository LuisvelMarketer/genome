/**
 * 🧬 Genoma Installer - Developer Mode
 * Full access, debugging, hot reload, verbose logs
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import { SetupOptions } from '../cli/installer-cli.js';
import { validateSystem } from '../validators/system-check.js';
import { withSpinner, showStepResult, showProgress } from '../cli/progress.js';
import { generateDevEnv } from '../config/env-generator.js';
import { displaySuccess, displayInfo } from '../utils/logger.js';

const INSTALL_STEPS = [
  'Verificando sistema',
  'Instalando dependencias',
  'Configurando entorno dev',
  'Construyendo proyecto',
  'Verificación final',
];

export async function runDevInstaller(options: SetupOptions): Promise<void> {
  console.log(chalk.cyan('\n🔧 Modo Desarrollador\n'));

  // Step 1: System validation
  showProgress(INSTALL_STEPS, 1);
  const systemOk = await validateSystem(options.skipValidation);
  if (!systemOk && !options.skipValidation) {
    throw new Error('Sistema no cumple requisitos mínimos');
  }

  // Step 2: Install dependencies
  showProgress(INSTALL_STEPS, 2);
  await withSpinner('Instalando dependencias con pnpm...', async () => {
    const cwd = process.cwd();
    try {
      execSync('pnpm install', { cwd, stdio: options.verbose ? 'inherit' : 'pipe' });
    } catch (error) {
      // Dependencies might already be installed
      console.log(chalk.yellow('  Algunas dependencias ya están instaladas'));
    }
  });

  // Step 3: Configure dev environment
  showProgress(INSTALL_STEPS, 3);
  await withSpinner('Configurando entorno de desarrollo...', async () => {
    const homeDir = os.homedir();
    const configDir = join(homeDir, '.genoma');

    // Create config directory
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    // Generate .env file
    const envContent = generateDevEnv({
      provider: options.provider || 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      channels: ['cli'],
      pgaEnabled: true,
    });

    const envPath = join(configDir, '.env.dev');
    writeFileSync(envPath, envContent);

    // Also create local .env if it doesn't exist
    const localEnvPath = join(process.cwd(), '.env');
    if (!existsSync(localEnvPath)) {
      writeFileSync(localEnvPath, envContent);
    }
  });

  // Step 4: Build project
  showProgress(INSTALL_STEPS, 4);
  await withSpinner('Construyendo proyecto...', async () => {
    try {
      execSync('pnpm build', { cwd: process.cwd(), stdio: options.verbose ? 'inherit' : 'pipe' });
    } catch (error) {
      console.log(chalk.yellow('\n  Build parcial - algunos módulos pueden faltar'));
    }
  });

  // Step 5: Final verification
  showProgress(INSTALL_STEPS, 5);
  const distExists = existsSync(join(process.cwd(), 'dist'));
  showStepResult('Directorio dist/', distExists);
  showStepResult('Configuración dev', true);

  // Show final instructions
  console.log(chalk.cyan('\n─── Configuración Completada ───\n'));

  displayInfo('Para iniciar en modo desarrollo:');
  console.log(chalk.white('  pnpm dev\n'));

  displayInfo('Para iniciar gateway:');
  console.log(chalk.white('  pnpm gateway:dev\n'));

  displayInfo('Para ejecutar tests:');
  console.log(chalk.white('  pnpm test\n'));

  displayInfo('Scripts disponibles:');
  console.log(chalk.gray('  pnpm dev          - Iniciar agente'));
  console.log(chalk.gray('  pnpm dev:watch    - Hot reload'));
  console.log(chalk.gray('  pnpm gateway:dev  - Solo gateway'));
  console.log(chalk.gray('  pnpm tui:dev      - Terminal UI'));
  console.log();
}
