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
  await mkdir(join(root, 'tests/fixtures'), { recursive: true });
  await writeFile(join(root, 'tests/fixtures/hidden-ancestor-v1.json'), '{"synthetic":true}');
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
    assert.equal((await get('/data/snapshot.json')).status, 404);
    assert.equal((await get('/data/test-snapshot.json?test=true')).body, '{"test":true}');
    assert.equal((await get('/tests/browser/hidden-ancestor.json')).body, '{"synthetic":true}');
    assert.equal((await get('/tests/fixtures/hidden-ancestor-v1.json')).status, 404);
    await writeFile(join(root, 'UI/data/snapshot.json'), '{"real":true}');
    assert.equal((await get('/data/snapshot.json')).body, '{"real":true}');
    assert.equal((await get('/data/snapshot.json', 'HEAD')).body, '');
    assert.equal((await get('/data/snapshot.json')).headers['cache-control'], 'no-store');
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
