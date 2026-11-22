import { describe, expect, it } from 'vitest';
import { parseEnv } from '../src/parser.js';

describe('parseEnv', () => {
  it('parses assignments, comments, exports, and quoted values without exposing them as issues', () => {
    const parsed = parseEnv('# comment\nexport GOOD_KEY="secret value" # note\nNEXT=plain');
    expect([...parsed.values.keys()]).toEqual(['GOOD_KEY', 'NEXT']);
    expect(parsed.values.get('GOOD_KEY').value).toBe('secret value');
    expect(parsed.issues).toEqual([]);
  });
  it('reports malformed, invalid, and duplicate assignments', () => {
    const { issues } = parseEnv('bad line\nBAD-NAME=x\nDUP=one\nDUP=two\nUNCLOSED="x');
    expect(issues.map((item) => item.code)).toEqual(['malformed-line', 'invalid-name', 'duplicate-key', 'malformed-value']);
  });
  it('handles multiline quoted values and CRLF while preserving line numbers', () => {
    const parsed = parseEnv('\uFEFFFIRST="line one\r\nline two # still value"\r\nNEXT=value # comment\r\nEMPTY=');
    expect(parsed.issues).toEqual([]);
    expect(parsed.values.get('FIRST')).toEqual({ value: 'line one\nline two # still value', line: 1 });
    expect(parsed.values.get('NEXT')).toEqual({ value: 'value', line: 3 });
    expect(parsed.values.get('EMPTY')).toEqual({ value: '', line: 4 });
  });
  it('handles empty input and keeps duplicate diagnostics on the later line', () => {
    expect(parseEnv('').issues).toEqual([]);
    expect(parseEnv('SAME=one\nSAME=two\nSAME=three').issues.map(({ code, line }) => ({ code, line }))).toEqual([
      { code: 'duplicate-key', line: 2 },
      { code: 'duplicate-key', line: 3 }
    ]);
  });
  it('treats shell-looking values as inert data and excludes them from diagnostics', () => {
    const parsed = parseEnv('PAYLOAD=$(printf secret-marker)\nBROKEN="secret-marker');
    expect(parsed.issues.some((item) => JSON.stringify(item).includes('secret-marker'))).toBe(false);
    expect(parsed.values.get('PAYLOAD').value).toBe('$(printf secret-marker)');
  });
});
