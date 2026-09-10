import {startViewer} from '/app.js';
const assert=(v,m)=>{if(!v)throw new Error(m);};
const wait=async(predicate)=>{const end=Date.now()+15000;while(!predicate()){if(Date.now()>end)throw new Error('Unlock DOM timeout');await new Promise(r=>setTimeout(r,20));}};
export async function run(report) {
 const frame=document.createElement('iframe');frame.style.cssText='width:412px;height:850px';
 frame.srcdoc=(await (await fetch('/index.html')).text()).replace('<head>','<head><base href="/">').replace(/<script type="module" src="app.js"><\/script>/,'');
 await new Promise(r=>{frame.onload=r;document.querySelector('#view').append(frame);});
 const win=frame.contentWindow,doc=frame.contentDocument;let count=0;
 const app=startViewer({document:doc,handlebars:win.Handlebars,pageUrl:location.origin+'/',config:{snapshotUrl:'/tests/browser/synthetic-snapshot.enc'},workerFactory:()=>{
  const worker=new Worker('/tests/browser/loading-worker.mjs',{type:'module'});worker.addEventListener('message',e=>{count=e.data.testFetchCount;});return worker;
 }});
 try {
  assert(!doc.querySelector('#unlock-form').hidden,'password form visible during download');
  assert(doc.querySelector('#unlock-button').disabled,'unlock disabled before ciphertext is ready');
  doc.querySelector('#snapshot-password').value='filled-before-download';
  await wait(()=>doc.querySelector('#app').dataset.state==='locked');
  assert(doc.querySelector('#snapshot-password').value==='filled-before-download','early autofill value preserved');
  assert(!doc.querySelector('.account-header') && doc.querySelector('#as-of-date').hidden,'no financial data before unlock');
  const form=doc.querySelector('#unlock-form'),input=doc.querySelector('#snapshot-password');
  assert(input.autocomplete==='current-password' && input.name==='password','stable password form');
  input.value='wrong';form.requestSubmit();await wait(()=>doc.querySelector('#unlock-status').textContent.includes('Unable to unlock'));
  assert(count===1 && !doc.querySelector('.account-header'),'wrong password retains one download');
  // Setting value without dispatching input simulates submit-time autofill reading.
  input.value='synthetic-password';form.requestSubmit();await wait(()=>doc.querySelector('#app').dataset.state==='ready');
  assert(input.value==='' && form.hidden,'password cleared after unlock');
  assert(count===1 && doc.querySelector('.account-header'),'native JVM fixture unlocked');
  const date=app.metadata.effectiveDate;
  for(let i=0;i<2;i++){win.dispatchEvent(new win.PageTransitionEvent('pagehide',{persisted:true}));win.dispatchEvent(new win.PageTransitionEvent('pageshow',{persisted:true}));}
  assert(app.metadata.effectiveDate===date && count===1,'unlock session survives persisted lifecycle');
  const checking=[...doc.querySelectorAll('.account-header')].find(n=>n.textContent.includes('Checking'));checking.click();
  assert(doc.querySelector('#total-balance').textContent==='$1,045.00','unlocked balance unchanged');
  report('PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle');
 } finally {app.dispose();}
}
