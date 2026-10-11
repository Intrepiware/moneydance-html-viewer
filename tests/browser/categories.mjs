import { App } from '/app.js';
const assert=(ok,message)=>{if(!ok)throw new Error('US5: '+message);};
async function wait(predicate){const end=performance.now()+15000;while(!predicate()){
  if(performance.now()>end)throw new Error('US5 timeout');await new Promise(r=>setTimeout(r,20));
}}
export async function run(report){
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/,'');
  for(const width of [1280,360,412]){
    const frame=document.createElement('iframe');frame.style.cssText=`width:${width}px;height:850px`;frame.srcdoc=markup;
    let app,fetches=0;
    try{
      await new Promise(r=>{frame.onload=r;document.querySelector('#view').append(frame);});
      const doc=frame.contentDocument,win=frame.contentWindow;
      const start=async()=>{
        app=new App({document:doc,handlebars:win.Handlebars,pageUrl:location.origin+'/?test=true',
          config:{testSnapshotUrl:'/tests/browser/categories.json'},workerFactory:()=>{
            const worker=new Worker('/tests/browser/loading-worker.mjs',{type:'module'});
            worker.addEventListener('message',e=>{fetches=e.data.testFetchCount;});return worker;}});
        assert((await app.start()).type==='ready','fixture loads');await wait(()=>doc.querySelector('tr[data-entry-id]'));
      };
      await start();
      const rows=()=>doc.querySelectorAll('tr[data-entry-id]');
      const periods=()=>[...doc.querySelectorAll('.period-divider')];
      const checkBadges=()=>{
        const button=[...rows()[0].querySelectorAll('.category-details')].find(n=>n.getBoundingClientRect().width);
        const label=button.querySelector('span');
        const reference=doc.createElement('span');reference.className='badge';reference.textContent='#MC';
        button.parentElement.append(reference);
        try {
          const actual=win.getComputedStyle(label),expected=win.getComputedStyle(reference);
          for(const property of ['fontSize','lineHeight','paddingTop','paddingBottom','paddingLeft','paddingRight','borderRadius','backgroundColor']){
            assert(actual[property]===expected[property],`category badge matches check-number ${property}`);
          }
          assert(Math.abs(label.getBoundingClientRect().height-reference.getBoundingClientRect().height)<1,'badge visible heights match');
          if(width<=768){
            const rect=button.getBoundingClientRect();
            assert(rect.width>=44 && rect.height>=44,'compact category badge retains mobile tap target');
          }
        } finally { reference.remove(); }
      };
      const choose=async id=>{app.selectAccount(app.nodes.get(id));await wait(()=>doc.getElementById('register-status').hidden);};
      const group=async value=>{doc.querySelector(`#category-grouping [data-grouping="${value}"]`).click();await wait(()=>doc.getElementById('register-status').hidden);};
      const search=async value=>{const input=doc.getElementById('search-input');input.value=value;input.dispatchEvent(new win.Event('input'));await wait(()=>doc.getElementById('register-status').hidden);};
      for(const light of [true,false]){
        app.toggleTheme(light);await choose('');
        assert(rows().length===100 && doc.getElementById('balance-card').hidden,'All Accounts population and no overall balance');
        doc.getElementById('show-accounts').click();
        assert(!doc.querySelector('.account-header[data-id="expense"]'),'Accounts omits categories');
        const before=doc.getElementById('transactions-body').innerHTML,footer=doc.getElementById('as-of-date').textContent;
        doc.getElementById('show-categories').click();
        assert(app.currentAccount.isAll && doc.getElementById('transactions-body').innerHTML===before,'switch changes list only');
        assert(doc.getElementById('as-of-date').textContent===footer,'footer retained');
        assert(doc.querySelector('.account-header[data-id="expense"]') && doc.querySelector('.account-header[data-id="child"]'),'category hierarchy retained');
        assert(doc.querySelector('.account-header[data-id="promoted"]') && !doc.querySelector('.account-header[data-id="hidden"]'),'excluded ancestor promoted');
        assert(!doc.querySelector('.account-header[data-id="bank"]'),'Categories omits ordinary accounts');
        for(const id of ['show-accounts','show-categories']){
          const button=doc.getElementById(id),rect=button.getBoundingClientRect();
          assert(button.tagName==='BUTTON' && button.getAttribute('aria-label') && button.title && rect.width>=44 && rect.height>=44,'named keyboard buttons with 44px targets');
        }
        assert(doc.getElementById('show-categories').getAttribute('aria-pressed')==='true','selected section exposed');
        await choose('expense');await group('month');
        assert(doc.getElementById('balance-card').hidden && doc.getElementById('mobile-balance-bar').hidden,'month hides Total Balance');
        assert(doc.getElementById('running-balance-heading').hidden && !doc.querySelector('.mobile-running-balance') && rows()[0].cells.length===4,'category running balances removed');
        for (const button of doc.querySelectorAll('#category-grouping button')) {
          const rect=button.getBoundingClientRect();
          assert(rect.width>=44 && rect.height>=44,'grouping pill target size');
          assert(button.getAttribute('aria-pressed')===String(button.dataset.grouping==='month'),'grouping selected state');
        }
        assert(periods().length===2 && periods()[0].textContent.includes('$0.00') && periods()[1].textContent.includes('$100.00'),'complete monthly totals');
        assert(win.getComputedStyle(doc.getElementById('category-scope')).display==='none','direct scope hidden');
        checkBadges();
        for(const id of ['category-scope','navigation-status'])assert(win.getComputedStyle(doc.getElementById(id)).textAlign==='center','scope and navigation messages centered');
        assert(!doc.querySelector('#transactions-body .amount.positive, #transactions-body .amount.negative'),'category amounts use neutral styling');
        if (width<=768) {
          const pills=doc.getElementById('category-grouping').getBoundingClientRect();
          const header=doc.querySelector('.table-header').getBoundingClientRect();
          assert(Math.abs((pills.left+pills.right)-(header.left+header.right))<2,'mobile pills centered');
          const badge=rows()[0].querySelector('.category-details');
          assert(badge.getBoundingClientRect().height>=44,'lightweight badge retains touch target');
        }
        assert(doc.getElementById('total-balance').textContent==='$322.00','source sidebar balance preserved');
        doc.getElementById('next-page').click();await wait(()=>app.page===2 && rows().length===9);
        assert(periods()[0].textContent.includes('continued') && periods()[0].textContent.includes('$100.00'),'continued complete total');
        const pane=doc.querySelector('.content-body');pane.scrollTop=50;
        const trigger=[...rows()[0].querySelectorAll('.category-details')].find(n=>n.getBoundingClientRect().width);
        const scroll=pane.scrollTop;trigger.click();await wait(()=>doc.querySelector('.details-path'));
        doc.getElementById('details-close').click();
        assert(app.page===2 && app.categoryGrouping==='month' && pane.scrollTop===scroll && doc.activeElement===trigger,'grouped details restore context');
        await group('all');
        assert(!doc.getElementById('balance-card').hidden && !doc.getElementById('mobile-balance-bar').hidden,'All Time shows Total Balance');
        assert(periods().length===0 && doc.querySelector('.sticky-year').textContent==='2025' && !doc.querySelector('.period-total'),'All Time annual headings without rollups');
        assert(!doc.querySelector('.mobile-running-balance') && rows()[0].cells.length===4,'All Time also hides running balances');
        await group('year');assert(periods()[0].textContent.includes('2025') && periods()[0].textContent.includes('$100.00'),'annual total');
        assert(doc.getElementById('balance-card').hidden && doc.getElementById('mobile-balance-bar').hidden,'year hides Total Balance');
        await choose('child');assert(doc.querySelector('#category-grouping [data-grouping="year"]').getAttribute('aria-pressed')==='true' && periods()[0].textContent.includes('$15.00'),'grouping retained across categories');
        await choose('expense');await search('Period');
        assert(periods()[0].textContent.includes('$115.00') && doc.getElementById('category-scope').textContent==='Matches in category + descendants','descendant matching activity');
        await search('no-such-description');assert(periods().length===0 && !doc.getElementById('no-results').classList.contains('hidden'),'empty search');
        await search('');await choose('future');
        assert(periods().length===0 && !doc.getElementById('future-summary').hidden,'future-only reveal control retained');
        doc.getElementById('future-summary').click();await wait(()=>rows().length===1);
        assert(periods()[0].textContent.includes('$9.00') && win.getComputedStyle(doc.getElementById('category-scope')).display==='none','future disclosure totals without direct scope');
        await choose('empty');assert(periods().length===0,'empty category has no periods');
        await choose('bank');assert(periods().length===0 && rows()[0].textContent.includes('$99.00'),'ordinary register unchanged');
        checkBadges();
        doc.getElementById('show-accounts').click();
        const bankTrigger=[...rows()[0].querySelectorAll('.category-details')].find(n=>n.getBoundingClientRect().width);bankTrigger.click();
        await wait(()=>doc.querySelector('.details-transfer'));doc.querySelector('.details-transfer').click();
        await wait(()=>app.currentAccount.id==='expense' && doc.querySelector('.navigation-target'));
        assert(app.page===2 && app.sidebarSection==='categories' && app.categoryGrouping==='year','transfer into category selects section and retains grouping');
        await choose('');await search('Period purchase 0');
        doc.querySelector('button.transaction-account[data-account-id="expense"]').click();
        await wait(()=>app.currentAccount.id==='expense' && doc.querySelector('.navigation-target'));
        assert(app.sidebarSection==='categories' && app.searchText==='','search navigation into category');
        assert(doc.documentElement.scrollWidth<=width+1,'no page overflow');
      }
      assert(fetches===1,'no extra snapshot fetch');app.dispose();await start();
      assert(app.sidebarSection==='accounts' && app.categoryGrouping==='month','new session resets defaults');
      report(`PASS US5 ${width}px: sections, hierarchy, full totals, continuation, search, future-only, details, navigation, defaults, one fetch`);
    }finally{app?.dispose();frame.remove();}
  }
}
