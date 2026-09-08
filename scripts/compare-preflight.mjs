// Compare a newly exported snapshot to the independently verified private reference.
// Print case ordinals/check names only, never account paths or monetary values.
import { readFile } from 'node:fs/promises';
import { validateSnapshot } from '../UI/src/snapshot.mjs';
const read = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
try {
  if (process.argv.length !== 4) throw new Error('USAGE');
  const model = validateSnapshot(await read(process.argv[2]));
  const reference = await read(process.argv[3]);
  let failures = 0;
  reference.cases.forEach((c, index) => {
    let account = model.snapshot.accounts;
    for (const name of c.accountPath) {
      const matches = account.children.filter(a => a.name === name);
      if (matches.length !== 1) throw new Error('REFERENCE_ACCOUNT_NOT_UNIQUE');
      account = matches[0];
    }
    const check = (label, ok) => {
      if (!ok) failures++;
      console.log(`Case ${index + 1} ${label}: ${ok ? 'PASS' : 'FAIL'}`);
    };
    if (!account.included) {
      check('excluded-own-rows', model.ownEntryIds.get(account.id).length === 0);
      console.log(`Case ${index + 1}: excluded metadata retained; balances already checked in source preflight`);
      return;
    }
    check('opening', account.openingBalanceCents === c.openingBalanceCents);
    check('closing', account.closingBalanceCents === c.closingBalanceCents);
    check('recursive-closing', account.balanceTimeline.points.at(-1).sidebarBalanceCents === c.recursiveClosingBalanceCents);
    const rows = model.ownEntryIds.get(account.id).map(id => model.entries[id]);
    check('entry-count', rows.length === c.entries.length);
    c.entries.forEach((expected, i) => {
      const row = rows[i];
      check(`row-${i + 1}`, !!row && Number(row.date.replaceAll('-', '')) === expected.date
        && row.description === expected.description && row.amountCents === expected.amountCents
        && row.runningBalanceCents === expected.runningBalanceCents);
    });
    c.dates.forEach((expected, i) => {
      const raw = String(expected.date), date = `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
      if (date < model.snapshot.balanceStartDate) {
        console.log(`Case ${index + 1} date-${i + 1}: outside compact coverage (source preflight reference retained)`);
        return;
      }
      const p = account.balanceTimeline.points.filter(p => p.date <= date).at(-1);
      check(`date-${i + 1}`, p.ownBalanceCents === expected.ownBalanceCents && p.sidebarBalanceCents === expected.sidebarBalanceCents);
    });
  });
  if (failures) process.exitCode = 1;
  console.log(failures ? 'REFERENCE_COMPARISON_FAILED' : 'REFERENCE_COMPARISONS_PASS');
} catch (error) {
  console.error(error.code === 'UNSUPPORTED_VERSION' ? error.code : 'REFERENCE_COMPARISON_INPUT_ERROR');
  process.exitCode = 1;
}
