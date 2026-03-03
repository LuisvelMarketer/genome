/**
 * 🧬 Genoma Installer - Progress Indicators
 * Spinners and progress bars for visual feedback
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';

let currentSpinner: Ora | null = null;

export function createSpinner(message: string): Ora {
  currentSpinner = ora({
    text: message,
    color: 'cyan',
  }).start();
  return currentSpinner;
}

export async function withSpinner<T>(
  message: string,
  task: () => Promise<T>,
  successMessage?: string
): Promise<T> {
  const spinner = createSpinner(message);
  try {
    const result = await task();
    spinner.succeed(successMessage || message);
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

export function showProgress(steps: string[], current: number): void {
  const total = steps.length;
  const percent = Math.round((current / total) * 100);
  const barWidth = 30;
  const filled = Math.round((current / total) * barWidth);
  const empty = barWidth - filled;

  const bar = chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

  console.log(`\n  [${bar}] ${percent}% (${current}/${total})`);
  if (current <= total && steps[current - 1]) {
    console.log(chalk.gray(`  → ${steps[current - 1]}`));
  }
}

export function showStepResult(step: string, success: boolean, details?: string): void {
  const icon = success ? chalk.green('✓') : chalk.red('✗');
  console.log(`  ${icon} ${step}`);
  if (details) {
    console.log(chalk.gray(`    ${details}`));
  }
}

export function showWarning(message: string): void {
  console.log(chalk.yellow(`  ⚠ ${message}`));
}

export function showInfo(message: string): void {
  console.log(chalk.blue(`  ℹ ${message}`));
}
