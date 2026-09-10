# -*- coding: utf-8 -*-
"""Snapshot v1 exporter. Run inside Moneydance's Jython 2.7 script facility.

Read-only source capture; no close hook or remote delivery. Save a controlled
book first and validate the JSON before using the full private book.
"""
import datetime
import json
import os
import sys
from java.lang import Runnable, System
from java.util.concurrent import CountDownLatch, TimeUnit
import threading
from java.lang import Exception as JavaException
from java.io import File, FileOutputStream, OutputStreamWriter
from java.nio.file import Files, StandardCopyOption
from javax.swing import JFileChooser, SwingUtilities
from com.infinitekind.moneydance.model import TxnSet

LIMIT = 9007199254740991
SUPPORTED = ('BANK', 'CREDIT_CARD', 'ASSET', 'LIABILITY', 'LOAN', 'INCOME', 'EXPENSE')
EXCLUDED = ('ROOT', 'INVESTMENT', 'SECURITY')


class ExportError(Exception):
    pass


class Deadline(object):
    """Cooperative monotonic deadline; cancellation never interrupts Java calls."""
    def __init__(self, seconds=60, clock=None):
        self.clock = clock or System.nanoTime
        self.end = self.clock() + long(seconds * 1000000000)
        self.cancelled = threading.Event()

    def check(self):
        if self.cancelled.is_set():
            raise ExportError('EXPORT_CANCELLED')
        if self.clock() >= self.end:
            raise ExportError('EXPORT_TIMEOUT')

    def cancel(self):
        self.cancelled.set()


def check_deadline(deadline):
    if deadline is not None:
        deadline.check()


def require(condition, code):
    if not condition:
        raise ExportError(code)


def exact(value):
    require(isinstance(value, (int, long)) and not isinstance(value, bool), 'INVALID_CENTS')
    require(-LIMIT <= value <= LIMIT, 'UNSAFE_CENTS')
    return long(value)


def add(a, b):
    return exact(exact(a) + exact(b))


def text(value):
    return unicode(value) if value is not None else u''


def check_editing_mode(item):
    # Build 5253 does not expose this method on all source objects.
    # Double capture with source stamps remains mandatory regardless.
    if hasattr(item, 'isInEditingMode'):
        require(not item.isInEditingMode(), 'SOURCE_EDIT_IN_PROGRESS')


def cleared_status(txn):
    source = text(txn.getClearedStatus().name())
    statuses = {'UNRECONCILED': 'UNCLEARED', 'UNCLEARED': 'UNCLEARED',
                'CLEARED': 'CLEARED', 'RECONCILING': 'RECONCILING'}
    require(source in statuses, 'UNSUPPORTED_CLEARED_STATUS')
    return statuses[source]


def date_text(value):
    raw = str(int(value))
    require(len(raw) == 8, 'INVALID_SOURCE_DATE')
    return datetime.date(int(raw[:4]), int(raw[4:6]), int(raw[6:])).isoformat()


def memo(txn):
    if hasattr(txn, 'getMemo'):
        return text(txn.getMemo())
    # Split descriptions carry allocation text; the parent carries transaction memo.
    return text(txn.getDescription())


def capture(book, deadline=None):
    """Copy relevant source data to Python values; never retain mutable Java nodes."""
    check_deadline(deadline)
    records = []
    seen = set()
    transaction_set = book.getTransactionSet()

    def visit(account, parent_id, ancestor_needs_balances=False):
        check_deadline(deadline)
        aid = text(account.getUUID())
        require(aid and aid not in seen, 'DUPLICATE_ACCOUNT_OR_CYCLE')
        seen.add(aid)
        check_editing_mode(account)
        kind = text(account.getAccountType().name())
        currency = text(account.getCurrencyType().getIDString())
        inactive = bool(account.getAccountIsInactive())
        require(kind in SUPPORTED or kind in EXCLUDED or inactive, 'UNSUPPORTED_ACCOUNT_TYPE')
        included = kind in SUPPORTED and not inactive
        require(not included or currency == 'USD', 'UNSUPPORTED_CURRENCY')
        needs_balances = included or ancestor_needs_balances
        require(not needs_balances or (currency == 'USD' and kind != 'SECURITY'),
                'UNVERIFIED_DESCENDANT_VALUATION')
        sign = -1 if account.balanceIsNegated() else 1
        record = {'id': aid, 'parentId': parent_id, 'name': text(account.getAccountName()),
                  'type': kind, 'currency': currency, 'inactive': inactive, 'included': included,
                  'sign': sign, 'needsBalances': needs_balances,
                  'opening': long(account.getStartBalance()) if needs_balances else None,
                  'sourceClosing': long(account.getUserBalance()) if needs_balances else None,
                  'sourceCurrent': long(account.getUserCurrentBalance()) if needs_balances else None,
                  'sourceRecursiveClosing': long(account.getRecursiveUserBalance()) if needs_balances else None,
                  'sourceRecursiveCurrent': long(account.getRecursiveUserCurrentBalance()) if needs_balances else None,
                  'sourceStamp': long(account.getSyncTimestamp()), 'rows': []}
        rows = []
        if needs_balances:
            source = transaction_set.getTransactionsForAccount(account)
            def dated(txn):
                check_deadline(deadline)
                return int(txn.getDateInt())
            for i in range(source.getSize()):
                check_deadline(deadline)
                rows.append(source.getTxn(i))
            rows.sort(key=dated)
        detached = TxnSet()
        for txn in rows:
            check_deadline(deadline)
            detached.addTxn(txn)
        if needs_balances:
            detached.setHoldBalances(True)
            detached.recalcBalances(record['opening'], bool(account.balanceIsNegated()))
        row_ids = set()
        for order, txn in enumerate(rows):
            check_deadline(deadline)
            check_editing_mode(txn)
            eid = text(txn.getUUID())
            require(eid and eid not in row_ids, 'DUPLICATE_ENTRY')
            row_ids.add(eid)
            require(text(txn.getAccount().getUUID()) == aid, 'ENTRY_ACCOUNT_MISMATCH')
            parent = txn.getParentTxn()
            require(parent is not None, 'MISSING_PARENT_TRANSACTION')
            split = text(parent.getUUID()) != eid
            description = text(txn.getDescription()) or text(parent.getDescription())
            allocations = []
            for i in range(txn.getOtherTxnCount()):
                check_deadline(deadline)
                other = txn.getOtherTxn(i)
                allocations.append({'accountId': text(other.getAccount().getUUID()),
                                    'name': text(other.getAccount().getAccountName()),
                                    'memo': memo(txn) if split else memo(other),
                                    'amountCents': None})
            tags = sorted(set(text(t) for node in (parent, txn) for t in (node.getKeywords() or [])))
            record['rows'].append({'id': eid, 'transactionId': text(parent.getUUID()),
                                   'accountId': aid, 'date': date_text(txn.getDateInt()),
                                   'registerOrder': order, 'raw': long(txn.getValue()),
                                   'sdkBalance': long(detached.getBalanceAt(order)),
                                   'description': description, 'memo': text(parent.getMemo()),
                                   'checkNum': text(txn.getCheckNumber()),
                                   'clearedStatus': cleared_status(txn),
                                   'tags': tags, 'allocations': allocations,
                                   'sourceStamp': long(txn.getSyncTimestamp())})
        records.append(record)
        for i in range(account.getSubAccountCount()):
            visit(account.getSubAccount(i), aid, needs_balances)
    visit(book.getRootAccount(), None)
    check_deadline(deadline)
    return records


def build_snapshot(records, instant, source_version, deadline=None):
    check_deadline(deadline)
    boundary = (instant.date() - datetime.timedelta(days=1)).isoformat()
    today = datetime.date.today().isoformat()
    by_id = dict((r['id'], r) for r in records)
    children = dict((r['id'], []) for r in records)
    roots = []
    for r in records:
        check_deadline(deadline)
        if r['parentId'] is None:
            roots.append(r['id'])
        else:
            require(r['parentId'] in by_id, 'MISSING_PARENT_ACCOUNT')
            children[r['parentId']].append(r['id'])
    require(len(roots) == 1, 'INVALID_ROOT')
    emitted_entries = []
    # Integer raw deltas are kept in source sign until the owning parent's display
    # sign is applied. Included entries separately use their own account's sign.
    for r in records:
        check_deadline(deadline)
        if not r['needsBalances']:
            # Metadata-only accounts do not participate in any included total.
            # Their security quantities/portfolio balances are outside this export.
            r['daily'] = {}
            r['closing'] = None
            continue
        opening = r['opening']
        running = opening
        daily = {}
        for row in r['rows']:
            check_deadline(deadline)
            running = add(running, row['raw']) if r['currency'] == 'USD' else running + row['raw']
            daily[row['date']] = add(daily.get(row['date'], 0), row['raw']) if r['currency'] == 'USD' else daily.get(row['date'], 0) + row['raw']
            require(row['sdkBalance'] == running * r['sign'], 'SDK_RUNNING_BALANCE_MISMATCH')
            for allocation in row['allocations']:
                require(allocation['accountId'] in by_id, 'MISSING_ALLOCATION_ACCOUNT')
            if r['included']:
                entry = dict((k, v) for k, v in row.items() if k not in ('raw', 'sdkBalance', 'sourceStamp'))
                entry['amountCents'] = exact(row['raw'] * r['sign'])
                entry['runningBalanceCents'] = exact(running * r['sign'])
                emitted_entries.append(entry)
        require(running * r['sign'] == r['sourceClosing'], 'SOURCE_CLOSING_MISMATCH')
        r['daily'] = daily
        r['closing'] = running

    def aggregate(aid):
        check_deadline(deadline)
        r = by_id[aid]
        require(r['currency'] == 'USD' and r['type'] != 'SECURITY', 'UNVERIFIED_DESCENDANT_VALUATION')
        opening = exact(r['opening'])
        events = dict((day, exact(value)) for day, value in r['daily'].items())
        for child in children[aid]:
            child_opening, child_events = aggregate(child)
            opening = add(opening, child_opening)
            for day, amount in child_events.items():
                check_deadline(deadline)
                events[day] = add(events.get(day, 0), amount)
        return opening, events

    def at(opening, events, cutoff):
        total = exact(opening)
        for day in sorted(events):
            check_deadline(deadline)
            if day <= cutoff:
                total = add(total, events[day])
        return total

    nodes = {}
    for r in records:
        check_deadline(deadline)
        node = dict((key, r[key]) for key in ('id', 'name', 'type', 'currency', 'inactive', 'included'))
        node.update({'children': [], 'openingBalanceCents': None, 'closingBalanceCents': None, 'balanceTimeline': None})
        if r['included']:
            sign = r['sign']
            opening, events = aggregate(r['id'])
            require(at(r['opening'], r['daily'], today) * sign == r['sourceCurrent'], 'SOURCE_CURRENT_MISMATCH')
            require(at(opening, events, today) * sign == r['sourceRecursiveCurrent'], 'SOURCE_RECURSIVE_CURRENT_MISMATCH')
            require(at(opening, events, '9999-12-31') * sign == r['sourceRecursiveClosing'], 'SOURCE_RECURSIVE_CLOSING_MISMATCH')
            own = exact(at(r['opening'], r['daily'], boundary) * sign)
            sidebar = exact(at(opening, events, boundary) * sign)
            points = [{'date': boundary, 'ownBalanceCents': own, 'sidebarBalanceCents': sidebar}]
            for day in sorted(set(events) | set(r['daily'])):
                check_deadline(deadline)
                if day <= boundary:
                    continue
                own = add(own, exact(r['daily'].get(day, 0) * sign))
                sidebar = add(sidebar, exact(events.get(day, 0) * sign))
                previous = points[-1]
                if own != previous['ownBalanceCents'] or sidebar != previous['sidebarBalanceCents']:
                    points.append({'date': day, 'ownBalanceCents': own, 'sidebarBalanceCents': sidebar})
            node['openingBalanceCents'] = exact(r['opening'] * sign)
            node['closingBalanceCents'] = exact(r['closing'] * sign)
            node['balanceTimeline'] = {'points': points}
        nodes[r['id']] = node
    # Securities have no viewing role. Retain only reference targets and ancestors
    # of retained nodes; prune after balance checks so valuation cannot be hidden.
    retained = set(r['id'] for r in records if r['type'] != 'SECURITY')
    for entry in emitted_entries:
        check_deadline(deadline)
        retained.update(a['accountId'] for a in entry['allocations'])
    for aid in list(retained):
        check_deadline(deadline)
        parent_id = by_id[aid]['parentId']
        while parent_id is not None and parent_id not in retained:
            retained.add(parent_id)
            parent_id = by_id[parent_id]['parentId']
    for aid in retained:
        check_deadline(deadline)
        nodes[aid]['children'] = [nodes[child] for child in children[aid] if child in retained]
    check_deadline(deadline)
    return {'schemaVersion': 1, 'exportDate': instant.isoformat() + 'Z',
            'sourceVersion': source_version, 'balanceStartDate': boundary,
            'accounts': nodes[roots[0]], 'entries': emitted_entries}


def atomic_save(snapshot, target):
    directory = target.getAbsoluteFile().getParentFile()
    require(directory.isDirectory(), 'OUTPUT_DIRECTORY_MISSING')
    temporary = File.createTempFile('.snapshot-', '.tmp', directory)
    try:
        stream = FileOutputStream(temporary)
        writer = OutputStreamWriter(stream, 'UTF-8')
        try:
            # Compact JSON is material for the full-history file size.
            for chunk in json.JSONEncoder(ensure_ascii=True, separators=(',', ':')).iterencode(snapshot):
                writer.write(chunk)
            writer.flush()
            stream.getFD().sync()
        finally:
            writer.close()
        # Fail rather than delete the last good export if atomic replacement is unavailable.
        Files.move(temporary.toPath(), target.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING)
    finally:
        if temporary.exists():
            temporary.delete()


class CaptureOnUIThread(Runnable):
    def __init__(self, book, deadline=None):
        self.book = book
        self.deadline = deadline
        self.done = CountDownLatch(1)
        self.result = None
        self.error = None

    def run(self):
        try:
            # UI edits cannot interleave on the EDT. Compare full detached captures
            # (including source stamps) to detect background changes; reject edits.
            check_deadline(self.deadline)
            first = capture(self.book, self.deadline)
            second = capture(self.book, self.deadline)
            require(first == second, 'SOURCE_CHANGED_DURING_CAPTURE')
            check_deadline(self.deadline)
            self.result = first
        except (Exception, JavaException) as error:
            self.error = error
        finally:
            self.book = None
            self.done.countDown()


def capture_stable(book, deadline):
    """Bounded EDT handoff; returns detached records, never a retained book."""
    deadline.check()
    operation = CaptureOnUIThread(book, deadline)
    if SwingUtilities.isEventDispatchThread():
        operation.run()
    else:
        SwingUtilities.invokeLater(operation)
        while not getattr(operation.done, 'await')(20, TimeUnit.MILLISECONDS):
            try:
                deadline.check()
            except ExportError:
                deadline.cancel()
                # A queued operation checks cancellation before any source access.
                # A running call may finish later; its result is never consumed.
                raise
    deadline.check()
    if operation.error is not None:
        raise operation.error
    return operation.result


def main():
    require(sys.version_info[:2] == (2, 7) and sys.platform.startswith('java'), 'MONEYDANCE_JYTHON_27_REQUIRED')
    book = moneydance.getCurrentAccountBook()
    require(book is not None, 'OPEN_BOOK_REQUIRED')
    chooser = JFileChooser()
    chooser.setDialogTitle('Save Moneydance Snapshot v1 JSON')
    chooser.setSelectedFile(File('snapshot.json'))
    if chooser.showSaveDialog(None) != JFileChooser.APPROVE_OPTION:
        print('EXPORT_CANCELLED')
        return
    target = chooser.getSelectedFile().getAbsoluteFile()
    operation = CaptureOnUIThread(book)
    if SwingUtilities.isEventDispatchThread():
        operation.run()
    else:
        SwingUtilities.invokeAndWait(operation)
    if operation.error is not None:
        raise operation.error
    require(moneydance.getCurrentAccountBook() == book, 'SOURCE_BOOK_CHANGED')
    snapshot = build_snapshot(operation.result, datetime.datetime.utcnow(), 'Moneydance build %d' % int(moneydance.getBuild()))
    atomic_save(snapshot, target)
    print('EXPORT_OK: schemaVersion=1 entries=%d' % len(snapshot['entries']))


if not globals().get('_EXPORT_LIBRARY_ONLY', False):
    try:
        main()
    except ExportError as error:
        print('EXPORT_FAILED: ' + str(error))
    except (Exception, JavaException):
        # Do not log exception messages containing private record contents or paths.
        print('EXPORT_FAILED: RUNTIME_OR_IO_ERROR (last valid export retained)')
