# -*- coding: utf-8 -*-
"""Run in Moneydance Developer Console with the synthetic book open; no file save."""
import os
import runpy
import copy
import datetime
from java.lang import Exception as JavaException


def verify(context):
    api = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'export_json.py'),
        init_globals={'_EXPORT_LIBRARY_ONLY': True})
    book = context.getCurrentAccountBook()
    api['require'](book is not None, 'OPEN_BOOK_REQUIRED')
    # Same stable source before/after; compare full detached values and stamps.
    before = api['capture_stable'](book, api['Deadline']())
    instant = datetime.datetime.utcnow()
    source = 'Moneydance build %d' % context.getBuild()
    ordinary = api['build_snapshot'](copy.deepcopy(before), instant, source)
    timed = api['build_snapshot'](copy.deepcopy(before), instant, source, api['Deadline']())
    after = api['capture_stable'](book, api['Deadline']())
    api['require'](before == after, 'SOURCE_CHANGED')
    api['require'](ordinary == timed, 'OUTPUT_CHANGED')
    try:
        api['capture_stable'](book, api['Deadline'](0))
        raise AssertionError('EXPIRED_CAPTURE_ACCEPTED')
    except api['ExportError'] as failure:
        api['require'](str(failure) == 'EXPORT_TIMEOUT', 'WRONG_TIMEOUT_RESULT')
    print('DEADLINE_SOURCE_PASS: entries=%d stable=true outputEqual=true timeoutRejected=true' % len(timed['entries']))


try:
    verify(moneydance)
except (Exception, JavaException):
    print('DEADLINE_SOURCE_FAILED: synthetic validation incomplete')
