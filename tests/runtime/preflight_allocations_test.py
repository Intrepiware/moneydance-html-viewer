"""Synthetic diagnostic checks; no Moneydance book is read."""
import os
import runpy
import unittest
api = runpy.run_path(os.path.join(os.path.dirname(__file__), '..', '..', 'scripts', 'moneydance-preflight.py'),
                    init_globals={'_PREFLIGHT_LIBRARY_ONLY': True})
probe = api['probe_allocations']

class Account(object):
    def getUUID(self): return 'synthetic-account'
    def balanceIsNegated(self): return False

class Txn(object):
    def getDateInt(self): return 20260902
    def getDescription(self): return 'Refund'
    def getUUID(self): return 'synthetic-row'
    def getSyncTimestamp(self): return 1
    def getParentTxn(self): return self
    def getOtherTxnCount(self): return 1
    def getOtherTxn(self, i): return self
    def getMemo(self): return 'Refund memo'
    def getKeywords(self): return ['Refund tag']
    def getAccount(self): return Account()
    def getValue(self): return 500
    def getParentAmount(self): return 500

class Book(object):
    def getRootAccount(self): return Account()

class DiagnosticsTests(unittest.TestCase):
    def setUp(self):
        scope = probe.func_globals
        scope['find_account'] = lambda root, path: Account()
        scope['read_rows'] = lambda book, account: [Txn()]
        scope['fingerprint'] = lambda account, rows: 'unchanged'
        self.case = {'accountPath':['Synthetic'], 'date':20260902, 'description':'Refund',
                     'amountCents':500, 'allocations':[{'accountPath':['Synthetic'],
                     'amountCents':500, 'memo':'Refund memo', 'tags':['Refund tag']}]}

    def test_correct_reference_passes_every_check(self):
        self.assertTrue(all(ok for label, ok, detail in probe(Book(), self.case)))

    def test_wrong_date_reports_selection_counts(self):
        self.case['date'] = 20260903
        label, ok, detail = probe(Book(), self.case)[0]
        self.assertEqual(label, 'row-selection')
        self.assertFalse(ok)
        self.assertEqual(detail['datesWithExpectedDescription'], [20260902])

    def test_memo_and_tag_failures_are_independent(self):
        self.case['allocations'][0]['memo'] = ''
        self.case['allocations'][0]['tags'] = []
        failures = [label for label, ok, detail in probe(Book(), self.case) if not ok]
        self.assertEqual(failures, ['split-1-memo', 'split-1-tags'])

if __name__ == '__main__': unittest.main()
