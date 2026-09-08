import test from 'node:test';
import assert from 'node:assert/strict';
import { formatExportDate, transactionDateParts } from '../../UI/src/format.mjs';
test('export instant is localized across midnight and daylight saving transitions', () => {
  const options={locale:'en-US',timeZone:'America/Chicago'};
  assert.match(formatExportDate('2026-09-07T01:00:00Z',options), /9\/6\/2026/);
  assert.match(formatExportDate('2026-03-08T07:59:00Z',options), /1:59:00.*CST/);
  assert.match(formatExportDate('2026-03-08T08:00:00Z',options), /3:00:00.*CDT/);
  assert.match(formatExportDate('2026-11-01T06:30:00Z',options), /1:30:00.*CDT/);
  assert.match(formatExportDate('2026-11-01T07:30:00Z',options), /1:30:00.*CST/);
  assert.match(formatExportDate('2026-09-06T23:00:00Z',{locale:'en-GB',timeZone:'Asia/Tokyo'}), /07\/09\/2026/);
});
test('invalid export instants are rejected, never relabeled as unavailable', () => {
  for(const stamp of [null,undefined,7,'bad','2026-02-30T00:00:00Z','2026-09-07T24:00:00Z','2026-09-07'])
    assert.throws(()=>formatExportDate(stamp),e=>e.code==='INVALID_SNAPSHOT' && e.field==='exportDate');
});
test('transaction calendar dates are split without timezone conversion', () => {
  assert.deepEqual(transactionDateParts('2026-09-07'),{year:'2026',month:'09',day:'07'});
  assert.throws(()=>transactionDateParts('2026-02-30'));
});
