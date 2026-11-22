import { describe, expect, it } from 'vitest';
import { formatReport } from '../src/reporter.js';

describe('reporter', () => {
  it('renders text and JSON without values', () => {
    const data = { file: '.env', totalVariables: 1, issues: [{ severity: 'warning', code: 'empty-value', message: 'Variable "KEY" has an empty value.', key: 'KEY' }] };
    expect(formatReport(data)).toContain('WARNING');
    expect(JSON.parse(formatReport(data, 'json'))).toEqual(data);
    expect(() => formatReport(data, 'yaml')).toThrow('must be "text" or "json"');
  });
});
