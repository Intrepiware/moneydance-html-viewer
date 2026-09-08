import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';
const fixture = JSON.parse(await readFile(new URL('../fixtures/valid-snapshot-v1.json', import.meta.url), 'utf8'));
const fresh = () => structuredClone(fixture);
test('valid snapshot indexes all entries without copying account history', () => {
  const s = fresh(), result = validateSnapshot(s);
  assert.equal(result.entries, s.entries);
  assert.equal(result.entries.length, 13);
  assert.equal(result.accountsById.size, 10);
});
test('version and timestamp failures have safe explicit errors', () => {
  for (const value of [undefined, null, 4, 'bad', '2026-02-30T00:00:00Z', '2026-09-06']) {
    const s = fresh(); s.exportDate = value;
    assert.throws(() => validateSnapshot(s), e => e.code === 'INVALID_SNAPSHOT');
  }
  const s = fresh(); delete s.schemaVersion;
  assert.throws(() => validateSnapshot(s), e => e.code === 'UNSUPPORTED_VERSION');
});
test('financial and reference corruption cannot silently load', () => {
  const changes = [
    s => { s.entries[0].runningBalanceCents++; },
    s => { s.entries[0].accountId = 'unknown'; },
    s => { s.entries.push(structuredClone(s.entries[0])); },
    s => { s.entries[0].allocations[0].accountId = 'unknown'; },
    s => { s.entries[0].amountCents = '20000'; },
    s => { s.accounts.children[0].balanceTimeline.points[0].ownBalanceCents++; },
    s => { s.accounts.children[0].balanceTimeline.points.shift(); },
    s => { s.accounts.children[0].children.push(s.accounts); },
    s => { s.accounts.children[0].currency = 'EUR'; },
    s => { s.entries[0].date = '2026-02-30'; },
    s => { s.accounts.children[0].balanceTimeline.points.push({date:'2026-09-08',ownBalanceCents:1,sidebarBalanceCents:1}); },
  ];
  for (const change of changes) { const s = fresh(); change(s); assert.throws(() => validateSnapshot(s)); }
});
test('all proposed valid edge fixtures validate', async () => {
  for (const name of ['hidden-ancestor', 'opening-only', 'transfers', 'same-day-order', 'future-activity']) {
    const s = JSON.parse(await readFile(new URL(`../fixtures/${name}-v1.json`, import.meta.url), 'utf8'));
    assert.doesNotThrow(() => validateSnapshot(s));
  }
});
test('compaction preserves own balances before, at and after known future activity', () => {
  const s = fresh();
  validateSnapshot(s);
  const accounts = [];
  const walk = a => { accounts.push(a); a.children.forEach(walk); }; walk(s.accounts);
  for (const account of accounts.filter(a => a.included)) {
    for (const cutoff of ['2026-09-05', '2026-09-06', '2026-09-20']) {
      const expected = s.entries.filter(e => e.accountId === account.id && e.date <= cutoff)
        .reduce((sum, e) => sum + e.amountCents, account.openingBalanceCents);
      const checkpoint = account.balanceTimeline.points.filter(p => p.date <= cutoff).at(-1);
      assert.equal(checkpoint.ownBalanceCents, expected);
    }
  }
  // Remove a future own-balance change: validator must detect missing coverage.
  const account = accounts.find(a => a.name === 'Misc Spending Budget');
  account.balanceTimeline.points.pop();
  assert.throws(() => validateSnapshot(s), e => e.field === 'timeline.missingChange');
});
test('duplicate order and aggregate overflow are rejected', () => {
  const s = fresh();
  const group = s.entries.filter(e => e.accountId === s.entries.find(e => e.description === 'Candy Bar').accountId);
  group[1].registerOrder = group[0].registerOrder;
  assert.throws(() => validateSnapshot(s));
  const t = fresh();
  const entry = t.entries[0], accountId = entry.accountId;
  const find = a => a.id === accountId ? a : a.children.map(find).find(Boolean);
  find(t.accounts).openingBalanceCents = Number.MAX_SAFE_INTEGER;
  assert.throws(() => validateSnapshot(t));
});

test('security metadata permits empty currency while preserving references and USD checks', () => {
  const s = fresh();
  const security = { id: 'security-reference', name: 'Synthetic Fund', type: 'SECURITY',
    currency: '', inactive: false, included: false, children: [],
    openingBalanceCents: null, closingBalanceCents: null, balanceTimeline: null };
  s.accounts.children.push(security);
  s.entries[0].allocations.push({ accountId: security.id, name: security.name, memo: '', amountCents: null });
  assert.doesNotThrow(() => validateSnapshot(s));
  for (const value of [null, 42, undefined]) {
    security.currency = value;
    assert.throws(() => validateSnapshot(s), e => e.field === 'account.currency');
  }
  security.currency = '';
  security.included = true;
  assert.throws(() => validateSnapshot(s), e => e.field === 'account.included');
  security.included = false;
  s.accounts.children.pop();
  assert.throws(() => validateSnapshot(s), e => e.field === 'allocation.accountId');
  s.entries[0].allocations.pop();
  s.accounts.children[0].currency = '';
  assert.throws(() => validateSnapshot(s), e => e.field === 'account.currency');
  s.accounts.children[0].currency = 'EUR';
  assert.throws(() => validateSnapshot(s), e => e.field === 'account.included');
});
