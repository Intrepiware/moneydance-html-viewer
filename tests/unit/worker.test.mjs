import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { createSnapshotHandler } from '../../UI/src/snapshot-worker.mjs';
import { createSnapshotClient } from '../../UI/src/worker-client.mjs';
const fixture = await readFile(new URL('../fixtures/valid-snapshot-v1.json', import.meta.url), 'utf8');
const load = { type: 'load', mode: 'test', requestId: 1, url: 'http://localhost/snapshot.json', effectiveDate: '2026-09-06' };
test('locate supersedes search and malformed/unavailable targets stay nonterminal', async () => {
  const messages=[];let fetches=0;
  const handle=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>{fetches++;return new Response(fixture);}});
  await handle(load);
  const pending=handle({type:'query',requestId:2,text:'candy'});
  const entry=JSON.parse(fixture).entries[0];
  await handle({type:'locate',requestId:3,mode:'exact',accountId:entry.accountId,entryId:entry.id});await pending;
  assert.equal(messages.at(-1).type,'located');assert.equal(messages.at(-1).focusEntryId,entry.id);
  assert.equal(messages.some(m=>m.requestId===2),false);
  for(const message of [{mode:'guess'}, {mode:'exact',accountId:[],entryId:'bad'}, {mode:'exact',accountId:'missing',entryId:'missing'}]) {
    await handle({type:'locate',requestId:4,...message});assert.equal(messages.at(-1).type,'navigationUnavailable');
    assert.equal('rows' in messages.at(-1),false);
  }
  await handle({type:'query',requestId:5});assert.equal(messages.at(-1).type,'page');assert.equal(fetches,1);
});
test('client navigation rejects stale locate/follow-up pages and pending details', () => {
  const seen=[],sent=[];let terminated=false;
  const worker={postMessage:m=>sent.push(m),terminate:()=>{terminated=true;}};
  const client=createSnapshotClient({pageUrl:'http://localhost/?test=true',workerFactory:()=>worker,onMessage:m=>seen.push(m)});
  client.load();worker.onmessage({data:{type:'ready',requestId:1}});
  const details=client.details({accountId:'a',entryId:'b'});
  const old=client.locate({mode:'exact',accountId:'a',entryId:'old'});
  const latest=client.locate({mode:'exact',accountId:'a',entryId:'latest'});
  worker.onmessage({data:{type:'details',lane:'details',requestId:details}});
  worker.onmessage({data:{type:'located',requestId:old}});
  assert.equal(client.queryLocated({accountId:'a'},old),null);
  worker.onmessage({data:{type:'located',requestId:latest}});
  const page=client.queryLocated({accountId:'a'},latest);
  client.invalidatePending();worker.onmessage({data:{type:'page',requestId:page}});
  assert.deepEqual(seen.map(m=>m.type),['ready','located']);
  assert.equal(client.queryLocated({accountId:'a'},latest),null);
  const unavailable=client.locate({mode:'exact',accountId:'a',entryId:'missing'});
  worker.onmessage({data:{type:'navigationUnavailable',requestId:unavailable}});
  assert.equal(terminated,false);assert.doesNotThrow(()=>client.query());
  client.locate({mode:'exact',accountId:'a',entryId:'latest'});worker.onerror({preventDefault(){}});
  assert.equal(terminated,true);assert.equal(seen.at(-1).code,'WORKER_FAILED');
});
test('details lane preserves pending pages, drops closed/replaced replies and remains nonterminal', () => {
  const sent=[],seen=[],worker={postMessage:m=>sent.push(m),terminate(){}};
  const client=createSnapshotClient({pageUrl:'http://localhost/',workerFactory:()=>worker,onMessage:m=>seen.push(m)});
  client.load();worker.onmessage({data:{type:'ready',requestId:1}});
  const page=client.query(),old=client.details({accountId:'a',entryId:'old'});
  const latest=client.details({accountId:'a',entryId:'new'});
  worker.onmessage({data:{type:'details',requestId:old,lane:'details'}});
  worker.onmessage({data:{type:'page',requestId:page}});
  worker.onmessage({data:{type:'detailsUnavailable',requestId:latest,lane:'details'}});
  assert.deepEqual(seen.map(m=>m.type),['ready','page','detailsUnavailable']);
  const closed=client.details({accountId:'a',entryId:'closed'});client.invalidateDetails();
  worker.onmessage({data:{type:'details',requestId:closed,lane:'details'}});
  assert.equal(seen.length,3);assert.doesNotThrow(()=>client.query());
  const changed=client.details({accountId:'a',entryId:'changed'});client.invalidatePending();
  worker.onmessage({data:{type:'details',requestId:changed,lane:'details'}});assert.equal(seen.length,3);
  client.dispose();
});

test('worker details are scoped by identity and do not cancel asynchronous search', async () => {
  const messages=[],data=JSON.parse(fixture),entry=data.entries[0];let fetches=0;
  const handler=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>{fetches++;return{ok:true,text:async()=>fixture}}});
  await handler(load);
  const pending=handler({type:'query',requestId:2,text:'candy'});
  await handler({type:'details',requestId:3,accountId:entry.accountId,entryId:entry.id});await pending;
  assert.ok(messages.some(m=>m.type==='page'&&m.requestId===2));
  assert.equal(messages.find(m=>m.type==='details').entryId,entry.id);
  await handler({type:'details',requestId:4,accountId:'missing',entryId:'missing'});
  assert.equal(messages.at(-1).type,'detailsUnavailable');
  await handler({type:'details',requestId:5,accountId:[],entryId:'bad'});
  assert.equal(messages.at(-1).type,'detailsUnavailable');
  await handler({type:'query',requestId:6});assert.equal(messages.at(-1).type,'page');assert.equal(fetches,1);
});
test('load-once handler reports missing file, blocks retries and cross-origin requests', async () => {
  const messages = []; let fetches = 0;
  const handler = createSnapshotHandler({ baseUrl: load.url, postMessage: m => messages.push(m), fetchSnapshot: async () => { fetches++; return { ok: false, status: 404 }; } });
  await handler(load); await handler({ ...load, requestId: 2 });
  assert.equal(fetches, 1); assert.equal(messages[0].reason, 'NOT_FOUND');
  const cross = createSnapshotHandler({ baseUrl: 'http://other.test/', postMessage: m => messages.push(m), fetchSnapshot: () => { throw new Error('must not fetch'); } });
  await cross(load); assert.equal(messages.at(-1).code, 'LOAD_FAILED');
});
test('worker validates timestamp and coverage independently of display', async () => {
  for (const [body, date] of [[fixture, '2026-09-04'], [fixture.replace(/"exportDate": "[^"]+"/, '"exportDate": null'), '2026-09-06']]) {
    const messages = [];
    const handler = createSnapshotHandler({ baseUrl: load.url, postMessage: m => messages.push(m), fetchSnapshot: async () => ({ ok: true, text: async () => body }) });
    await handler({ ...load, effectiveDate: date }); assert.equal(messages[0].code, 'INVALID_SNAPSHOT');
  }
});
test('real isolated worker fetches once and sends compact metadata without records', async () => {
  let fetches = 0;
  const server = createServer((req, res) => { fetches++; res.end(fixture); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/snapshot.json`;
  const worker = new Worker(new URL('../fixtures/node-worker-bridge.mjs', import.meta.url), { workerData: { baseUrl: url } });
  const ask = async data => { const reply = once(worker, 'message'); worker.postMessage(data); return (await reply)[0]; };
  try {
    const ready = await ask({ ...load, url });
    assert.equal(ready.type, 'ready'); assert.equal(ready.totalCount, 13);
    assert.equal(ready.accounts[0].sidebarBalanceCents, 104500);
    assert.equal('entries' in ready, false);
    assert.equal(JSON.stringify(ready).includes('runningBalanceCents'), false);
    const page = await ask({ type: 'query', requestId: 2 });
    assert.equal(page.type, 'page'); assert.equal(page.rows.length, 13);
    assert.equal(page.totalMatches, 13);
    assert.equal((await ask({ type: 'query', requestId: 4, page: 0 })).code, 'INVALID_QUERY');
    assert.equal((await ask({ ...load, url, requestId: 3 })).code, 'LOAD_FAILED');
    assert.equal(fetches, 1);
  } finally { await worker.terminate(); await new Promise(resolve => server.close(resolve)); }
});
test('client selects explicit test mode, captures local date and ignores stale replies', () => {
  const sent = [], seen = [];
  const worker = { postMessage: m => sent.push(m), terminate() {} };
  const client = createSnapshotClient({ pageUrl: 'http://localhost/?test=true', now: new Date(2026, 8, 6, 23), workerFactory: () => worker, onMessage: m => seen.push(m) });
  client.load(); assert.equal(sent[0].url, 'http://localhost/data/test-snapshot.json');
  assert.equal(sent[0].effectiveDate, '2026-09-06'); assert.throws(() => client.load());
  worker.onmessage({ data: { type: 'ready', requestId: 1 } });
  client.query({ text: 'old' }); client.query({ text: 'new' });
  worker.onmessage({ data: { type: 'page', requestId: 2 } });
  worker.onmessage({ data: { type: 'page', requestId: 3 } });
  assert.deepEqual(seen.map(m => m.requestId), [1, 3]);
  client.dispose(); assert.throws(() => client.query());
});

test('input invalidation rejects replies during debounce before the next query', () => {
  const sent=[], seen=[];
  const worker={postMessage:m=>sent.push(m),terminate(){}};
  const client=createSnapshotClient({pageUrl:'http://localhost/',workerFactory:()=>worker,onMessage:m=>seen.push(m)});
  client.load();worker.onmessage({data:{type:'ready',requestId:1}});
  client.query({text:'old'}); const stale=sent.at(-1).requestId;
  client.invalidatePending();worker.onmessage({data:{type:'page',requestId:stale}});
  assert.deepEqual(seen.map(m=>m.type),['ready']);
  client.query({text:'new'});worker.onmessage({data:{type:'page',requestId:sent.at(-1).requestId}});
  assert.deepEqual(seen.map(m=>m.type),['ready','page']);client.dispose();
});
test('worker suppresses superseded searches while retaining a single download', async () => {
  const messages=[];let fetches=0;
  const handler=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>{fetches++;return{ok:true,text:async()=>fixture};}});
  await handler(load);
  const first=handler({type:'query',requestId:2,text:'candy'});
  const second=handler({type:'query',requestId:3,text:'parking'});
  await Promise.all([first,second]);
  assert.equal(messages.some(m=>m.requestId===2),false);
  assert.equal(messages.at(-1).requestId,3);
  assert.equal(messages.at(-1).totalMatches,2);
  assert.equal(fetches,1);
});

test('loader rejects every invalid timestamp with a safe timestamp error', async () => {
  for (const stamp of [undefined, null, 7, 'malformed', '2026-02-30T00:00:00Z']) {
    const data=JSON.parse(fixture); data.exportDate=stamp;
    const messages=[];
    const handler=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>({ok:true,text:async()=>JSON.stringify(data)})});
    await handler(load);
    assert.equal(messages.length,1);assert.equal(messages[0].code,'INVALID_SNAPSHOT');
    assert.match(messages[0].message,/export timestamp/);
    assert.equal('entity' in messages[0],false);
  }
});
test('client makes worker failures terminal and does not forward stale messages', () => {
  for (const failure of ['error','messageerror','send','construct']) {
    const seen=[]; let terminated=0;
    const worker={postMessage(){if(failure==='send')throw new Error('private diagnostic');},terminate(){terminated++;}};
    const client=createSnapshotClient({pageUrl:'http://localhost/',onMessage:m=>seen.push(m),workerFactory:()=>{if(failure==='construct')throw new Error('private diagnostic');return worker;}});
    client.load();
    if(failure==='error')worker.onerror({preventDefault(){}});
    if(failure==='messageerror')worker.onmessageerror();
    assert.equal(seen.length,1);assert.equal(seen[0].code,'WORKER_FAILED');
    assert.equal(JSON.stringify(seen).includes('private diagnostic'),false);
    worker.onmessage?.({data:{type:'ready',requestId:1}});
    assert.equal(seen.length,1);
    assert.throws(()=>client.query());assert.throws(()=>client.load());
    if(failure!=='construct')assert.equal(terminated,1);
  }
});
test('empty and unknown-version snapshots have distinct loader results', async () => {
  const data=JSON.parse(fixture); data.entries=[];data.accounts.children=[];
  for(const version of [1,2]) {
    data.schemaVersion=version;const messages=[];
    const handler=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>({ok:true,text:async()=>JSON.stringify(data)})});
    await handler(load);
    if(version===1){assert.equal(messages[0].type,'ready');assert.equal(messages[0].totalCount,0);}
    else assert.equal(messages[0].code,'UNSUPPORTED_VERSION');
  }
});
