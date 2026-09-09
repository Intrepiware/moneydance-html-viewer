# -*- coding: utf-8 -*-
"""Real Windows DPAPI tests under bundled Jython; synthetic credentials only."""
import os
import json
import runpy
import tempfile
import shutil
import datetime
import unittest
from java.nio.file import Files, Paths
from java.nio.file.attribute import AclFileAttributeView

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
api=runpy.run_path(os.path.join(ROOT,'extension','configuration.py'))
with open(os.path.join(ROOT,'extension','protect-secrets.ps1')) as source: HELPER=source.read()


def config():
    return {'version':1,'configuredBookId':'synthetic-book','destination':'https://example.blob.core.windows.net/view/snapshot.enc',
        'encryptionPassword':u'test-\U0001f642 password',
        'serviceSas':'sr=b&sp=w&spr=https&sv=2023-11-03&se=2028-08-09T00%3A00%3A00Z&sig=SYNTHETIC',
        'credentialIssuedAt':'2026-09-09T00:00:00Z','credentialExpiresAt':'2028-08-09T00:00:00Z'}


class ConfigTests(unittest.TestCase):
    def test_sas_date_autofill_on_edt(self):
        ui=runpy.run_path(os.path.join(ROOT,'extension','snapshot_extension.py'))
        from javax.swing import JTextField, JPasswordField, SwingUtilities
        failures=[]
        def check():
            try:
                fields={'serviceSas':JPasswordField(), 'credentialIssuedAt':JTextField('saved-issued'),
                        'credentialExpiresAt':JTextField('saved-expiry')}
                fields['serviceSas'].setText('saved-token')
                listener=ui['SasDateListener'](fields)
                fields['serviceSas'].getDocument().addDocumentListener(listener)
                self.assertEqual(fields['credentialIssuedAt'].getText(),'saved-issued')
                token=config()['serviceSas']
                for text in [token, '?'+token, config()['destination']+'?'+token]:
                    fields['serviceSas'].setText(text)
                    self.assertEqual(fields['credentialExpiresAt'].getText(),config()['credentialExpiresAt'])
                    self.assertEqual(ui['sas_query'](text),token)
                    issued=api['utc'](unicode(fields['credentialIssuedAt'].getText()))
                    self.assertTrue(0 <= (datetime.datetime.utcnow()-issued).total_seconds() < 5)
                for text in ['', 'broken', 'se=bad', 'se=2028-02-30T00:00:00Z',
                             token+'&se=2029-01-01T00:00:00Z', 'https://[broken']:
                    fields['serviceSas'].setText(text)
                    self.assertEqual(fields['credentialExpiresAt'].getText(),config()['credentialExpiresAt'])
                fields['serviceSas'].getDocument().removeDocumentListener(listener)
                fields['credentialIssuedAt'].setText('unchanged-on-cleanup')
                fields['serviceSas'].setText('')
                self.assertEqual(fields['credentialIssuedAt'].getText(),'unchanged-on-cleanup')
            except BaseException as failure: failures.append(failure)
        SwingUtilities.invokeAndWait(ui['OnEDT'](check))
        if failures: raise failures[0]

    def test_helper_timeout_and_malformed_response_fail_closed(self):
        self.assertRaises(api['ConfigError'],api['protect_call'],'Start-Sleep -Seconds 10','protect','SYNTHETIC',1)
        self.assertRaises(api['ConfigError'],api['protect_call'],"[Console]::Out.WriteLine('invalid-json')",'protect','SYNTHETIC')

    def test_packaged_initializer_resource_loading_and_teardown(self):
        from java.io import FileInputStream
        namespace={'__name__':'phase3_test'}
        with open(os.path.join(ROOT,'extension','snapshot_extension.py')) as source:
            exec compile(source.read(),'snapshot_extension.py','exec') in namespace
        class Wrapper(object):
            def getResourceAsStream(self,name):
                name=name.lstrip('/')
                path=os.path.join(ROOT,name) if name=='export_json.py' else os.path.join(ROOT,'extension',name)
                return FileInputStream(path)
        class Context(object):
            def __init__(self): self.actions=[]
            def registerFeature(self,wrapper,command,icon,label): self.actions.append((command,label))
        extension=namespace['SnapshotExtension']()
        # Resource loading must not read the developer's real protected settings.
        extension.check_warning=lambda: None
        context=Context()
        extension.initialize(context,Wrapper())
        self.assertEqual(context.actions,[('snapshot_settings','Snapshot Settings'),('snapshot_publish','Publish Snapshot')])
        extension.unload()
        self.assertTrue(extension.stopped)
        self.assertIsNone(extension.context)
        self.assertIsNone(extension.wrapper)
        self.assertIsNone(extension.store)

    def test_native_dpapi_separate_process_roundtrip_and_corruption(self):
        protected=api['protect_call'](HELPER,'protect','SYNTHETIC-SECRET')
        self.assertNotIn('SYNTHETIC-SECRET',protected)
        self.assertEqual(api['protect_call'](HELPER,'unprotect',protected),'SYNTHETIC-SECRET')
        self.assertRaises(api['ConfigError'],api['protect_call'],HELPER,'unprotect','garbage')

    def test_roundtrip_acl_and_bad_update_preserves_previous(self):
        directory=tempfile.mkdtemp(dir=os.path.join(ROOT,'build'))
        try:
            store=api['ConfigStore'](HELPER,directory)
            value=config(); store.save(value,'synthetic-book')
            reloaded=api['ConfigStore'](HELPER,directory).load('synthetic-book')
            self.assertEqual(value,reloaded)
            self.assertRaises(api['ConfigError'],store.load,'other-book')
            bad=dict(value);bad['encryptionPassword']=''
            self.assertRaises(api['ConfigError'],store.save,bad,'synthetic-book')
            self.assertEqual(store.load('synthetic-book'),value)
            self.assertEqual(len(Files.getFileAttributeView(store.path,AclFileAttributeView).getAcl()),1)
        finally: shutil.rmtree(directory)

    def test_validation_scope_dates_and_expiry(self):
        value=config()
        now=datetime.datetime(2026,9,9,12)
        self.assertEqual(api['validate'](value,'synthetic-book',now),value)
        for field,replacement in [('serviceSas','sr=b&sp=rw&spr=https&sig=x'),('destination','http://example.org/blob'),
                ('credentialIssuedAt','2028-08-08T00:00:00Z')]:
            bad=dict(value);bad[field]=replacement
            self.assertRaises(api['ConfigError'],api['validate'],bad,'synthetic-book',now)
        expiry=api['utc'](value['credentialExpiresAt'])
        self.assertEqual(api['expiry_state'](value,expiry-datetime.timedelta(days=31)),'valid')
        self.assertEqual(api['expiry_state'](value,expiry-datetime.timedelta(days=30)),'warning')
        self.assertEqual(api['expiry_state'](value,expiry),'expired')
        self.assertEqual(api['expiry_state']({}),'unknown')


if __name__=='__main__': unittest.main()
