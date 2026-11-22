import { describe, expect, it } from 'vitest';
import { validateFilePath } from '../src/utils.js';

describe('utils', () => {
  it('validates and resolves paths', () => {
    expect(validateFilePath('config/.env')).toContain('config');
    expect(() => validateFilePath('')).toThrow('non-empty path string');
    expect(() => validateFilePath(42)).toThrow('non-empty path string');
  });
});
