import { addCents } from './money.mjs';
import { validDate } from './snapshot.mjs';
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const invalid = () => { const error = new Error('Invalid register query.'); error.code = 'INVALID_QUERY'; throw error; };

// Index once; page DTOs alone cross the worker boundary. Source entries stay intact.
export function createRegisterQuery(model, effectiveDate) {
  if (!validDate(effectiveDate)) invalid();
  const summaries = new Map();
  const entries = model.entries;
  const all = entries.map((_, i) => i).sort((a, b) => {
    const x = entries[a], y = entries[b];
    return compare(y.date, x.date) || compare(x.accountId, y.accountId) ||
      compare(y.registerOrder, x.registerOrder) || compare(x.id, y.id);
  });
  return ({ accountId = null, text = '', page = 1, pageSize = 100, includeFuture = false } = {}) => {
    if (typeof includeFuture !== 'boolean' || !Number.isSafeInteger(page) || page < 1 || pageSize !== 100 || typeof text !== 'string' || text.trim()) invalid();
    if (accountId !== null && (typeof accountId !== 'string' || !model.accountsById.get(accountId)?.included)) invalid();
    const ids = accountId === null ? all : model.ownEntryIds.get(accountId);
    const indexAt = offset => ids[accountId === null ? offset : ids.length - offset - 1];
    if (!summaries.has(accountId)) {
      let count = 0, amountCents = 0;
      while (count < ids.length && entries[indexAt(count)].date > effectiveDate) {
        amountCents = addCents(amountCents, entries[indexAt(count)].amountCents);
        count++;
      }
      summaries.set(accountId, { count, amountCents });
    }
    const future = summaries.get(accountId);
    const hiddenCount = includeFuture ? 0 : future.count;
    const totalMatches = ids.length - hiddenCount;
    page = Math.min(page, Math.max(1, Math.ceil(totalMatches / pageSize)));
    const start = (page - 1) * pageSize;
    const rows = [];
    for (let offset = start; offset < Math.min(start + pageSize, totalMatches); offset++) {
      // Own IDs are ascending authoritative register order; display descending.
      const entry = entries[indexAt(offset + hiddenCount)];
      rows.push({ id: entry.id, transactionId: entry.transactionId, accountId: entry.accountId,
        accountName: model.accountsById.get(entry.accountId).name,
        date: entry.date, description: entry.description, memo: entry.memo, checkNum: entry.checkNum,
        category: entry.allocations.length === 0 ? 'Uncategorized' : entry.allocations.length === 1 ? entry.allocations[0].name : 'Split',
        amountCents: entry.amountCents, runningBalanceCents: entry.runningBalanceCents });
    }
    return { totalMatches, page, pageSize, rows, future };
  };
}
