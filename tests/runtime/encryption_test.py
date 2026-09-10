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
    def test_production_encrypt_matches_vectors_and_fresh_randomness(self):
        api = runpy.run_path(os.path.join(ROOT,'extension','encryption.py'))
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


if __name__ == '__main__': unittest.main()
