import { App } from '/app.js';
const status=document.getElementById('status');
let app;
try {
  const encrypted=new URLSearchParams(location.search).get('encrypted')==='true';
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/,'');
  const frame=document.createElement('iframe');frame.title='Synthetic transaction navigation viewer';frame.srcdoc=markup;
  await new Promise(resolve=>{frame.onload=resolve;document.body.append(frame)});
  app=new App({document:frame.contentDocument,handlebars:frame.contentWindow.Handlebars,
    pageUrl:location.origin+(encrypted?'/':'/?test=true'),
    config:{testSnapshotUrl:'/tests/browser/navigation.json',snapshotUrl:'/tests/browser/navigation.enc'}});
  const result=await app.start();
  if(!['ready','locked'].includes(result.type))throw new Error();
  status.textContent='US4: In All Accounts search Exact needle, or select Navigation Checking and open Mixed transfer / Past transfer / Unavailable transfers. Encrypted password: synthetic-password.';
  window.addEventListener('pagehide',event=>{if(!event.persisted)app.dispose()});
} catch {app?.dispose();status.textContent='Unable to load navigation preview. Restart the updated local server and reload.';}
