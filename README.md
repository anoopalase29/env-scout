# env-scout

Inspect `.env` files for malformed assignments, duplicate or invalid names, empty values, missing keys, and basic security concerns. Reports include variable names and diagnostics, never their values. env-scout parses input as text; it does not execute or evaluate environment files.

## Install

```sh
npm install
npm link
```

For a project dependency, install the published package with `npm install @anoopalase29/env-scout` after it is published.

Run the CLI without installing it globally:

```sh
npx @anoopalase29/env-scout --help
```

## CLI

```sh
env-scout
env-scout --file .env.production
env-scout --file .env.production --example .env.example
env-scout --format json
env-scout --no-color
env-scout --no-example
env-scout --help
env-scout --version
```

The CLI compares against `.env.example` when that file exists. Missing example files are allowed. Exit codes are `0` for no errors, `1` when the scan finds errors, and `2` for invocation or file access errors. Warnings do not fail the scan.

## JavaScript API

```js
import { inspectEnv } from '@anoopalase29/env-scout';

const result = await inspectEnv({ file: '.env' });
console.log(result.success, result.errors, result.warnings);
```

Options are `file` (default `.env`) and `exampleFile` (default `.env.example`, set to `null` to disable). Every key in the example file is required; env-scout does not define optional-variable annotations. `totalVariables` counts distinct validly named keys present in the scanned file, and `validVariables` excludes present keys with an error or warning. The result also contains `success`, `file`, `errors`, `warnings`, and `issues`. Values are never included in that result.

## Checks

- Parses dotenv-style assignments and comments without evaluating input.
- Reports malformed lines and quoted values, invalid names, and duplicate keys.
- Warns about empty values and common placeholder values.
- Compares keys with an optional example file and reports missing variables.
- Warns when POSIX file permissions allow group or other access.

The parser uses `dotenv` for conventional value decoding and a source-text pass to preserve duplicate and malformed-line diagnostics. It intentionally does not perform shell expansion or evaluate the file.

## Development

```sh
npm install
npm test
node bin/cli.js --help
node bin/cli.js --file examples/env.sample --example examples/.env.example
```

Before publishing, review `npm pack --dry-run`, verify the package name is available, update the version, then publish with `npm publish`. Publishing is intentionally left to the package owner.

## License

MIT
