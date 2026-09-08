import { startViewer } from '/app.js';
const assert = (value, message) => { if (!value) throw new Error(message); };
const waitFor = (doc, step, predicate) => new Promise((resolve, reject) => {
  if (predicate()) return resolve();
  const observer = new MutationObserver(() => {
    if (predicate()) { clearTimeout(timer); observer.disconnect(); resolve(); }
  });
  const timer = setTimeout(() => { observer.disconnect(); reject(new Error('Lifecycle timeout: ' + step)); }, 10000);
  observer.observe(doc.body, { subtree: true, childList: true, attributes: true, characterData: true });
});

export async function run(report) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:412px;height:850px';
  frame.srcdoc = (await (await fetch('/index.html')).text()).replace('<head>', '<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/, '');
  await new Promise(resolve => { frame.onload = resolve; document.querySelector('#view').append(frame); });
  const win = frame.contentWindow, doc = frame.contentDocument;
  let downloads = 0, terminations = 0, workers = 0;
  const app = startViewer({ document: doc, handlebars: win.Handlebars,
    pageUrl: location.origin + '/?test=true', config: { testSnapshotUrl: '/tests/browser/register-pages.json' },
    workerFactory: () => {
      workers++;
      const worker = new Worker('/tests/browser/loading-worker.mjs', { type: 'module' });
      worker.addEventListener('message', event => { downloads = event.data.testFetchCount; });
      const terminate = worker.terminate.bind(worker);
      worker.terminate = () => { terminations++; terminate(); };
      return worker;
    } });
  const transition = (name, persisted) => win.dispatchEvent(new win.PageTransitionEvent(name, { persisted }));
  try {
    await waitFor(doc, 'initial rows', () => doc.querySelectorAll('tr[data-entry-id]').length === 13);
    const cutoff = app.metadata.effectiveDate, footer = doc.querySelector('#as-of-date').textContent;
    // Exercise the production bootstrap's lifecycle listener, not a test substitute.
    // These events simulate cache transitions; real history restoration is a separate manual check.
    for (let cycle = 0; cycle < 2; cycle++) {
      transition('pagehide', true);
      transition('pageshow', true);
      assert(terminations === 0 && !app.handles.signal.aborted, 'cached page remains live');
      doc.querySelector('[data-id="register-pages"]').click();
      await waitFor(doc, 'account selection', () => !doc.querySelector('#future-summary').hidden);
      doc.querySelector('#future-summary').click();
      await waitFor(doc, 'first page', () => doc.querySelector('#page-info').textContent === 'Page 1 of 3');
      doc.querySelector('#next-page').click();
      await waitFor(doc, 'next page', () => doc.querySelector('#page-info').textContent === 'Page 2 of 3');
      const search = doc.querySelector('#search-input');
      search.value = 'no-match-lifecycle';
      search.dispatchEvent(new win.Event('input', { bubbles: true }));
      await waitFor(doc, 'search', () => doc.querySelector('#total-transactions').textContent === '0');
      doc.querySelector('#clear-search').click();
      await waitFor(doc, 'clear', () => doc.querySelector('#total-transactions').textContent === '205');
      doc.querySelector('[data-id=""]').click();
      await waitFor(doc, 'All Accounts', () => doc.querySelectorAll('tr[data-entry-id]').length === 13);
      assert(app.metadata.effectiveDate === cutoff && doc.querySelector('#as-of-date').textContent === footer, 'session dates unchanged');
      assert(workers === 1 && downloads === 1, 'one worker and one snapshot download');
    }
    transition('pagehide', false);
    assert(terminations === 1 && app.handles.signal.aborted, 'final departure disposes app');
    transition('pagehide', false);
    assert(terminations === 1, 'cleanup listener removed after disposal');
    report('PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal');
  } finally { app.dispose(); frame.remove(); }
}
