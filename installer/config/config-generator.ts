/**
 * 🧬 Genoma Installer - Configuration Generator
 * Generates genoma.json configuration files
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';
import chalk from 'chalk';

export interface GenomaConfigInput {
  mode: 'dev' | 'production';
  provider: string;
  channels: string[];
  pgaEnabled: boolean;
}

export interface GenomaConfig {
  $schema: string;
  version: string;
  agents: {
    defaults: {
      model: string;
      sandbox: boolean;
      pga: {
        enabled: boolean;
        autoMutation: boolean;
        autoRollback: boolean;
      };
      orbis: {
        immuneSystem: boolean;
        mutationEvaluator: boolean;
        promptGuard: boolean;
      };
    };
  };
  gateway: {
    port: number;
    bind: string;
    auth: { type: string };
  };
  channels: Record<string, { enabled: boolean }>;
  logging: {
    level: string;
    format: string;
  };
}

export function generateGenomaConfig(input: GenomaConfigInput): GenomaConfig {
  return {
    $schema: 'https://genoma.dev/schemas/genoma.json',
    version: '4.0',

    agents: {
      defaults: {
        model: getDefaultModel(input.provider),
        sandbox: input.mode === 'production',
        pga: {
          enabled: input.pgaEnabled,
          autoMutation: input.mode === 'production',
          autoRollback: true,
        },
        orbis: {
          immuneSystem: true,
          mutationEvaluator: input.mode === 'production',
          promptGuard: true,
        },
      },
    },

    gateway: {
      port: 18789,
      bind: input.mode === 'dev' ? 'localhost' : 'lan',
      auth: { type: 'token' },
    },

    channels: input.channels.reduce(
      (acc, ch) => {
        acc[ch] = { enabled: true };
        return acc;
      },
      {} as Record<string, { enabled: boolean }>
    ),

    logging: {
      level: input.mode === 'dev' ? 'debug' : 'info',
      format: input.mode === 'dev' ? 'pretty' : 'json',
    },
  };
}

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4-turbo';
    case 'anthropic':
      return 'claude-3-5-sonnet-20241022';
    case 'google':
      return 'gemini-pro';
    case 'ollama':
      return 'llama3';
    default:
      return 'gpt-4-turbo';
  }
}

export async function showConfig(options: { show?: boolean; edit?: boolean }): Promise<void> {
  const homeDir = os.homedir();
  const configPath = join(homeDir, '.genoma', 'genoma.json');
  const envPath = join(homeDir, '.genoma', '.env');

  console.log(chalk.cyan('\n🧬 Configuración de Genoma\n'));

  if (existsSync(configPath)) {
    console.log(chalk.green('✓ genoma.json encontrado'));
    console.log(chalk.gray(`  Ruta: ${configPath}\n`));

    if (options.show) {
      try {
        const content = readFileSync(configPath, 'utf-8');
        console.log(chalk.white(content));
      } catch (error) {
        console.log(chalk.red('Error leyendo configuración'));
      }
    }
  } else {
    console.log(chalk.yellow('⚠ genoma.json no encontrado'));
    console.log(chalk.gray('  Ejecuta: genoma setup\n'));
  }

  if (existsSync(envPath)) {
    console.log(chalk.green('✓ .env encontrado'));
    console.log(chalk.gray(`  Ruta: ${envPath}\n`));
  } else {
    console.log(chalk.yellow('⚠ .env no encontrado'));
  }

  if (options.edit) {
    console.log(chalk.blue('\n📝 Para editar la configuración:'));
    console.log(chalk.gray(`  nano ${configPath}`));
    console.log(chalk.gray(`  nano ${envPath}\n`));
  }
}
