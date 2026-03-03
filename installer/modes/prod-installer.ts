/**
 * 🧬 Genoma Installer - Production/User Mode
 * Simplified wizard for end users
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import chalk from 'chalk';
import { SetupOptions } from '../cli/installer-cli.js';
import { validateSystem } from '../validators/system-check.js';
import { runInstallationWizard, confirmAction } from '../cli/prompts.js';
import { withSpinner, showProgress, showStepResult } from '../cli/progress.js';
import { generateEnvFile } from '../config/env-generator.js';
import { generateGenomaConfig } from '../config/config-generator.js';
import { displaySuccess, displayInfo } from '../utils/logger.js';
import { generateSecureToken } from '../utils/helpers.js';

const INSTALL_STEPS = [
  'Verificando sistema',
  'Configurando proveedor IA',
  'Generando configuración',
  'Instalando dependencias',
  'Verificación final',
];

export async function runProdInstaller(options: SetupOptions): Promise<void> {
  console.log(chalk.cyan('\n🚀 Modo Usuario\n'));

  // Step 1: System validation
  showProgress(INSTALL_STEPS, 1);
  const systemOk = await validateSystem(options.skipValidation);
  if (!systemOk && !options.skipValidation) {
    throw new Error('Sistema no cumple requisitos mínimos');
  }

  // Step 2: Get configuration (wizard or quick)
  showProgress(INSTALL_STEPS, 2);
  let config: {
    provider: string;
    apiKey: string;
    channels: string[];
    enablePGA: boolean;
  };

  if (options.quick) {
    // Quick mode - use defaults or provided options
    config = {
      provider: options.provider || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      channels: options.channel ? [options.channel] : ['cli'],
      enablePGA: true,
    };

    if (!config.apiKey) {
      console.log(chalk.yellow('\n  ⚠ No se detectó API Key en variables de entorno'));
      console.log(chalk.gray('    Configura OPENAI_API_KEY o ANTHROPIC_API_KEY\n'));
    }
  } else {
    // Interactive wizard
    const answers = await runInstallationWizard();
    if (!answers) {
      throw new Error('Instalación cancelada por el usuario');
    }
    config = {
      provider: answers.provider,
      apiKey: answers.apiKey,
      channels: answers.channels,
      enablePGA: answers.enablePGA,
    };
  }

  // Step 3: Generate configuration
  showProgress(INSTALL_STEPS, 3);
  await withSpinner('Generando archivos de configuración...', async () => {
    const homeDir = os.homedir();
    const configDir = join(homeDir, '.genoma');

    // Create directories
    mkdirSync(configDir, { recursive: true });
    mkdirSync(join(configDir, 'state'), { recursive: true });
    mkdirSync(join(configDir, 'logs'), { recursive: true });

    // Generate .env file
    const gatewayToken = generateSecureToken();
    const envContent = generateEnvFile({
      mode: 'production',
      provider: config.provider,
      apiKey: config.apiKey,
      channels: config.channels,
      pgaEnabled: config.enablePGA,
      gatewayToken,
    });

    writeFileSync(join(configDir, '.env'), envContent);

    // Generate genoma.json
    const genomaConfig = generateGenomaConfig({
      mode: 'production',
      provider: config.provider,
      channels: config.channels,
      pgaEnabled: config.enablePGA,
    });

    writeFileSync(
      join(configDir, 'genoma.json'),
      JSON.stringify(genomaConfig, null, 2)
    );

    // Create local symlinks/copies if in project directory
    const localEnvPath = join(process.cwd(), '.env');
    if (!existsSync(localEnvPath)) {
      writeFileSync(localEnvPath, envContent);
    }
  });

  // Step 4: Install dependencies
  showProgress(INSTALL_STEPS, 4);
  await withSpinner('Verificando instalación...', async () => {
    // Check if we're in a Genoma project directory
    const packageJson = join(process.cwd(), 'package.json');
    if (existsSync(packageJson)) {
      try {
        execSync('pnpm install --prod', {
          cwd: process.cwd(),
          stdio: options.verbose ? 'inherit' : 'pipe',
        });
      } catch {
        // Might already be installed
      }
    }
  });

  // Step 5: Final verification
  showProgress(INSTALL_STEPS, 5);
  const homeDir = os.homedir();
  const configDir = join(homeDir, '.genoma');

  showStepResult('Configuración', existsSync(join(configDir, '.env')));
  showStepResult('Directorio de estado', existsSync(join(configDir, 'state')));
  showStepResult('Proveedor IA', !!config.apiKey, config.provider);

  // Show final instructions
  console.log(chalk.cyan('\n─── Instalación Completada ───\n'));

  displayInfo('Para iniciar Genoma:');
  console.log(chalk.white('  genoma start\n'));

  displayInfo('Para ver el estado:');
  console.log(chalk.white('  genoma status\n'));

  displayInfo('Para diagnosticar problemas:');
  console.log(chalk.white('  genoma doctor\n'));

  if (config.channels.includes('webui')) {
    displayInfo('Acceso a Web UI:');
    console.log(chalk.white('  http://localhost:18789\n'));
  }

  console.log(chalk.gray('Documentación: https://github.com/LuisvelMarketer/genoma\n'));
}
