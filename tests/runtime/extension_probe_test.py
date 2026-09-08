# -*- coding: utf-8 -*-
"""Run with bundled Moneydance Jython; no Moneydance UI or book is opened."""
import json
import os
import runpy
import tempfile
import unittest
from java.io import File
from java.lang import Class, StackTraceElement

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
Probe = runpy.run_path(os.path.join(ROOT, 'scripts', 'extension-preflight.py'))['CompatibilityProbe']


class Root(object):
    def getSubAccountCount(self): return 2


class Transactions(object):
    def getTransactionCount(self): return 4


class Book(object):
    def getRootAccount(self): return Root()
    def getTransactionSet(self): return Transactions()


class Context(object):
    def __init__(self): self.book = Book()
    def getCurrentAccountBook(self): return self.book


class ProbeTest(unittest.TestCase):
    def test_window_class_name_collision_in_ui_inspection(self):
        class WindowClass(object):
            def getClass(self):
                return Class.forName('com.moneydance.apps.md.view.gui.MainFrame')
        class UIContext(WindowClass):
            def getUI(self): return WindowClass()
        self.probe.context = UIContext()
        self.probe.inspect_ui()
        kinds = [r['kind'] for r in self.rows()]
        self.assertIn('GUI_API', kinds)
        self.assertIn('UI_SCAN_COMPLETE', kinds)
        self.assertNotIn('UI_SCAN_FAILED', kinds)

    def test_call_path_excludes_private_frames_files_and_lines(self):
        frames = [StackTraceElement('com.moneydance.Example', 'shutdown', 'PRIVATE-PATH', 123),
            StackTraceElement('private.script', 'PRIVATE-NAME', 'PRIVATE-PATH', 456)]
        self.assertEqual(Probe.lifecycle_call_path(frames), ['com.moneydance.Example.shutdown'])

    def test_gui_parameter_signatures_under_real_jython(self):
        class GUIClass(object):
            def getClass(self):
                return Class.forName('com.moneydance.apps.md.view.gui.MoneydanceGUI')
        signatures = Probe().methods(GUIClass())
        self.assertTrue(any('setStatus(' in signature for signature in signatures))

    def test_exporter_library_load_does_not_launch_export(self):
        library = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
            init_globals={'_EXPORT_LIBRARY_ONLY': True})
        self.assertTrue(callable(library['capture']))

    def test_capture_requires_arm_and_close_and_runs_once(self):
        calls = []
        self.probe.capture_on_close = lambda: calls.append(True)
        self.probe.handle_event('md:file:postsave')
        self.probe.capture_armed = True
        self.probe.handle_event('md:file:postsave')
        self.assertEqual(calls, [])
        self.probe.handle_event('md:file:closing')
        self.probe.handle_event('md:file:postsave')
        self.probe.handle_event('md:file:postsave')
        self.assertEqual(calls, [True])

    def test_capture_detaches_and_exit_checks_candidate(self):
        class Operation(object):
            def __init__(self, book):
                self.result = []
                self.error = None
            def run(self): pass
        self.probe.context.getBuild = lambda: 5253
        self.probe.exporter = {'CaptureOnUIThread': Operation,
            'build_snapshot': lambda *args: {'entries': [{'description': 'PRIVATE-TEXT'}]}}
        self.probe.capture_on_close()
        self.assertIsNotNone(self.probe.candidate)
        self.probe.context.book = None
        self.probe.handle_event('md:app:exiting')
        rows = self.rows()
        self.assertTrue(rows[-1]['unchanged'])
        self.assertIsNone(self.probe.candidate)
        self.assertNotIn('PRIVATE-TEXT', json.dumps(rows))

    def setUp(self):
        handle, self.path = tempfile.mkstemp(suffix='.log')
        os.close(handle)
        self.probe = Probe()
        self.probe.target = File(self.path)
        self.probe.context = Context()

    def tearDown(self):
        os.remove(self.path)

    def rows(self):
        with open(self.path) as source:
            return [json.loads(line) for line in source]

    def test_lifecycle_and_book_teardown_are_recorded_without_source_content(self):
        self.probe.handle_event('md:file:postsave')
        self.probe.handle_event('md:account:select:PRIVATE-ACCOUNT-ID')
        self.probe.context.book = None
        self.probe.handle_event('md:file:closed')
        self.probe.unload()
        self.probe.handle_event('md:app:exiting')
        rows = self.rows()
        self.assertEqual([r['kind'] for r in rows], ['md:file:postsave', 'LIFECYCLE_CALL_PATH', 'md:file:closed', 'UNLOAD'])
        self.assertTrue(rows[0]['bookReadable'])
        self.assertEqual(rows[0]['transactionCount'], 4)
        self.assertFalse(rows[2]['bookAvailable'])
        self.assertEqual([r['sequence'] for r in rows], [1, 2, 3, 4])
        self.assertIsNone(self.probe.context)
        self.assertNotIn('PRIVATE-ACCOUNT-ID', json.dumps(rows))

    def test_unreadable_book_records_safe_failure_and_continues(self):
        class Broken(Context):
            def getCurrentAccountBook(self): raise ValueError('PRIVATE-DATA')
        self.probe.context = Broken()
        self.probe.handle_event('md:file:closing')
        row = self.rows()[0]
        self.assertEqual(row['readError'], 'BOOK_READ_FAILED')
        self.assertNotIn('PRIVATE-DATA', json.dumps(row))

    def test_hold_runs_once_and_logs_completion(self):
        self.probe.hold_once = True
        self.probe.handle_event('md:app:exiting')
        self.probe.handle_event('md:app:exiting')
        rows = [r for r in self.rows() if r['kind'] != 'LIFECYCLE_CALL_PATH']
        self.assertEqual([r['kind'] for r in rows],
            ['md:app:exiting', 'EXIT_HOLD_BEGIN', 'EXIT_HOLD_END', 'md:app:exiting'])
        self.assertGreaterEqual(rows[2]['elapsedMs'] - rows[1]['elapsedMs'], 1900)
        self.assertFalse(self.probe.hold_once)


if __name__ == '__main__':
    unittest.main()
