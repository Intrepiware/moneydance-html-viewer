# -*- coding: utf-8 -*-
"""Read-only Jython 2.7 probe. Run inside Moneydance, not standalone Python.

Select a private reference JSON prepared from independently checked register values.
Failed reference checks include expected/actual values for the controlled test book.
No book setters are used; balance caches below belong to a new detached TxnSet.
"""
import json
import sys
import datetime
from javax.swing import JFileChooser
from com.infinitekind.moneydance.model import TxnSet

REQUIRED_CASES = (
    'debit-credit', 'opening-only', 'same-day-order', 'split', 'transfer',
    'future', 'hidden-nonzero', 'active-under-hidden', 'income-sign',
    'investment-cash')


def find_account(root, path):
    current = root
    for name in path:
        matches = [current.getSubAccount(i)
                   for i in range(current.getSubAccountCount())
                   if unicode(current.getSubAccount(i).getAccountName()) == name]
        if len(matches) != 1:
            raise ValueError('REFERENCE_ACCOUNT_NOT_UNIQUE')
        current = matches[0]
    return current


def read_rows(book, account):
    source = book.getTransactionSet().getTransactionsForAccount(account)
    # Do not use TxnSet.iterator(): its documented iteration order is reversed.
    return [source.getTxn(i) for i in range(source.getSize())]


def fingerprint(account, rows):
    return (long(account.getStartBalance()),
            tuple((unicode(t.getUUID()), int(t.getDateInt()), long(t.getValue()))
                  for t in rows))


def own_at(book, account, date):
    # Candidate complete-history calculation to compare to independent references.
    # This does not establish historical security valuation.
    currency = account.getCurrencyType()
    if unicode(currency.getIDString()) != 'USD':
        raise ValueError('NON_USD_DATED_VALUATION_UNVERIFIED')
    raw = long(account.getStartBalance())
    for txn in read_rows(book, account):
        if int(txn.getDateInt()) <= date:
            raw += long(txn.getValue())
    return raw


def recursive_at(book, account, date):
    raw = own_at(book, account, date)
    for i in range(account.getSubAccountCount()):
        raw += recursive_at(book, account.getSubAccount(i), date)
    return raw


def register_description(txn):
    # Verified on build 5253: an empty split description displays its parent's
    # description in the register. Preserve nonempty account-side descriptions;
    # their precedence still needs a separate source-reference comparison.
    description = unicode(txn.getDescription() or '')
    if description:
        return description
    parent = txn.getParentTxn()
    if parent is not None:
        return unicode(parent.getDescription() or '')
    return description


def probe_case(book, case):
    account = find_account(book.getRootAccount(), case['accountPath'])
    if unicode(account.getCurrencyType().getIDString()) != 'USD':
        raise ValueError('REFERENCE_MUST_BE_USD')
    rows = read_rows(book, account)
    before = fingerprint(account, rows)
    sign = -1 if account.balanceIsNegated() else 1
    # Stable date sort is a candidate only. Same-day reference comparisons below
    # must establish whether it matches the actual register; never invent a tie key.
    ordered = sorted(rows, key=lambda t: int(t.getDateInt()))
    detached = TxnSet()
    for txn in ordered:
        detached.addTxn(txn)
    detached.setHoldBalances(True)
    detached.recalcBalances(long(account.getStartBalance()), bool(account.balanceIsNegated()))
    checks = []

    def check(label, result, detail=None):
        checks.append((label, bool(result), detail))
    running = long(account.getStartBalance()) * sign
    check('opening-sign-policy', running == long(account.getUserStartBalance()))
    observed = []
    for i, txn in enumerate(ordered):
        amount = long(txn.getValue()) * sign
        running += amount
        check('row-%d-sdk-running-balance' % (i + 1), long(detached.getBalanceAt(i)) == running)
        check('row-%d-account-identity' % (i + 1), unicode(txn.getAccount().getUUID()) == unicode(account.getUUID()))
        observed.append({'date': int(txn.getDateInt()),
                         'description': register_description(txn),
                         'amountCents': amount, 'runningBalanceCents': running})
    check('calculated-closing-vs-source', running == long(account.getUserBalance()))
    # Require the complete ascending reference register, so omissions/ties cannot
    # accidentally pass a subset comparison. Only failed reference values are printed.
    check('reference-entry-count', len(observed) == len(case['entries']))
    for row_index, (actual, expected) in enumerate(zip(observed, case['entries'])):
        for field in ('date', 'description', 'amountCents', 'runningBalanceCents'):
            check('reference-row-%d-%s' % (row_index + 1, field),
                  actual[field] == expected.get(field),
                  {'expected': expected.get(field), 'actual': actual[field]})
            if field == 'description' and actual[field] != expected.get(field):
                txn = ordered[row_index]
                try:
                    parent = txn.getParentTxn()
                    parent_description = unicode(parent.getDescription() or '')
                    detail = {'expected': expected.get(field),
                              'accountSideDescription': unicode(txn.getDescription() or ''),
                              'resolvedDescription': actual[field],
                              'parentDescription': parent_description,
                              'parentMatchesReference': parent_description == expected.get(field),
                              'isSplit': unicode(txn.getUUID()) != unicode(parent.getUUID())}
                    print('  reference-row-%d-description-diagnostic: %s' %
                          (row_index + 1, json.dumps(detail, ensure_ascii=True)))
                except Exception:
                    print('  reference-row-%d-parent-description: API_UNVERIFIED' % (row_index + 1))
    check('reference-opening', long(account.getUserStartBalance()) == case['openingBalanceCents'])
    check('reference-closing', long(account.getUserBalance()) == case['closingBalanceCents'])
    check('reference-recursive-closing', long(account.getRecursiveUserBalance()) == case['recursiveClosingBalanceCents'])
    today = int(datetime.date.today().strftime('%Y%m%d'))
    check('current-own-vs-source', own_at(book, account, today) * sign == long(account.getUserCurrentBalance()))
    check('current-recursive-vs-source', recursive_at(book, account, today) * sign == long(account.getRecursiveUserCurrentBalance()))
    if len(case['dates']) < 2:
        raise ValueError('MULTIPLE_REFERENCE_DATES_REQUIRED')
    for date_index, ref in enumerate(case['dates']):
        check('reference-date-%d-own' % (date_index + 1), own_at(book, account, int(ref['date'])) * sign == ref['ownBalanceCents'])
        check('reference-date-%d-sidebar' % (date_index + 1), recursive_at(book, account, int(ref['date'])) * sign == ref['sidebarBalanceCents'])
    check('source-fingerprint-unchanged', before == fingerprint(account, read_rows(book, account)))
    return checks


def probe_allocations(book, case):
    account = find_account(book.getRootAccount(), case['accountPath'])
    rows = read_rows(book, account)
    selected = [t for t in rows if int(t.getDateInt()) == case['date']
                and register_description(t) == case['description']]
    if len(selected) != 1:
        return [('row-selection', False, {
            'expectedDate': case['date'], 'expectedDescription': case['description'],
            'exactMatches': len(selected),
            'rowsOnExpectedDate': sum(1 for t in rows if int(t.getDateInt()) == case['date']),
            'datesWithExpectedDescription': sorted(set(int(t.getDateInt()) for t in rows
                if register_description(t) == case['description']))})]
    txn = selected[0]
    before = fingerprint(account, rows)
    stamp = long(txn.getSyncTimestamp())
    parent = txn.getParentTxn()
    split = unicode(txn.getUUID()) != unicode(parent.getUUID())
    sign = -1 if account.balanceIsNegated() else 1
    observed = []
    for i in range(txn.getOtherTxnCount()):
        other = txn.getOtherTxn(i)
        source = txn if split else other
        source_memo = source.getMemo() if hasattr(source, 'getMemo') else source.getDescription()
        observed.append({'accountId': unicode(other.getAccount().getUUID()),
                         'amountCents': long(txn.getValue() if split else other.getParentAmount()) * sign,
                         'memo': unicode(source_memo or ''),
                         'tags': sorted(set(unicode(t) for t in (source.getKeywords() or [])))})
    expected = []
    for allocation in case['allocations']:
        target = find_account(book.getRootAccount(), allocation['accountPath'])
        expected.append({'accountId': unicode(target.getUUID()), 'amountCents': allocation['amountCents'],
                         'memo': allocation['memo'], 'tags': allocation['tags']})
    checks = []
    def compare(label, actual, wanted, disclose=True):
        checks.append((label, actual == wanted,
                       {'expected': wanted, 'actual': actual} if disclose else None))
    compare('selected-row-amount', long(txn.getValue()) * sign, case['amountCents'])
    compare('allocation-count', len(observed), len(expected))
    for index, (actual, wanted) in enumerate(zip(observed, expected)):
        for field in ('accountId', 'amountCents', 'memo', 'tags'):
            compare('split-%d-%s' % (index + 1, field), actual[field], wanted[field], field != 'accountId')
    compare('allocation-total', sum(a['amountCents'] for a in observed), case['amountCents'])
    compare('source-fingerprint-unchanged', before == fingerprint(account, read_rows(book, account)), True)
    compare('source-stamp-unchanged', stamp == long(txn.getSyncTimestamp()), True)
    return checks


def main():
    if sys.version_info[:2] != (2, 7) or not sys.platform.startswith('java'):
        print('PREFLIGHT_BLOCKED: MONEYDANCE_JYTHON_27_REQUIRED')
        return
    book = moneydance.getCurrentAccountBook()
    if book is None:
        print('PREFLIGHT_BLOCKED: OPEN_REFERENCE_BOOK_REQUIRED')
        return
    chooser = JFileChooser()
    chooser.setDialogTitle('Choose private Moneydance preflight reference JSON')
    if chooser.showOpenDialog(None) != JFileChooser.APPROVE_OPTION:
        print('PREFLIGHT_CANCELLED')
        return
    try:
        with open(unicode(chooser.getSelectedFile().getAbsolutePath()), 'r') as handle:
            reference = json.load(handle)
        # Runtime version is public metadata; do not print arbitrary exception text.
        print('Jython: %s.%s.%s' % sys.version_info[:3])
        try:
            print('Moneydance build: %d' % int(moneydance.getBuild()))
        except Exception:
            print('Moneydance build: UNVERIFIED (record from About Moneydance)')
        passed_tags = set()
        failures = 0
        for index, case in enumerate(reference['cases']):
            try:
                checks = probe_case(book, case)
                passed = all(result for label, result, detail in checks)
                count = len(checks)
                print('Case %d: %s (%d comparisons)' % (index + 1, 'PASS' if passed else 'FAIL', count))
                for label, result, detail in checks:
                    print('  %s: %s' % (label, 'PASS' if result else 'FAIL'))
                    if not result and detail is not None:
                        print('    %s' % json.dumps(detail, ensure_ascii=True))
                if passed:
                    passed_tags.update(tag for tag in case.get('covers', []) if tag in REQUIRED_CASES)
                else:
                    failures += 1
            except Exception:
                failures += 1
                print('Case %d: BLOCKED (reference or runtime API requires review)' % (index + 1))
        for index, case in enumerate(reference.get('allocationCases', [])):
            try:
                checks = probe_allocations(book, case)
                passed = all(result for label, result, detail in checks)
            except Exception as error:
                passed = False
                # Never print arbitrary Java exception text or financial objects.
                known = ('REFERENCE_ACCOUNT_NOT_UNIQUE', 'REFERENCE_MUST_BE_USD')
                code = str(error) if str(error) in known else 'REFERENCE_OR_RUNTIME_API_ERROR'
                checks = [(code, False, {'exceptionType': type(error).__name__})]
            print('Allocation case %d: %s' % (index + 1, 'PASS' if passed else 'FAIL'))
            for label, result, detail in checks:
                if not result:
                    print('  %s: FAIL' % label)
                    if detail is not None:
                        print('    %s' % json.dumps(detail, ensure_ascii=True))
            if not passed:
                failures += 1
        required = () if reference.get('scope') == 'allocations' else REQUIRED_CASES
        if reference.get('scope') == 'allocations' and not reference.get('allocationCases'):
            failures += 1
        for tag in required:
            print('%s: %s' % (tag, 'REFERENCE_COMPARED' if tag in passed_tags else 'UNVERIFIED'))
        if failures or set(required) - passed_tags:
            print('PREFLIGHT_BLOCKED: reference coverage or comparisons incomplete')
        else:
            print('PREFLIGHT_REFERENCE_CHECKS_PASS: manually confirm coverage and source UI order; this is not viewer/device acceptance')
    except Exception:
        print('PREFLIGHT_BLOCKED: INVALID_REFERENCE_INPUT')


if not globals().get('_PREFLIGHT_LIBRARY_ONLY', False):
    main()
