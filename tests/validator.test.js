import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/parser.js';
import { findMissingVariables, validateParsed } from '../src/validator.js';

describe('validator', () => {
  it('detects empty values', () => {
    expect(validateParsed(parseEnv('EMPTY=')).map((item) => item.code)).toContain('empty-value');
  });
  it('compares keys with an example file', () => {
    expect(findMissingVariables(parseEnv('HERE=1'), parseEnv('HERE=x\nMISSING=x'))[0].key).toBe('MISSING');
  });
  it('treats every example key, including an empty template value, as required', () => {
    const issues = findMissingVariables(parseEnv('PRESENT=1'), parseEnv('PRESENT=x\nREQUIRED='));
    expect(issues.map((item) => item.code)).toEqual(['missing-variable']);
    expect(issues[0].key).toBe('REQUIRED');
  });
  it('keeps duplicate diagnostics from the parser without duplicating validator output', () => {
    const issues = validateParsed(parseEnv('DUP=one\nDUP=two'));
    expect(issues.filter((item) => item.code === 'duplicate-key')).toHaveLength(1);
  });
});
