import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockReadFile, mockStat } = vi.hoisted(() => ({ mockReadFile: vi.fn(), mockStat: vi.fn() }));
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, readFile: mockReadFile, stat: mockStat };
});

const { scanEnv } = await import('../src/scanner.js');

describe('scanner permission errors', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
    mockStat.mockReset();
  });

  it('converts EACCES into a useful error without leaking system details', async () => {
    mockReadFile.mockRejectedValue(Object.assign(new Error('EACCES secret-value'), { code: 'EACCES' }));
    mockStat.mockResolvedValue({ mode: 0o100600 });
    await expect(scanEnv({ file: '/private/protected.env', exampleFile: null }))
      .rejects.toThrow('Cannot read environment file: /private/protected.env');
    try {
      await scanEnv({ file: '/private/protected.env', exampleFile: null });
    } catch (error) {
      expect(error.message).not.toContain('secret-value');
      expect(error.cause).toBeUndefined();
    }
  });
});
