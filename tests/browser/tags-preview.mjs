// Manual acceptance page: real viewer with fixed synthetic data, no config edits.
import { App } from '/app.js';

const status=document.querySelector('#status');
let app;
try {
  const response=await fetch('/index.html');
  if(!response.ok) throw new Error('Viewer markup unavailable');
  const markup=(await response.text()).replace('<head>','<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/,'');
  const frame=document.createElement('iframe');
  frame.title='Synthetic transaction tag viewer';
  frame.srcdoc=markup;
  await new Promise(resolve=>{frame.onload=resolve;document.body.append(frame);});
  app=new App({document:frame.contentDocument,handlebars:frame.contentWindow.Handlebars,
    pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:'/tests/browser/tags.json'}});
  if((await app.start()).type!=='ready') throw new Error('Tag fixture unavailable');
  app.selectAccount(app.nodes.get('tags-bank'));
  status.textContent='US2 synthetic cases: No tags, One tag, Many tags, Long tag, Markup tag. Page 2: Later page.';
  window.addEventListener('pagehide',event=>{if(!event.persisted) app.dispose();});
} catch {
  app?.dispose();
  status.textContent='Unable to load tag preview. Restart the updated local server and reload this page.';
}
