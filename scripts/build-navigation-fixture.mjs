// Synthetic-only public acceptance files. No UI/data reads or configuration edits.
import { writeFile } from 'node:fs/promises';
import { randomBytes, pbkdf2Sync, createCipheriv } from 'node:crypto';
import { navigationFixture } from '../tests/fixtures/navigation-fixture.mjs';
import { validateSnapshot } from '../UI/src/snapshot.mjs';
const snapshot = navigationFixture();
validateSnapshot(snapshot);
const json = JSON.stringify(snapshot, null, 2) + '\n';
await writeFile(new URL('../tests/fixtures/navigation-v1.json', import.meta.url), json);
const header = Buffer.concat([Buffer.from('MDSNAP01'), Buffer.from([1]), randomBytes(16), randomBytes(12)]);
const key = pbkdf2Sync('synthetic-password', header.subarray(9, 25), 600000, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, header.subarray(25));
cipher.setAAD(header);
const encrypted = Buffer.concat([header, cipher.update(json, 'utf8'), cipher.final(), cipher.getAuthTag()]);
key.fill(0);
await writeFile(new URL('../tests/fixtures/navigation-v1.enc', import.meta.url), encrypted);
console.log('Synthetic navigation fixtures generated: 212 entries; password synthetic-password.');
