/**
 * 🧬 Genoma Installer
 * Professional npm installer with dev and production modes
 * 
 * @packageDocumentation
 */

// CLI
export { createInstallerCLI, SetupOptions, StartOptions } from './cli/installer-cli.js';
export { runInstallationWizard, confirmAction, InstallationAnswers } from './cli/prompts.js';
export { createSpinner, withSpinner, showProgress, showStepResult } from './cli/progress.js';

// Modes
export { runDevInstaller } from './modes/dev-installer.js';
export { runProdInstaller } from './modes/prod-installer.js';

// Validators
export {
  checkSystemRequirements,
  checkOptionalRequirements,
  validateSystem,
  runDiagnostics,
  SystemRequirements,
  OptionalRequirements,
} from './validators/system-check.js';
export { checkNodeVersion, ensureNodeVersion } from './validators/node-check.js';
export { checkDependencies, getMissingRequired, DependencyStatus } from './validators/dependencies-check.js';

// Config
export { generateEnvFile, generateDevEnv, generateProdEnv, EnvConfig } from './config/env-generator.js';
export { generateGenomaConfig, showConfig, GenomaConfigInput, GenomaConfig } from './config/config-generator.js';

// Utils
export {
  displayBanner,
  displaySuccess,
  displayError,
  displayWarning,
  displayInfo,
  displaySection,
  log,
  logVerbose,
} from './utils/logger.js';
export {
  generateSecureToken,
  ensureDir,
  getConfigDir,
  getStateDir,
  isRoot,
  sleep,
  isPortAvailable,
  formatBytes,
} from './utils/helpers.js';
export { startGenoma, stopGenoma, getStatus } from './utils/service-manager.js';
