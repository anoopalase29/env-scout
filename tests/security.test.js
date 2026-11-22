import { describe, expect, it } from 'vitest';
import process from 'node:process';
import { inspectSecurity } from '../src/security.js';
import { parseEnv } from '../src/parser.js';

describe('security', () => {
  it('warns about placeholder-like values without printing their contents', () => {
    const issues = inspectSecurity(parseEnv('TOKEN=changeme'), null, '.env');
    expect(issues[0].code).toBe('placeholder-secret');
    expect(JSON.stringify(issues)).not.toContain('changeme');
  });
  it('checks group and other permissions only on POSIX platforms', () => {
    const issues = inspectSecurity(parseEnv('KEY=value'), { mode: 0o100644 }, '.env');
    if (process.platform === 'win32') {
      expect(issues).toEqual([]);
    } else {
      expect(issues.map((item) => item.code)).toContain('permissive-file-mode');
    }
  });
});
