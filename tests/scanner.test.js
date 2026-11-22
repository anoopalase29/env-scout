import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scanEnv } from '../src/scanner.js';

let dir;
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); dir = undefined; });

describe('scanner', () => {
  it('scans files and compares against an example', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-'));
    await writeFile(path.join(dir, '.env'), 'PRESENT=secret\nEMPTY=\n');
    await writeFile(path.join(dir, '.env.example'), 'PRESENT=x\nMISSING=x');
    const result = await scanEnv({ file: path.join(dir, '.env'), exampleFile: path.join(dir, '.env.example') });
    expect(result.totalVariables).toBe(2);
    expect(result.issues.map((item) => item.code)).toContain('missing-variable');
    expect(JSON.stringify(result)).not.toContain('secret');
  });
  it('returns a useful missing-file error', async () => {
    await expect(scanEnv({ file: '/definitely/not/here' })).rejects.toThrow('Environment file not found');
  });
  it('accepts a missing optional example and reports malformed example input', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-'));
    const file = path.join(dir, '.env');
    await writeFile(file, 'KNOWN=ok');
    const withoutExample = await scanEnv({ file, exampleFile: path.join(dir, 'not-created') });
    expect(withoutExample.issues.map((item) => item.code)).not.toContain('missing-variable');
    const exampleFile = path.join(dir, '.env.example');
    await writeFile(exampleFile, 'MALFORMED LINE');
    const withMalformedExample = await scanEnv({ file, exampleFile });
    expect(withMalformedExample.issues.map((item) => item.code)).toContain('malformed-line');
    expect(withMalformedExample.issues.some((item) => item.message.startsWith('Example file:'))).toBe(true);
  });
  it('does not count a missing example key as an invalid present variable', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-'));
    const file = path.join(dir, '.env');
    const exampleFile = path.join(dir, '.env.example');
    await writeFile(file, 'PRESENT=ok');
    await writeFile(exampleFile, 'PRESENT=x\nMISSING=x');
    const result = await scanEnv({ file, exampleFile });
    expect(result.totalVariables).toBe(1);
    expect(result.validVariables).toBe(1);
  });
});
