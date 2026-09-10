// Synthetic known-answer generator using Node/OpenSSL, independently checked
// against Web Crypto and Moneydance's JCA. Never use fixed randomness in delivery.
import { pbkdf2Sync, createCipheriv } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const passwords = ['synthetic-password', 'caf\u00e9', 'cafe\u0301', 'emoji-\u{1f642}', ' spaces ', 'a'.repeat(200)];
const salt = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
const iv = Buffer.from('101112131415161718191a1b', 'hex');
const header = Buffer.concat([Buffer.from('MDSNAP01'), Buffer.from([1]), salt, iv]);
const plaintext = Buffer.from('{"synthetic":"Envelope interoperability only"}');
const vectors = passwords.map((password, index) => {
  const key = pbkdf2Sync(Buffer.from(password, 'utf8'), salt, 600000, 32, 'sha256');
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  return { id: index + 1, password, keyHex: key.toString('hex'), envelopeHex: Buffer.concat([header, body]).toString('hex') };
});
writeFileSync(new URL('./vectors.json', import.meta.url), JSON.stringify({ plaintextHex: plaintext.toString('hex'), vectors }, null, 2) + '\n');
