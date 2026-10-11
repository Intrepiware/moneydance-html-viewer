# -*- coding: utf-8 -*-
"""Synthetic tag-location regressions; not in-Moneydance source acceptance."""
import os
import runpy
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
api = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
    init_globals={'_EXPORT_LIBRARY_ONLY': True})


class Transaction(object):
    def __init__(self, identity, keywords=None):
        self.identity = identity
        self.keywords = keywords
        self.others = []
    def getUUID(self): return self.identity
    def getKeywords(self): return self.keywords
    def getOtherTxnCount(self): return len(self.others)
    def getOtherTxn(self, index): return self.others[index]


class TagTests(unittest.TestCase):
    def example(self, parent_tags=None):
        parent = Transaction('synthetic-parent', parent_tags)
        first = Transaction('synthetic-first', [u'Example.Travel.2026'])
        second = Transaction('synthetic-second', [u'Example.Meals'])
        parent.others = [first, second]
        first.others = second.others = [parent]
        return parent, first, second

    def test_parent_collects_split_only_tags_with_no_parent_tags(self):
        parent, first, second = self.example()
        self.assertEqual(api['entry_tags'](parent, parent),
            [u'Example.Meals', u'Example.Travel.2026'])
        self.assertIsNone(parent.keywords)
        self.assertEqual(first.keywords, [u'Example.Travel.2026'])
        self.assertEqual(second.keywords, [u'Example.Meals'])

    def test_split_never_inherits_sibling_tags(self):
        parent, first, second = self.example([u'Shared'])
        self.assertEqual(api['entry_tags'](first, parent), [u'Example.Travel.2026', u'Shared'])
        self.assertEqual(api['entry_tags'](second, parent), [u'Example.Meals', u'Shared'])

    def test_parent_and_split_duplicates_unicode_and_empty_tags(self):
        parent, first, second = self.example([u'Shared', u'Example.Travel.2026'])
        first.keywords += [u'Shared', u'caf\u00e9', u'<literal>']
        second.keywords = []
        self.assertEqual(api['entry_tags'](parent, parent),
            [u'<literal>', u'Example.Travel.2026', u'Shared', u'caf\u00e9'])
        parent.keywords = first.keywords = []
        self.assertEqual(api['entry_tags'](parent, parent), [])

    def test_parent_identity_does_not_require_same_python_wrapper(self):
        parent, first, second = self.example()
        wrapper = Transaction(parent.identity)
        self.assertEqual(api['entry_tags'](parent, wrapper),
            [u'Example.Meals', u'Example.Travel.2026'])

    def test_cancelled_export_stops_tag_traversal(self):
        parent, first, second = self.example()
        deadline = api['Deadline']()
        deadline.cancel()
        self.assertRaises(api['ExportError'], api['entry_tags'], parent, parent, deadline)


if __name__ == '__main__': unittest.main()
