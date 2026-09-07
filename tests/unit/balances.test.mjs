import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot, visibleAccounts } from '../../UI/src/snapshot.mjs';
const load = async name => validateSnapshot(JSON.parse(await readFile(new URL(`../fixtures/${name}-v1.json`, import.meta.url), 'utf8')));
const flatten = nodes => nodes.flatMap(n => [n, ...flatten(n.children)]);
test('balances use the local cutoff, baseline and last known point', async () => {
  const model = await load('valid-snapshot');
  const get = day => flatten(visibleAccounts(model, day)).find(a => a.name === 'Checking');
  assert.equal(get('2026-09-05').sidebarBalanceCents, 105000);
  assert.equal(get('2026-09-06').sidebarBalanceCents, 104500);
  assert.equal(get('2026-09-06').ownBalanceCents, 0);
  assert.equal(get('2030-01-01').sidebarBalanceCents, 104500);
  assert.doesNotThrow(() => visibleAccounts(model, model.snapshot.balanceStartDate));
  for (const day of ['2026-09-04', 'bad', '2026-02-30'])
    assert.throws(() => visibleAccounts(model, day), e => e.code === 'INVALID_SNAPSHOT');
});
test('projection retains hidden contributions once and promotes accessible descendants', async () => {
  const model = await load('hidden-ancestor');
  const before = JSON.stringify(model.snapshot);
  const tree = visibleAccounts(model, '2026-09-06');
  const all = flatten(tree);
  for (const source of model.accountsById.values()) {
    const visible = all.find(a => a.id === source.id);
    assert.equal(Boolean(visible), source.included);
    if (visible) {
      const point = source.balanceTimeline.points.filter(p => p.date <= '2026-09-06').at(-1);
      assert.equal(visible.sidebarBalanceCents, point.sidebarBalanceCents);
      assert.equal(visible.ownBalanceCents, point.ownBalanceCents);
      assert.equal('entries' in visible, false);
    }
  }
  const hidden = model.accountsById.get('hidden-parent');
  const child = hidden.children.find(c => c.included);
  assert.ok(all.some(a => a.id === child.id));
  assert.equal(model.ancestry.get(child.id).parentId, hidden.id);
  const checking = all.find(a => a.name === 'Checking');
  assert.ok(checking.children.some(a => a.id === child.id));
  assert.equal(checking.sidebarBalanceCents, 105250); // $1,045 + hidden $5 + active child $2.50.
  assert.equal(JSON.stringify(model.snapshot), before);
});
test('opening-only accounts use their exported checkpoint', async () => {
  const model = await load('opening-only');
  const all = flatten(visibleAccounts(model, '2026-09-06'));
  const account = [...model.accountsById.values()].find(a => a.included && !model.ownEntryIds.get(a.id).length && a.openingBalanceCents !== 0);
  assert.ok(account);
  assert.equal(all.find(a => a.id === account.id).ownBalanceCents, account.openingBalanceCents);
});
