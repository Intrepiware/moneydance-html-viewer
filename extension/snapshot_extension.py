# -*- coding: utf-8 -*-
"""Persistent manual delivery and one detached publication at normal exit."""
import threading
import datetime
from urlparse import urlsplit, parse_qs
from urllib import quote
from java.util.concurrent import CountDownLatch, TimeUnit
from javax.swing.event import DocumentListener
from java.lang import Runnable, System, Exception as JavaException
from java.awt import GridLayout
from javax.swing import SwingUtilities, JPanel, JLabel, JTextField, JPasswordField, JOptionPane


def read_resource(wrapper, name):
    stream = wrapper.getResourceAsStream('/' + name)
    if stream is None: raise ValueError('RESOURCE_MISSING')
    try:
        data = bytearray()
        while True:
            value = stream.read()
            if value < 0: break
            if len(data) >= 1048576: raise ValueError('RESOURCE_TOO_LARGE')
            data.append(value)
        return str(data).decode('utf-8')
    finally: stream.close()


class OnEDT(Runnable):
    def __init__(self, action): self.action = action
    def run(self): self.action()


def sas_query(value):
    value = value.strip()
    return urlsplit(value).query if '://' in value else value.lstrip('?')


def sas_expiry(value):
    """Best-effort date hint only; Save still validates the credential."""
    try:
        fields = parse_qs(sas_query(value), keep_blank_values=True, strict_parsing=True)
        values = fields.get('se', [])
        if len(values) != 1: return None
        expiry = datetime.datetime.strptime(values[0], '%Y-%m-%dT%H:%M:%SZ')
        return expiry.strftime('%Y-%m-%dT%H:%M:%SZ')
    except (ValueError, TypeError):
        return None


class SasDateListener(DocumentListener):
    def __init__(self, fields): self.fields = fields

    def update(self, event):
        from java.lang import String
        from java.util import Arrays
        self.fields['credentialIssuedAt'].setText(datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))
        chars = self.fields['serviceSas'].getPassword()
        try: expiry = sas_expiry(unicode(String(chars)))
        finally: Arrays.fill(chars, u'\x00')
        if expiry is not None: self.fields['credentialExpiresAt'].setText(expiry)

    def insertUpdate(self, event): self.update(event)
    def removeUpdate(self, event): self.update(event)
    def changedUpdate(self, event): self.update(event)


class SnapshotExtension(object):
    def __init__(self):
        self.context = None
        self.wrapper = None
        self.config_api = None
        self.store = None
        self.stopped = False
        self.busy = False
        self.dialog = None
        self.delivery = None
        self.exporter = None
        self.publishing = False
        self.startup_status_shown = False

    def getName(self): return 'Snapshot Delivery'

    def initialize(self, context, extension_object):
        self.context, self.wrapper = context, extension_object
        self.stopped = False
        self.startup_status_shown = False
        namespace = {'__name__':'snapshot_delivery_configuration'}
        exec compile(read_resource(extension_object,'configuration.py').encode('utf-8'), 'configuration.py', 'exec') in namespace
        self.config_api = namespace
        self.store = namespace['ConfigStore'](read_resource(extension_object,'protect-secrets.ps1'))
        # Validate shared resource can load without running the standalone chooser.
        shared = {'__name__':'snapshot_delivery_export','_EXPORT_LIBRARY_ONLY':True}
        exec compile(read_resource(extension_object,'export_json.py').encode('utf-8'), 'export_json.py', 'exec') in shared
        self.exporter = shared
        modules = {}
        for name in ('encryption','azure_upload','delivery'):
            module = {'__name__':'snapshot_delivery_'+name}
            exec compile(read_resource(extension_object,name+'.py').encode('utf-8'), name+'.py', 'exec') in module
            modules[name] = module
        status = modules['delivery']['StatusStore'](self.store.directory,namespace['restrict'])
        self.delivery = modules['delivery']['Delivery'](shared,namespace['validate'],
            modules['encryption']['encrypt'],modules['azure_upload']['upload'],status)
        context.registerFeature(extension_object,'snapshot_settings',None,'Snapshot Settings')
        context.registerFeature(extension_object,'snapshot_publish',None,'Publish Snapshot')
        self.later(self.check_warning)

    def later(self, action):
        def guarded():
            if not self.stopped: action()
        SwingUtilities.invokeLater(OnEDT(guarded))

    def notice(self, text, error=False):
        if not self.stopped:
            JOptionPane.showMessageDialog(None,text,'Snapshot Delivery',
                JOptionPane.ERROR_MESSAGE if error else JOptionPane.INFORMATION_MESSAGE)

    def book_id(self):
        book = self.context.getCurrentAccountBook()
        return unicode(book.getRootAccount().getUUID()) if book is not None else None

    def invoke(self, uri):
        if self.stopped: return
        if not SwingUtilities.isEventDispatchThread():
            self.later(lambda: self.invoke(uri)); return
        command = unicode(uri).split(':',1)[0].split('?',1)[0]
        if command == 'snapshot_publish':
            self.publish()
        elif command == 'snapshot_settings':
            if self.busy:
                self.notice('Settings are already open or being saved.'); return
            book_id = self.book_id()
            if not book_id:
                self.notice('Open the book you want to configure first.',True); return
            self.busy = True
            store = self.store
            def load():
                try:
                    current = store.load(book_id)
                    self.later(lambda: self.warn(current or {}))
                    self.later(lambda: self.edit(book_id,current or {}))
                except (Exception, JavaException):
                    self.later(lambda: self.failed('Unable to load settings. Open the configured book and use the same Windows user. A damaged settings file must be restored or removed before reconfiguration.'))
            worker = threading.Thread(target=load); worker.daemon=True; worker.start()

    def failed(self, message):
        self.busy = False
        self.notice(message,True)

    def edit(self, book_id, current):
        if self.book_id() != book_id:
            self.failed('The open book changed. Open settings again.'); return
        panel = JPanel(GridLayout(0,1,4,4))
        fields = {}
        labels = [('destination','Blob URL (HTTPS, no SAS query)'),
            ('encryptionPassword','Encryption password'), ('serviceSas','Blob SAS token or SAS URL (write only, HTTPS)'),
            ('credentialIssuedAt','Credential issued at (UTC: YYYY-MM-DDTHH:MM:SSZ)'),
            ('credentialExpiresAt','Credential expires at (UTC: YYYY-MM-DDTHH:MM:SSZ)')]
        for key,label in labels:
            panel.add(JLabel(label))
            field = JPasswordField(48) if key in ('encryptionPassword','serviceSas') else JTextField(48)
            field.setText(current.get(key,''))
            panel.add(field); fields[key]=field
        # Attach after populating saved values so reopening does not change dates.
        sas_listener = SasDateListener(fields)
        fields['serviceSas'].getDocument().addDocumentListener(sas_listener)
        panel.add(JLabel('Renew in Azure: create a blob-scoped service SAS with Write and HTTPS only.'))
        panel.add(JLabel('Use 23 months if policy permits (required range: 22-24 months).'))
        panel.add(JLabel('Pasting a SAS fills its expiry and sets issued time to now; adjust issuance if older.'))
        panel.add(JLabel('Publishes manually or on normal exit. Save here changes settings only.'))
        pane = JOptionPane(panel,JOptionPane.PLAIN_MESSAGE,JOptionPane.OK_CANCEL_OPTION)
        dialog = pane.createDialog(None,'Snapshot Settings')
        self.dialog = dialog
        try:
            dialog.setVisible(True)
            outcome = pane.getValue()
        finally:
            self.dialog = None
            dialog.dispose()
            fields['serviceSas'].getDocument().removeDocumentListener(sas_listener)
        value = {'version':1,'configuredBookId':book_id}
        if not self.stopped and outcome == JOptionPane.OK_OPTION:
            from java.lang import String
            for key,field in fields.items():
                if isinstance(field,JPasswordField):
                    chars=field.getPassword()
                    value[key]=unicode(String(chars))
                    from java.util import Arrays
                    Arrays.fill(chars, u'\x00')
                else: value[key]=unicode(field.getText()).strip()
            # Accept a pasted SAS URL while retaining the separately configured destination.
            try: value['serviceSas'] = sas_query(value['serviceSas'])
            except (ValueError, TypeError): pass  # Normal Save validation reports invalid input.
        for field in fields.values(): field.setText('')
        current.clear()
        if self.stopped or outcome != JOptionPane.OK_OPTION:
            self.busy=False; return
        if self.book_id() != book_id:
            self.failed('The open book changed. Settings were not saved.'); return
        try: self.config_api['validate'](value,book_id)
        except self.config_api['ConfigError'] as failure:
            self.failed('Settings were not saved: %s. Check the password, HTTPS blob URL, SAS scope and UTC issuance/expiry dates.' % str(failure)); return
        store = self.store
        def save():
            try:
                store.save(value,book_id)
                def complete():
                    self.busy=False
                    self.check_warning()
                    self.notice('Settings saved for this book. They will be available after restarting Moneydance.')
                self.later(complete)
            except (Exception, JavaException):
                self.later(lambda: self.failed('Settings could not be saved. Check Windows profile permissions; previous settings were retained.'))
            finally: value.clear()
        worker=threading.Thread(target=save); worker.daemon=True; worker.start()

    def status(self, text, meter=None, warning=False):
        if self.stopped: return
        try:
            if warning:
                escaped = text.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
                text = '<html><font color="#d32f2f">'+escaped+'</font></html>'
            uri = 'moneydance:setprogress?label='+quote(text.encode('utf-8'))
            if meter is not None: uri += '&meter='+str(meter)
            self.context.showURL(uri)
        except (Exception, JavaException): pass

    def warn(self, config, previous=None):
        state = self.config_api['expiry_state'](config)
        if state in ('warning','expired','unknown'):
            label = {'warning':'expire soon','expired':'have expired','unknown':'have unknown expiry'}[state]
            message = 'Upload credentials '+label+' - Extensions > Snapshot Settings'
            if previous: message = previous+' | '+message
            self.status(message,warning=True)
        elif previous: self.status(previous)

    def check_warning(self):
        if self.stopped or self.publishing: return
        store = self.store
        status_store = self.delivery.status_store
        show_previous = not self.startup_status_shown
        self.startup_status_shown = True
        def load():
            previous = None
            if show_previous:
                try:
                    result = status_store.load()
                    if result:
                        previous = 'Last snapshot (%s): %s' % (result['completedAt'],self.result_message(result))
                except (Exception, JavaException): previous = 'Previous snapshot status unavailable.'
            try:
                current = store.load()
                if current:
                    warning = {'credentialExpiresAt':current.get('credentialExpiresAt')}
                    current.clear()
                    self.later(lambda: self.warn(warning,previous))
                elif previous: self.later(lambda: self.status(previous))
            except (Exception, JavaException):
                self.later(lambda: self.status('Upload settings unavailable - Extensions > Snapshot Settings'))
        worker=threading.Thread(target=load); worker.daemon=True; worker.start()

    def capture_current(self, book_id, deadline):
        # Resolve the live book on the EDT at capture time, not in a retained worker closure.
        done, result = CountDownLatch(1), {}
        exporter, context = self.exporter, self.context
        def capture():
            book = None
            try:
                deadline.check()
                book = context.getCurrentAccountBook()
                if book is None or unicode(book.getRootAccount().getUUID()) != book_id:
                    raise ValueError('SOURCE_BOOK_CHANGED')
                result['records'] = exporter['capture_stable'](book,deadline)
                if context.getCurrentAccountBook() != book: raise ValueError('SOURCE_BOOK_CHANGED')
            except (Exception, JavaException) as error: result['error'] = error
            finally:
                book = None
                done.countDown()
        if SwingUtilities.isEventDispatchThread(): capture()
        else: SwingUtilities.invokeLater(OnEDT(capture))
        while not getattr(done,'await')(20,TimeUnit.MILLISECONDS):
            try: deadline.check()
            except Exception:
                deadline.cancel()
                raise
        deadline.check()
        if 'error' in result: raise result['error']
        return result['records']

    def publish(self):
        if self.publishing:
            self.notice('A snapshot publication is already in progress.'); return
        book_id = self.book_id()
        if not book_id:
            self.notice('Open the configured book before publishing.',True); return
        self.publishing = True
        store, delivery = self.store, self.delivery
        source_version = 'Moneydance build %d' % int(self.context.getBuild())
        def progress(stage):
            labels = {'capture':('Capturing snapshot...',0.1),'validate':('Validating snapshot...',0.35),
                      'encrypt':('Encrypting snapshot...',0.6),'upload':('Uploading snapshot...',0.8)}
            label,meter = labels[stage]
            self.later(lambda: self.status(label,meter))
        def work():
            current = None
            try:
                current = store.load(book_id)
                if not current: raise ValueError('CONFIGURATION_REQUIRED')
                warning = {'credentialExpiresAt':current.get('credentialExpiresAt')}
                self.later(lambda: self.warn(warning))
                result = delivery.run(current,book_id,lambda deadline: self.capture_current(book_id,deadline),source_version,progress)
            except (Exception, JavaException):
                result = {'outcome':'failure','stage':'capture','code':'CONFIGURATION_FAILED'}
            finally:
                if current is not None: current.clear()
            self.later(lambda: self.publish_finished(result))
        worker=threading.Thread(target=work); worker.daemon=True; worker.start()

    def publish_finished(self, result):
        self.publishing = False
        # A canceled/drained manual attempt must not show a modal during shutdown.
        if self.delivery.cycle is not None: return
        message = self.result_message(result)
        self.status(message)
        self.notice(message,result['outcome'] != 'success')
        self.check_warning()

    def result_message(self, result):
        if result['outcome'] == 'success':
            message = 'Snapshot encrypted and published successfully.'
        elif result['outcome'] == 'unknown':
            message = 'Upload outcome unknown. Azure may have received the complete snapshot. Verify the remote file before publishing again.'
        else:
            guidance = {'CONFIGURATION_FAILED':'Check credentials and dates in Extensions > Snapshot Settings.',
                'CAPTURE_FAILED':'Finish editing, keep the configured book open, and try again.',
                'VALIDATION_FAILED':'Run the standalone exporter and validation checks against this book.',
                'ENCRYPTION_FAILED':'Check the encryption password and bundled Java runtime.',
                'UPLOAD_REJECTED':'Check blob permissions, credential expiry and storage policy in Snapshot Settings.',
                'UPLOAD_NOT_SENT':'Check your network connection and destination in Snapshot Settings.',
                'EXPORT_TIMEOUT':'The 60-second budget expired. Check source size and network performance.',
                'EXPORT_TOO_LARGE':'The snapshot exceeds the 128 MiB limit. History was not truncated.',
                'EXPORT_CANCELLED':'The operation was canceled.',
                'DELIVERY_UNAVAILABLE':'A prior transport could not be drained. Verify the remote file and restart Moneydance.',
                'BUSY':'A snapshot publication is already in progress.'}
            message = 'Snapshot publication failed at %s: %s' % (result.get('stage','upload'),guidance.get(result['code'],'Check settings and try again.'))
        if result.get('statusSaved') is False: message += ' The local status record could not be saved.'
        return message

    def handle_event(self, event):
        if self.stopped or self.delivery is None: return
        name = unicode(event)
        if name.startswith('md:'): name = name[3:]
        if name in ('file:opening','file:opened'):
            self.delivery.reset_close()
            if name == 'file:opened': self.later(self.check_warning)
        elif name == 'file:closing':
            shutdown = self.exporter['Deadline'](60)
            book_id = self.book_id()
            if book_id:
                self.delivery.start_close(book_id,self.store.load,
                    'Moneydance build %d' % int(self.context.getBuild()),shutdown)
        elif name == 'file:presave': self.delivery.before_save()
        elif name == 'file:postsave':
            cycle = self.delivery.cycle
            if cycle is not None:
                self.delivery.capture_close(lambda deadline:self.capture_current(cycle['bookId'],deadline))
        elif name == 'file:closed': self.delivery.confirm_closed()
        elif name == 'app:exiting':
            # Synchronous callback hold: the detached pipeline must finish before
            # Moneydance exits. It never needs a book or an EDT task at this point.
            self.delivery.finish_close()

    def unload(self):
        self.stopped=True
        if self.delivery is not None: self.delivery.cancel()
        dialog = self.dialog
        if dialog is not None:
            SwingUtilities.invokeLater(OnEDT(lambda: dialog.dispose()))
        self.context=None
        self.wrapper=None
        self.store=None
        self.config_api=None
        self.exporter=None


moneydance_extension = SnapshotExtension()
