import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseEnvelope,readEnvelope,decryptEnvelope,MAX_ENVELOPE} from '../../UI/src/encrypted-snapshot.mjs';
import {createSnapshotHandler} from '../../UI/src/snapshot-worker.mjs';
import {createSnapshotClient} from '../../UI/src/worker-client.mjs';
const vectors=JSON.parse(await readFile(new URL('../fixtures/encryption/vectors.json',import.meta.url)));
const fixture=await readFile(new URL('../fixtures/valid-snapshot-v1.json',import.meta.url),'utf8');
async function encrypt(text) {
 const header=new Uint8Array(37);header.set(new TextEncoder().encode('MDSNAP01'));header[8]=1;
 const source=await crypto.subtle.importKey('raw',new TextEncoder().encode('synthetic-password'),'PBKDF2',false,['deriveKey']);
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:header.slice(9,25),iterations:600000},source,{name:'AES-GCM',length:256},false,['encrypt']);
 const body=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:header.slice(25),additionalData:header,tagLength:128},key,new TextEncoder().encode(text)));
 const result=new Uint8Array(37+body.length);result.set(header);result.set(body,37);return result;
}
const envelope=await encrypt(fixture);
const load={type:'load',mode:'encrypted',requestId:1,url:'http://localhost/snapshot.enc',effectiveDate:'2026-09-06'};
function session(bytes=envelope) {
 const messages=[];let fetches=0;
 const handle=createSnapshotHandler({baseUrl:load.url,postMessage:m=>messages.push(m),fetchSnapshot:async()=>{fetches++;return new Response(bytes);}});
 return {handle,messages,get fetches(){return fetches;}};
}
test('production decrypt passes all native-compatible known answers and rejects mutations',async()=>{
 for(const vector of vectors.vectors) assert.equal(Buffer.from(await decryptEnvelope(Buffer.from(vector.envelopeHex,'hex'),vector.password)).toString('hex'),vectors.plaintextHex);
 for(const offset of [9,25,37,envelope.length-1]) {const bad=envelope.slice();bad[offset]^=1;await assert.rejects(decryptEnvelope(bad,'synthetic-password'));}
 await assert.rejects(decryptEnvelope(envelope,'\ud800'));
 await assert.rejects(decryptEnvelope(envelope,'wrong'));
 await assert.rejects(decryptEnvelope(envelope.slice(0,-1),'synthetic-password'));
 const appended=new Uint8Array(envelope.length+1);appended.set(envelope);await assert.rejects(decryptEnvelope(appended,'synthetic-password'));
 for(const offset of [0,8]) {const bad=envelope.slice();bad[offset]^=1;assert.throws(()=>parseEnvelope(bad));}
 assert.throws(()=>parseEnvelope(new Uint8Array(52)));
});
test('counted streaming rejects absent/false size overflow and cancels reader',async()=>{
 for(const length of [null,'1',String(MAX_ENVELOPE+1)]) {
  let canceled=false;
  const response={headers:{get:()=>length},body:{getReader:()=>({read:async()=>({done:false,value:{byteLength:MAX_ENVELOPE+1}}),cancel:async()=>{canceled=true;},releaseLock(){}})}};
  await assert.rejects(readEnvelope(response));if(length!==String(MAX_ENVELOPE+1))assert.equal(canceled,true);
 }
});
test('encrypted worker locks, retries once downloaded, validates and queries fixed date',async()=>{
 const s=session();await s.handle(load);assert.deepEqual(s.messages,[{type:'locked',requestId:1}]);
 await s.handle({type:'unlock',requestId:2,password:'wrong'});assert.equal(s.messages.at(-1).type,'unlockError');
 await s.handle({type:'unlock',requestId:3,password:'synthetic-password'});assert.equal(s.messages.at(-1).type,'ready');assert.equal(s.messages.at(-1).metadata.effectiveDate,load.effectiveDate);
 await s.handle({type:'query',requestId:4});assert.equal(s.messages.at(-1).rows.length,13);assert.equal(s.fetches,1);
});
test('encrypted worker has no plaintext fallback and rejects authenticated invalid data',async()=>{
 for(const text of ['not json','{}',fixture.replace('"schemaVersion": 1','"schemaVersion": 2')]) {
  const s=session(await encrypt(text));await s.handle(load);await s.handle({type:'unlock',requestId:2,password:'synthetic-password'});assert.equal(s.messages.at(-1).type,'error');
 }
 const s=session(new TextEncoder().encode(fixture));await s.handle(load);assert.equal(s.messages.at(-1).code,'INVALID_ENVELOPE');
});
test('disposal during unlock suppresses late data and client serializes attempts',async()=>{
 const s=session();await s.handle(load);const pending=s.handle({type:'unlock',requestId:2,password:'synthetic-password'});await s.handle({type:'dispose'});await pending;assert.equal(s.messages.length,1);
 const sent=[],seen=[];let terminated=false;
 const worker={postMessage:m=>sent.push(m),terminate:()=>{terminated=true;}};
 const client=createSnapshotClient({pageUrl:'http://localhost/',config:{snapshotUrl:'/snapshot.enc'},workerFactory:()=>worker,onMessage:m=>seen.push(m)});
 client.load();assert.equal(sent[0].mode,'encrypted');worker.onmessage({data:{type:'locked',requestId:1}});
 client.unlock('wrong');assert.throws(()=>client.unlock('other'));worker.onmessage({data:{type:'unlockError',requestId:2}});assert.equal(terminated,false);
 client.unlock('correct');worker.onmessage({data:{type:'ready',requestId:2}});assert.equal(seen.at(-1).type,'unlockError');
 client.dispose();worker.onmessage({data:{type:'ready',requestId:3}});assert.equal(seen.at(-1).type,'unlockError');
});

test('actual bundled Jython output unlocks through production worker',async()=>{
 const s=session(await readFile(new URL('../browser/synthetic-snapshot.enc',import.meta.url)));await s.handle(load);
 await s.handle({type:'unlock',requestId:2,password:'synthetic-password'});
 assert.equal(s.messages.at(-1).type,'ready');assert.equal(s.messages.at(-1).totalCount,13);
});
