import { App } from '/app.js';
const assert=(ok,message)=>{if(!ok)throw new Error('US3: '+message)};
async function wait(predicate){const end=performance.now()+10000;while(!predicate()){if(performance.now()>end)throw new Error('US3 timeout');await new Promise(r=>setTimeout(r,20));}}
export async function run(report) {
  const markup=(await(await fetch('/index.html')).text()).replace('<head>','<head><base href="/">').replace(/<script type="module" src="app.js"><\/script>/,'');
  for(const width of [1280,360,412]) {
    const frame=document.createElement('iframe');frame.style.cssText=`width:${width}px;height:850px`;frame.srcdoc=markup;let app;
    try {
      await new Promise(r=>{frame.onload=r;document.querySelector('#view').append(frame)});
      const doc=frame.contentDocument;app=new App({document:doc,handlebars:frame.contentWindow.Handlebars,pageUrl:location.origin+'/?test=true',config:{testSnapshotUrl:'/tests/browser/details.json'}});
      assert((await app.start()).type==='ready','fixture loads');
      app.selectAccount(app.nodes.get('details-bank'));await wait(()=>doc.querySelector('[data-entry-id="filler-99"]'));
      app.requestPage(2);await wait(()=>doc.querySelector('[data-entry-id="paycheck"]'));
      const trigger=id=>[...doc.querySelectorAll(`.category-details[data-entry-id="${id}"]`)].find(n=>n.getBoundingClientRect().width);
      for(const light of [true,false]) {
        app.toggleTheme(light);const button=trigger('paycheck');button.focus();button.click();
        await wait(()=>doc.querySelectorAll('.details-allocation').length===7);
        assert(doc.getElementById('details-amount').textContent==='$2,000.00','header net');
        assert(doc.getElementById('details-total').textContent==='$2,000.00','footer net');
        assert(doc.querySelectorAll('.details-tags').length===0,'empty tags omitted');
        const money=[...doc.querySelectorAll('.details-allocation .details-money')].map(n=>n.getBoundingClientRect().right);
        assert(money.every(x=>Math.abs(x-money[0])<1),'right aligned amounts');
        assert(doc.getElementById('split-details').getBoundingClientRect().right<=width,'dialog fits');
        doc.getElementById('details-close').click();assert(doc.activeElement===button,'trigger focus restored');assert(app.page===2,'page retained');
      }
      trigger('repeated').click();await wait(()=>doc.querySelectorAll('.details-allocation').length===2);
      assert(!doc.querySelector('#details-body img'),'memo escaped');assert(doc.querySelector('.details-memo').textContent.includes('<img'),'literal memo');
      assert(doc.querySelectorAll('.details-memo').length===1,'empty memo omitted');
      doc.getElementById('split-details').dispatchEvent(new frame.contentWindow.Event('cancel',{cancelable:true}));
      assert(!doc.getElementById('split-details').open,'Escape cancel closes');
      trigger('legacy').click();await wait(()=>doc.getElementById('details-total').textContent==='Unavailable');
      assert(doc.getElementById('details-body').textContent.includes('-$42.00'),'excluded known amount retained');app.closeDetails();
      trigger('many').click();await wait(()=>doc.querySelectorAll('.details-allocation').length===12);
      const body=doc.getElementById('details-body');assert(body.scrollHeight>body.clientHeight,'bounded scroll');app.closeDetails();
      trigger('paycheck').click();app.closeDetails();await new Promise(r=>setTimeout(r,150));assert(!doc.getElementById('split-details').open,'late reply cannot reopen');
      const search=doc.getElementById('search-input');search.value='Uncategorized';search.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));
      await wait(()=>trigger('empty'));trigger('empty').click();await wait(()=>doc.querySelector('.details-empty'));
      assert(doc.getElementById('details-total').textContent==='Unavailable','empty total unavailable');app.closeDetails();
      assert(search.value==='Uncategorized'&&app.searchText==='Uncategorized','search context preserved');
      search.value='';search.dispatchEvent(new frame.contentWindow.Event('input',{bubbles:true}));
      app.selectAccount(app.nodes.get('rainy'));await wait(()=>trigger('rainy-entry'));trigger('rainy-entry').click();
      await wait(()=>doc.querySelectorAll('.details-allocation').length===1);
      assert(doc.getElementById('details-total').textContent==='-$1,000.00','selected split only');app.closeDetails();
      report(`PASS US3 ${width}px: paycheck, alignment, themes, literal/empty fields, unavailable total, dismissal and late replies`);
    } finally {app?.dispose();frame.remove()}
  }
}
