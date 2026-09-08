import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateSnapshot, SnapshotError } from '../../UI/src/snapshot.mjs';
const fixture = JSON.parse(await readFile(new URL('../fixtures/valid-snapshot-v1.json', import.meta.url), 'utf8'));
const cli = fileURLToPath(new URL('../../scripts/validate-snapshot.mjs', import.meta.url));

test('CLI diagnostics are opt-in and identify account, entry and root failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'snapshot-debug-'));
  try {
    const file = join(dir, 'input.json');
    for (const [change, field, marker] of [
      [s => { s.accounts.children[0].name = 42; s.accounts.children[0].id = 'account-marker'; }, 'account.name', 'account-marker'],
      [s => { s.entries[0].clearedStatus = 'bad-status-marker'; }, 'entry.clearedStatus', 'bad-status-marker'],
      [s => { s.exportDate = 'bad-date-marker'; }, 'exportDate', 'bad-date-marker'],
    ]) {
      const s = structuredClone(fixture); change(s);
      await writeFile(file, JSON.stringify(s));
      const normal = spawnSync(process.execPath, [cli, file], { encoding: 'utf8' });
      assert.equal(normal.status, 1);
      assert.equal(normal.stdout, '');
      assert.deepEqual(JSON.parse(normal.stderr), { status: 'ERROR', code: 'INVALID_SNAPSHOT', field });
      assert.ok(!normal.stderr.includes(marker));
      for (const args of [[cli, '--debug', file], [cli, file, '--debug']]) {
        const debug = spawnSync(process.execPath, args, { encoding: 'utf8' });
        assert.equal(debug.status, 1);
        assert.ok(debug.stderr.includes(marker));
        assert.match(debug.stderr, /Validation entity:/);
        assert.match(debug.stderr, /SnapshotError: INVALID_SNAPSHOT/);
        assert.match(debug.stderr, /at validateSnapshot/);
        assert.match(debug.stderr, /validate-snapshot.mjs/);
      }
    }
    await writeFile(file, '{malformed-json-marker');
    const normal = spawnSync(process.execPath, [cli, file], { encoding: 'utf8' });
    assert.equal(JSON.parse(normal.stderr).field, 'input');
    const debug = spawnSync(process.execPath, [cli, file, '--debug'], { encoding: 'utf8' });
    assert.equal(debug.status, 1);
    assert.match(debug.stderr, /Unavailable:/);
    assert.match(debug.stderr, /SyntaxError:/);
    await writeFile(file, JSON.stringify(fixture));
    for (const args of [[cli, file], [cli, '--debug', file]]) {
      const valid = spawnSync(process.execPath, args, { encoding: 'utf8' });
      assert.equal(valid.status, 0);
      assert.equal(valid.stderr, '');
      assert.equal(JSON.parse(valid.stdout).status, 'VALID');
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('arithmetic overflow preserves validation error and failing entry', () => {
  const s = structuredClone(fixture);
  const entry = s.entries[0];
  const find = a => a.id === entry.accountId ? a : a.children.map(find).find(Boolean);
  const account = find(s.accounts);
  account.openingBalanceCents = Number.MAX_SAFE_INTEGER;
  entry.amountCents = Number.MAX_SAFE_INTEGER;
  assert.throws(() => validateSnapshot(s), error => {
    assert.ok(error instanceof SnapshotError);
    assert.equal(error.field, 'entry.runningBalanceCents');
    assert.equal(error.entity, entry);
    return true;
  });
});
