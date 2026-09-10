import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pbkdf2Sync, createCipheriv } from 'node:crypto';
import { decryptSynthetic } from '../tools/decrypt-synthetic.mjs';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

function envelope(text) {
  const header = Buffer.concat([Buffer.from('MDSNAP01'), Buffer.from([1]), Buffer.alloc(16, 2), Buffer.alloc(12, 3)]);
  const key = pbkdf2Sync('synthetic', header.subarray(9,25), 600000, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, header.subarray(25));
  cipher.setAAD(header);
  return Buffer.concat([header, cipher.update(text), cipher.final(), cipher.getAuthTag()]);
}
test('existing output is rejected before input reading or password prompt', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'synthetic-decrypt-'));
  const output = join(directory, 'existing.json');
  try {
    await writeFile(output, 'preserve this synthetic file');
    const child = spawn(process.execPath, [
      fileURLToPath(new URL('../tools/decrypt-synthetic.mjs', import.meta.url)),
      '--synthetic', '--input', join(directory, 'missing.enc'), '--output', output,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    // Keep stdin open: an accidental password read would hang until this timeout.
    const timer = setTimeout(() => child.kill(), 5000);
    try {
      const code = await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', resolve);
      });
      assert.equal(code, 1);
      assert.match(stderr, /^OUTPUT_ALREADY_EXISTS:/);
      assert.equal(stdout, '');
      assert.equal(await readFile(output, 'utf8'), 'preserve this synthetic file');
    } finally { clearTimeout(timer); child.stdin.destroy(); }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('synthetic utility authenticates before validating and rejects malformed data', async () => {
  const json = readFileSync(new URL('../../UI/data/test-snapshot.json', import.meta.url), 'utf8');
  const bytes = envelope(json);
  const result = await decryptSynthetic(bytes, 'synthetic');
  assert.equal(result.json, json);
  assert.ok(result.entries > 0);
  await assert.rejects(decryptSynthetic(bytes, 'wrong'));
  const bad = Buffer.from(bytes); bad[bad.length-1] ^= 1;
  await assert.rejects(decryptSynthetic(bad, 'synthetic'));
  await assert.rejects(decryptSynthetic(bytes.subarray(0,52), 'synthetic'));
  await assert.rejects(decryptSynthetic(envelope('{"invalid":"financial schema"}'), 'synthetic'));
  await assert.rejects(decryptSynthetic(envelope('not json'), 'synthetic'));
});
