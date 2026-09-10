import { createServer } from 'node:http';
import { open, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { parseArgs } from 'node:util';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.enc': 'application/octet-stream' };
const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('..\\') && !rel.startsWith('../') && !isAbsolute(rel);
};
const loadingFixtures = {
  'timestamp-missing.json': 'invalid-export-date-missing-v1.json',
  'timestamp-null.json': 'invalid-export-date-null-v1.json',
  'timestamp-type.json': 'invalid-export-date-wrong-type-v1.json',
  'timestamp-bad.json': 'invalid-export-date-malformed-v1.json',
  'empty.json': 'empty-snapshot-v1.json',
  'version.json': 'unsupported-version.json',
  'balance.json': 'invalid-balance-v1.json',
};

// Only the selected private snapshot and explicit public routes are exposed.
export function createViewerServer({ root = repo, snapshot = resolve(root, 'UI/data/snapshot.enc') } = {}) {
  return createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (code) => { res.writeHead(code); res.end(code === 404 ? 'Not found' : 'Request failed'); };
    if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); fail(405); return; }
    let path;
    try { path = decodeURIComponent(req.url.split('?')[0]); }
    catch { fail(400); return; }
    if (!path.startsWith('/') || /[\\\x00]/.test(path) || path.split('/').some(p => p === '.' || p === '..')) {
      fail(400); return;
    }
    let target, allowedRoot;
    if (path === '/data/snapshot.enc') {
      target = resolve(snapshot); // Explicitly selected CLI file may be outside the repository.
    } else if (path === '/data/test-snapshot.json') {
      allowedRoot = resolve(root, 'UI/data'); target = resolve(allowedRoot, 'test-snapshot.json');
    } else if (['/', '/index.html', '/app.js', '/styles.css', '/config.js'].includes(path)) {
      allowedRoot = resolve(root, 'UI'); target = resolve(allowedRoot, path === '/' ? 'index.html' : path.slice(1));
    } else if (path.startsWith('/src/') && ['.js', '.mjs'].includes(extname(path))) {
      allowedRoot = resolve(root, 'UI/src'); target = resolve(root, 'UI', path.slice(1));
    } else if (path === '/tests/browser/hidden-ancestor.json') {
      allowedRoot = resolve(root, 'tests/fixtures');
      target = resolve(allowedRoot, 'hidden-ancestor-v1.json');
    } else if (path === '/tests/browser/register-pages.json') {
      allowedRoot = resolve(root, 'tests/fixtures');
      target = resolve(allowedRoot, 'register-pages-v1.json');
    } else if (path.startsWith('/tests/browser/loading-fixtures/') && Object.hasOwn(loadingFixtures, path.slice('/tests/browser/loading-fixtures/'.length))) {
      allowedRoot = resolve(root, 'tests/fixtures');
      target = resolve(allowedRoot, loadingFixtures[path.slice('/tests/browser/loading-fixtures/'.length)]);
    } else if (path.startsWith('/tests/browser/') && mime[extname(path === '/tests/browser/' ? 'index.html' : path)]) {
      allowedRoot = resolve(root, 'tests/browser');
      target = resolve(root, path === '/tests/browser/' ? 'tests/browser/index.html' : path.slice(1));
    } else { fail(404); return; }
    let handle;
    try {
      const actual = await realpath(target);
      if (allowedRoot && !inside(await realpath(allowedRoot), actual)) { fail(404); return; }
      handle = await open(actual, 'r');
      const stat = await handle.stat();
      if (!stat.isFile()) { fail(404); return; }
      res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Content-Length': stat.size });
      if (req.method === 'HEAD') { res.end(); return; }
      await pipeline(handle.createReadStream({ autoClose: false }), res);
    } catch (error) {
      if (!res.headersSent) fail(['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code) ? 404 : 500);
      else res.destroy();
    } finally { await handle?.close().catch(() => {}); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { values } = parseArgs({ options: { host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '8080' }, snapshot: { type: 'string' } } });
    const port = Number(values.port);
    if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
    const server = createViewerServer({ snapshot: values.snapshot ? resolve(values.snapshot) : undefined });
    server.on('error', () => { console.error('SERVER_START_FAILED'); process.exitCode = 1; });
    server.listen(port, values.host, () => console.log(`Viewer server: http://${values.host}:${server.address().port}/`));
  } catch { console.error('Usage: node scripts/serve-ui.mjs [--host 127.0.0.1] [--port 8080] [--snapshot path]'); process.exitCode = 1; }
}
