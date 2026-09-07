import '../config.js';

export function localPageDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function createSnapshotClient({ onMessage, pageUrl = globalThis.location.href,
  config = globalThis.MONEYDANCE_CONFIG, now = new Date(),
  workerFactory = () => new Worker(new URL('./snapshot-worker.mjs', import.meta.url), { type: 'module' }) } = {}) {
  if (typeof onMessage !== 'function') throw new TypeError('onMessage is required');
  const page = new URL(pageUrl);
  const testMode = page.searchParams.get('test') === 'true';
  const effectiveDate = localPageDate(now);
  let worker, loaded = false, ready = false, disposed = false, sequence = 0, currentRequest = 0;
  const workerFailed = () => {
    if (!disposed) onMessage({ type: 'error', requestId: currentRequest, code: 'WORKER_FAILED', message: 'Snapshot worker failed. Reload the page to retry.' });
    disposed = true; worker?.terminate();
  };
  const send = message => {
    currentRequest = ++sequence;
    try { worker.postMessage({ ...message, requestId: currentRequest }); } catch { workerFailed(); }
    return currentRequest;
  };
  return {
    testMode, effectiveDate,
    load() {
      if (loaded || disposed) throw new Error('Reload the page to load again.');
      loaded = true;
      let url;
      try {
        url = new URL(testMode ? config.testSnapshotUrl : config.snapshotUrl, page);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== page.origin || url.username || url.password) throw new Error();
      } catch {
        onMessage({ type: 'error', requestId: ++sequence, code: 'LOAD_FAILED', message: 'Snapshot URL must be same-origin HTTP or HTTPS.' }); return;
      }
      try {
        worker = workerFactory();
        worker.onmessage = event => {
          if (!disposed && event.data?.requestId === currentRequest) {
            if (event.data.type === 'ready') ready = true;
            onMessage(event.data);
          }
        };
        worker.onerror = event => { event.preventDefault?.(); workerFailed(); };
        worker.onmessageerror = workerFailed;
      } catch { workerFailed(); return; }
      return send({ type: 'load', url: url.href, effectiveDate });
    },
    // UI integration and querying follow in the story phases. No new load occurs.
    query({ accountId = null, text = '', page = 1, pageSize = 100 } = {}) {
      if (!worker || disposed || !ready) throw new Error('Snapshot is not ready.');
      return send({ type: 'query', accountId, text, page, pageSize });
    },
    dispose() {
      if (disposed) return;
      disposed = true; worker?.terminate(); worker = null;
    }
  };
}
