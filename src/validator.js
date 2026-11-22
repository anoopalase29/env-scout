import { issue } from './utils.js';

export function validateParsed(parsed) {
  const issues = [...parsed.issues];
  for (const [key, entry] of parsed.values) {
    if (entry.value.trim() === '') {
      issues.push(issue('warning', 'empty-value', `Variable "${key}" has an empty value.`, entry.line, key));
    }
  }
  return issues;
}

export function findMissingVariables(parsed, exampleParsed) {
  if (!exampleParsed) return [];
  return [...exampleParsed.values.keys()]
    .filter((key) => !parsed.values.has(key))
    .map((key) => issue('error', 'missing-variable', `Required variable "${key}" is missing.` , undefined, key));
}
