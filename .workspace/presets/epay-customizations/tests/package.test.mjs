import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, relative, isAbsolute } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'preset.yml'), 'utf8'));

test('manifest exposes the intended unique command and template targets', () => {
  assert.equal(manifest.schema_version, '1.0');
  assert.equal(manifest.preset.id, 'epay-customizations');
  assert.match(manifest.preset.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.requires.speckit_version, '>=1.0.4');
  const expected = ['speckit.tasks','speckit.implement','speckit.analyze','tasks-template','constitution-template','acceptance-template'];
  assert.deepEqual(manifest.provides.templates.map(e=>e.name).sort(), expected.sort());
  assert.equal(new Set(manifest.provides.templates.map(e=>e.name)).size,6);
});

test('all declared files exist inside the package and preserve upstream composition', async () => {
  const canonicalRoot = await realpath(root);
  for (const entry of manifest.provides.templates) {
    assert.ok(['command','template'].includes(entry.type));
    assert.equal(entry.strategy, entry.name === 'acceptance-template' ? 'replace' : 'append');
    const path = await realpath(resolve(root,entry.file));
    const rel = relative(canonicalRoot,path);
    assert.ok(rel && rel !== '..' && !rel.startsWith('..\\') && !rel.startsWith('../') && !isAbsolute(rel));
    const text = await readFile(path,'utf8');
    assert.ok(text.trim().length>100);
    assert.ok(!text.includes('{CORE_TEMPLATE}'), 'append must not leak an unresolved wrapper token');
    assert.ok(!text.includes('$ARGUMENTS'), 'core command owns argument substitution');
  }
});

test('acceptance scaffold separates human results, defects, omissions and automation', async () => {
  const text=await readFile(resolve(root,'templates/acceptance-template.md'),'utf8');
  for(const field of ['Task','Tester','Test date','Environment','Expected / observed','Evidence or report','Defects and retests','Justified omissions','Supporting automated evidence','Gate decision'])
    assert.ok(text.includes(field),field);
});
