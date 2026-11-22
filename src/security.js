import { issue } from './utils.js';

export function inspectSecurity(parsed, stats, file) {
  const issues = [];
  for (const [key, entry] of parsed.values) {
    // Catch common committed/demo credentials without ever including their contents in a report.
    if (/^(?:changeme|change_me|replace[-_ ]?me|your[_ -].*|<.*>)$/i.test(entry.value.trim())) {
      issues.push(issue('warning', 'placeholder-secret', `Variable "${key}" appears to contain a placeholder.`, entry.line, key));
    }
  }
  if (stats && process.platform !== 'win32' && (stats.mode & 0o077) !== 0) {
    issues.push(issue('warning', 'permissive-file-mode', `File permissions for "${file}" allow group or other access.`));
  }
  return issues;
}
