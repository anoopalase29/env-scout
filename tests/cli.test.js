import { spawnSync } from 'node:child_process';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let dir;
afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }); dir = undefined; });

function runCli(args) {
  return spawnSync(process.execPath, [path.join(root, 'bin/cli.js'), ...args], {
    cwd: root,
    encoding: 'utf8'
  });
}

describe('CLI', () => {
  it('supports help and version', () => {
    expect(runCli(['--help']).status).toBe(0);
    expect(runCli(['--version']).status).toBe(0);
  });

  it('returns valid JSON for successful scans and validation failures', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-cli-'));
    const file = path.join(dir, '.env');
    await writeFile(file, 'TOKEN=private-sentinel\nDUP=one\nDUP=two');
    const result = runCli(['--file', file, '--no-example', '--format', 'json']);
    expect(result.status).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.errors.map((item) => item.code)).toContain('duplicate-key');
    expect(result.stdout).not.toContain('private-sentinel');
  });

  it('scans a custom file successfully and honors --no-color', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'env-scout-cli-'));
    const file = path.join(dir, '.env');
    await writeFile(file, 'TOKEN=ok');
    const result = spawnSync(process.execPath, [path.join(root, 'bin/cli.js'), '--file', file, '--no-example', '--no-color'], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    expect(result.status).toBe(0);
    expect(result.stdout).not.toMatch(/\u001b\[/);
    expect(result.stdout).toContain('0 error(s)');
  });

  it('returns JSON and exit code 2 for file errors; usage errors are graceful', () => {
    const missing = runCli(['--file', path.join(os.tmpdir(), 'env-scout-missing'), '--format', 'json']);
    expect(missing.status).toBe(2);
    expect(JSON.parse(missing.stdout).errors[0].code).toBe('scan-failed');
    expect(runCli(['--unknown-option']).status).toBe(2);
    expect(runCli(['--format', 'yaml']).status).toBe(2);
    expect(runCli(['--example', '', '--file', 'examples/env.sample']).status).toBe(2);
  });
});
