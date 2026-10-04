// Independently defined synthetic US4 cases; never reads UI/data or private exports.
export function navigationFixture() {
  const accounts = ['source', 'destination', 'empty', 'archived', 'category'].map((id, i) => ({
    id, name: ['Navigation Checking', 'Transfer Savings', 'Empty Reserve', 'Archived Reserve', 'Navigation Expense'][i],
    type: id === 'category' ? 'EXPENSE' : 'BANK', currency: 'USD', inactive: id === 'archived',
    included: id !== 'archived', openingBalanceCents: 0, closingBalanceCents: 0, balanceTimeline: null, children: []
  }));
  const entries = [];
  const allocation = (accountId, amountCents) => ({accountId, name: accounts.find(a => a.id === accountId).name, amountCents, memo: '', tags: []});
  const add = (accountId, id, transactionId, description, amountCents, allocations = [], date = '2025-06-01') => {
    const own = entries.filter(e => e.accountId === accountId);
    entries.push({accountId, id, transactionId, description, amountCents, allocations, date,
      registerOrder: own.length, runningBalanceCents: (own.at(-1)?.runningBalanceCents || 0) + amountCents,
      memo: '', tags: [], checkNum: '', clearedStatus: 'CLEARED'});
  };
  add('source', 'source-mixed', 'mixed', 'Mixed transfer', -3000,
    [allocation('destination', -1000), allocation('destination', -1000), allocation('destination', -1000)]);
  add('source', 'source-past', 'past', 'Past transfer', -2000, [allocation('destination', -2000)]);
  add('source', 'source-unavailable', 'unavailable', 'Unavailable transfers', -2000,
    [allocation('empty', -1000), allocation('archived', -1000)]);
  add('source', 'source-category', 'category-txn', 'Category example', -500, [allocation('category', -500)]);
  for (let i = 0; i < 205; i++) {
    const transactionId = [40, 140].includes(i) ? 'mixed' : [30, 31].includes(i) ? 'past' : 'unrelated-' + i;
    add('destination', 'destination-' + i, transactionId,
      i === 40 ? 'Exact needle' : [140, 141].includes(i) ? 'Shared transfer' : 'Savings row ' + i,
      1000, [allocation('source', 1000)]);
  }
  add('destination', 'destination-future', 'mixed', 'Future counterpart', 1000, [allocation('source', 1000)], '2099-01-01');
  add('destination', 'future-lookalike', 'unrelated-future', 'Future counterpart', 1000, [allocation('source', 1000)], '2099-01-01');
  add('category', 'category-entry', 'category-txn', 'Category needle', 500, [allocation('source', 500)]);
  for (const account of accounts) {
    const own = entries.filter(e => e.accountId === account.id);
    account.closingBalanceCents = own.at(-1)?.runningBalanceCents || 0;
    if (account.included) {
      const past = own.filter(e => e.date < '2099-01-01').at(-1)?.runningBalanceCents || 0;
      account.balanceTimeline = {points: [{date: '2026-09-05', ownBalanceCents: past, sidebarBalanceCents: past}]};
      if (past !== account.closingBalanceCents) account.balanceTimeline.points.push({date: '2099-01-01',
        ownBalanceCents: account.closingBalanceCents, sidebarBalanceCents: account.closingBalanceCents});
    }
  }
  return {schemaVersion: 1, exportDate: '2026-09-06T12:00:00Z', balanceStartDate: '2026-09-05', sourceVersion: 'synthetic-us4',
    accounts: {id: 'root', name: 'Synthetic Book', type: 'ROOT', currency: 'USD', inactive: false, included: false,
      openingBalanceCents: null, closingBalanceCents: null, balanceTimeline: null, children: accounts}, entries};
}
