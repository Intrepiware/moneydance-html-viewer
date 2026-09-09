// Test-only contract oracle; production parser/decryptor belongs to T022.
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
const fixture = JSON.parse(readFileSync(new URL('../fixtures/encryption/vectors.json', import.meta.url)));
const maxBytes = 134217781;
function parse(bytes) {
  if (bytes.length < 53 || bytes.length > maxBytes ||
      Buffer.from(bytes.subarray(0, 8)).toString() !== 'MDSNAP01' || bytes[8] !== 1) throw new Error('INVALID_ENVELOPE');
  return { salt: bytes.subarray(9,25), iv: bytes.subarray(25,37), additionalData: bytes.subarray(0,37), tagLength:128, name:'AES-GCM' };
}
async function keyFor(password, salt) {
  assert.ok(!/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(password), 'UNPAIRED_SURROGATE');
  const source = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await webcrypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations:600000},source,256);
  return {bits, key:await webcrypto.subtle.importKey('raw',bits,'AES-GCM',false,['decrypt'])};
}
test('known answers: OpenSSL to Web Crypto, exact Unicode passwords', async () => {
  for (const vector of fixture.vectors) {
    const bytes = Buffer.from(vector.envelopeHex,'hex'), params = parse(bytes);
    const {bits,key} = await keyFor(vector.password,params.salt);
    assert.equal(Buffer.from(bits).toString('hex'),vector.keyHex);
    assert.equal(Buffer.from(await webcrypto.subtle.decrypt(params,key,bytes.subarray(37))).toString('hex'),fixture.plaintextHex);
  }
});
test('contract rejects malformed framing, oversize and lone surrogates', async () => {
  const bytes = Buffer.from(fixture.vectors[0].envelopeHex,'hex');
  assert.throws(()=>parse(bytes.subarray(0,52)));
  for (const index of [0,8]) { const changed=Buffer.from(bytes); changed[index]^=1; assert.throws(()=>parse(changed)); }
  // No giant allocation: reject by length before touching content.
  assert.throws(()=>parse({length:maxBytes+1}));
  await assert.rejects(keyFor('\ud800',parse(bytes).salt));
});
test('authentication rejects wrong password, altered salt/IV/body/tag and appended/truncated body', async () => {
  const bytes=Buffer.from(fixture.vectors[0].envelopeHex,'hex'), params=parse(bytes);
  const {key}=await keyFor(fixture.vectors[0].password,params.salt);
  for (const offset of [9,25,37,bytes.length-1]) {
    const changed=Buffer.from(bytes); changed[offset]^=1;
    const p=parse(changed);
    const k=offset===9 ? (await keyFor(fixture.vectors[0].password,p.salt)).key : key;
    await assert.rejects(webcrypto.subtle.decrypt(p,k,changed.subarray(37)));
  }
  await assert.rejects(webcrypto.subtle.decrypt(params,(await keyFor('wrong',params.salt)).key,bytes.subarray(37)));
  for(const altered of [bytes.subarray(37,bytes.length-1),Buffer.concat([bytes.subarray(37),Buffer.from([0])])])
    await assert.rejects(webcrypto.subtle.decrypt(params,key,altered));
});
