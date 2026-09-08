# -*- coding: utf-8 -*-
"""Temporary Jython 2.7 probe; optional in-memory export, no cloud/book writes.

Run using Developer Console, accept runtime installation, then use the
Compatibility Probe menu. This does NOT establish persistent MXT installation.
"""
import json
import threading
import os
import runpy
import datetime
import hashlib
from java.lang import System, Thread, Class, Runnable, Exception as JavaException
from java.util.concurrent import CountDownLatch, TimeUnit
from java.io import File, FileOutputStream, OutputStreamWriter
from java.awt import Frame, Container
from javax.swing import JFileChooser, SwingUtilities

EVENTS = frozenset(('md:file:opening', 'md:file:opened', 'md:file:closing',
    'md:file:closed', 'md:file:presave', 'md:file:postsave',
    'md:file:backupstarted', 'md:file:backupfinished', 'md:app:exiting'))


class CompatibilityProbe(object):
    def __init__(self):
        self.context = None
        self.target = None
        self.lock = threading.RLock()
        self.started = System.nanoTime()
        self.sequence = 0
        self.hold_once = False
        self.stopped = False
        self.capture_armed = False
        self.closing = False
        self.candidate = None
        self.exporter = None

    def getName(self):
        return 'Snapshot Compatibility Probe'

    def initialize(self, context, extension_object):
        self.context = context
        for command, label in (('start', 'Compatibility Probe: Start logging'),
                ('inspect', 'Compatibility Probe: Record book and UI capabilities'),
                ('hold', 'Compatibility Probe: Arm one 2-second exit hold'),
                ('capture', 'Compatibility Probe: Arm synthetic close capture once'),
                ('stop', 'Compatibility Probe: Stop logging')):
            context.registerFeature(extension_object, 'snapshot_probe_' + command,
                                    None, label)
        print('PROBE_READY: choose Compatibility Probe: Start logging from Extensions')

    def record(self, kind, **details):
        with self.lock:
            if self.target is None or self.stopped:
                return
            self.sequence += 1
            row = {'sequence': self.sequence, 'kind': kind,
                   'utcEpochMs': long(System.currentTimeMillis()),
                   'elapsedMs': long((System.nanoTime() - self.started) // 1000000),
                   'onEDT': bool(SwingUtilities.isEventDispatchThread())}
            row.update(details)
            try:
                stream = FileOutputStream(self.target, True)
                writer = OutputStreamWriter(stream, 'UTF-8')
                try:
                    writer.write(json.dumps(row, sort_keys=True) + '\n')
                    writer.flush()
                    stream.getFD().sync()
                finally:
                    writer.close()
            except (Exception, JavaException):
                # Never print Java exception messages, paths or source objects.
                self.stopped = True
                print('PROBE_LOG_WRITE_FAILED: logging stopped')

    def book_state(self, kind):
        fields = {'bookAvailable': False, 'bookReadable': False}
        try:
            book = self.context.getCurrentAccountBook()
            fields['bookAvailable'] = book is not None
            if book is not None:
                root = book.getRootAccount()
                fields['transactionCount'] = int(book.getTransactionSet().getTransactionCount())
                fields['rootChildCount'] = int(root.getSubAccountCount())
                fields['bookReadable'] = True
            # No book/root reference is retained beyond this callback.
        except (Exception, JavaException):
            fields['readError'] = 'BOOK_READ_FAILED'
        self.record(kind, **fields)

    def methods(self, instance):
        # Class signatures only. Never inspect fields, UI text, URLs or account names.
        result = []
        for method in instance.getClass().getMethods():
            name = unicode(method.getName())
            if any(part in name.lower() for part in ('status', 'progress', 'exit',
                                                     'shutdown', 'save', 'frame', 'close', 'quit')):
                result.append('%s(%s):%s' % (name,
                    ','.join(unicode(Class.getName(p)) for p in method.getParameterTypes()),
                    unicode(Class.getName(method.getReturnType()))))
        return sorted(set(result))

    def inspect_ui(self):
        # Called only from the EDT; no component mutation or click interception.
        stage = 'context_methods'
        try:
            self.record('CONTEXT_API', className=unicode(Class.getName(self.context.getClass())),
                        methods=self.methods(self.context))
            stage = 'get_ui'
            gui = self.context.getUI()
            stage = 'gui_class'
            gui_class = unicode(Class.getName(gui.getClass()))
            self.record('GUI_CLASS', className=gui_class)
            stage = 'gui_methods'
            self.record('GUI_API', className=unicode(Class.getName(gui.getClass())),
                        methods=self.methods(gui))
            visited = [0]

            def walk(component, depth):
                if visited[0] >= 2000 or depth > 64:
                    return
                visited[0] += 1
                name = unicode(Class.getName(component.getClass()))
                if 'status' in name.lower() or 'progress' in name.lower():
                    self.record('STATUS_COMPONENT', className=name,
                        methods=self.methods(component),
                        mouseListenerCount=len(component.getMouseListeners()))
                if isinstance(component, Container):
                    for child in component.getComponents():
                        walk(child, depth + 1)

            stage = 'component_scan'
            for frame in Frame.getFrames():
                if frame.isDisplayable():
                    walk(frame, 0)
            self.record('UI_SCAN_COMPLETE', componentsVisited=visited[0],
                        scanLimitReached=visited[0] >= 2000)
        except (Exception, JavaException) as error:
            # Exception TYPE only, never its message or object representation.
            error_type = unicode(type(error).__name__)
            self.record('UI_SCAN_FAILED', code='PUBLIC_UI_INSPECTION_FAILED',
                        stage=stage, errorType=error_type)

    def invoke(self, uri):
        # Invocation strings may have a trailing colon/parameter; never log them.
        command = unicode(uri).split(':', 1)[0].split('?', 1)[0]
        if not SwingUtilities.isEventDispatchThread():
            SwingUtilities.invokeLater(lambda: self.invoke(command))
            return
        if command == 'snapshot_probe_start':
            chooser = JFileChooser()
            chooser.setDialogTitle('Choose a NEW sanitized compatibility log')
            chooser.setSelectedFile(File('moneydance-compatibility.log'))
            if chooser.showSaveDialog(None) != JFileChooser.APPROVE_OPTION:
                return
            target = chooser.getSelectedFile().getAbsoluteFile()
            # Refuse existing paths instead of overwriting/appending another run.
            try:
                if not target.createNewFile():
                    print('PROBE_LOG_EXISTS: choose a new filename')
                    return
            except (Exception, JavaException):
                print('PROBE_LOG_CREATE_FAILED: choose another location')
                return
            with self.lock:
                self.target = target
                self.sequence = 0
                self.started = System.nanoTime()
                self.stopped = False
                self.hold_once = False
                self.capture_armed = False
                self.closing = False
                self.candidate = None
            self.record('START', moneydanceBuild=int(self.context.getBuild()),
                        javaVersion=unicode(System.getProperty('java.version')),
                        probeVersion=4, temporaryRuntimeInstall=True)
            self.book_state('INITIAL_BOOK')
            self.inspect_ui()
            print('PROBE_LOGGING: log contains counts, timing and class signatures only')
        elif command == 'snapshot_probe_inspect':
            self.book_state('MANUAL_BOOK')
            self.inspect_ui()
        elif command == 'snapshot_probe_capture':
            if self.target is not None and not self.stopped:
                path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'export_json.py')
                self.exporter = runpy.run_path(path, init_globals={'_EXPORT_LIBRARY_ONLY': True})
                self.capture_armed = True
                self.closing = False
                self.candidate = None
                self.record('CLOSE_CAPTURE_ARMED', syntheticOnly=True)
                print('PROBE_CAPTURE_ARMED: synthetic book only; next close/save captures once')
        elif command == 'snapshot_probe_hold':
            if self.target is not None and not self.stopped:
                self.hold_once = True
                self.record('EXIT_HOLD_ARMED', durationMs=2000)
                print('PROBE_HOLD_ARMED: next app-exiting callback pauses once for 2 seconds')
        elif command == 'snapshot_probe_stop':
            self.record('STOP')
            self.stopped = True
            self.hold_once = False
            self.capture_armed = False
            self.candidate = None
            print('PROBE_STOPPED')

    def handle_event(self, event):
        if self.stopped or self.target is None:
            return
        name = unicode(event)
        if name not in EVENTS:
            return
        self.book_state(name)
        if name in ('md:file:closing', 'md:file:postsave', 'md:app:exiting'):
            self.record('LIFECYCLE_CALL_PATH', event=name,
                methods=self.lifecycle_call_path(Thread.currentThread().getStackTrace()))
        if name in ('md:file:opening', 'md:file:opened'):
            self.capture_armed = False
            self.closing = False
            self.candidate = None
        elif name == 'md:file:closing':
            self.closing = True
        elif name == 'md:file:postsave' and self.closing and self.capture_armed:
            self.capture_armed = False
            self.capture_on_close()
        if name == 'md:app:exiting':
            if self.candidate is not None:
                payload, digest = self.candidate
                self.record('EXIT_CANDIDATE', detachedBytes=len(payload),
                    unchanged=hashlib.sha256(payload).hexdigest() == digest)
                self.candidate = None
            with self.lock:
                hold = self.hold_once
                self.hold_once = False
            if hold:
                self.record('EXIT_HOLD_BEGIN', durationMs=2000)
                try:
                    Thread.sleep(2000)
                    self.book_state('EXIT_HOLD_END')
                except (Exception, JavaException):
                    self.record('EXIT_HOLD_INTERRUPTED')

    @staticmethod
    def lifecycle_call_path(frames):
        # Diagnostic evidence only, never used to decide whether to export.
        # Vendor class/method names only: no arguments, files, line numbers,
        # thread names, exception messages, or user-defined script frames.
        return [unicode(frame.getClassName()) + '.' + unicode(frame.getMethodName())
            for frame in frames if unicode(frame.getClassName()).startswith(
                ('com.moneydance.', 'com.infinitekind.'))][:40]

    def capture_on_close(self):
        # Diagnostic only: never wait indefinitely for an EDT that may be waiting
        # for this callback. A queued operation is canceled on timeout. A running
        # capture cannot safely be interrupted; its result is discarded if late.
        probe = self
        done = CountDownLatch(1)
        state = {'cancelled': False, 'payload': None, 'error': None}
        started = System.nanoTime()

        class Capture(Runnable):
            def run(self):
                try:
                    if state['cancelled']:
                        return
                    book = probe.context.getCurrentAccountBook()
                    if book is None:
                        raise ValueError('NO_BOOK')
                    operation = probe.exporter['CaptureOnUIThread'](book)
                    operation.run()
                    if operation.error is not None:
                        raise operation.error
                    snapshot = probe.exporter['build_snapshot'](operation.result,
                        datetime.datetime.utcnow(), 'Moneydance build %d' % probe.context.getBuild())
                    if not state['cancelled']:
                        state['payload'] = json.dumps(snapshot, sort_keys=True,
                            separators=(',', ':')).encode('utf-8')
                except (Exception, JavaException) as error:
                    state['error'] = unicode(type(error).__name__)
                finally:
                    done.countDown()

        self.record('CLOSE_CAPTURE_BEGIN')
        task = Capture()
        if SwingUtilities.isEventDispatchThread():
            task.run()
        else:
            SwingUtilities.invokeLater(task)
            if not getattr(done, 'await')(5, TimeUnit.SECONDS):
                state['cancelled'] = True
                state['payload'] = None
                self.record('CLOSE_CAPTURE_TIMEOUT', deadlineMs=5000)
                return
        payload = state['payload']
        if payload is None:
            self.record('CLOSE_CAPTURE_FAILED', errorType=state['error'])
            return
        self.candidate = (payload, hashlib.sha256(payload).hexdigest())
        self.record('CLOSE_CAPTURE_OK', detachedBytes=len(payload),
            entries=len(json.loads(payload)['entries']),
            durationMs=long((System.nanoTime() - started) // 1000000))

    def unload(self):
        self.record('UNLOAD')
        self.stopped = True
        self.hold_once = False
        self.context = None
        self.capture_armed = False
        self.candidate = None


# The documented Developer Console runtime-extension discovery convention.
moneydance_extension = CompatibilityProbe()
