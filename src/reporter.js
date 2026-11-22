import chalk, { Chalk } from 'chalk';

export function formatReport(result, format = 'text', color = true) {
  if (format !== 'text' && format !== 'json') {
    throw new TypeError('Report format must be "text" or "json".');
  }
  if (format === 'json') return JSON.stringify(result, null, 2);
  const paint = color ? chalk : new Chalk({ level: 0 });
  const lines = [`env-scout: ${result.file}`, `${result.totalVariables} variable(s) inspected`];
  if (result.issues.length === 0) lines.push(paint.green('✓ No issues found.'));
  for (const item of result.issues) {
    const symbol = item.severity === 'error' ? '✖' : '⚠';
    const style = item.severity === 'error' ? paint.red : paint.yellow;
    const location = item.line ? ` (line ${item.line})` : '';
    lines.push(style(`${symbol} ${item.severity.toUpperCase()} ${item.message}${location}`));
  }
  const errors = result.issues.filter((item) => item.severity === 'error').length;
  const warnings = result.issues.length - errors;
  lines.push(`${errors} error(s), ${warnings} warning(s)`);
  return lines.join('\n');
}
