import { App } from '/app.js';
const status=document.getElementById('status');
let app;
try {
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/,'');
  const frame=document.createElement('iframe');frame.title='Synthetic category viewer';frame.srcdoc=markup;
  await new Promise(resolve=>{frame.onload=resolve;document.body.append(frame);});
  app=new App({document:frame.contentDocument,handlebars:frame.contentWindow.Handlebars,
    pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:'/tests/browser/categories.json'}});
  if((await app.start()).type!=='ready')throw new Error();
  status.textContent='US5: Switch to Categories, then select Living. January 2025 activity is $100 across two pages; February is $0. Search Period to include Dining. See quickstart.md for all references.';
  window.addEventListener('pagehide',event=>{if(!event.persisted)app.dispose();});
}catch{app?.dispose();status.textContent='Unable to load category preview. Restart the updated local server and reload.';}
