import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSnapshot } from '../../UI/src/snapshot.mjs';
import { createDetailsQuery } from '../../UI/src/query.mjs';
const fixture = JSON.parse(await readFile(new URL('../fixtures/valid-snapshot-v1.json', import.meta.url), 'utf8'));
function setup() {
  const snapshot = structuredClone(fixture), entry = snapshot.entries[0];
  const destination = entry.allocations[0];
  entry.allocations = [
    {...destination, amountCents: entry.amountCents - 100, memo: '<literal>', tags: ['Own.Tag']},
    {...destination, amountCents: 100, memo: '', tags: []}
  ];
  return {snapshot, entry};
}
test('details preserve selected identity, repeated full paths, literal memo/tags and exact total', () => {
  const {snapshot, entry} = setup(), before = JSON.stringify(snapshot);
  const details = createDetailsQuery(validateSnapshot(snapshot))({accountId:entry.accountId, entryId:entry.id});
  assert.equal(details.totalCents, entry.amountCents);
  assert.equal(details.allocations.length, 2);
  assert.equal(details.allocations[0].memo, '<literal>');
  assert.deepEqual(details.allocations[0].tags, ['Own.Tag']);
  assert.equal(details.allocations[0].path, details.allocations[1].path);
  assert.ok(!details.allocations[0].path.startsWith('Root:'));
  details.allocations[0].tags.push('mutated');
  assert.equal(JSON.stringify(snapshot), before);
});
test('legacy partial and empty allocations never invent a total or tags', () => {
  for (const amount of [null, undefined]) {
    const {snapshot,entry} = setup(); entry.allocations[0].amountCents=amount; delete entry.allocations[0].tags;
    const query=createDetailsQuery(validateSnapshot(snapshot));
    const result=query({accountId:entry.accountId,entryId:entry.id});
    assert.equal(result.totalCents,null);assert.equal(result.allocations[0].amountCents,null);
    assert.equal(result.allocations[0].tags,null);assert.equal(result.allocations[1].amountCents,100);
  }
  const {snapshot,entry}=setup();entry.allocations=[];
  assert.equal(createDetailsQuery(validateSnapshot(snapshot))({accountId:entry.accountId,entryId:entry.id}).totalCents,null);
});
test('details reject malformed identities and return unavailable for missing rows', () => {
  const query=createDetailsQuery(validateSnapshot(structuredClone(fixture)));
  for(const args of [{}, {accountId:[],entryId:'x'}, {accountId:'x',entryId:''}]) assert.throws(()=>query(args));
  assert.equal(query({accountId:'missing',entryId:'missing'}),null);
});
test('allocation contracts reject mismatched, unsafe totals and malformed tags; legacy remains valid', () => {
  for (const change of [e=>e.allocations[1].amountCents++,e=>e.allocations[0].amountCents=Number.MAX_SAFE_INTEGER,e=>e.allocations[0].tags=[7]]) {
    const {snapshot,entry}=setup();change(entry);assert.throws(()=>validateSnapshot(snapshot));
  }
  const {snapshot,entry}=setup();entry.allocations[0].tags=null;
  assert.doesNotThrow(()=>validateSnapshot(snapshot));
});

test('synthetic paycheck, selected split and excluded destination match independent expectations', async () => {
  const snapshot=JSON.parse(await readFile(new URL('../fixtures/browsing-allocations-v1.json',import.meta.url),'utf8'));
  const query=createDetailsQuery(validateSnapshot(snapshot));
  const pay=query({accountId:'details-bank',entryId:'paycheck'});
  assert.deepEqual(pay.allocations.map(a=>a.amountCents),[269000,-25000,-15000,-3000,-8000,-500,-17500]);
  assert.equal(pay.totalCents,200000);assert.equal(pay.allocations.length,7);
  const rainy=query({accountId:'rainy',entryId:'rainy-entry'});
  assert.equal(rainy.allocations.length,1);assert.equal(rainy.totalCents,-100000);
  assert.deepEqual(rainy.allocations[0].tags,['Rainy']);
  const legacy=query({accountId:'details-bank',entryId:'legacy'});
  assert.equal(legacy.totalCents,null);assert.equal(legacy.allocations[1].amountCents,-4200);
  assert.equal(legacy.allocations[1].destinationAvailable,false);
});
