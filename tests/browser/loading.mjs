import { App } from '/app.js';
import { createSnapshotClient } from '/src/worker-client.mjs';
const assert=(value,message)=>{if(!value)throw new Error(message);};
const root='/tests/browser/loading-fixtures/';
async function checkClient(file, mode, code) {
  const url=file.startsWith('/') ? file : root+file; let client;
  const messages=[];let receive;
  const next=()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Loading test timeout: '+file)),10000);receive=m=>{clearTimeout(timer);resolve(m);};});
  try {
    client=createSnapshotClient({pageUrl:location.origin+'/?test='+mode,config:{snapshotUrl:url,testSnapshotUrl:url},
      workerFactory:()=>new Worker('/tests/browser/loading-worker.mjs',{type:'module'}),
      onMessage:m=>{messages.push(m);receive(m);}});
    const pending=next();client.load();const result=await pending;
    assert(code ? result.code===code : result.type==='ready','load result for '+file+': '+(result.code || result.type)+'. If the fixture is missing, restart the local server.');
    assert(result.testFetchCount===1,'single download for '+file);
    if(file.startsWith('timestamp'))assert(result.message.includes('export timestamp'),'actionable timestamp error');
    let rejected=false;try{client.load();}catch{rejected=true;}assert(rejected,'reload-only retry');
    if(!code) {
      for(const text of ['', 'candy', 'parking']){const pending=next();client.query({text});const page=await pending;assert(page.type==='page' && page.testFetchCount===1,'in-memory query without redownload');}
      const pending=next();client.query({page:0});assert((await pending).code==='INVALID_QUERY','invalid query code');
    }
  }finally{client?.dispose();}
}
export async function run(report) {
  for(const mode of ['true']) {
    for(const file of ['timestamp-missing.json','timestamp-null.json','timestamp-type.json','timestamp-bad.json'])await checkClient(file,mode,'INVALID_SNAPSHOT');
  }
  await checkClient('empty.json','true');
  await checkClient('version.json','true','UNSUPPORTED_VERSION');
  await checkClient('balance.json','true','INVALID_SNAPSHOT');
  await checkClient('does-not-exist.json','false','LOAD_FAILED');
  await checkClient('/tests/browser/index.html','true','INVALID_SNAPSHOT');
  report('PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry');
  const frame=document.createElement('iframe');frame.style.cssText='width:412px;height:850px';
  frame.srcdoc=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">').replace(/<script type="module" src="app.js"><\/script>/,'');
  await new Promise(resolve=>{frame.onload=resolve;document.querySelector('#view').append(frame);});
  const doc=frame.contentDocument;
  const mount=(file,extra={})=>new App({document:doc,handlebars:frame.contentWindow.Handlebars,pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:root+file},...extra});
  let app=mount('empty.json');
  try {
    await app.start();
    assert(doc.getElementById('app').dataset.state==='empty','empty load state');
    assert(doc.getElementById('load-status').textContent.includes('No transactions'),'visible empty snapshot');
    assert(!doc.getElementById('as-of-date').hidden && doc.getElementById('as-of-date').textContent.startsWith('As of:'),'local export footer');
  } finally {app.dispose();}
  app=mount('timestamp-null.json');
  try{await app.start();assert(doc.getElementById('app').dataset.state==='error','error state');assert(doc.getElementById('as-of-date').hidden,'no stale footer');assert(!doc.querySelector('.account-header'),'no stale accounts');assert(doc.getElementById('load-status').textContent.includes('export timestamp'),'timestamp error visible');}finally{app.dispose();}
  app=mount('empty.json',{workerFactory:()=>new Worker('/tests/browser/failing-worker.mjs',{type:'module'})});
  try{const result=await app.start();assert(result.code==='WORKER_FAILED','real worker failure propagation');assert(doc.getElementById('app').dataset.state==='error','worker error visible');}finally{app.dispose();}
  const message=await new Promise(resolve=>{const client=createSnapshotClient({pageUrl:location.origin+'/',config:{snapshotUrl:'https://example.invalid/private.json'},onMessage:m=>{resolve(m);client.dispose();}});client.load();});
  assert(message.code==='LOAD_FAILED','cross-origin blocked');
  report('PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection');
}
