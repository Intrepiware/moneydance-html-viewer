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
