import { readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return discover(path);
    return entry.isFile() && entry.name.endsWith('.test.mjs') ? [path] : [];
  });
}

// Expand paths here so discovery does not depend on shell or Node glob support.
const files = ['tests/unit', 'tests/contract']
  .flatMap((directory) => discover(join(root, directory)))
  .sort();
if (files.length === 0) throw new Error('No unit or contract test files found.');

const result = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files], {
  cwd: root,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
