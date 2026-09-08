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
    if (disposed) return;
    disposed = true; ready = false; worker?.terminate();
    onMessage({ type: 'error', requestId: currentRequest, code: 'WORKER_FAILED', message: 'Snapshot worker failed.' });
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
        const selected = testMode ? config.testSnapshotUrl : config.snapshotUrl;
        if (typeof selected !== 'string' || !selected.trim()) throw new Error();
        url = new URL(selected, page);
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== page.origin || url.username || url.password) throw new Error();
      } catch {
        onMessage({ type: 'error', requestId: ++sequence, code: 'LOAD_FAILED', message: 'Snapshot URL must be same-origin HTTP or HTTPS.' }); return;
      }
      try {
        worker = workerFactory();
        worker.onmessage = event => {
          if (!disposed && event.data?.requestId === currentRequest) {
            if (event.data.type === 'ready') ready = true;
            if (event.data.type === 'error') { ready = false; disposed = true; worker.terminate(); }
            onMessage(event.data);
          }
        };
        worker.onerror = event => { event.preventDefault?.(); workerFailed(); };
        worker.onmessageerror = workerFailed;
      } catch { workerFailed(); return; }
      return send({ type: 'load', url: url.href, effectiveDate });
    },
    // Invalidate immediately on input, before the debounced request is sent.
    invalidatePending() { if (ready && !disposed) currentRequest = ++sequence; },
    query({ accountId = null, text = '', page = 1, pageSize = 100, includeFuture = false } = {}) {
      if (!worker || disposed || !ready) throw new Error('Snapshot is not ready.');
      return send({ type: 'query', accountId, text, page, pageSize, includeFuture });
    },
    dispose() {
      if (disposed) return;
      disposed = true; worker?.terminate(); worker = null;
    }
  };
}
