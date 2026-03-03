#!/usr/bin/env node
/**
 * 🧬 Genoma Installer - Entry Point
 * Genoma v4.0 - Professional npm Installer
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Dynamic import for the CLI
async function main() {
  try {
    // Check for tsx or run compiled version
    const cliPath = join(__dirname, '..', 'cli', 'installer-cli.js');
    const { createInstallerCLI } = await import(cliPath);
    const program = createInstallerCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    // Fallback: try TypeScript version with tsx
    try {
      const { execSync } = await import('node:child_process');
      const tsCliPath = join(__dirname, '..', 'cli', 'installer-cli.ts');
      execSync(`npx tsx ${tsCliPath} ${process.argv.slice(2).join(' ')}`, {
        stdio: 'inherit',
        cwd: join(__dirname, '..', '..')
      });
    } catch (e) {
      console.error('❌ Error: Could not start Genoma installer');
      console.error('   Please run: pnpm build first');
      process.exit(1);
    }
  }
}

main();
