import { cents, addCents } from "./money.mjs";

export class SnapshotError extends Error {
  constructor(code, field, value) {
    super(`${code}: ${field}`);
    this.name = "SnapshotError";
    this.code = code;
    this.field = field;
    this.value = value;
  }
}
const fail = (field, value) => {
  throw new SnapshotError("INVALID_SNAPSHOT", field, value);
};
const object = (v, p) => {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail(p);
};
const array = (v, p) => {
  if (!Array.isArray(v)) fail(p, v);
};
const string = (v, p, nonempty = false) => {
  if (typeof v !== "string" || (nonempty && !v.length)) fail(p, v);
};
const money = (v, p) => {
  try {
    return cents(v);
  } catch {
    fail(p, v);
  }
};
const sum = (a, b, p) => {
  try {
    return addCents(a, b);
  } catch {
    fail(p, { left: a, right: b });
  }
};
export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value;
}
const date = (v, p) => {
  if (!validDate(v)) fail(p, v);
};
const supported = new Set([
  "BANK",
  "CREDIT_CARD",
  "ASSET",
  "LIABILITY",
  "LOAN",
  "INCOME",
  "EXPENSE",
]);
const excluded = new Set(["ROOT", "INVESTMENT", "SECURITY"]);

export function validateSnapshot(snapshot) {
  // Keep diagnostic context on the error; callers decide whether to disclose it.
  let entity = snapshot;
  try {
    object(snapshot, "snapshot");
    if (snapshot.schemaVersion !== 1)
      throw new SnapshotError(
        "UNSUPPORTED_VERSION",
        "schemaVersion; re-export required",
      );
    const stamp = snapshot.exportDate;
    if (
      typeof stamp !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(stamp) ||
      !validDate(stamp.slice(0, 10)) ||
      !Number.isFinite(Date.parse(stamp)) ||
      Number(stamp.slice(11, 13)) > 23 ||
      Number(stamp.slice(14, 16)) > 59 ||
      Number(stamp.slice(17, 19)) > 59
    )
      fail("exportDate", stamp);
    string(snapshot.sourceVersion, "sourceVersion", true);
    date(snapshot.balanceStartDate, "balanceStartDate");
    const boundary = new Date(stamp);
    boundary.setUTCDate(boundary.getUTCDate() - 1);
    if (snapshot.balanceStartDate !== boundary.toISOString().slice(0, 10))
      fail("balanceStartDate", snapshot.balanceStartDate);
    array(snapshot.entries, "entries");
    const accountsById = new Map(),
      ownEntryIds = new Map(),
      ancestry = new Map();
    let ordinal = 0;
    const visit = (a, parentId, depth) => {
      entity = a;
      if (depth > 512) fail("accounts.depth", a);
      object(a, "account");
      string(a.id, "account.id", true);
      if (accountsById.has(a.id)) fail("account.duplicateOrCycle", a);
      for (const key of ["name", "type"]) {
        string(a[key], `account.${key}`, true);
      }
      string(a.currency, "account.currency", a.type !== "SECURITY");
      if (typeof a.inactive !== "boolean" || typeof a.included !== "boolean")
        fail("account.flags", a);
      if (!supported.has(a.type) && !excluded.has(a.type) && !a.inactive)
        fail("account.type", a);
      const shouldInclude = supported.has(a.type) && !a.inactive;
      if (a.included !== shouldInclude || (shouldInclude && a.currency !== "USD"))
        fail("account.included", a);
      if (parentId === null && a.type !== "ROOT") fail("accounts.root", a);
      if (parentId !== null && a.type === "ROOT") fail("account.type", a);
      accountsById.set(a.id, a);
      ownEntryIds.set(a.id, []);
      const range = { parentId, start: ordinal++, end: 0 };
      ancestry.set(a.id, range);
      if (a.included) {
        money(a.openingBalanceCents, "account.openingBalanceCents");
        money(a.closingBalanceCents, "account.closingBalanceCents");
        object(a.balanceTimeline, "account.balanceTimeline");
        array(a.balanceTimeline.points, "timeline.points");
        const points = a.balanceTimeline.points;
        if (!points.length || points[0].date !== snapshot.balanceStartDate)
          fail("timeline.baseline", a);
        let previous;
        for (const p of points) {
          object(p, "timeline.point");
          date(p.date, "timeline.date");
          money(p.ownBalanceCents, "timeline.ownBalanceCents");
          money(p.sidebarBalanceCents, "timeline.sidebarBalanceCents");
          if (
            previous &&
            (p.date <= previous.date ||
              (p.ownBalanceCents === previous.ownBalanceCents &&
                p.sidebarBalanceCents === previous.sidebarBalanceCents))
          )
            fail("timeline.orderOrRedundantPoint");
          previous = p;
        }
      } else {
        for (const key of ["openingBalanceCents", "closingBalanceCents"])
          if (a[key] !== null) money(a[key], `account.${key}`);
        if (a.balanceTimeline !== null) fail("excluded.balanceTimeline", a);
      }
      array(a.children, "account.children");
      for (const child of a.children) visit(child, a.id, depth + 1);
      range.end = ordinal;
    };
    visit(snapshot.accounts, null, 0);
    const identities = new Set();
    snapshot.entries.forEach((entry, index) => {
      entity = entry;
      object(entry, "entry");
      for (const key of ["id", "transactionId", "accountId"])
        string(entry[key], `entry.${key}`, true);
      const account = accountsById.get(entry.accountId);
      if (!account?.included) fail("entry.accountId", entry);
      const identity = JSON.stringify([entry.accountId, entry.id]);
      if (identities.has(identity)) fail("entry.duplicate", entry);
      identities.add(identity);
      date(entry.date, "entry.date");
      if (!Number.isSafeInteger(entry.registerOrder) || entry.registerOrder < 0)
        fail("entry.registerOrder", entry);
      money(entry.amountCents, "entry.amountCents");
      money(entry.runningBalanceCents, "entry.runningBalanceCents");
      for (const key of ["description", "memo", "checkNum"])
        string(entry[key], `entry.${key}`);
      if (!["CLEARED", "RECONCILING", "UNCLEARED"].includes(entry.clearedStatus))
        fail("entry.clearedStatus", entry);
      array(entry.tags, "entry.tags");
      entry.tags.forEach((t) => string(t, "entry.tag"));
      array(entry.allocations, "entry.allocations");
      for (const a of entry.allocations) {
        object(a, "allocation");
        if (!accountsById.has(a.accountId)) fail("allocation.accountId", a);
        string(a.name, "allocation.name");
        string(a.memo, "allocation.memo");
        if (a.amountCents !== undefined && a.amountCents !== null)
          money(a.amountCents, "allocation.amountCents");
      }
      ownEntryIds.get(entry.accountId).push(index);
    });
    for (const account of accountsById.values()) {
      entity = account;
      if (!account.included) continue;
      const ids = ownEntryIds.get(account.id);
      ids.sort(
        (a, b) =>
          snapshot.entries[a].registerOrder - snapshot.entries[b].registerOrder,
      );
      let running = account.openingBalanceCents,
        previous;
      const daily = new Map();
      for (const id of ids) {
        const e = snapshot.entries[id];
        entity = e;
        if (
          previous &&
          (e.registerOrder === previous.registerOrder || e.date < previous.date)
        )
          fail("entry.registerOrder", e);
        running = sum(running, e.amountCents, "entry.runningBalanceCents");
        if (e.runningBalanceCents !== running)
          fail("entry.runningBalanceCents", e);
        daily.set(e.date, running);
        previous = e;
      }
      entity = account;
      if (running !== account.closingBalanceCents)
        fail("account.closingBalanceCents", account);
      const points = account.balanceTimeline.points;
      let cursor = 0,
        balance = account.openingBalanceCents;
      const pointDates = new Set(points.map((p) => p.date));
      for (const p of points) {
        while (
          cursor < ids.length &&
          snapshot.entries[ids[cursor]].date <= p.date
        )
          balance = snapshot.entries[ids[cursor++]].runningBalanceCents;
        if (balance !== p.ownBalanceCents)
          fail("timeline.ownBalanceCents", account);
      }
      let prior = account.openingBalanceCents;
      for (const [day, value] of daily) {
        if (
          day > snapshot.balanceStartDate &&
          value !== prior &&
          !pointDates.has(day)
        )
          fail("timeline.missingChange", account);
        prior = value;
      }
      // Recursive totals involve omitted hidden rows; their reference proof is source-side.
    }
    return {
      snapshot,
      accountsById,
      ownEntryIds,
      ancestry,
      entries: snapshot.entries,
    };
  } catch (error) {
    error.entity = entity;
    throw error;
  }
}

export function visibleAccounts(model, effectiveDate) {
  if (!validDate(effectiveDate) || effectiveDate < model.snapshot.balanceStartDate)
    throw new SnapshotError("INVALID_SNAPSHOT", "effectiveDate; before balance coverage or invalid date");
  const nodes = new Map();
  for (const account of model.accountsById.values()) {
    if (!account.included) continue;
    const points = account.balanceTimeline.points;
    let low = 0, high = points.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (points[middle].date <= effectiveDate) low = middle + 1;
      else high = middle;
    }
    const p = points[low - 1];
    nodes.set(account.id, { id: account.id, name: account.name, type: account.type,
      currency: account.currency, ownBalanceCents: p.ownBalanceCents,
      sidebarBalanceCents: p.sidebarBalanceCents, children: [] });
  }
  const roots = [];
  for (const [id, node] of nodes) {
    let parent = model.ancestry.get(id).parentId;
    while (parent !== null && !nodes.has(parent)) parent = model.ancestry.get(parent).parentId;
    (parent === null ? roots : nodes.get(parent).children).push(node);
  }
  return roots;
}
