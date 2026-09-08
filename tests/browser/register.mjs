import { App } from '/app.js';
const assert = (value, message) => { if (!value) throw new Error(message); };
const waitFor = (doc, step, predicate) => new Promise((resolve, reject) => {
  if (predicate()) return resolve();
  const observer = new MutationObserver(() => { if (predicate()) { clearTimeout(timer); observer.disconnect(); resolve(); } });
  const timer = setTimeout(() => { observer.disconnect(); reject(new Error(`Register timeout during ${step}. Visible rows: ${doc.querySelectorAll('tr[data-entry-id]').length}; transaction count: ${doc.querySelector('#total-transactions').textContent}; status: ${doc.querySelector('#load-status').hidden ? doc.querySelector('#register-status').textContent : doc.querySelector('#load-status').textContent}`)); }, 10000);
  observer.observe(doc.body, { subtree: true, childList: true, attributes: true, characterData: true });
});
export async function run(report) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:412px;height:850px;border:1px solid #ccc';
  const markup = (await (await fetch('/index.html')).text()).replace('<head>', '<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/, '');
  frame.srcdoc = markup;
  await new Promise(resolve => { frame.onload = resolve; document.querySelector('#view').append(frame); });
  const doc = frame.contentDocument;
  const app = new App({ document: doc, handlebars: frame.contentWindow.Handlebars,
    pageUrl: location.origin + '/?test=true', config: { testSnapshotUrl: '/tests/browser/register-pages.json' } });
  try {
    const loaded = await app.start();
    if (loaded.type !== 'ready') {
      const hint = loaded.reason === 'NOT_FOUND'
        ? ' Restart the local server (Ctrl+C, then npm run serve) to enable /tests/browser/register-pages.json. If still missing, run npm run fixtures.' : '';
      throw new Error(`Register fixture load failed: ${loaded.code}. ${loaded.message}${hint}`);
    }
    report('PASS register fixture loaded');
    const rows = () => [...doc.querySelectorAll('tr[data-entry-id]')];
    await waitFor(doc, 'initial current/past register', () => rows().length === 13);
    doc.querySelector('[data-id="register-pages"]').click();
    await waitFor(doc, 'future summary', () => !doc.querySelector('#future-summary').hidden && doc.querySelector('#future-summary').textContent.includes('205 Future Transactions: +$205.00'));
    assert(rows().length === 0, 'future-only register starts hidden');
    doc.querySelector('#future-summary').click();
    await waitFor(doc, 'future reveal', () => doc.querySelector('#total-transactions').textContent === '205');
    assert(rows()[0].dataset.entryId === 'register-204', 'latest future row first');
    assert(doc.querySelector('.sticky-year').colSpan === 3, 'year spans only visible mobile columns');
    const tableRight = doc.querySelector('#transactions-table').getBoundingClientRect().right;
    const amountRight = rows()[0].querySelector('td.amount-col').getBoundingClientRect().right;
    assert(Math.abs(tableRight - amountRight) < 3, 'mobile rows use full table width without phantom columns');
    assert(frame.contentWindow.getComputedStyle(rows()[0]).backgroundColor !== 'rgba(0, 0, 0, 0)', 'future row has background tint');
    assert(rows()[0].textContent.includes('0007'), 'supplied check number');
    assert(rows()[0].textContent.includes('Uncategorized'), 'empty allocations');
    assert(rows()[1].textContent.includes('Checking'), 'single allocation');
    assert(rows()[2].textContent.includes('Split'), 'multiple allocations');
    assert(rows()[0].textContent.includes('Full memo & details'), 'full memo');
    assert(!rows()[0].querySelector('not'), 'escaped transaction text');
    const balance = rows()[0].querySelector('.mobile-running-balance');
    assert(frame.contentWindow.getComputedStyle(balance).display !== 'none' && balance.textContent.includes('$328.45'), 'mobile running balance visible');
    const sidebarBalance = doc.querySelector('#total-balance').textContent;
    doc.querySelector('#next-page').click();
    await waitFor(doc, 'page 2', () => doc.querySelector('#page-info').textContent === 'Page 2 of 3');
    assert(rows()[0].dataset.entryId === 'register-104', 'second page correct');
    doc.querySelector('#next-page').click();
    await waitFor(doc, 'page 3', () => rows().length === 5);
    assert(doc.querySelector('#next-page').disabled, 'last page disables next');
    assert(rows().at(-1).textContent.includes('$124.45'), 'opening plus first entry balance');
    assert(doc.querySelector('#total-balance').textContent === sidebarBalance, 'paging preserves sidebar');
    doc.querySelector('[data-id="00000000-0000-4000-8000-000000000002"]').click();
    await waitFor(doc, 'empty parent register', () => !doc.querySelector('#no-results').classList.contains('hidden'));
    assert(rows().length === 0, 'parent has no direct entries');
    doc.querySelector('[data-id=""]').click();
    await waitFor(doc, 'return to All Accounts', () => doc.querySelector('#total-transactions').textContent === '13');
    assert(rows().length === 13 && doc.querySelector('#balance-card').hidden, 'All Accounts restored');
    // Rapid account changes must render only the final choice.
    doc.querySelector('[data-id="register-pages"]').click();
    doc.querySelector('[data-id="00000000-0000-4000-8000-000000000006"]').click();
    await waitFor(doc, 'rapid account switching', () => doc.querySelector('#total-transactions').textContent === '3');
    assert(rows().every(r => r.dataset.accountId.endsWith('000006')), 'no stale register');
    report('PASS register DOM: paging, direct scope, future dates, categories, checks, memo, escaped text, mobile balance, stale replies');
  } finally { app.dispose(); }
}
