import { readFile, stat } from 'node:fs/promises';
import { parseEnv } from './parser.js';
import { validateParsed, findMissingVariables } from './validator.js';
import { inspectSecurity } from './security.js';
import { validateFilePath, validateOptions } from './utils.js';

export async function scanEnv(options = {}) {
  validateOptions(options, 'Scan options', ['file', 'exampleFile']);
  const { file = '.env', exampleFile = '.env.example' } = options;
  const filePath = validateFilePath(file);
  const examplePath = exampleFile === null || exampleFile === undefined
    ? null
    : validateFilePath(exampleFile, 'exampleFile');
  let content;
  let fileStats;
  try {
    [content, fileStats] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Environment file not found: ${file}`);
    if (error.code === 'EACCES') throw new Error(`Cannot read environment file: ${file}`);
    throw new Error(`Unable to read environment file: ${file}`);
  }
  const parsed = parseEnv(content);
  const ownIssues = [...validateParsed(parsed), ...inspectSecurity(parsed, fileStats, file)];
  const issues = [...ownIssues];

  if (examplePath) {
    try {
      const example = parseEnv(await readFile(examplePath, 'utf8'));
      issues.push(...findMissingVariables(parsed, example));
      issues.push(...example.issues.map((item) => ({ ...item, message: `Example file: ${item.message}` })));
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Unable to read example file: ${exampleFile}`);
    }
  }
  const invalidKeys = new Set(ownIssues
    .filter((item) => item.key && parsed.values.has(item.key))
    .map((item) => item.key));
  return {
    file: filePath,
    totalVariables: parsed.values.size,
    validVariables: parsed.values.size - invalidKeys.size,
    issues
  };
}
