export const MAX_ENVELOPE = 134217781;
export function parseEnvelope(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 53 || bytes.length > MAX_ENVELOPE ||
      ![77,68,83,78,65,80,48,49].every((b,i)=>bytes[i]===b) || bytes[8] !== 1)
    throw new Error('INVALID_ENVELOPE');
  return bytes;
}
export async function readEnvelope(response) {
  if (Number(response.headers?.get('content-length')) > MAX_ENVELOPE) { await response.body?.cancel(); throw new Error('INVALID_ENVELOPE'); }
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_ENVELOPE) throw new Error('INVALID_ENVELOPE');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(()=>{}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset=0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
  return parseEnvelope(bytes);
}
export async function decryptEnvelope(bytes, password) {
  parseEnvelope(bytes);
  if (typeof password !== 'string' || !password.trim() || /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(password))
    throw new Error('AUTHENTICATION_FAILED');
  const encoded = new TextEncoder().encode(password);
  let source;
  try { source = await crypto.subtle.importKey('raw',encoded,'PBKDF2',false,['deriveKey']); }
  finally { encoded.fill(0); }
  const key = await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt:bytes.subarray(9,25),iterations:600000},source,{name:'AES-GCM',length:256},false,['decrypt']);
  return crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.subarray(25,37),additionalData:bytes.subarray(0,37),tagLength:128},key,bytes.subarray(37));
}
