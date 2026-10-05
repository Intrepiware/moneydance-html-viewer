import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { createViewerServer } from '../../scripts/serve-ui.mjs';

test('server isolates selected snapshots and refuses private paths/traversal', async () => {
  const root = await mkdtemp(join(tmpdir(), 'moneydance-server-'));
  await mkdir(join(root, 'UI/data'), { recursive: true });
  await writeFile(join(root, 'UI/index.html'), '<h1>Fixture</h1>');
  await writeFile(join(root, 'UI/data/test-snapshot.json'), '{"test":true}');
  await writeFile(join(root, 'UI/data/private.json'), 'never serve');
  await mkdir(join(root, 'UI/assets/icons'), { recursive: true });
  await writeFile(join(root, 'UI/assets/icons/checkbook.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
  await writeFile(join(root, 'UI/assets/icons/private.json'), 'never serve');
  await mkdir(join(root, 'tests/fixtures'), { recursive: true });
  await writeFile(join(root, 'tests/fixtures/valid-snapshot-v1.json'), '{"baseline":true}');
  await writeFile(join(root, 'tests/fixtures/tags-v1.json'), '{"tagsFixture":true}');
  await writeFile(join(root, 'tests/fixtures/browsing-allocations-v1.json'), '{"detailsFixture":true}');
  await writeFile(join(root, 'tests/fixtures/navigation-v1.json'), '{"navigationFixture":true}');
  await writeFile(join(root, 'tests/fixtures/category-periods-v1.json'), '{"categoryFixture":true}');
  await writeFile(join(root, 'tests/fixtures/navigation-v1.enc'), 'synthetic encrypted fixture');
  await writeFile(join(root, 'tests/fixtures/hidden-ancestor-v1.json'), '{"synthetic":true}');
  await writeFile(join(root, 'tests/fixtures/register-pages-v1.json'), '{"register":true}');
  await writeFile(join(root, 'tests/fixtures/empty-snapshot-v1.json'), '{"empty":true}');
  const server = createViewerServer({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const get = (path, method = 'GET') => new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port: server.address().port, path, method }, res => {
      let body = ''; res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    }); req.on('error', reject); req.end();
  });
  try {
    assert.equal((await get('/')).status, 200);
    const icon = await get('/assets/icons/checkbook.svg');
    assert.equal(icon.status, 200);
    assert.equal(icon.headers['content-type'], 'image/svg+xml');
    assert.equal(icon.body, '<svg xmlns="http://www.w3.org/2000/svg"/>');
    assert.equal((await get('/assets/icons/checkbook.svg', 'HEAD')).body, '');
    for (const path of ['/assets/icons/private.json', '/assets/icons/missing.svg', '/assets/other.svg'])
      assert.equal((await get(path)).status, 404);
    for (const path of ['/assets/icons/../private.svg', '/assets/icons/%2e%2e/private.svg', '/assets/icons/%5cprivate.svg'])
      assert.equal((await get(path)).status, 400);
    assert.equal((await get('/data/snapshot.enc')).status, 404);
    assert.equal((await get('/data/test-snapshot.json?test=true')).body, '{"test":true}');
    const baseline = await get('/tests/browser/baseline.json');
    assert.equal(baseline.status, 200);
    assert.equal(baseline.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(baseline.body, '{"baseline":true}');
    await writeFile(join(root, 'UI/data/test-snapshot.json'), '{"customDemo":true}');
    assert.equal((await get('/tests/browser/baseline.json')).body, '{"baseline":true}');
    assert.equal((await get('/data/test-snapshot.json')).body, '{"customDemo":true}');
    assert.equal((await get('/tests/fixtures/valid-snapshot-v1.json')).status, 404);
    const tags = await get('/tests/browser/tags.json');
    assert.equal((await get('/tests/browser/details.json')).body, '{"detailsFixture":true}');
    assert.equal((await get('/tests/browser/navigation.json')).body, '{"navigationFixture":true}');
    const encryptedNavigation = await get('/tests/browser/navigation.enc');
    assert.equal(encryptedNavigation.body, 'synthetic encrypted fixture');
    assert.equal(encryptedNavigation.headers['content-type'], 'application/octet-stream');
    assert.equal((await get('/tests/fixtures/navigation-v1.json')).status, 404);
    assert.equal(tags.status, 200);
    assert.equal(tags.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(tags.body, '{"tagsFixture":true}');
    assert.equal((await get('/tests/fixtures/tags-v1.json')).status, 404);
    assert.equal((await get('/tests/browser/categories.json')).body, '{"categoryFixture":true}');
    assert.equal((await get('/tests/fixtures/category-periods-v1.json')).status, 404);
    assert.equal((await get('/tests/browser/hidden-ancestor.json')).body, '{"synthetic":true}');
    assert.equal((await get('/tests/browser/register-pages.json')).body, '{"register":true}');
    assert.equal((await get('/tests/browser/loading-fixtures/empty.json')).body, '{"empty":true}');
    assert.equal((await get('/tests/browser/loading-fixtures/unknown.json')).status, 404);
    assert.equal((await get('/tests/fixtures/hidden-ancestor-v1.json')).status, 404);
    await writeFile(join(root, 'UI/data/snapshot.enc'), '{"real":true}');
    assert.equal((await get('/data/snapshot.enc')).body, '{"real":true}');
    assert.equal((await get('/data/snapshot.enc', 'HEAD')).body, '');
    assert.equal((await get('/data/snapshot.enc')).headers['cache-control'], 'no-store');
    for (const path of ['/data/private.json', '/.git/config', '/export_json.py', '/data.json']) {
      assert.equal((await get(path)).status, 404);
    }
    for (const path of ['/src/../data/private.json', '/src/%2e%2e/data/private.json', '/src/%5c..%5cprivate.mjs', '/%00', '/%ZZ']) {
      assert.equal((await get(path)).status, 400);
    }
    assert.equal((await get('/', 'POST')).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await rm(root, { recursive: true, force: true });
  }
});
