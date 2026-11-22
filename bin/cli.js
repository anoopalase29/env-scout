#!/usr/bin/env node
import { Command } from 'commander';
import chalk, { Chalk } from 'chalk';
import { inspectEnv } from '../src/index.js';
import { formatReport } from '../src/reporter.js';

const program = new Command();
program
  .name('env-scout')
  .description('Inspect environment files for errors, missing variables, and security risks.')
  .option('-f, --file <path>', 'environment file to inspect', '.env')
  .option('-e, --example <path>', 'example file used to detect missing variables', '.env.example')
  .option('--no-example', 'disable comparison with an example file')
  .option('--no-color', 'disable colored terminal output')
  .option('--format <format>', 'output format: text or json', 'text')
  .showHelpAfterError();
program.version('1.0.0');
program.exitOverride();

let parseError;
try {
  program.parse();
} catch (error) {
  parseError = error;
}

const options = program.opts();
const paint = options.color === false ? new Chalk({ level: 0 }) : chalk;
if (parseError?.code === 'commander.helpDisplayed' || parseError?.code === 'commander.version') {
  process.exitCode = 0;
} else if (parseError) {
  console.error(paint.red(`env-scout: ${parseError.message}`));
  process.exitCode = 2;
} else if (!['text', 'json'].includes(options.format)) {
  console.error(paint.red('--format must be either "text" or "json".'));
  process.exitCode = 2;
} else {
  try {
    const result = await inspectEnv({ file: options.file, exampleFile: options.example === false ? null : options.example });
    console.log(formatReport(result, options.format, Boolean(options.color)));
    if (!result.success) process.exitCode = 1;
  } catch (error) {
    if (options.format === 'json') {
      const issue = {
        severity: 'error',
        code: 'scan-failed',
        message: error.message
      };
      console.log(JSON.stringify({
        success: false,
        file: options.file,
        totalVariables: 0,
        validVariables: 0,
        errors: [issue],
        warnings: [],
        issues: [issue]
      }, null, 2));
    } else {
      console.error(paint.red(`env-scout: ${error.message}`));
    }
    process.exitCode = 2;
  }
}
