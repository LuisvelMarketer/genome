/**
 * 🧬 Genoma Installer - Logger
 * Beautiful console output with colors and formatting
 */

import chalk from 'chalk';

const BANNER = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ██████╗ ███████╗███╗   ██╗ ██████╗ ███╗   ███╗ █████╗  ║
║  ██╔════╝ ██╔════╝████╗  ██║██╔═══██╗████╗ ████║██╔══██╗ ║
║  ██║  ███╗█████╗  ██╔██╗ ██║██║   ██║██╔████╔██║███████║ ║
║  ██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██║╚██╔╝██║██╔══██║ ║
║  ╚██████╔╝███████╗██║ ╚████║╚██████╔╝██║ ╚═╝ ██║██║  ██║ ║
║   ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝ ║
║                                                          ║
║           🧬 Genoma v4.0 - Installer                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝`;

export function displayBanner(): void {
  console.log(chalk.cyan(BANNER));
}

export function displaySuccess(message: string): void {
  console.log(chalk.green(`\n🎉 ${message}\n`));
}

export function displayError(message: string): void {
  console.log(chalk.red(`\n❌ Error: ${message}\n`));
}

export function displayWarning(message: string): void {
  console.log(chalk.yellow(`\n⚠ ${message}\n`));
}

export function displayInfo(message: string): void {
  console.log(chalk.blue(`ℹ ${message}`));
}

export function displaySection(title: string): void {
  console.log(chalk.cyan(`\n─── ${title} ───\n`));
}

export function log(message: string): void {
  console.log(message);
}

export function logVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(chalk.gray(`[VERBOSE] ${message}`));
  }
}
