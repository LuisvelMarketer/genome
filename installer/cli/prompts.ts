/**
 * 🧬 Genoma Installer - Interactive Prompts
 * Using @clack/prompts for beautiful CLI interactions
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';

export interface InstallationAnswers {
  installType: 'quick' | 'custom' | 'enterprise';
  provider: string;
  apiKey: string;
  channels: string[];
  enablePGA: boolean;
  enableDocker?: boolean;
}

export async function runInstallationWizard(): Promise<InstallationAnswers | null> {
  p.intro(chalk.bgBlue.white(' 🧬 Genoma Installer '));

  const installType = await p.select({
    message: '¿Qué tipo de instalación prefieres?',
    options: [
      { value: 'quick', label: '⚡ Rápida', hint: 'Configuración mínima para empezar ya' },
      { value: 'custom', label: '🔧 Personalizada', hint: 'Elige tus proveedores y canales' },
      { value: 'enterprise', label: '🏢 Empresarial', hint: 'Incluye Docker y alta disponibilidad' },
    ],
  });

  if (p.isCancel(installType)) {
    p.cancel('Instalación cancelada.');
    return null;
  }

  const provider = await p.select({
    message: 'Selecciona tu proveedor de IA principal:',
    options: [
      { value: 'openai', label: 'OpenAI', hint: 'GPT-4, GPT-3.5' },
      { value: 'anthropic', label: 'Anthropic', hint: 'Claude 3.5' },
      { value: 'google', label: 'Google', hint: 'Gemini Pro' },
      { value: 'ollama', label: 'Modelos locales', hint: 'Ollama' },
      { value: 'multi', label: 'Múltiples', hint: 'Varios proveedores' },
    ],
  });

  if (p.isCancel(provider)) {
    p.cancel('Instalación cancelada.');
    return null;
  }

  let apiKey = '';
  if (provider !== 'ollama') {
    const apiKeyResult = await p.password({
      message: `Ingresa tu API Key de ${provider}:`,
      validate: (value) => {
        if (!value) return 'API Key es requerida';
        if (provider === 'openai' && !value.startsWith('sk-')) {
          return 'API Key de OpenAI debe empezar con sk-';
        }
        return undefined;
      },
    });

    if (p.isCancel(apiKeyResult)) {
      p.cancel('Instalación cancelada.');
      return null;
    }
    apiKey = apiKeyResult;
  }

  const channels = await p.multiselect({
    message: '¿Qué canales deseas habilitar?',
    options: [
      { value: 'cli', label: 'Terminal (CLI)', hint: 'Siempre activo' },
      { value: 'webui', label: 'Web UI', hint: 'Interface gráfica' },
      { value: 'telegram', label: 'Telegram' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'discord', label: 'Discord' },
      { value: 'slack', label: 'Slack' },
    ],
    required: true,
    initialValues: ['cli'],
  });

  if (p.isCancel(channels)) {
    p.cancel('Instalación cancelada.');
    return null;
  }

  const enablePGA = await p.confirm({
    message: '¿Habilitar evolución PGA? (Recomendado)',
    initialValue: true,
  });

  if (p.isCancel(enablePGA)) {
    p.cancel('Instalación cancelada.');
    return null;
  }

  let enableDocker: boolean | undefined;
  if (installType === 'enterprise') {
    const dockerResult = await p.confirm({
      message: '¿Configurar Docker para sandbox?',
      initialValue: true,
    });
    if (!p.isCancel(dockerResult)) {
      enableDocker = dockerResult;
    }
  }

  return {
    installType: installType as 'quick' | 'custom' | 'enterprise',
    provider: provider as string,
    apiKey,
    channels: channels as string[],
    enablePGA,
    enableDocker,
  };
}

export async function confirmAction(message: string): Promise<boolean> {
  const result = await p.confirm({ message });
  return !p.isCancel(result) && result;
}
