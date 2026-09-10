import { readEnvelope, decryptEnvelope } from './encrypted-snapshot.mjs';
import { validateSnapshot, validDate, visibleAccounts } from './snapshot.mjs';
import { createRegisterQuery } from './query.mjs';

// The same handler runs in a browser Worker and in isolated Node worker tests.
export function createSnapshotHandler({ postMessage, baseUrl, fetchSnapshot = fetch }) {
  let attempted = false, disposed = false, model = null, query = null;
  let latestQuery = 0, ciphertext = null, unlocking = false, effectiveDate;
  const controller = new AbortController();
  const error = (requestId, code, message, reason) => {
    if (!disposed) postMessage({ type: 'error', requestId, code, message, ...(reason ? { reason } : {}) });
  };
  const accept = (data, requestId) => {
      model = validateSnapshot(data);
      if (effectiveDate < data.balanceStartDate) {
        model = null; ciphertext = null; error(requestId, 'INVALID_SNAPSHOT', 'Page-load date is before snapshot balance coverage.'); return;
      }
      query = createRegisterQuery(model, effectiveDate);
      postMessage({ type: 'ready', requestId,
        metadata: { exportDate: data.exportDate, effectiveDate: effectiveDate, sourceVersion: data.sourceVersion },
        accounts: visibleAccounts(model, effectiveDate), totalCount: model.entries.length });
      ciphertext = null;
  };
  return async message => {
    if (disposed) return;
    if (message?.type === 'dispose') { disposed = true; controller.abort(); model = null; query = null; ciphertext = null; return; }
    const requestId = message?.requestId;
    if (!Number.isSafeInteger(requestId) || requestId < 1) {
      error(null, 'INVALID_QUERY', 'Invalid request ID.'); return;
    }
    if (message.type === 'unlock') {
      if (!ciphertext || unlocking) { error(requestId,'INVALID_QUERY','Snapshot is not ready for unlock.'); return; }
      unlocking = true;
      let plaintext;
      try {
        try { plaintext = await decryptEnvelope(ciphertext,message.password); }
        catch {
          if (!disposed) postMessage({type:'unlockError',requestId,code:'AUTHENTICATION_FAILED',message:'Unable to unlock. Check your password; the file may also be damaged.'});
          return;
        }
        if (disposed) return;
        accept(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plaintext)),requestId);
      } catch { ciphertext=null; model=null; query=null; error(requestId,'INVALID_SNAPSHOT','Snapshot validation failed. Re-export from Moneydance.'); }
      finally { if (plaintext) new Uint8Array(plaintext).fill(0); message.password=undefined; unlocking=false; }
      return;
    }
    if (message.type !== 'load') {
      if (message.type !== 'query' || !query) {
        error(requestId, 'INVALID_QUERY', 'Snapshot is not ready or request is invalid.'); return;
      }
      latestQuery = requestId;
      const isCurrent = () => !disposed && latestQuery === requestId;
      try {
        const result = await query(message, { isCurrent });
        if (result && isCurrent()) postMessage({ type: 'page', requestId, ...result });
      } catch { if (isCurrent()) error(requestId, 'INVALID_QUERY', 'Unable to display this register.'); }
      return;
    }
    if (attempted) { error(requestId, 'LOAD_FAILED', 'Reload the page to load a snapshot again.'); return; }
    attempted = true;
    if (!['encrypted','test'].includes(message.mode)) { error(requestId,'LOAD_FAILED','Invalid snapshot mode.'); return; }
    effectiveDate = message.effectiveDate;
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
      if (message.mode === 'encrypted') {
        if (!globalThis.crypto?.subtle) { error(requestId,'LOAD_FAILED','Secure browser cryptography is unavailable. Use HTTPS.'); return; }
        const bytes = await readEnvelope(response);
        if (!disposed) { ciphertext=bytes; postMessage({type:'locked',requestId}); }
        return;
      }
      const data = JSON.parse((await response.text()).replace(/^\uFEFF/, ''));
      if (disposed) return;
      accept(data, requestId);
    } catch (failure) {
      model = null;
      query = null;
      if (message.mode === 'encrypted') { error(requestId,'INVALID_ENVELOPE','Invalid or unsupported encrypted snapshot. Re-export from Moneydance.'); return; }
      const version = failure.code === 'UNSUPPORTED_VERSION';
      error(requestId, version ? failure.code : 'INVALID_SNAPSHOT', version ? 'Unsupported snapshot version; re-export from Moneydance.' :
        failure.field === 'exportDate' ? 'Missing or invalid export timestamp. Re-export from Moneydance.' : 'Snapshot validation failed. Re-export from Moneydance.');
    }
  };
}

if (typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope) {
  const handle = createSnapshotHandler({ postMessage: message => globalThis.postMessage(message), baseUrl: globalThis.location.href });
  globalThis.onmessage = event => { void handle(event.data); };
}
