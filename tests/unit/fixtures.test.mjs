import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
test('synthetic budget fixture preserves the requested financial scenario', async () => {
  const snapshot = await read('../fixtures/valid-snapshot-v1.json');
  const accounts = [];
  const visit = a => { accounts.push(a); a.children.forEach(visit); };
  visit(snapshot.accounts);
  const ids = new Set(accounts.map(a => a.id));
  assert.equal(snapshot.entries.length, 13);
  assert.equal(new Set(snapshot.entries.map(e => e.transactionId)).size, 5);
  for (const entry of snapshot.entries) {
    assert.ok(ids.has(entry.accountId));
    for (const allocation of entry.allocations) assert.ok(ids.has(allocation.accountId));
  }
  for (const account of accounts.filter(a => a.included)) {
    const entries = snapshot.entries.filter(e => e.accountId === account.id).sort((a, b) => a.registerOrder - b.registerOrder);
    let balance = account.openingBalanceCents;
    for (const entry of entries) {
      balance += entry.amountCents;
      assert.equal(entry.runningBalanceCents, balance);
    }
    assert.equal(balance, account.closingBalanceCents);
    assert.equal(account.balanceTimeline.points[0].date, snapshot.balanceStartDate);
  }
  const checking = accounts.find(a => a.name === 'Checking');
  assert.deepEqual(checking.balanceTimeline.points.map(p => p.sidebarBalanceCents), [105000, 104500]);
  assert.deepEqual(checking.children.map(a => a.closingBalanceCents), [0, 65000, 20000, 19500]);
  assert.deepEqual(await read('../../UI/data/test-snapshot.json'), snapshot);
});
