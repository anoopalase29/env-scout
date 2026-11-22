import { scanEnv } from './scanner.js';
import { validateOptions } from './utils.js';

/** Inspect an env file. Reports contain names and diagnostics, never values. */
export async function inspectEnv(options = {}) {
  validateOptions(options, 'inspectEnv options', ['file', 'exampleFile']);
  const scanned = await scanEnv(options);
  const errors = scanned.issues.filter((item) => item.severity === 'error');
  const warnings = scanned.issues.filter((item) => item.severity === 'warning');
  return {
    success: errors.length === 0,
    file: scanned.file,
    totalVariables: scanned.totalVariables,
    validVariables: scanned.validVariables,
    errors,
    warnings,
    issues: scanned.issues
  };
}

export { formatReport } from './reporter.js';
