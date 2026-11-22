import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectEnv } from '../src/index.js';
import { inspectEnv as packageInspectEnv } from 'env-scout';

let dir;
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); dir = undefined; });

describe('inspectEnv API', () => {
  it('returns structured diagnostics and never returns values', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-'));
    const file = path.join(dir, '.env');
    await writeFile(file, 'TOKEN=very-secret-value');
    const result = await inspectEnv({ file, exampleFile: null });
    expect(result).toMatchObject({ success: true, totalVariables: 1, validVariables: 1 });
    expect(JSON.stringify(result)).not.toContain('very-secret-value');
    expect(packageInspectEnv).toBe(inspectEnv);
  });
  it('rejects invalid options and does not silently disable an empty example path', async () => {
    await expect(inspectEnv(null)).rejects.toThrow('options must be an object');
    await expect(inspectEnv({ file: '.env', exampleFile: '' })).rejects.toThrow('exampleFile must be a non-empty path');
    await expect(inspectEnv({ file: '.env', unsupported: 'ignored' })).rejects.toThrow('Unsupported inspectEnv options key');
  });
});
