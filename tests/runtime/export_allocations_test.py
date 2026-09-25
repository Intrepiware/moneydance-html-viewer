# -*- coding: utf-8 -*-
"""Fake-source checks under bundled Jython; actual Moneydance remains a gate."""
import os
import runpy
import unittest
api = runpy.run_path(os.path.join(os.path.dirname(__file__), '..', '..', 'export_json.py'),
                    init_globals={'_EXPORT_LIBRARY_ONLY': True})

class Account(object):
    def getUUID(self): return 'destination'
    def getAccountName(self): return 'Destination'

class Txn(object):
    def __init__(self, value, parent_amount, tags):
        self.value, self.parent_amount, self.tags = value, parent_amount, tags
    def getAccount(self): return Account()
    def getValue(self): return self.value
    def getParentAmount(self): return self.parent_amount
    def getKeywords(self): return self.tags
    def getDescription(self): return 'Literal <memo>'

class AllocationTests(unittest.TestCase):
    def test_parent_uses_parent_units_and_split_tags(self):
        parent, split = Txn(-500000, 0, ['Parent']), Txn(400000, -400000, ['Split', 'Split'])
        result=api['capture_allocation'](parent, split, False, 1)
        self.assertEqual(result['amountCents'], -400000)
        self.assertEqual(result['tags'], ['Split'])
        self.assertEqual(result['memo'], 'Literal <memo>')

    def test_split_uses_own_value_and_never_parent_tags(self):
        split, parent=Txn(-100000, 100000, ['Selected']), Txn(500000, 0, ['SiblingUnion'])
        result=api['capture_allocation'](split, parent, True, 1)
        self.assertEqual(result['amountCents'], -100000)
        self.assertEqual(result['tags'], ['Selected'])

    def test_negated_sign_refund_and_zero(self):
        for value in [-2500,0,2500]:
            txn=Txn(value,value,[])
            self.assertEqual(api['capture_allocation'](txn,txn,False,-1)['amountCents'],-value)
            self.assertEqual(api['capture_allocation'](txn,txn,True,-1)['amountCents'],-value)

    def test_deadline_and_unsafe_values(self):
        txn=Txn(9007199254740992,9007199254740992,[])
        self.assertRaises(api['ExportError'],api['capture_allocation'],txn,txn,False,1)
        self.assertRaises(api['ExportError'],api['capture_allocation'],txn,txn,True,1,api['Deadline'](0))

if __name__ == '__main__': unittest.main()
