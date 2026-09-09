# -*- coding: utf-8 -*-
"""Persistent Phase 3 extension: settings only; no capture or publication hooks."""
import threading
import datetime
from urlparse import urlsplit, parse_qs
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

    def getName(self): return 'Snapshot Delivery'

    def initialize(self, context, extension_object):
        self.context, self.wrapper = context, extension_object
        self.stopped = False
        namespace = {'__name__':'snapshot_delivery_configuration'}
        exec compile(read_resource(extension_object,'configuration.py').encode('utf-8'), 'configuration.py', 'exec') in namespace
        self.config_api = namespace
        self.store = namespace['ConfigStore'](read_resource(extension_object,'protect-secrets.ps1'))
        # Validate shared resource can load without running the standalone chooser.
        shared = {'__name__':'snapshot_delivery_export','_EXPORT_LIBRARY_ONLY':True}
        exec compile(read_resource(extension_object,'export_json.py').encode('utf-8'), 'export_json.py', 'exec') in shared
        context.registerFeature(extension_object,'snapshot_settings',None,'Snapshot Settings')
        context.registerFeature(extension_object,'snapshot_publish',None,'Publish Snapshot')

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
            self.notice('Publication is not enabled in this Phase 3 build. Use Snapshot Settings to configure the extension.')
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
        panel.add(JLabel('This build stores settings only; it does not upload or test Azure access.'))
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
                    self.notice('Settings saved for this book. They will be available after restarting Moneydance.')
                self.later(complete)
            except (Exception, JavaException):
                self.later(lambda: self.failed('Settings could not be saved. Check Windows profile permissions; previous settings were retained.'))
            finally: value.clear()
        worker=threading.Thread(target=save); worker.daemon=True; worker.start()

    def handle_event(self, event):
        # Automatic capture/publication and expiry presentation are later phases.
        pass

    def unload(self):
        self.stopped=True
        dialog = self.dialog
        if dialog is not None:
            SwingUtilities.invokeLater(OnEDT(lambda: dialog.dispose()))
        self.context=None
        self.wrapper=None
        self.store=None
        self.config_api=None


moneydance_extension = SnapshotExtension()
