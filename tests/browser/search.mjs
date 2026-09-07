import { App } from '/app.js';
const assert = (value, message) => { if (!value) throw new Error(message); };
const settle = doc => new Promise((resolve, reject) => {
  const done = () => doc.querySelector('#register-status').hidden && doc.querySelector('#total-transactions').textContent !== '—';
  if (done()) return resolve();
  const observer = new MutationObserver(() => { if(done()) { clearTimeout(timer); observer.disconnect(); resolve(); } });
  const timer=setTimeout(()=>{observer.disconnect();reject(new Error('Search render timeout'));},10000);
  observer.observe(doc.body,{subtree:true,childList:true,attributes:true,characterData:true});
});
export async function run(report) {
  const frame=document.createElement('iframe'); frame.style.cssText='width:412px;height:850px';
  frame.srcdoc=(await (await fetch('/index.html')).text()).replace('<head>','<head><base href="/">').replace(/<script type="module" src="app.js"><\/script>/,'');
  await new Promise(resolve=>{frame.onload=resolve;document.querySelector('#view').append(frame);});
  const doc=frame.contentDocument;
  const app=new App({document:doc,handlebars:frame.contentWindow.Handlebars,pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:'/tests/browser/register-pages.json'}});
  const input=doc.querySelector('#search-input');
  const type=text=>{input.value=text;input.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));};
  const find=async text=>{type(text);await settle(doc);};
  const count=()=>Number(doc.querySelector('#total-transactions').textContent);
  try {
    const loaded=await app.start(); assert(loaded.type==='ready','search fixture loaded; restart server if missing'); await settle(doc);
    doc.querySelector('[data-id="00000000-0000-4000-8000-000000000002"]').click();await settle(doc);
    const balance=doc.querySelector('#total-balance').textContent;
    await find('CANDY');assert(count()===1,'descendant description match');
    assert(doc.querySelector('.transaction-account').textContent.includes('Misc Spending Budget'),'originating account shown');
    await find('');assert(count()===0,'clear restores parent own register');
    doc.querySelector('[data-id=""]').click();await settle(doc);
    await find('candy');assert(count()===2,'All Accounts retains counterparts');
    await find('Full memo & details');assert(count()===0 && !doc.querySelector('#future-summary').hidden,'memo-only future matches summarized');
    doc.querySelector('#future-summary').click();await settle(doc);assert(count()===205,'future search reveal');
    doc.querySelector('#next-page').click();await settle(doc);assert(doc.querySelector('#page-info').textContent==='Page 2 of 3','search paging');
    await find('Allocation note');assert(count()===204 && doc.querySelector('#page-info').textContent==='Page 1 of 3','allocation matches deduplicated and page reset');
    await find('not-a-real-result');assert(count()===0 && doc.querySelector('#no-results').textContent.includes('No results'),'explicit no results');
    type('candy');type('parking');await settle(doc);assert(count()===2 && doc.querySelector('#transactions-body').textContent.includes('Parking'),'rapid query final choice');
    type('candy');doc.querySelector('[data-id="00000000-0000-4000-8000-000000000002"]').click();await settle(doc);
    assert(count()===1 && doc.querySelector('#total-balance').textContent===balance,'account switch uses newest query without changing balance');
    await find('');assert(count()===0,'clear restores direct scope again');
    const times=[];
    doc.querySelector('[data-id=""]').click();await settle(doc);
    for(let i=0;i<20;i++) { const start=performance.now();await find(i%2?'candy':'parking');times.push(Math.round(performance.now()-start)); }
    report('PASS search DOM: descriptions/memos/allocations, descendant scope, clear, paging, future disclosure, rapid changes and balances');
    report(`Synthetic search timings including debounce (ms): ${times.join(', ')}. Real-data Pixel 8 timing remains a separate check.`);
  } finally {app.dispose();}
}
