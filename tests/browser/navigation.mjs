import { App } from '/app.js';
const assert = (ok, text) => { if (!ok) throw new Error('US4: ' + text); };
async function wait(predicate) { const end=performance.now()+15000; while(!predicate()) {
  if(performance.now()>end) throw new Error('US4 timeout'); await new Promise(r=>setTimeout(r,20));
} }
export async function run(report) {
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/,'');
  for(const [width,encrypted] of [[1280,false],[360,false],[412,true]]) {
    const frame=document.createElement('iframe');frame.style.cssText=`width:${width}px;height:850px`;frame.srcdoc=markup;
    let app,fetches=0;
    try {
      await new Promise(r=>{frame.onload=r;document.querySelector('#view').append(frame)});
      const doc=frame.contentDocument,win=frame.contentWindow;
      app=new App({document:doc,handlebars:win.Handlebars,pageUrl:location.origin+(encrypted?'/':'/?test=true'),
        config:{testSnapshotUrl:'/tests/browser/navigation.json',snapshotUrl:'/tests/browser/navigation.enc'},
        workerFactory:()=>{const worker=new Worker('/tests/browser/loading-worker.mjs',{type:'module'});
          worker.addEventListener('message',e=>{fetches=e.data.testFetchCount});return worker;}});
      const start=await app.start();assert(start.type===(encrypted?'locked':'ready'),'fixture loads');
      if(encrypted){doc.getElementById('snapshot-password').value='synthetic-password';doc.getElementById('unlock-form').requestSubmit();}
      await wait(()=>doc.querySelector('tr[data-entry-id]'));
      const search=text=>{const input=doc.getElementById('search-input');input.value=text;input.dispatchEvent(new win.Event('input',{bubbles:true}));};
      const row=id=>[...doc.querySelectorAll('tr[data-entry-id]')].find(n=>n.dataset.entryId===id);
      const category=id=>[...row(id).querySelectorAll('.category-details')].find(n=>n.getBoundingClientRect().width);
      const topbarTop=doc.querySelector('.topbar').getBoundingClientRect().top;
      const paneBottom=doc.querySelector('.content-body').getBoundingClientRect().bottom;
      const assertStableLayout=()=>{
        assert(doc.querySelector('.main-content').scrollTop===0,'navigation does not scroll the outer panel');
        assert(Math.abs(doc.querySelector('.topbar').getBoundingClientRect().top-topbarTop)<1,'topbar stays in place');
        assert(Math.abs(doc.querySelector('.content-body').getBoundingClientRect().bottom-paneBottom)<1,'register bottom stays in place');
        for(const id of ['search-input','theme-toggle']) {
          const rect=doc.getElementById(id).getBoundingClientRect();
          assert(rect.top>=0 && rect.bottom<=win.innerHeight,`${id} remains visible`);
        }
      };
      for(const light of [true,false]) {
        app.toggleTheme(light);app.selectAccount(app.nodes.get(''));search('Exact needle');
        await wait(()=>row('destination-40')?.querySelector('button.transaction-account'));
        row('destination-40').querySelector('button.transaction-account').click();
        await wait(()=>app.currentAccount.id==='destination' && app.page===2 && row('destination-40')?.classList.contains('navigation-target'));
        assert(app.searchText==='' && doc.getElementById('search-input').value==='','search cleared');
        assert(!app.includeFuture && doc.activeElement===row('destination-40'),'exact target focused');
        assertStableLayout();
        assert(doc.querySelectorAll('tr.navigation-target').length===1,'only exact row highlighted');
        assert(row('destination-40').textContent.includes('$410.00'),'source running balance preserved');
        const rect=row('destination-40').getBoundingClientRect();
        assert(rect.top>=doc.querySelector('thead').getBoundingClientRect().bottom && rect.bottom<=win.innerHeight,'target visible below sticky headings');
        app.selectAccount(app.nodes.get('source'));await wait(()=>row('source-mixed'));category('source-mixed').click();
        await wait(()=>doc.querySelectorAll('.details-transfer').length===3);
        assert(doc.querySelectorAll('.details-allocation').length===3,'repeated allocations remain distinct');
        doc.querySelector('.details-transfer').click();
        await wait(()=>row('destination-future')?.classList.contains('navigation-target'));
        assert(!app.detailsDialog.open && !doc.getElementById('sidebar').classList.contains('open'),'overlays closed');
        assert(app.includeFuture && row('destination-future').classList.contains('future-entry'),'future target revealed and styled');
        assert(doc.activeElement===row('destination-future'),'first related row focused');
        assertStableLayout();
        assert(doc.querySelectorAll('tr.navigation-target').length===2,'two related rows on first page');
        assert(!row('destination-141').classList.contains('navigation-target') && !row('future-lookalike').classList.contains('navigation-target'),'look-alikes excluded');
        doc.getElementById('next-page').click();await wait(()=>app.page===2 && row('destination-40'));
        assert(row('destination-40').classList.contains('navigation-target'),'related highlights retained across pages');
        app.selectAccount(app.nodes.get('destination'));await wait(()=>app.page===1 && row('destination-204'));
        assert(!app.includeFuture && !doc.querySelector('.navigation-target') && !row('destination-future'),'ordinary selection resets');
      }
      app.selectAccount(app.nodes.get('source'));await wait(()=>row('source-unavailable'));category('source-unavailable').click();
      await wait(()=>doc.querySelectorAll('.details-reason').length===2);
      assert(!doc.querySelector('.details-transfer'),'no unavailable links');app.closeDetails();
      const original=doc.getElementById('transactions-body').innerHTML;
      app.navigate({mode:'exact',accountId:'destination',entryId:'missing'});
      await wait(()=>doc.getElementById('navigation-status').textContent.includes('unavailable'));
      assert(doc.getElementById('transactions-body').innerHTML===original && app.currentAccount.id==='source','unavailable preserves register');
      category('source-category').click();await wait(()=>doc.querySelector('.details-path'));
      assert(!doc.querySelector('.details-transfer'),'category details remain read-only');app.closeDetails();
      category('source-mixed').click();
      app.navigate({mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'});
      app.navigate({mode:'exact',accountId:'source',entryId:'source-past'});
      await wait(()=>row('source-past')?.classList.contains('navigation-target'));
      await new Promise(r=>setTimeout(r,200));
      assert(app.currentAccount.id==='source' && !app.detailsDialog.open && doc.querySelectorAll('.navigation-target').length===1,'latest navigation wins over details and older locate');
      app.navigate({mode:'transfer',destinationAccountId:'destination',transactionId:'mixed'});search('Past transfer');
      await wait(()=>row('source-past') && !doc.querySelector('.navigation-target') && app.searchText==='Past transfer');
      assert(app.currentAccount.id==='source','new search supersedes navigation');
      assert(fetches===1 && doc.getElementById('unlock-form').hidden,'one fetch, no reunlock');
      assert(doc.documentElement.scrollWidth<=width+1,'no horizontal page overflow');
      report(`PASS US4 ${width}px ${encrypted?'encrypted':'plaintext'}: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock`);
    } finally {app?.dispose();frame.remove();}
  }
}
