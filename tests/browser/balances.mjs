import { App } from '/app.js';
import { createSnapshotClient } from '/src/worker-client.mjs';
const assert = (value, message) => { if (!value) throw new Error(message); };
const config = { snapshotUrl: '/tests/browser/missing.json', testSnapshotUrl: '/data/test-snapshot.json' };
export async function run(report) {
  async function clientCase(params, cfg, expected) {
    let client;
    try {
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Worker timeout')), 10000);
        client = createSnapshotClient({ pageUrl: location.origin + '/' + params, config: cfg,
          onMessage: msg => { clearTimeout(timer); resolve(msg); } });
        client.load();
      });
      assert(result.type === expected.type && (!expected.reason || result.reason === expected.reason), 'worker/client result');
      if (expected.code) assert(result.code === expected.code, 'error code');
    } finally { client?.dispose(); }
  }
  await clientCase('?test=true', config, { type: 'ready' });
  await clientCase('?test=false', config, { type: 'error', code: 'LOAD_FAILED', reason: 'NOT_FOUND' });
  await clientCase('?test=true', { snapshotUrl: '/data/test-snapshot.json', testSnapshotUrl: '/tests/browser/missing.json' }, { type: 'error', reason: 'NOT_FOUND' });
  await clientCase('?test=true', { snapshotUrl: '/data/test-snapshot.json', testSnapshotUrl: '/tests/browser/index.html' }, { type: 'error', code: 'INVALID_SNAPSHOT' });
  report('PASS real worker/client: exact test selection, missing real/test, invalid test, no fallback');
  const frame = document.createElement('iframe');
  frame.style.cssText = 'width:100%;height:750px;border:1px solid #ccc';
  // Reuse the real app markup and templates; the harness owns its controller.
  const markup = (await (await fetch('/index.html')).text()).replace('<head>', '<head><base href="/">')
    .replace(/<script type="module" src="app.js"><\/script>/, '');
  frame.srcdoc = markup;
  await new Promise(resolve => { frame.onload = resolve; document.querySelector('#view').append(frame); });
  const doc = frame.contentDocument;
  let app = new App({ document: doc, handlebars: frame.contentWindow.Handlebars,
    pageUrl: location.origin + '/?other=kept#anchor', config });
  await app.start();
  assert(doc.querySelector('#load-status').textContent.includes('missing'), 'missing file message');
  const link = new URL(doc.querySelector('#test-data-link').href);
  assert(link.searchParams.get('other') === 'kept' && link.searchParams.get('test') === 'true' && link.hash === '#anchor', 'preserve navigation parameters');
  assert(!doc.querySelector('.account-header'), 'no stale accounts on failure');
  app.dispose();
  app = new App({ document: doc, handlebars: frame.contentWindow.Handlebars, pageUrl: link.href, config });
  await app.start();
  assert(!doc.querySelector('#test-data-indicator').hidden, 'test indicator');
  assert(doc.querySelector('#balance-card').hidden && doc.querySelector('#mobile-balance-bar').hidden, 'All Accounts has no summary');
  assert(!doc.querySelector('[data-id=""] .account-balance'), 'All Accounts has no sidebar total');
  const checking = [...doc.querySelectorAll('.account-header')].find(n => n.textContent.includes('Checking'));
  assert(checking, 'Checking accessible');
  checking.click();
  assert(doc.querySelector('#total-balance').textContent === '$1,045.00', 'Checking source recursive total');
  assert(doc.querySelector('#mobile-total-balance').textContent === '$1,045.00', 'mobile total');
  assert(!doc.querySelector('#balance-card').hidden, 'selected balance visible');
  const calls = frame.contentWindow.performance.getEntriesByType('resource').filter(r => /snapshot\.json/.test(r.name));
  assert(calls.length === 0, 'main thread never downloads full records');
  for (const header of doc.querySelectorAll('.account-header')) header.click();
  doc.querySelector('[data-id=""]').click();
  assert(doc.querySelector('#balance-card').hidden, 'All Accounts restored');
  report('PASS real app DOM: missing link, test indicator, account selection, $1,045, no All Accounts total');
  app.dispose();
  app = new App({ document: doc, handlebars: frame.contentWindow.Handlebars,
    pageUrl: location.origin + '/?test=true',
    config: { ...config, testSnapshotUrl: '/tests/browser/hidden-ancestor.json' } });
  await app.start();
  assert(!doc.querySelector('[data-id="hidden-parent"]'), 'hidden ancestor is not selectable');
  const descendant = doc.querySelector('[data-id="active-descendant"]');
  assert(descendant, 'active descendant remains accessible');
  descendant.click();
  assert(doc.querySelector('#total-balance').textContent === '$2.50', 'active descendant balance');
  const parent = [...doc.querySelectorAll('.account-header')].find(n => n.querySelector('.account-name').textContent === 'Checking');
  parent.click();
  assert(doc.querySelector('#total-balance').textContent === '$1,052.50', 'hidden contribution counted once');
  report('PASS hidden hierarchy DOM: active descendant accessible, excluded ancestor absent, source parent total');
  app.dispose();
}
