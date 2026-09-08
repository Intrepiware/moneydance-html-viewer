import test from 'node:test';
import assert from 'node:assert/strict';
import { cents, addCents, parseUsd, formatUsd } from '../../UI/src/money.mjs';
test('exact signed USD parsing and formatting', () => {
  assert.equal(parseUsd('-$1,234.56'), -123456);
  assert.equal(parseUsd('0.01'), 1);
  assert.equal(parseUsd('200'), 20000);
  assert.equal(formatUsd(-123456), '-$1,234.56');
  assert.equal(addCents(20000, -300), 19700);
});
test('unsafe amounts and intermediate sums are rejected', () => {
  for (const n of [1.1, NaN, Infinity, '100', null, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => cents(n));
  assert.throws(() => addCents(Number.MAX_SAFE_INTEGER, 1));
  for (const s of ['1.001', '1e3', '1,23', '', '90071992547409.92']) assert.throws(() => parseUsd(s));
  assert.equal(parseUsd('90071992547409.91'), Number.MAX_SAFE_INTEGER);
  assert.equal(formatUsd(Number.MAX_SAFE_INTEGER), '$90,071,992,547,409.91');
});
