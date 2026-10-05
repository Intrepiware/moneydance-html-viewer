import { addCents, formatUsd } from './money.mjs';
import { validDate } from './snapshot.mjs';
const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const isCategory = account => ['INCOME', 'EXPENSE'].includes(account?.type);
const invalid = () => { const error = new Error('Invalid register query.'); error.code = 'INVALID_QUERY'; throw error; };

// Keep text fields separate: matches must never span unrelated fields.
export function searchFields(entry) {
  return { text: [entry.description, entry.memo, ...entry.allocations.map(a => a.memo || '')].map(value => value.toLowerCase()),
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

export function accountPath(model, accountId) {
  const names = [];
  for (let id = accountId; id !== null; id = model.ancestry.get(id).parentId) {
    const account = model.accountsById.get(id);
    if (account.type !== 'ROOT') names.unshift(account.name);
  }
  return names.join(':');
}

export function createDetailsQuery(model) {
  return ({ accountId, entryId } = {}) => {
    if (typeof accountId !== 'string' || !accountId || typeof entryId !== 'string' || !entryId) invalid();
    const index = model.entryIndex.get(JSON.stringify([accountId, entryId]));
    if (index === undefined) return null;
    const entry = model.entries[index];
    let totalCents = 0, complete = entry.allocations.length > 0;
    const allocations = entry.allocations.map(a => {
      const destination = model.accountsById.get(a.accountId);
      const amountCents = a.amountCents ?? null;
      if (amountCents === null) complete = false;
      else totalCents = addCents(totalCents, amountCents);
      const category = isCategory(destination);
      const destinationAvailable = destination.included &&
        model.transactionEntries.has(JSON.stringify([a.accountId, entry.transactionId]));
      return {accountId:a.accountId, path:accountPath(model,a.accountId) || a.name,
        memo:a.memo || '', tags:a.tags?.slice() ?? null, amountCents,
        destinationAvailable,
        unavailableReason:destinationAvailable ? '' : destination.included ? 'Related entry unavailable in this export' : 'Account unavailable in this export',
        isTransfer:!category};
    });
    return {accountId,entryId,transactionId:entry.transactionId,description:entry.description,
      date:entry.date,accountPath:accountPath(model,accountId),amountCents:entry.amountCents,
      allocations,totalCents:complete ? totalCents : null};
  };
}

export function createLocateQuery(model, effectiveDate) {
  if (!validDate(effectiveDate)) invalid();
  return ({mode, accountId, entryId, destinationAccountId, transactionId} = {}) => {
    const identity = value => typeof value === 'string' && value.length > 0;
    let targetId, matches;
    if (mode === 'exact') {
      if (!identity(accountId) || !identity(entryId) || destinationAccountId !== undefined || transactionId !== undefined) invalid();
      targetId = accountId;
      const index = model.entryIndex.get(JSON.stringify([accountId, entryId]));
      matches = index === undefined ? [] : [index];
    } else if (mode === 'transfer') {
      if (!identity(destinationAccountId) || !identity(transactionId) || accountId !== undefined || entryId !== undefined) invalid();
      targetId = destinationAccountId;
      matches = (model.transactionEntries.get(JSON.stringify([targetId, transactionId])) || []).slice().reverse();
    } else invalid();
    const account = model.accountsById.get(targetId);
    if (!account?.included || !matches.length) return null;
    const includeFuture = matches.some(index => model.entries[index].date > effectiveDate);
    const ids = model.ownEntryIds.get(targetId);
    let hidden = 0;
    if (!includeFuture) {
      while (hidden < ids.length && model.entries[ids[ids.length - hidden - 1]].date > effectiveDate) hidden++;
    }
    const position = ids.length - 1 - ids.indexOf(matches[0]) - hidden;
    const entryIds = matches.map(index => model.entries[index].id);
    return {accountId: targetId, page: Math.floor(position / 100) + 1, includeFuture,
      entryIds, focusEntryId: entryIds[0]};
  };
}

// Index once; page DTOs alone cross the worker boundary. Source entries stay intact.
export function createRegisterQuery(model, effectiveDate) {
  if (!validDate(effectiveDate)) invalid();
  const summaries = new Map();
  const entries = model.entries;
  const fields = entries.map(searchFields);
  const categoryTitles = new Map();
  const categoryTitle = allocation => {
    if (!categoryTitles.has(allocation.accountId)) {
      const names = [];
      let id = allocation.accountId;
      while (id !== null) {
        const account = model.accountsById.get(id);
        if (account.type !== 'ROOT') names.unshift(account.name);
        id = model.ancestry.get(id).parentId;
      }
      categoryTitles.set(allocation.accountId, names.join(':'));
    }
    return categoryTitles.get(allocation.accountId);
  };
  let cachedSearch = null;
  const all = entries.map((_, i) => i).sort((a, b) => {
    const x = entries[a], y = entries[b];
    return compare(y.date, x.date) || compare(x.accountId, y.accountId) ||
      compare(y.registerOrder, x.registerOrder) || compare(x.id, y.id);
  });
  const pageResult = (ids, indexAt, future, page, pageSize, includeFuture, grouping, periodScope) => {
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
        tags: entry.tags.slice(),
        category: entry.allocations.length === 0 ? 'Uncategorized' : entry.allocations.length === 1 ? entry.allocations[0].name : 'Split',
        categoryTitle: entry.allocations.length === 0 ? 'Uncategorized' : entry.allocations.length === 1 ? categoryTitle(entry.allocations[0]) : 'Split',
        amountCents: entry.amountCents, runningBalanceCents: entry.runningBalanceCents });
    }
    const result = { totalMatches, page, pageSize, rows, future };
    if (grouping) Object.assign(result,{grouping,periodScope});
    if (grouping && grouping !== 'all') {
      const keyFor = date => date.slice(0, grouping === 'month' ? 7 : 4);
      const totals = new Map();
      // Aggregate the entire disclosed matching set, never just the current page.
      for (let offset = hiddenCount; offset < ids.length; offset++) {
        const entry = entries[indexAt(offset)], key = keyFor(entry.date);
        const period = totals.get(key) || {totalCents:0,count:0};
        period.totalCents = addCents(period.totalCents,entry.amountCents);
        period.count++;
        totals.set(key,period);
      }
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const periods = [];
      let previous;
      rows.forEach((row, rowIndex) => {
        const key = keyFor(row.date);
        if (key !== previous) {
          const continued = rowIndex === 0 && start > 0 &&
            keyFor(entries[indexAt(start + hiddenCount - 1)].date) === key;
          periods.push({key, label:grouping === 'year' ? key : `${months[Number(key.slice(5))-1]} ${key.slice(0,4)}`,
            ...totals.get(key), continued, rowIndex});
        }
        previous = key;
      });
      Object.assign(result,{grouping,periodScope,periods});
    }
    return result;
  };

  return ({ accountId = null, text = '', page = 1, pageSize = 100, includeFuture = false, grouping = 'month' } = {}, { isCurrent = () => true } = {}) => {
    if (!['all','month','year'].includes(grouping)) invalid();
    if (typeof includeFuture !== 'boolean' || !Number.isSafeInteger(page) || page < 1 || pageSize !== 100 || typeof text !== 'string') invalid();
    if (accountId !== null && (typeof accountId !== 'string' || !model.accountsById.get(accountId)?.included)) invalid();
    const needle = text.trim().toLowerCase();
    const categoryGrouping = isCategory(model.accountsById.get(accountId)) ? grouping : null;
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
          if (categoryGrouping && !isCategory(model.accountsById.get(entry.accountId))) continue;
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
      return pageResult(result.ids, offset => result.ids[offset], result.future, page, pageSize, includeFuture, categoryGrouping, 'matching');
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
    return pageResult(ids, indexAt, future, page, pageSize, includeFuture, categoryGrouping, 'direct');
  };
}
