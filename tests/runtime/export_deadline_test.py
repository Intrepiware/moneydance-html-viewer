# -*- coding: utf-8 -*-
"""Bundled Jython tests; fake source, not Moneydance source acceptance."""
import os
import runpy
import unittest
import datetime
from java.lang import Runnable
from java.util.concurrent import CountDownLatch, TimeUnit
from javax.swing import SwingUtilities

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
api = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
    init_globals={'_EXPORT_LIBRARY_ONLY': True})


class Kind(object):
    def __init__(self, value): self.value = value
    def name(self): return self.value


class Currency(object):
    def getIDString(self): return 'USD'


class Account(object):
    def __init__(self, root=False):
        self.root = root
        self.children = [Account()] if root else []
    def getUUID(self): return 'root' if self.root else 'bank'
    def getAccountType(self): return Kind('ROOT' if self.root else 'BANK')
    def getCurrencyType(self): return Currency()
    def getAccountIsInactive(self): return False
    def balanceIsNegated(self): return False
    def getAccountName(self): return 'Synthetic'
    def getStartBalance(self): return 12500
    def getUserBalance(self): return 12500
    def getUserCurrentBalance(self): return 12500
    def getRecursiveUserBalance(self): return 12500
    def getRecursiveUserCurrentBalance(self): return 12500
    def getSyncTimestamp(self): return 1
    def getSubAccountCount(self): return len(self.children)
    def getSubAccount(self, index): return self.children[index]


class EmptyTransactions(object):
    def getTransactionsForAccount(self, account): return self
    def getSize(self): return 0


class Book(object):
    def __init__(self): self.root = Account(True); self.reads = 0
    def getRootAccount(self): self.reads += 1; return self.root
    def getTransactionSet(self): return EmptyTransactions()


class DeadlineTests(unittest.TestCase):
    def test_deadline_boundary_and_cancellation(self):
        now = [0]
        deadline = api['Deadline'](1, lambda: now[0])
        deadline.check()
        now[0] = 1000000000
        self.assertRaises(api['ExportError'], deadline.check)
        other = api['Deadline']()
        other.cancel()
        self.assertRaises(api['ExportError'], other.check)

    def test_stable_capture_and_unchanged_financial_output(self):
        book = Book()
        ordinary = api['capture'](book)
        timed = api['capture_stable'](book, api['Deadline']())
        self.assertEqual(ordinary, timed)
        instant = datetime.datetime.utcnow()
        expected = api['build_snapshot'](ordinary, instant, 'test')
        actual = api['build_snapshot'](timed, instant, 'test', api['Deadline']())
        self.assertEqual(expected, actual)
        self.assertEqual(actual['accounts']['children'][0]['closingBalanceCents'], 12500)
        self.assertEqual(book.root.children[0].getStartBalance(), 12500)
        self.assertEqual(book.root.children[0].getSyncTimestamp(), 1)

    def test_source_change_between_captures_rejected(self):
        class Changing(Book):
            def getRootAccount(self):
                self.root.children[0].getSyncTimestamp = lambda: self.reads
                return Book.getRootAccount(self)
        self.assertRaises(api['ExportError'], api['capture_stable'], Changing(), api['Deadline']())

    def test_expired_build_rejected(self):
        records = api['capture'](Book())
        self.assertRaises(api['ExportError'], api['build_snapshot'], records,
            datetime.datetime.utcnow(), 'test', api['Deadline'](0))

    def test_queued_timeout_never_reads_source(self):
        entered, release, flushed = CountDownLatch(1), CountDownLatch(1), CountDownLatch(1)
        class Block(Runnable):
            def run(self):
                entered.countDown()
                getattr(release, 'await')(3, TimeUnit.SECONDS)
        class Flush(Runnable):
            def run(self): flushed.countDown()
        SwingUtilities.invokeLater(Block())
        self.assertTrue(getattr(entered, 'await')(2, TimeUnit.SECONDS))
        book = Book()
        try:
            self.assertRaises(api['ExportError'], api['capture_stable'], book, api['Deadline'](.05))
        finally:
            release.countDown()
        SwingUtilities.invokeLater(Flush())
        self.assertTrue(getattr(flushed, 'await')(2, TimeUnit.SECONDS))
        self.assertEqual(book.reads, 0)


if __name__ == '__main__': unittest.main()
