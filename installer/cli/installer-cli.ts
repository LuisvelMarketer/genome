/**
 * 🧬 Genoma Installer CLI
 * Main CLI implementation with Commander.js
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runDevInstaller } from '../modes/dev-installer.js';
import { runProdInstaller } from '../modes/prod-installer.js';
import { runDiagnostics } from '../validators/system-check.js';
import { displayBanner, displaySuccess, displayError } from '../utils/logger.js';

export interface SetupOptions {
  dev?: boolean;
  quick?: boolean;
  provider?: string;
  channel?: string;
  skipValidation?: boolean;
  verbose?: boolean;
}

export interface StartOptions {
  gatewayOnly?: boolean;
  port?: string;
}

export function createInstallerCLI(): Command {
  const program = new Command();

  program
    .name('genoma')
    .description('🧬 Genoma - Agente Inteligente Autoevolutivo')
    .version('4.0.0');

  // Setup command
  program
    .command('setup')
    .description('Instalar y configurar Genoma')
    .option('--dev', 'Modo desarrollador (acceso completo)')
    .option('--quick', 'Instalación rápida sin preguntas')
    .option('--provider <provider>', 'Pre-seleccionar proveedor IA (openai, anthropic, google, ollama)')
    .option('--channel <channel>', 'Pre-seleccionar canal (cli, telegram, discord, slack)')
    .option('--skip-validation', 'Saltar validación de sistema')
    .option('--verbose', 'Mostrar logs detallados')
    .action(async (options: SetupOptions) => {
      displayBanner();
      try {
        if (options.dev) {
          await runDevInstaller(options);
        } else {
          await runProdInstaller(options);
        }
        displaySuccess('¡Genoma instalado correctamente!');
      } catch (error) {
        displayError(error instanceof Error ? error.message : 'Error desconocido');
        process.exit(1);
      }
    });

  // Start command
  program
    .command('start')
    .description('Iniciar Genoma')
    .option('--gateway-only', 'Solo iniciar gateway')
    .option('--port <port>', 'Puerto personalizado')
    .action(async (options: StartOptions) => {
      const { startGenoma } = await import('../utils/service-manager.js');
      await startGenoma(options);
    });

  // Stop command
  program
    .command('stop')
    .description('Detener Genoma')
    .action(async () => {
      const { stopGenoma } = await import('../utils/service-manager.js');
      await stopGenoma();
    });

  // Status command
  program
    .command('status')
    .description('Ver estado de Genoma')
    .action(async () => {
      const { getStatus } = await import('../utils/service-manager.js');
      await getStatus();
    });

  // Doctor command
  program
    .command('doctor')
    .description('Diagnosticar problemas de instalación')
    .action(async () => {
      displayBanner();
      await runDiagnostics();
    });

  // Update command
  program
    .command('update')
    .description('Actualizar Genoma a la última versión')
    .action(async () => {
      console.log(chalk.yellow('⚠ Función de actualización en desarrollo'));
      console.log(chalk.gray('  Por ahora, usa: git pull && pnpm install && pnpm build'));
    });

  // Config command
  program
    .command('config')
    .description('Ver o editar configuración')
    .option('--show', 'Mostrar configuración actual')
    .option('--edit', 'Editar configuración')
    .action(async (options) => {
      const { showConfig } = await import('../config/config-generator.js');
      await showConfig(options);
    });

  return program;
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  const program = createInstallerCLI();
  program.parse(process.argv);
}
