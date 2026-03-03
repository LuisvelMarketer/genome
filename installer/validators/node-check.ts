/**
 * 🧬 Genoma Installer - Node.js Version Check
 */

import chalk from 'chalk';

const REQUIRED_NODE_VERSION = '22.12.0';

export function checkNodeVersion(): { ok: boolean; current: string; required: string } {
  const current = process.version.replace('v', '');
  const currentParts = current.split('.').map(Number);
  const requiredParts = REQUIRED_NODE_VERSION.split('.').map(Number);

  let ok = true;
  for (let i = 0; i < requiredParts.length; i++) {
    if (currentParts[i] > requiredParts[i]) break;
    if (currentParts[i] < requiredParts[i]) {
      ok = false;
      break;
    }
  }

  return { ok, current, required: REQUIRED_NODE_VERSION };
}

export function ensureNodeVersion(): void {
  const { ok, current, required } = checkNodeVersion();

  if (!ok) {
    console.error(chalk.red(`\n❌ Error: Node.js v${current} no es compatible`));
    console.error(chalk.yellow(`   Requerido: Node.js >= v${required}`));
    console.error(chalk.gray('   Descarga: https://nodejs.org\n'));
    process.exit(1);
  }
}
