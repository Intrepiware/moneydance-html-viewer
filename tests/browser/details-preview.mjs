import { App } from '/app.js';
const status=document.querySelector('#status');
let app;
try {
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">').replace(/<script type="module" src="app.js"><\/script>/,'');
  const frame=document.createElement('iframe');frame.title='Synthetic split-details viewer';frame.srcdoc=markup;
  await new Promise(resolve=>{frame.onload=resolve;document.body.append(frame)});
  app=new App({document:frame.contentDocument,handlebars:frame.contentWindow.Handlebars,pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:'/tests/browser/details.json'}});
  if((await app.start()).type!=='ready')throw new Error();
  app.selectAccount(app.nodes.get('details-bank'));
  status.textContent='US3: Details Checking page 2, or search Payroll / Repeated / Legacy / Uncategorized / Many / Refund. Also inspect Home Savings, Rainy Day Savings and Home:Repairs.';
  window.addEventListener('pagehide',event=>{if(!event.persisted)app.dispose()});
} catch {app?.dispose();status.textContent='Unable to load details preview. Restart the updated local server and reload.'}
