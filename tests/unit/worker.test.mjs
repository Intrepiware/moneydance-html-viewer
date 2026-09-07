import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { createSnapshotHandler } from '../../UI/src/snapshot-worker.mjs';
import { createSnapshotClient } from '../../UI/src/worker-client.mjs';
const fixture = await readFile(new URL('../fixtures/valid-snapshot-v1.json', import.meta.url), 'utf8');
const load = { type: 'load', requestId: 1, url: 'http://localhost/snapshot.json', effectiveDate: '2026-09-06' };
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
