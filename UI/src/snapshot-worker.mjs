import { validateSnapshot, validDate, visibleAccounts } from './snapshot.mjs';

// The same handler runs in a browser Worker and in isolated Node worker tests.
export function createSnapshotHandler({ postMessage, baseUrl, fetchSnapshot = fetch }) {
  let attempted = false, disposed = false, model = null;
  const controller = new AbortController();
  const error = (requestId, code, message, reason) => {
    if (!disposed) postMessage({ type: 'error', requestId, code, message, ...(reason ? { reason } : {}) });
  };
  return async message => {
    if (disposed) return;
    if (message?.type === 'dispose') { disposed = true; controller.abort(); model = null; return; }
    const requestId = message?.requestId;
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      error(null, 'INVALID_QUERY', 'Invalid request ID.'); return;
    }
    if (message.type !== 'load') {
      // Register and search queries are implemented by T020/T025, not this foundation.
      error(requestId, 'INVALID_QUERY', model ? 'Query handler is not implemented yet.' : 'Snapshot is not ready.'); return;
    }
    if (attempted) { error(requestId, 'LOAD_FAILED', 'Reload the page to load a snapshot again.'); return; }
    attempted = true;
    let url;
    try {
      if (typeof message.url !== 'string') throw new Error();
      url = new URL(message.url, baseUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== new URL(baseUrl).origin || url.username || url.password) throw new Error();
    } catch { error(requestId, 'LOAD_FAILED', 'Snapshot URL must be same-origin HTTP or HTTPS.'); return; }
    if (!validDate(message.effectiveDate)) { error(requestId, 'INVALID_SNAPSHOT', 'Invalid page-load date.'); return; }
    let response;
    try {
      response = await fetchSnapshot(url.href, { cache: 'no-store', redirect: 'error', credentials: 'same-origin', signal: controller.signal });
    } catch { error(requestId, 'LOAD_FAILED', 'Unable to download the snapshot.'); return; }
    if (!response.ok) {
      error(requestId, 'LOAD_FAILED', response.status === 404 ? 'Snapshot file is missing.' : 'Unable to download the snapshot.', response.status === 404 ? 'NOT_FOUND' : undefined); return;
    }
    try {
      const data = JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
      if (disposed) return;
      model = validateSnapshot(data);
      if (message.effectiveDate < data.balanceStartDate) {
        model = null; error(requestId, 'INVALID_SNAPSHOT', 'Page-load date is before snapshot balance coverage.'); return;
      }
      postMessage({ type: 'ready', requestId,
        metadata: { exportDate: data.exportDate, effectiveDate: message.effectiveDate, sourceVersion: data.sourceVersion },
        accounts: visibleAccounts(model, message.effectiveDate), totalCount: model.entries.length });
    } catch (failure) {
      model = null;
      const version = failure.code === 'UNSUPPORTED_VERSION';
      error(requestId, version ? failure.code : 'INVALID_SNAPSHOT', version ? 'Unsupported snapshot version; re-export from Moneydance.' : 'Snapshot validation failed.');
    }
  };
}

if (typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope) {
  const handle = createSnapshotHandler({ postMessage: message => globalThis.postMessage(message), baseUrl: globalThis.location.href });
  globalThis.onmessage = event => { void handle(event.data); };
}
