// Synthetic data only. Never reads UI/data private exports.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const baseline = JSON.parse(await readFile(new URL('specs/001-view-moneydance-data/contracts/example-export.json', root), 'utf8'));
const copy = () => structuredClone(baseline);
const save = async (name, data) => writeFile(new URL(name, root), JSON.stringify(data, null, 2) + '\n');
await mkdir(new URL('tests/fixtures/', root), { recursive: true });
await save('tests/fixtures/valid-snapshot-v1.json', baseline);
await save('UI/data/test-snapshot.json', baseline);
const invalid = copy(); invalid.entries[0].runningBalanceCents += 1;
await save('tests/fixtures/invalid-balance-v1.json', invalid);
const dangling = copy(); dangling.entries[0].accountId = 'missing-account';
await save('tests/fixtures/invalid-reference-v1.json', dangling);
for (const [name, value] of [['null', null], ['malformed', 'not-a-date'], ['wrong-type', 7], ['missing', undefined]]) {
  const data = copy();
  if (value === undefined) delete data.exportDate; else data.exportDate = value;
  await save(`tests/fixtures/invalid-export-date-${name}-v1.json`, data);
}
const point = (own, sidebar = own) => ({ date: baseline.balanceStartDate, ownBalanceCents: own, sidebarBalanceCents: sidebar });
const account = (id, included, own, sidebar = own, children = []) => ({
  id, name: `Synthetic ${id}`, type: 'BANK', currency: 'USD', inactive: !included, included,
  openingBalanceCents: included ? own : null, closingBalanceCents: included ? own : null,
  balanceTimeline: included ? { points: [point(own, sidebar)] } : null, children
});
const hidden = copy();
// Hidden ancestor has a 500-cent own opening contribution; visible child has 250.
// Neither needs transaction rows, and both still contribute to Checking's sidebar.
hidden.accounts.children[0].children.push(account('hidden-parent', false, 0, 0, [account('active-descendant', true, 250)]));
for (const p of hidden.accounts.children[0].balanceTimeline.points) p.sidebarBalanceCents += 750;
await save('tests/fixtures/hidden-ancestor-v1.json', hidden);
const opening = copy();
opening.accounts.children.push(account('opening-only', true, 12345));
await save('tests/fixtures/opening-only-v1.json', opening);
// The requested example already has full split/transfer sides, same-day ordering,
// and September 6 activity that is future relative to the September 5 cutoff.
for (const name of ['transfers', 'same-day-order', 'future-activity']) {
  await save(`tests/fixtures/${name}-v1.json`, baseline);
}
console.log('Synthetic fixtures generated from the documented example.');

// Full-register pagination with an opening balance and repeated descriptions/amounts.
const register = copy();
const registerAccount = account('register-pages', true, 12345);
register.accounts.children.push(registerAccount);
for (let i = 0; i < 205; i++) {
  register.entries.push({ id: `register-${String(i).padStart(3, '0')}`,
    transactionId: `transaction-${i}`, accountId: registerAccount.id,
    date: i === 204 ? '2099-01-02' : '2099-01-01', registerOrder: i,
    amountCents: 100, runningBalanceCents: 12345 + (i + 1) * 100,
    description: 'Repeated purchase <not markup>', memo: 'Full memo & details',
    checkNum: i === 204 ? '0007' : '', clearedStatus: 'UNCLEARED', tags: [],
    allocations: i === 204 ? [] : Array.from({ length: i === 203 ? 1 : 2 }, () => ({
      accountId: baseline.accounts.children[0].id, name: 'Checking', memo: 'Allocation note', amountCents: null })) });
}
registerAccount.closingBalanceCents = 32845;
registerAccount.balanceTimeline.points.push({ date: '2099-01-01', ownBalanceCents: 32745, sidebarBalanceCents: 32745 },
  { date: '2099-01-02', ownBalanceCents: 32845, sidebarBalanceCents: 32845 });
await save('tests/fixtures/register-pages-v1.json', register);

const empty = copy(); empty.accounts.children = []; empty.entries = [];
await save('tests/fixtures/empty-snapshot-v1.json', empty);
const unknownVersion = copy(); unknownVersion.schemaVersion = 2;
await save('tests/fixtures/unsupported-version.json', unknownVersion);
