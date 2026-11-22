import path from 'node:path';

export function validateFilePath(file, optionName = 'file') {
  if (typeof file !== 'string' || file.trim() === '') {
    throw new TypeError(`${optionName} must be a non-empty path string.`);
  }
  return path.resolve(file);
}

export function validateOptions(options, label, allowedKeys) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError(`${label} must be an object.`);
  }
  const prototype = Object.getPrototypeOf(options);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  const unsupported = Object.keys(options).find((key) => !allowedKeys.includes(key));
  if (unsupported) throw new TypeError(`Unsupported ${label} key "${unsupported}".`);
  return options;
}

export function issue(severity, code, message, line, key) {
  const result = { severity, code, message };
  if (Number.isInteger(line)) result.line = line;
  if (key) result.key = key;
  return result;
}
