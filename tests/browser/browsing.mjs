// US1 and US2. Real controller/templates with synthetic register data.
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
  const categories = await import('./categories.mjs');
  await categories.run(report);
  const navigation = await import('./navigation.mjs');
  await navigation.run(report);
  const details = await import('./details.mjs');
  await details.run(report);
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
      assert(categoryBadge.title==='Uncategorized','uncategorized hover text');
      const categoryPreview=doc.createElement('tbody');
      categoryPreview.innerHTML=app.transactionsTemplate({paginatedTransactions:[{
        category:'Dining Out',categoryTitle:'Personal:Dining:Dining Out "special" <literal>',
        amountCents:0,runningBalanceCents:0
      }],columnCount:5});
      assert(categoryPreview.querySelector('.category-cell .badge').title==='Personal:Dining:Dining Out "special" <literal>',
        'full category title is escaped and preserved');
      assert(categoryPreview.querySelector('.category-cell .badge').textContent==='Dining Out','visible category remains short');
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
      await waitFor(()=>doc.querySelector('#total-transactions').textContent!=='—','cleared search completes');
      const countAlignment=win.getComputedStyle(doc.querySelector('#total-transactions')).textAlign;
      for(const [totalMatches,expected] of [[0,'0'],[999,'999'],[1000,'1,000'],[2963,'2,963'],[1234567,'1,234,567']]) {
        app.renderPage({page:1,pageSize:100,totalMatches,rows:[],future:{count:0,amountCents:0}});
        assert(doc.querySelector('#total-transactions').textContent===expected,'summary count grouping');
        assert(win.getComputedStyle(doc.querySelector('#total-transactions')).textAlign===countAlignment,'count alignment unchanged');
      }
      report(`PASS US1 ${width}px: both themes, columns, money, icons and controls`);
    } finally {app?.dispose();frame.remove();}
  }
  await runTags(report, markup);
}

async function runTags(report, markup) {
  const check = (value, message) => { if (!value) throw new Error(`US2: ${message}`); };
  for (const width of [1280,1440,360,412]) {
    const frame=document.createElement('iframe');
    frame.style.cssText=`width:${width}px;height:850px;border:0;display:block`;
    frame.srcdoc=markup;
    let app;
    try {
      await new Promise(resolve=>{frame.onload=resolve;document.querySelector('#view').append(frame);});
      const doc=frame.contentDocument, win=frame.contentWindow;
      app=new App({document:doc,handlebars:win.Handlebars,pageUrl:location.origin+'/?test=true',
        config:{testSnapshotUrl:'/tests/browser/tags.json'}});
      check((await app.start()).type==='ready','fixture loads');
      app.selectAccount(app.nodes.get('tags-bank'));
      const row=id=>doc.querySelector(`[data-entry-id="${id}"]`);
      const tags=id=>[...row(id).querySelectorAll('.transaction-tag')].map(node=>node.textContent);
      await waitFor(()=>row('tag-104'),'US2 first page');
      const expectedMarkup=['<img src=x onerror="window.tagExecuted=true">','Quotes " & < >','{{notATemplate}}'];
      for(const light of [true,false]) {
        app.toggleTheme(light);
        check(!row('tag-104').querySelector('.transaction-tags'),'empty array has no tag container');
        check(JSON.stringify(tags('tag-103'))===JSON.stringify(['tagonly-orchid']),'single tag');
        check(tags('tag-102').length===10,'all ten tags appear');
        check(tags('tag-101')[0]==='LongTag'+'abcdefghij'.repeat(16),'long unbroken tag is complete');
        check(JSON.stringify(tags('tag-100'))===JSON.stringify(expectedMarkup),'markup stays literal and ordered');
        check(!row('tag-100').querySelector('.transaction-tags img, .transaction-tags script'),'no injected elements');
        check(!win.tagExecuted,'no tag script executed');
        check(row('tag-103').querySelector('.desc-main').textContent==='One tag','description retained');
        check(row('tag-103').querySelector('.memo-text').textContent==='memo-103','memo retained');
        check(row('tag-103').querySelector('.desc-extra .badge').textContent==='#007','check number retained');
        for(const id of ['tag-104','tag-103','tag-102','tag-101','tag-100']) {
          const current=row(id), money=current.querySelector('td.amount-col');
          const moneyRect=money.getBoundingClientRect();
          check(money.firstChild.textContent.trim()==='-$1.00','amount unchanged');
          check(current.children[4].textContent==='$'+(19900-Number(id.slice(4))*100)/100+'.00','running balance unchanged');
          check(moneyRect.right<=width+1 && moneyRect.width>=100,'money visible');
          for(const tag of current.querySelectorAll('.transaction-tag')) {
            const rect=tag.getBoundingClientRect();
            check(tag.scrollWidth<=tag.clientWidth+1,'tag text does not overflow its badge');
            check(rect.right<=moneyRect.left+1,'tags do not overlap money');
            check(win.getComputedStyle(tag).whiteSpace!=='nowrap','tags can wrap');
          }
        }
        const longTag=row('tag-101').querySelector('.transaction-tag');
        check(longTag.getBoundingClientRect().height>25,'long tag wraps to multiple lines');
        check(doc.documentElement.scrollWidth<=width+1,'no page-wide horizontal overflow');
      }
      const search=doc.querySelector('#search-input');
      const searchFor=async(text,expected)=>{
        search.value=text;search.dispatchEvent(new win.Event('input',{bubbles:true}));
        await waitFor(()=>doc.querySelector('#total-transactions').textContent===String(expected) &&
          doc.querySelector('#register-status').hidden,`US2 search ${text}`);
      };
      await searchFor('Markup tag',1);
      check(JSON.stringify(tags('tag-100'))===JSON.stringify(expectedMarkup),'search displays escaped tags');
      // Wait for a fresh page reply even when the previous search has the same count.
      search.value='memo-103';search.dispatchEvent(new win.Event('input',{bubbles:true}));
      await waitFor(()=>row('tag-103') && !row('tag-100'),'US2 memo search');
      check(tags('tag-103')[0]==='tagonly-orchid','memo result retains tags');
      await searchFor('tagonly-orchid',0);
      check(!doc.querySelector('.transaction-tags'),'tag-only term does not match');
      doc.querySelector('#clear-search').click();
      await waitFor(()=>row('tag-104'),'US2 clear restores rows');
      doc.querySelector('#next-page').click();
      await waitFor(()=>row('tag-000'),'US2 later page');
      check(JSON.stringify(tags('tag-000'))===JSON.stringify(['later-page-tag']),'later-page tag');
      app.selectAccount(app.nodes.get('tags-empty'));
      await waitFor(()=>!doc.querySelector('#no-results').classList.contains('hidden'),'US2 empty account');
      check(!doc.querySelector('.transaction-tags'),'account change leaves no stale tags');
      app.selectAccount(app.nodes.get(''));
      await waitFor(()=>row('tag-103'),'US2 All Accounts');
      check(tags('tag-103')[0]==='tagonly-orchid','All Accounts retains tags');
      report(`PASS US2 ${width}px: tags, escaping, wrapping, money, search and page/account changes`);
    } finally {app?.dispose();frame.remove();}
  }
}
