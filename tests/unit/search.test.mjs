import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';
import { createRegisterQuery, searchFields, matchesSearch } from '../../UI/src/query.mjs';
const base = { description: 'Alpha Store', memo: 'Annual renewal', allocations: [{memo:'Athletic equipment', name:'ForbiddenCategory'}, {memo:'Athletic equipment'}], amountCents: -15025, accountName:'ForbiddenAccount', checkNum:'ForbiddenCheck', tags:['ForbiddenTag', 'ForbiddenCategory'] };
test('search matches individual allowed fields as whole-query case-insensitive substrings', () => {
  const fields = searchFields(base);
  for (const text of ['ALPHA', 'renewal', 'equipment', 'athletic equipment']) assert.ok(matchesSearch(fields, text));
  for (const text of ['store annual', 'alpha renewal', 'ForbiddenAccount', 'ForbiddenCheck', 'ForbiddenTag']) assert.equal(matchesSearch(fields, text), false);
});
test('partial USD matching handles formatting, signs and independent text branches', () => {
  for (const amountCents of [15025, -15025]) {
    const fields = searchFields({...base, description:'', memo:'', allocations:[], amountCents});
    for (const text of ['50', '$150.2', '150.25', '.25']) assert.ok(matchesSearch(fields, text));
    assert.equal(matchesSearch(fields, '-50'), amountCents < 0);
    assert.equal(matchesSearch(fields, '1,50'), false);
  }
  assert.ok(matchesSearch(searchFields({...base, amountCents:123456}), '$1,234.5'));
  assert.ok(matchesSearch(searchFields({...base, description:'Coupon -50', amountCents:200}), '-50'));
});
const fixture = JSON.parse(await readFile(new URL('../fixtures/register-pages-v1.json', import.meta.url), 'utf8'));
test('descendant search, clear, allocation deduplication, paging and balances', async () => {
  const model = validateSnapshot(structuredClone(fixture));
  const query = createRegisterQuery(model, '2026-09-07');
  const checking = model.snapshot.accounts.children[0].id;
  assert.equal((await query({accountId:checking, text:'candy'})).totalMatches, 1);
  assert.equal((await query({text:'candy'})).totalMatches, 2);
  assert.equal(query({accountId:checking, text:'   '}).totalMatches, 0);
  const result = await query({accountId:'register-pages', text:'allocation note', includeFuture:true});
  assert.equal(result.totalMatches, 204);
  assert.equal(result.rows.length, 100);
  const last = await query({accountId:'register-pages', text:'allocation note', includeFuture:true, page:999});
  assert.equal(last.page, 3); assert.equal(last.rows.length, 4);
  for (const row of result.rows) assert.equal(row.runningBalanceCents, model.entries.find(e => e.id === row.id).runningBalanceCents);
  const hidden = await query({text:'repeated purchase'});
  assert.equal(hidden.totalMatches, 0); assert.equal(hidden.future.count, 205);
  assert.equal((await query({text:'no-such-purchase'})).totalMatches, 0);
});
test('superseded search yields and does not return or cache obsolete results', async () => {
  const query = createRegisterQuery(validateSnapshot(structuredClone(fixture)), '2026-09-07');
  let current = true;
  const pending = query({text:'candy'}, {isCurrent:()=>current});
  current = false;
  assert.equal(await pending, null);
  assert.equal((await query({text:'parking'})).totalMatches, 2);
});

test('original ancestry includes accessible descendants under excluded nodes', async () => {
  const data = JSON.parse(await readFile(new URL('../fixtures/hidden-ancestor-v1.json', import.meta.url), 'utf8'));
  data.entries.push({...data.entries[0], id:'hidden-descendant-entry', transactionId:'hidden-descendant-txn', accountId:'active-descendant',
    amountCents:0, runningBalanceCents:250, registerOrder:0, date:data.balanceStartDate, description:'Unique descendant memo test', memo:'', allocations:[]});
  const model=validateSnapshot(data), query=createRegisterQuery(model,'2026-09-07');
  const result=await query({accountId:data.accounts.children[0].id,text:'unique descendant'});
  assert.equal(result.totalMatches,1); assert.equal(result.rows[0].accountId,'active-descendant');
  assert.throws(()=>query({accountId:'hidden-parent',text:'unique descendant'}),e=>e.code==='INVALID_QUERY');
});
