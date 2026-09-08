import { addCents, formatUsd } from './money.mjs';
import { validDate } from './snapshot.mjs';
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const invalid = () => { const error = new Error('Invalid register query.'); error.code = 'INVALID_QUERY'; throw error; };

// Keep text fields separate: matches must never span unrelated fields.
export function searchFields(entry) {
  return { text: [entry.description, entry.memo, ...entry.allocations.map(a => a.memo)].map(value => value.toLowerCase()),
    amount: formatUsd(entry.amountCents).replace(/[$,]/g, '') };
}
export function matchesSearch(fields, text) {
  const needle = text.trim().toLowerCase();
  if (fields.text.some(value => value.includes(needle))) return true;
  if (!/^-?\$?(?:(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d*)?|\.\d+)$/.test(needle)) return false;
  const negative = needle.startsWith('-');
  const fragment = needle.replace(/[-$,]/g, '');
  return (!negative || fields.amount.startsWith('-')) && fields.amount.replace('-', '').includes(fragment);
}

// Index once; page DTOs alone cross the worker boundary. Source entries stay intact.
export function createRegisterQuery(model, effectiveDate) {
  if (!validDate(effectiveDate)) invalid();
  const summaries = new Map();
  const entries = model.entries;
  const fields = entries.map(searchFields);
  let cachedSearch = null;
  const all = entries.map((_, i) => i).sort((a, b) => {
    const x = entries[a], y = entries[b];
    return compare(y.date, x.date) || compare(x.accountId, y.accountId) ||
      compare(y.registerOrder, x.registerOrder) || compare(x.id, y.id);
  });
  const pageResult = (ids, indexAt, future, page, pageSize, includeFuture) => {
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

  return ({ accountId = null, text = '', page = 1, pageSize = 100, includeFuture = false } = {}, { isCurrent = () => true } = {}) => {
    if (typeof includeFuture !== 'boolean' || !Number.isSafeInteger(page) || page < 1 || pageSize !== 100 || typeof text !== 'string') invalid();
    if (accountId !== null && (typeof accountId !== 'string' || !model.accountsById.get(accountId)?.included)) invalid();
    const needle = text.trim().toLowerCase();
    if (needle) return (async () => {
      let result = cachedSearch;
      if (!result || result.accountId !== accountId || result.text !== needle) {
        const ids = [], future = { count: 0, amountCents: 0 };
        const scope = accountId === null ? null : model.ancestry.get(accountId);
        for (let i = 0; i < all.length; i++) {
          if (i % 512 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            if (!isCurrent()) return null;
          }
          const id = all[i], entry = entries[id], range = model.ancestry.get(entry.accountId);
          if (scope && (range.start < scope.start || range.start >= scope.end)) continue;
          if (!matchesSearch(fields[id], needle)) continue;
          ids.push(id);
          if (entry.date > effectiveDate) {
            future.count++;
            future.amountCents = addCents(future.amountCents, entry.amountCents);
          }
        }
        if (!isCurrent()) return null;
        result = { accountId, text: needle, ids, future };
        cachedSearch = result;
      }
      if (!isCurrent()) return null;
      return pageResult(result.ids, offset => result.ids[offset], result.future, page, pageSize, includeFuture);
    })();
    cachedSearch = null;
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
    return pageResult(ids, indexAt, future, page, pageSize, includeFuture);
  };
}
