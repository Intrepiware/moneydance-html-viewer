// Synthetic acceptance utility only; the production viewer is Phase 6.
import { createReadStream } from 'node:fs';
import { lstat, writeFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';

const MAX = 134217781;
export async function decryptSynthetic(bytes, password) {
  if (bytes.length < 53 || bytes.length > MAX ||
      bytes.subarray(0, 8).toString('ascii') !== 'MDSNAP01' || bytes[8] !== 1)
    throw new Error('INVALID_ENVELOPE');
  if (!password || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(password))
    throw new Error('INVALID_PASSWORD');
  const source = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256',
    salt: bytes.subarray(9, 25), iterations: 600000 }, source,
    { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const plaintext = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(25, 37),
    additionalData: bytes.subarray(0, 37), tagLength: 128 }, key, bytes.subarray(37));
  const json = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
  const snapshot = JSON.parse(json);
  const validated = validateSnapshot(snapshot);
  return { json, accounts: validated.accountsById.size, entries: validated.entries.length };
}

async function passwordInput() {
  if (process.stdin.isTTY) {
    process.stdout.write('Synthetic encryption password (hidden): ');
    const silent = new Writable({ write(_chunk, _encoding, done) { done(); } });
    const reader = createInterface({ input: process.stdin, output: silent, terminal: true });
    try { return await reader.question(''); }
    finally { reader.close(); process.stdout.write('\n'); }
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of process.stdin) {
    size += chunk.length;
    if (size > 16384) throw new Error('PASSWORD_TOO_LONG');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/, '');
}

async function main() {
  try {
    const { values } = parseArgs({ options: {
      synthetic: { type: 'boolean' }, input: { type: 'string' }, output: { type: 'string' },
    } });
    if (!values.synthetic || !values.input) {
      process.stderr.write('Usage: node tests/tools/decrypt-synthetic.mjs --synthetic --input <ciphertext> [--output <new-synthetic-json>]\n');
      process.exitCode = 1; return;
    }
    if (values.output) {
      try {
        await lstat(values.output);
        console.error('OUTPUT_ALREADY_EXISTS: Choose a new output filename or remove the existing file.');
        process.exitCode = 1; return;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of createReadStream(values.input)) {
      size += chunk.length;
      if (size > MAX) throw new Error('INVALID_ENVELOPE');
      chunks.push(chunk);
    }
    let password = await passwordInput();
    const result = await decryptSynthetic(Buffer.concat(chunks), password);
    password = undefined;
    if (values.output) await writeFile(values.output, result.json, { flag: 'wx' });
    console.log(JSON.stringify({ status: 'VALID', accounts: result.accounts, entries: result.entries }));
  } catch {
    // Authentication, parsing, financial validation and file errors reveal no content.
    console.error('SYNTHETIC_DECRYPT_OR_VALIDATION_FAILED');
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
