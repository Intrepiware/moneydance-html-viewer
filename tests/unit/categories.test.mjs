import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot, visibleAccounts } from '../../UI/src/snapshot.mjs';
import { projectSidebar } from '../../UI/src/sidebar.mjs';
import { createRegisterQuery, createLocateQuery } from '../../UI/src/query.mjs';
import { createSnapshotHandler } from '../../UI/src/snapshot-worker.mjs';
import { createSnapshotClient } from '../../UI/src/worker-client.mjs';
const raw = await readFile(new URL('../fixtures/category-periods-v1.json', import.meta.url), 'utf8');
const model = validateSnapshot(JSON.parse(raw));
const query = createRegisterQuery(model, '2026-10-03');
const totals = page => page.periods.map(p => [p.key, p.totalCents]);

test('sidebar lists retain category hierarchy, promote eligible descendants and preserve balances', () => {
  const tree=visibleAccounts(model,'2026-10-03'),before=JSON.stringify(tree);
  assert.deepEqual(projectSidebar(tree,'accounts').map(a=>a.id),['bank']);
  const categories=projectSidebar(tree,'categories');
  assert.deepEqual(categories.map(a=>a.id),['expense','future','empty','promoted']);
  assert.equal(categories[0].children[0].id,'child');
  assert.equal(categories[0].sidebarBalanceCents,32200);
  const crossType=[{id:'bank-parent',type:'BANK',children:[{id:'category-child',type:'EXPENSE',children:[]}]}];
  assert.equal(projectSidebar(crossType,'categories')[0].id,'category-child');
  assert.equal(JSON.stringify(tree),before);
});

test('category totals span pages, preserve order/balances and exclude opening/opposite-side amounts', () => {
  const page = query({accountId:'expense'});
  assert.equal(page.totalMatches,109);
  assert.equal(page.rows.length,100);
  assert.deepEqual(totals(page), [['2025-02',0],['2025-01',10000]]);
  assert.equal(page.rows[2].id,'refund');
  assert.equal(page.rows[3].id,'jan-104');
  assert.equal(page.rows[2].runningBalanceCents,20700);
  const next = query({accountId:'expense',page:2});
  assert.deepEqual(totals(next), [['2025-01',10000],['2024-12',700]]);
  assert.equal(next.periods[0].continued,true);
  assert.equal(next.periods[0].count,106);
  assert.equal(next.periods[1].continued,false);
  assert.equal(next.rows.length,9);
  assert.equal(JSON.stringify(model.snapshot),JSON.stringify(JSON.parse(raw)));
});
test('annual sums, disclosure and direct/descendant search scope use the full matching set', async () => {
  assert.deepEqual(totals(query({accountId:'expense',grouping:'year'})),[['2025',10000]]);
  assert.deepEqual(totals(query({accountId:'expense',grouping:'year',page:2})),[['2025',10000],['2024',700]]);
  const searched = await query({accountId:'expense',text:'Period',grouping:'year'});
  assert.deepEqual(totals(searched),[['2025',11500]]);
  assert.equal(searched.totalMatches,111);
  assert.equal(searched.periodScope,'matching');
  const future = query({accountId:'expense',includeFuture:true});
  assert.deepEqual(totals(future),[['2099-01',300],['2025-02',0],['2025-01',10000]]);
  assert.equal(future.totalMatches,110);
});
test('All Time preserves rows, search scope and future disclosure without rollups', async () => {
  for (const options of [{}, {page:2}, {includeFuture:true}, {text:'Period'}, {text:'not-present'}]) {
    const all = await query({accountId:'expense',...options,grouping:'all'});
    const month = await query({accountId:'expense',...options,grouping:'month'});
    assert.equal(all.grouping,'all');
    assert.equal(all.periods,undefined);
    assert.equal(all.periodScope,month.periodScope);
    assert.equal(all.totalMatches,month.totalMatches);
    assert.deepEqual(all.rows,month.rows);
    assert.deepEqual(all.future,month.future);
  }
  assert.equal(query({accountId:'expense'}).periods[0].label,'Feb 2025');
});
test('empty and hidden future-only categories do not fabricate periods', async () => {
  const hidden = query({accountId:'future'});
  assert.deepEqual(hidden.periods,[]); assert.equal(hidden.future.count,1);
  assert.deepEqual(totals(query({accountId:'future',includeFuture:true})),[['2099-01',900]]);
  assert.deepEqual(query({accountId:'empty'}).periods,[]);
  assert.deepEqual((await query({accountId:'expense',text:'not-present'})).periods,[]);
});
test('ordinary accounts and All Accounts remain ungrouped with unchanged population', () => {
  assert.equal(query({accountId:'bank',grouping:'year'}).periods,undefined);
  assert.equal(query({grouping:'month'}).periods,undefined);
  assert.equal(query().totalMatches,113);
  assert.equal(query({accountId:'bank'}).rows[0].runningBalanceCents,9900);
});
test('grouping rejects invalid values and category transfer identity locates the grouped page', () => {
  for (const grouping of ['week',null,{},1]) assert.throws(()=>query({accountId:'expense',grouping}),{code:'INVALID_QUERY'});
  const located=createLocateQuery(model,'2026-10-03')({mode:'transfer',destinationAccountId:'expense',transactionId:'jan-0'});
  assert.equal(located.page,2);
  assert.ok(query({...located,grouping:'year'}).rows.some(e=>e.id===located.focusEntryId));
});
test('unsafe period activity fails even when source running balances are safe', () => {
  const snapshot=JSON.parse(raw), account=snapshot.accounts.children[1];
  snapshot.entries=snapshot.entries.filter(e=>e.accountId!=='expense');
  account.openingBalanceCents=-Number.MAX_SAFE_INTEGER;
  account.closingBalanceCents=Number.MAX_SAFE_INTEGER;
  account.balanceTimeline.points=[{date:snapshot.balanceStartDate,ownBalanceCents:account.closingBalanceCents,sidebarBalanceCents:account.closingBalanceCents}];
  const base=JSON.parse(raw).entries[0];
  snapshot.entries.push({...base,id:'big1',amountCents:Number.MAX_SAFE_INTEGER,runningBalanceCents:0,allocations:[]},
    {...base,id:'big2',registerOrder:1,amountCents:Number.MAX_SAFE_INTEGER,runningBalanceCents:Number.MAX_SAFE_INTEGER,allocations:[]});
  const q=createRegisterQuery(validateSnapshot(snapshot),'2026-10-03');
  assert.throws(()=>q({accountId:'expense'}),RangeError);
});
test('worker returns grouped pages from one fetch and rejects malformed grouping', async () => {
  const seen=[];let fetches=0;
  const handle=createSnapshotHandler({baseUrl:'http://localhost/',postMessage:m=>seen.push(m),fetchSnapshot:async()=>{fetches++;return new Response(raw);}});
  await handle({type:'load',mode:'test',url:'/fixture',effectiveDate:'2026-10-03',requestId:1});
  await handle({type:'query',accountId:'expense',grouping:'year',requestId:2});
  assert.deepEqual(totals(seen.at(-1)),[['2025',10000]]);
  await handle({type:'query',accountId:'expense',grouping:'bad',requestId:3});
  assert.equal(seen.at(-1).code,'INVALID_QUERY'); assert.equal(fetches,1);
});
test('client preserves grouping through navigation and ignores superseded grouped pages', () => {
  const sent=[],seen=[],worker={postMessage:m=>sent.push(m),terminate(){}};
  const client=createSnapshotClient({pageUrl:'http://localhost/?test=true',config:{testSnapshotUrl:'/fixture'},workerFactory:()=>worker,onMessage:m=>seen.push(m)});
  client.load();worker.onmessage({data:{type:'ready',requestId:sent.at(-1).requestId}});
  const locate=client.locate({mode:'exact',accountId:'expense',entryId:'jan-0'});
  const first=client.queryLocated({accountId:'expense',page:2,includeFuture:false},locate,'year');
  assert.equal(sent.at(-1).grouping,'year');
  const second=client.query({accountId:'expense',grouping:'month'});
  worker.onmessage({data:{type:'page',requestId:first,grouping:'year'}});
  worker.onmessage({data:{type:'page',requestId:second,grouping:'month'}});
  assert.deepEqual(seen.map(m=>m.type),['ready','page']);
  assert.equal(seen.at(-1).grouping,'month');client.dispose();
});
