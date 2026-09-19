// US1 only. Real controller/templates with synthetic register data.
import { App } from '/app.js';
const assert = (value, message) => { if (!value) throw new Error(`US1: ${message}`); };
async function waitFor(predicate, label) {
  const deadline = performance.now() + 10000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(`US1 timeout: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 20));
  }
}
const mappings = {ROOT:'checkbook',BANK:'account_balance',CREDIT_CARD:'credit_card',
  EXPENSE:'sell',INCOME:'paid',LOAN:'payment_arrow_down',ASSET:'money_bag',LIABILITY:'receipt_long'};

export async function run(report) {
  const markup = (await (await fetch('/index.html')).text()).replace('<head>', '<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/, '');
  for (const width of [1280,1440,360,412]) {
    const frame = document.createElement('iframe');
    frame.style.cssText = `width:${width}px;height:850px;border:0;display:block`;
    frame.srcdoc = markup;
    let app;
    try {
      await new Promise(resolve => {frame.onload=resolve;document.querySelector('#view').append(frame);});
      const doc=frame.contentDocument, win=frame.contentWindow;
      app=new App({document:doc,handlebars:win.Handlebars,pageUrl:location.origin+'/?test=true',
        config:{testSnapshotUrl:'/tests/browser/register-pages.json'}});
      assert((await app.start()).type==='ready','synthetic snapshot loads');
      await waitFor(()=>doc.querySelector('tr[data-entry-id]'),'initial register');
      doc.querySelector('[data-id="register-pages"]').click();
      await waitFor(()=>!doc.querySelector('#future-summary').hidden,'future summary');
      doc.querySelector('#future-summary').click();
      await waitFor(()=>doc.querySelectorAll('tr[data-entry-id]').length===100,'full page');
      // Long text uses existing row markup; no private fixtures or model changes.
      const row=doc.querySelector('tr[data-entry-id]');
      assert(row.querySelector('.desc-main').title===row.querySelector('.desc-main').textContent,'description hover text');
      const categoryBadge=row.children[2].querySelector('.badge');
      assert(categoryBadge.title===categoryBadge.textContent,'category hover text');
      row.querySelector('.desc-main').textContent='A long synthetic description that truncates on one line rather than increasing the row height';
      categoryBadge.textContent='Personal:Household repairs and maintenance';
      for (const light of [true,false]) {
        app.toggleTheme(light);
        const head=doc.querySelector('thead tr').children;
        assert(!doc.querySelector('[class*="fa-solid"],[class*="fa-regular"],link[href*="font-awesome"]'),'no Font Awesome markup');
        assert(doc.querySelector('.sidebar-header .mi-checkbook[aria-hidden="true"]'),'branding mapping');
        assert(doc.querySelector('#theme-toggle .mi-'+(light?'dark_mode':'light_mode')),'theme action icon');
        doc.querySelector('#theme-toggle').click();
        assert(doc.body.classList.contains('light-mode')!==light,'theme button switches theme');
        doc.querySelector('#theme-toggle').click();
        assert(doc.body.classList.contains('light-mode')===light,'theme button restores theme');
        for (const id of ['open-sidebar','close-sidebar','theme-toggle','clear-search'])
          assert(doc.getElementById(id).getAttribute('aria-label'),`${id} accessible name`);
        assert(doc.documentElement.scrollWidth<=width+1,'no page-wide overflow');
        const money=row.querySelector('td.amount-col').getBoundingClientRect();
        assert(money.right<=width+1 && money.width>=100,'amount column visible');
        if(width>768) {
          const category=head[2].getBoundingClientRect(),description=head[1].getBoundingClientRect();
          assert(Math.abs(head[0].getBoundingClientRect().width-90)<2,'compact desktop date');
          assert(Math.abs(category.width-180)<2 && Math.abs(category.width/money.width-1.5)<.03,'category is 1.5 times amount');
          assert(description.width>category.width,'description receives the most space');
          for(const text of [row.querySelector('.desc-main'),categoryBadge]) {
            const style=win.getComputedStyle(text);
            assert(style.whiteSpace==='nowrap' && style.textOverflow==='ellipsis' && style.overflow==='hidden','single-line ellipsis');
          }
          assert(categoryBadge.scrollWidth>categoryBadge.clientWidth,'long category is truncated');
          assert(row.children[4].getBoundingClientRect().right<=width+1,'desktop balance visible');
          doc.querySelector('.content-body').scrollTop=350;
          await new Promise(resolve=>win.requestAnimationFrame(resolve));
          for (let i=0;i<5;i++) assert(Math.abs(head[i].getBoundingClientRect().left-row.children[i].getBoundingClientRect().left)<2,'sticky header columns align');
          assert(win.getComputedStyle(head[2]).position==='sticky','sticky header retained');
          doc.querySelector('.content-body').scrollTop=0;
        } else {
          assert(win.getComputedStyle(row.querySelector('.mobile-running-balance')).display!=='none','mobile balance visible');
          doc.querySelector('#open-sidebar').click();assert(doc.querySelector('#sidebar').classList.contains('open'),'menu opens');
          doc.querySelector('#close-sidebar').click();assert(!doc.querySelector('#sidebar').classList.contains('open'),'close works');
        }
      }
      // Exercise every account type through the real sidebar template, then
      // check loaded row icons below against their owning account metadata.
      const scratch=doc.createElement('div');
      for(const [type,icon] of Object.entries({...mappings,UNKNOWN:'account_balance'})) {
        scratch.innerHTML=app.treeTemplate({id:'synthetic-icon',type,name:'Synthetic',children:[],isAll:true});
        assert(scratch.querySelector(`.account-icon .mi-${icon}[aria-hidden="true"]`),`${type} sidebar icon`);
      }
      doc.querySelector('#next-page').click();
      await waitFor(()=>doc.querySelector('#page-info').textContent==='Page 2 of 3','next page');
      doc.querySelector('#prev-page').click();
      await waitFor(()=>doc.querySelector('#page-info').textContent==='Page 1 of 3','previous page');
      doc.querySelector('[data-id=""]').click();
      await waitFor(()=>doc.querySelector('.transaction-account'),'All Accounts labels');
      for(const label of doc.querySelectorAll('.transaction-account')) {
        const type=app.nodes.get(label.closest('tr').dataset.accountId).type;
        assert(label.querySelector('.mi-'+(mappings[type]||'account_balance')),'account label matches its type');
      }
      const search=doc.querySelector('#search-input');search.value='candy';search.dispatchEvent(new win.Event('input',{bubbles:true}));
      await waitFor(()=>doc.querySelector('#total-transactions').textContent==='2','search');
      assert(doc.querySelectorAll('.transaction-account .mi').length===2,'search result icons');
      doc.querySelector('#clear-search').click();
      assert(search.value==='','clear search works');
      assert(!win.performance.getEntriesByType('resource').some(r=>/font-awesome/i.test(r.name)),'no Font Awesome requests');
      report(`PASS US1 ${width}px: both themes, columns, money, icons and controls`);
    } finally {app?.dispose();frame.remove();}
  }
}
