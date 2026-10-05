import test from 'node:test';
import assert from 'node:assert/strict';
import { navigationFixture } from '../fixtures/navigation-fixture.mjs';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';
import { createLocateQuery, createRegisterQuery, createDetailsQuery } from '../../UI/src/query.mjs';
import { readFile } from 'node:fs/promises';
import { createSnapshotHandler } from '../../UI/src/snapshot-worker.mjs';
const model = validateSnapshot(navigationFixture());
const locate = createLocateQuery(model, '2026-09-30');
const query = createRegisterQuery(model, '2026-09-30');

test('exact identity finds an off-page row without revealing unrelated future rows', () => {
  const target = locate({mode: 'exact', accountId: 'destination', entryId: 'destination-40'});
  assert.deepEqual(target, {accountId: 'destination', page: 2, includeFuture: false,
    entryIds: ['destination-40'], focusEntryId: 'destination-40'});
  const page = query(target);
  assert.equal(page.rows.findIndex(e => e.id === target.focusEntryId), 64);
  assert.equal(page.rows.find(e => e.id === target.focusEntryId).runningBalanceCents, 41000);
  assert.equal(locate({mode:'exact',accountId:'source',entryId:'destination-40'}), null);
});
test('transfer retains every counterpart in display order across pages, excluding look-alikes', () => {
  const target = locate({mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'});
  assert.deepEqual(target, {accountId:'destination',page:1,includeFuture:true,
    entryIds:['destination-future','destination-140','destination-40'],focusEntryId:'destination-future'});
  assert.equal(query(target).rows[1].id, 'destination-future');
  assert.ok(query({...target,page:2}).rows.some(e=>e.id==='destination-40'));
  assert.equal(target.entryIds.includes('destination-141'),false);
  assert.equal(target.entryIds.includes('future-lookalike'),false);
  const past = locate({mode:'transfer',destinationAccountId:'destination',transactionId:'past'});
  assert.deepEqual(past.entryIds,['destination-31','destination-30']);
  assert.equal(past.includeFuture,false);assert.equal(past.page,2);
});
test('future exact and category exact navigation use direct register order', () => {
  assert.equal(locate({mode:'exact',accountId:'destination',entryId:'destination-future'}).includeFuture,true);
  assert.equal(locate({mode:'exact',accountId:'category',entryId:'category-entry'}).focusEntryId,'category-entry');
});
test('lookup order follows validated register order even when export entries are interleaved', () => {
  const snapshot=navigationFixture();snapshot.entries.reverse();
  const shuffledLocate=createLocateQuery(validateSnapshot(snapshot),'2026-09-30');
  const request={mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'};
  assert.deepEqual(shuffledLocate(request),locate(request));
});
test('missing and excluded transfer targets never guess; category counterparts are supported', () => {
  for (const destinationAccountId of ['missing','archived','empty'])
    assert.equal(locate({mode:'transfer',destinationAccountId,transactionId:'category-txn'}),null);
  assert.equal(locate({mode:'exact',accountId:'destination',entryId:'Shared transfer'}),null);
  assert.deepEqual(locate({mode:'transfer',destinationAccountId:'category',transactionId:'category-txn'}).entryIds,['category-entry']);
  const details=createDetailsQuery(model)({accountId:'source',entryId:'source-unavailable'});
  assert.ok(details.allocations.every(a=>!a.destinationAvailable && a.unavailableReason));
});
test('malformed locate requests are rejected and source financial data is unchanged', () => {
  const before=JSON.stringify(model.snapshot);
  for(const input of [{},{mode:'guess'}, {mode:'exact',accountId:[],entryId:'x'},
    {mode:'transfer',destinationAccountId:'destination',transactionId:''},
    {mode:'exact',accountId:'destination',entryId:'destination-40',transactionId:'mixed'}])
    assert.throws(()=>locate(input),{code:'INVALID_QUERY'});
  locate({mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'});
  assert.equal(JSON.stringify(model.snapshot),before);
});

test('published synthetic plaintext and encrypted fixtures navigate with one fetch and one unlock', async () => {
  const plaintext=await readFile(new URL('../fixtures/navigation-v1.json',import.meta.url));
  assert.deepEqual(JSON.parse(plaintext),navigationFixture());
  for(const mode of ['test','encrypted']) {
    const bytes=mode==='test'?plaintext:await readFile(new URL('../fixtures/navigation-v1.enc',import.meta.url));
    const seen=[];let fetches=0;
    const handle=createSnapshotHandler({baseUrl:'http://localhost/',postMessage:m=>seen.push(m),
      fetchSnapshot:async()=>{fetches++;return new Response(bytes);}});
    await handle({type:'load',requestId:1,mode,url:'/synthetic',effectiveDate:'2026-09-30'});
    if(mode==='encrypted') {
      assert.equal(seen.at(-1).type,'locked');
      await handle({type:'unlock',requestId:2,password:'synthetic-password'});
    }
    assert.equal(seen.at(-1).type,'ready');
    await handle({type:'locate',requestId:3,mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'});
    const target=seen.at(-1);assert.equal(target.type,'located');
    await handle({type:'query',requestId:4,accountId:target.accountId,page:target.page,includeFuture:target.includeFuture});
    assert.equal(seen.at(-1).rows[1].id,'destination-future');
    await handle({type:'query',requestId:5,accountId:'category',grouping:'year'});
    assert.equal(seen.at(-1).grouping,'year');
    assert.equal(seen.at(-1).periods[0].totalCents,500);
    assert.equal(fetches,1);assert.equal(seen.filter(m=>m.type==='locked').length,mode==='encrypted'?1:0);
  }
});
