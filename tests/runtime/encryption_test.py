# -*- coding: utf-8 -*-
"""Test-only JCA oracle against independent OpenSSL known answers; no source book."""
import os
import json
import unittest
import binascii
import runpy
from java.lang import String
from javax.crypto import Cipher, SecretKeyFactory
from javax.crypto.spec import PBEKeySpec, SecretKeySpec, GCMParameterSpec
from jarray import array

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
with open(os.path.join(ROOT, 'tests', 'fixtures', 'encryption', 'vectors.json')) as source:
    fixture = json.load(source)


def java_bytes(value):
    return array([ord(c) if ord(c) < 128 else ord(c)-256 for c in value], 'b')


def hex_bytes(value):
    return ''.join('%02x' % (int(b) & 255) for b in value)


class EncryptionTests(unittest.TestCase):
    def encryption_api(self):
        return runpy.run_path(os.path.join(ROOT,'extension','encryption.py'))

    def test_production_encrypt_matches_vectors_and_fresh_randomness(self):
        api = self.encryption_api()
        class Deadline(object):
            def check(self): pass
        class FixedRandom(object):
            def __init__(self, value): self.value = value; self.offset = 0
            def nextBytes(self, target):
                for i in range(len(target)):
                    value = ord(self.value[self.offset]); self.offset += 1
                    target[i] = value if value < 128 else value-256
        plain = java_bytes(binascii.unhexlify(fixture['plaintextHex']))
        for vector in fixture['vectors']:
            encoded = binascii.unhexlify(vector['envelopeHex'])
            actual = api['encrypt'](plain,vector['password'],Deadline(),FixedRandom(encoded[9:37]))
            self.assertEqual(hex_bytes(actual),vector['envelopeHex'])
        first = api['encrypt'](plain,'synthetic',Deadline())
        second = api['encrypt'](plain,'synthetic',Deadline())
        self.assertNotEqual(hex_bytes(first[9:25]),hex_bytes(second[9:25]))
        self.assertNotEqual(hex_bytes(first[25:37]),hex_bytes(second[25:37]))
        class Oversize(object):
            def __len__(self): return 128*1024*1024+1
        self.assertRaises(ValueError,api['encrypt'],Oversize(),'synthetic',Deadline())
        self.assertRaises(ValueError,api['encrypt'],plain,'  ',Deadline())

    def test_actual_provider_matches_all_known_answers(self):
        for vector in fixture['vectors']:
            payload = binascii.unhexlify(vector['envelopeHex'])
            spec = PBEKeySpec(String(vector['password']).toCharArray(),java_bytes(payload[9:25]),600000,256)
            try:
                key = SecretKeyFactory.getInstance('PBKDF2WithHmacSHA256').generateSecret(spec).getEncoded()
            finally:
                spec.clearPassword()
            self.assertEqual(hex_bytes(key),vector['keyHex'])
            cipher = Cipher.getInstance('AES/GCM/NoPadding')
            cipher.init(Cipher.ENCRYPT_MODE,SecretKeySpec(key,'AES'),GCMParameterSpec(128,java_bytes(payload[25:37])))
            cipher.updateAAD(java_bytes(payload[:37]))
            encrypted = cipher.doFinal(java_bytes(binascii.unhexlify(fixture['plaintextHex'])))
            self.assertEqual(hex_bytes(encrypted),binascii.hexlify(payload[37:]))


class DirectEncryptionTests(EncryptionTests):
    def test_direct_dialog_choices_do_not_confuse_cancel_with_plaintext(self):
        from java.io import File
        from javax.swing import SwingUtilities
        api = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
            init_globals={'_EXPORT_LIBRARY_ONLY': True})
        scope = api['ExportOptions'].run.im_func.func_globals
        class Dialog(object):
            OK_OPTION, OK_CANCEL_OPTION, PLAIN_MESSAGE = 0, 2, -1
            choices = []
            @staticmethod
            def showConfirmDialog(parent, panel, title, buttons, style):
                choice, password = Dialog.choices.pop(0)
                panel.getComponent(1).setText(password)
                return choice
            @staticmethod
            def showMessageDialog(parent, message): pass
        class Chooser(object):
            APPROVE_OPTION = 0
            result = 0
            selected = None
            def setDialogTitle(self, title): pass
            def setSelectedFile(self, file): Chooser.selected = file.getName()
            def showSaveDialog(self, parent): return self.result
            def getSelectedFile(self): return File('synthetic-output')
        scope['JOptionPane'], scope['JFileChooser'] = Dialog, Chooser
        for choices, approve, expected, filename in [
                ([(-1, '')], 0, None, None),
                ([(0, '')], 0, u'', 'snapshot.json'),
                ([(0, 'secret')], 1, None, 'snapshot.enc'),
                ([(0, '   '), (0, ' secret ')], 0, u' secret ', 'snapshot.enc')]:
            Dialog.choices, Chooser.result, Chooser.selected = list(choices), approve, None
            options = api['ExportOptions']()
            SwingUtilities.invokeAndWait(options)
            self.assertEqual(options.password, expected)
            self.assertEqual(options.target is None, expected is None)
            self.assertEqual(Chooser.selected, filename)

    def encryption_api(self):
        api = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
            init_globals={'_EXPORT_LIBRARY_ONLY': True})
        return {'encrypt': api['encrypt_direct']}

    def test_direct_save_formats_and_failure_preserves_file(self):
        import tempfile
        import shutil
        from java.io import File
        api = runpy.run_path(os.path.join(ROOT, 'export_json.py'),
            init_globals={'_EXPORT_LIBRARY_ONLY': True})
        directory = tempfile.mkdtemp()
        path = os.path.join(directory, 'synthetic-output')
        snapshot = {'schemaVersion': 1, 'synthetic': True}
        try:
            api['save_direct_snapshot'](snapshot, File(path), u'')
            with open(path, 'rb') as source:
                plain = source.read()
            self.assertEqual(json.loads(plain), snapshot)
            self.assertRaises(ValueError, api['save_direct_snapshot'], snapshot, File(path), u'   ')
            with open(path, 'rb') as source:
                self.assertEqual(source.read(), plain)
            api['save_direct_snapshot'](snapshot, File(path), u'synthetic-password')
            with open(path, 'rb') as source:
                encrypted = source.read()
            self.assertTrue(encrypted.startswith('MDSNAP01'))
            salt, iv = java_bytes(encrypted[9:25]), java_bytes(encrypted[25:37])
            spec = PBEKeySpec(String('synthetic-password').toCharArray(), salt, 600000, 256)
            try:
                key = SecretKeyFactory.getInstance('PBKDF2WithHmacSHA256').generateSecret(spec).getEncoded()
            finally:
                spec.clearPassword()
            cipher = Cipher.getInstance('AES/GCM/NoPadding')
            cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, 'AES'), GCMParameterSpec(128, iv))
            cipher.updateAAD(java_bytes(encrypted[:37]))
            decrypted = cipher.doFinal(java_bytes(encrypted[37:]))
            self.assertEqual(json.loads(unicode(String(decrypted, 'UTF-8'))), snapshot)
            self.assertEqual(os.listdir(directory), ['synthetic-output'])
        finally:
            shutil.rmtree(directory)


if __name__ == '__main__': unittest.main()
