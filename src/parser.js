import { parse as parseDotenv } from 'dotenv';
import { issue } from './utils.js';

const VALID_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

function findClosingQuote(value, quote) {
  for (let index = 1; index < value.length; index += 1) {
    if (value[index] !== quote) continue;
    let slashes = 0;
    for (let previous = index - 1; previous >= 0 && value[previous] === '\\'; previous -= 1) slashes += 1;
    if (slashes % 2 === 0) return index;
  }
  return -1;
}

/** Parse dotenv-style source without evaluating it. Parsed values remain internal to scanning. */
export function parseEnv(text) {
  if (typeof text !== 'string') throw new TypeError('Environment file contents must be a string.');
  const source = text.replace(/^\uFEFF/, '');
  const lines = source.split(/\r\n|\n|\r/);
  const values = new Map();
  const issues = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = index + 1;
    const trimmed = lines[index].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([^=\s]+)\s*(?:=|:\s+)(.*)$/);
    if (!match) {
      issues.push(issue('error', 'malformed-line', 'Malformed environment assignment.', line));
      continue;
    }

    const key = match[1];
    if (!VALID_KEY.test(key)) {
      issues.push(issue('error', 'invalid-name', `Invalid variable name "${key}".`, line));
      continue;
    }
    if (values.has(key)) {
      issues.push(issue('error', 'duplicate-key', `Variable "${key}" is defined more than once.`, line, key));
    }

    const rawStart = match[2].trimStart();
    const quote = rawStart[0];
    let rawValue = rawStart;
    if (quote === '"' || quote === "'" || quote === '`') {
      let close = findClosingQuote(rawValue, quote);
      while (close < 0 && index + 1 < lines.length) {
        index += 1;
        rawValue += `\n${lines[index]}`;
        close = findClosingQuote(rawValue, quote);
      }
      if (close < 0) {
        issues.push(issue('error', 'malformed-value', `Unclosed quoted value for "${key}".`, line, key));
        rawValue = '';
      } else {
        const trailing = rawValue.slice(close + 1).trim();
        if (trailing && !trailing.startsWith('#')) {
          issues.push(issue('error', 'malformed-value', `Unexpected text after quoted value for "${key}".`, line, key));
        }
        rawValue = rawValue.slice(0, close + 1);
      }
    } else {
      rawValue = rawValue.replace(/\s+#.*$/, '').trim();
    }

    // Parse one assignment at a time so duplicate definitions retain their own values.
    const decoded = parseDotenv(`${key}=${rawValue}`);
    const value = Object.hasOwn(decoded, key) ? decoded[key] : rawValue;
    if (!values.has(key)) values.set(key, { value, line });
  }
  return { values, issues };
}
