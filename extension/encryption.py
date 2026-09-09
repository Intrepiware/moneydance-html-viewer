# -*- coding: utf-8 -*-
"""Snapshot envelope v1 using the bundled JVM's cryptographic providers."""
from java.lang import String, Byte, System
from java.lang.reflect import Array
from java.security import SecureRandom
from java.util import Arrays
from javax.crypto import Cipher, SecretKeyFactory
from javax.crypto.spec import PBEKeySpec, SecretKeySpec, GCMParameterSpec

MAX_PLAINTEXT = 128 * 1024 * 1024
MAX_ENVELOPE = MAX_PLAINTEXT + 53


def encrypt(plaintext, password, deadline, random=None):
    deadline.check()
    if len(plaintext) > MAX_PLAINTEXT: raise ValueError('EXPORT_TOO_LARGE')
    if not isinstance(password, basestring) or not password.strip():
        raise ValueError('INVALID_PASSWORD')
    if any(0xD800 <= ord(c) <= 0xDFFF for c in password):
        raise ValueError('INVALID_PASSWORD')
    password.encode('utf-8', 'strict')
    salt, iv = Array.newInstance(Byte.TYPE,16), Array.newInstance(Byte.TYPE,12)
    rng = random or SecureRandom()
    rng.nextBytes(salt); rng.nextBytes(iv)
    header = Array.newInstance(Byte.TYPE,37)
    System.arraycopy(String('MDSNAP01').getBytes('US-ASCII'),0,header,0,8)
    header[8] = 1
    System.arraycopy(salt,0,header,9,16); System.arraycopy(iv,0,header,25,12)
    chars = String(password).toCharArray()
    spec = PBEKeySpec(chars,salt,600000,256)
    key = None
    try:
        key = SecretKeyFactory.getInstance('PBKDF2WithHmacSHA256').generateSecret(spec).getEncoded()
        deadline.check()
        cipher = Cipher.getInstance('AES/GCM/NoPadding')
        cipher.init(Cipher.ENCRYPT_MODE,SecretKeySpec(key,'AES'),GCMParameterSpec(128,iv))
        cipher.updateAAD(header)
        output = Array.newInstance(Byte.TYPE,len(plaintext)+53)
        System.arraycopy(header,0,output,0,37)
        written = 37
        for offset in range(0,len(plaintext),65536):
            deadline.check()
            written += cipher.update(plaintext,offset,min(65536,len(plaintext)-offset),output,written)
        written += cipher.doFinal(output,written)
        deadline.check()
        if written != len(output): raise ValueError('ENCRYPTION_LENGTH')
        return output
    finally:
        spec.clearPassword()
        Arrays.fill(chars,u'\x00')
        if key is not None: Arrays.fill(key,0)
