import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';
import { createRegisterQuery } from '../../UI/src/query.mjs';
const model = validateSnapshot(JSON.parse(await readFile(new URL('../fixtures/register-pages-v1.json', import.meta.url), 'utf8')));
const query = createRegisterQuery(model, '2100-01-01');
test('direct register pages preserve full history, opening balance and source order', () => {
  const before = JSON.stringify(model.snapshot);
  const rows = [1, 2, 3].flatMap(page => query({ accountId: 'register-pages', page }).rows);
  assert.equal(rows.length, 205);
  assert.equal(new Set(rows.map(r => r.id)).size, 205);
  assert.equal(rows[0].id, 'register-204');
  assert.equal(rows.at(-1).id, 'register-000');
  assert.equal(rows[0].runningBalanceCents, 32845);
  assert.equal(rows.at(-1).runningBalanceCents, 12445);
  assert.equal(rows[0].date, '2099-01-02');
  assert.equal(rows[0].checkNum, '0007');
  assert.deepEqual(rows.slice(0, 3).map(r => r.category), ['Uncategorized', 'Checking', 'Split']);
  assert.equal(query({ accountId: 'register-pages', page: 999 }).page, 3);
  assert.equal(query({ accountId: 'register-pages', page: 999 }).rows.length, 5);
  assert.equal(JSON.stringify(model.snapshot), before);
});
test('All Accounts retains counterparts and selection never loses rows or alters balances', () => {
  const all = query({});
  const parent = model.snapshot.accounts.children[0];
  assert.equal(query({ accountId: parent.id }).totalMatches, 0);
  assert.equal(query({ accountId: parent.id, page: 10 }).page, 1);
  const child = parent.children[3];
  const own = query({ accountId: child.id });
  assert.ok(own.rows.every(r => r.accountId === child.id));
  assert.deepEqual(query({}), all);
  const rows = [1, 2, 3].flatMap(page => query({ page }).rows);
  assert.equal(rows.length, model.entries.length);
  for (let i = 1; i < rows.length; i++) {
    const previous = rows[i - 1], current = rows[i];
    assert.ok(previous.date >= current.date);
    if (previous.date === current.date) assert.ok(previous.accountId <= current.accountId);
  }
  for (const row of rows) {
    const source = model.entries.find(e => e.id === row.id && e.accountId === row.accountId);
    assert.equal(row.runningBalanceCents, source.runningBalanceCents);
    assert.equal(row.amountCents, source.amountCents);
  }
  assert.equal(rows.filter(r => r.description === 'Candy Bar').length, 2);
});
test('queries reject malformed input and excluded/unknown accounts', () => {
  for (const input of [{page: 0}, {page: 1.5}, {pageSize: 101}, {text:'search'}, {accountId:'missing'}, {accountId:model.snapshot.accounts.id}])
    assert.throws(() => query(input), e => e.code === 'INVALID_QUERY');
});

test('future summary covers the whole register and reveal restores paged history', () => {
  const q = createRegisterQuery(model, '2026-09-06');
  const hidden = q({ accountId: 'register-pages' });
  assert.equal(hidden.totalMatches, 0);
  assert.equal(hidden.page, 1);
  assert.deepEqual(hidden.rows, []);
  assert.deepEqual(hidden.future, { count: 205, amountCents: 20500 });
  const shown = q({ accountId: 'register-pages', includeFuture: true });
  assert.equal(shown.totalMatches, 205);
  assert.equal(shown.rows.length, 100);
  assert.equal(shown.rows[0].runningBalanceCents, 32845);
  assert.equal(q({}).totalMatches, 13);
  assert.equal(q({ includeFuture: true }).totalMatches, 218);
  assert.deepEqual(q({ accountId: 'register-pages' }), hidden);
  const cutoff = createRegisterQuery(model, '2099-01-01');
  assert.deepEqual(cutoff({ accountId: 'register-pages' }).future, { count: 1, amountCents: 100 });
  assert.equal(cutoff({ accountId: 'register-pages' }).totalMatches, 204);
});
