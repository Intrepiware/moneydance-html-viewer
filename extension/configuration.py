# -*- coding: utf-8 -*-
"""Windows/Jython settings. No network operations or financial writes."""
import base64
import calendar
import copy
import datetime
import json
import os
import re
import threading
from jarray import array
from urlparse import urlsplit, parse_qs
from java.lang import ProcessBuilder, System, Exception as JavaException
from java.io import FileOutputStream
from java.util.concurrent import TimeUnit
from java.nio.file import Files, Paths, StandardCopyOption
from java.nio.file.attribute import AclFileAttributeView, AclEntry, AclEntryType, AclEntryPermission
from java.util import ArrayList, EnumSet


class ConfigError(Exception): pass


def require(condition, code):
    if not condition: raise ConfigError(code)


def utc(value):
    try:
        return datetime.datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ')
    except (ValueError, TypeError):
        raise ConfigError('INVALID_UTC_DATE')


def months_after(value, months):
    total = value.year * 12 + value.month - 1 + months
    year, month = total // 12, total % 12 + 1
    return value.replace(year=year, month=month, day=min(value.day, calendar.monthrange(year, month)[1]))


def validate(config, book_id=None, now=None, delivery=False):
    require(isinstance(config, dict) and config.get('version') == 1, 'INVALID_CONFIG')
    require(isinstance(config.get('configuredBookId'), basestring) and config['configuredBookId'], 'BOOK_REQUIRED')
    require(book_id is None or config['configuredBookId'] == book_id, 'DIFFERENT_BOOK')
    password = config.get('encryptionPassword')
    require(isinstance(password, basestring) and password.strip(), 'PASSWORD_REQUIRED')
    try: password.encode('utf-8', 'strict')
    except UnicodeError: raise ConfigError('INVALID_PASSWORD_UNICODE')
    require(not any(0xD800 <= ord(c) <= 0xDFFF for c in password), 'INVALID_PASSWORD_UNICODE')
    require(len(password) <= 4096, 'PASSWORD_TOO_LONG')
    destination = config.get('destination', '')
    try: parsed = urlsplit(destination)
    except (ValueError, TypeError): raise ConfigError('INVALID_DESTINATION')
    require(parsed.scheme == 'https' and parsed.hostname and
        parsed.hostname.endswith('.blob.core.windows.net') and not parsed.username and
        not parsed.password and not parsed.query and not parsed.fragment and
        parsed.netloc == parsed.hostname and len(parsed.path.strip('/').split('/')) >= 2,
        'INVALID_DESTINATION')
    sas = config.get('serviceSas', '')
    require(isinstance(sas, basestring) and len(sas) < 16384, 'INVALID_SAS')
    try: fields = parse_qs(sas.lstrip('?'), keep_blank_values=True, strict_parsing=True)
    except (ValueError, TypeError): raise ConfigError('INVALID_SAS')
    require(all(len(v) == 1 for v in fields.values()), 'INVALID_SAS')
    require(fields.get('sr') == ['b'] and fields.get('sp') == ['w'] and
        fields.get('spr') == ['https'] and fields.get('sig', [''])[0] and fields.get('sv', [''])[0], 'INVALID_SAS_SCOPE')
    require('skoid' not in fields and 'ss' not in fields and 'srt' not in fields, 'INVALID_SAS_SCOPE')
    issued = config.get('credentialIssuedAt')
    expires = config.get('credentialExpiresAt')
    require(issued and expires and fields.get('se') == [expires], 'EXPIRY_METADATA_REQUIRED')
    issued_at, expiry = utc(issued), utc(expires)
    require(months_after(issued_at,22) <= expiry <= months_after(issued_at,24), 'CREDENTIAL_LIFETIME')
    current = now or datetime.datetime.utcnow()
    require(issued_at <= current, 'ISSUANCE_IN_FUTURE')
    if delivery:
        require(expiry > current, 'CREDENTIAL_EXPIRED')
    return copy.deepcopy(config)


def expiry_state(config, now=None):
    if not config.get('credentialExpiresAt'): return 'unknown'
    delta = utc(config['credentialExpiresAt']) - (now or datetime.datetime.utcnow())
    if delta.total_seconds() <= 0: return 'expired'
    return 'warning' if delta <= datetime.timedelta(days=30) else 'valid'


def protect_call(script, operation, value, timeout=15):
    """Only non-secret helper source goes in args; payload travels through pipes."""
    require(operation in ('protect','unprotect') and len(value) <= 32768, 'INVALID_SECRET_REQUEST')
    encoded = base64.b64encode(script.encode('utf-16le'))
    executable = os.path.join(System.getenv('SystemRoot'), 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    process = ProcessBuilder([executable, '-NoLogo', '-NoProfile', '-NonInteractive',
        '-WindowStyle', 'Hidden', '-EncodedCommand', encoded]).start()
    response = {}
    def exchange():
        try:
            request = json.dumps({'operation':operation,'dataBase64':base64.b64encode(value)}) + '\n'
            stream = process.getOutputStream()
            stream.write(bytearray(request.encode('ascii')))
            stream.close()
            result = process.getInputStream()
            output = bytearray()
            while True:
                item = result.read()
                if item == -1: break
                require(len(output) < 65536, 'INVALID_HELPER_OUTPUT')
                output.append(item)
            response['data'] = json.loads(str(output))
        except (Exception, JavaException):
            response['failed'] = True
    worker = threading.Thread(target=exchange)
    worker.daemon = True
    worker.start()
    try:
        require(process.waitFor(timeout, TimeUnit.SECONDS), 'SECRET_HELPER_TIMEOUT')
        worker.join(1)
        require(not worker.is_alive() and not response.get('failed') and process.exitValue() == 0,
            'SECRET_PROTECTION_FAILED')
        data = response.get('data', {})
        require(data.get('status') == 'OK' and isinstance(data.get('dataBase64'), basestring), 'SECRET_PROTECTION_FAILED')
        return base64.b64decode(data['dataBase64'])
    except (Exception, JavaException):
        raise ConfigError('SECRET_PROTECTION_FAILED')
    finally:
        if process.isAlive(): process.destroyForcibly()
        for stream in (process.getInputStream(),process.getErrorStream(),process.getOutputStream()):
            try: stream.close()
            except (Exception, JavaException): pass


def restrict(path, owner):
    view = Files.getFileAttributeView(path, AclFileAttributeView)
    require(view is not None and not Files.isSymbolicLink(path), 'UNSAFE_CONFIG_PATH')
    permissions = EnumSet.allOf(AclEntryPermission)
    entries = ArrayList()
    entries.add(AclEntry.newBuilder().setType(AclEntryType.ALLOW).setPrincipal(owner).setPermissions(permissions).build())
    view.setAcl(entries)


class ConfigStore(object):
    def __init__(self, helper_script, directory=None):
        self.helper = helper_script
        self.directory = directory or os.path.join(System.getProperty('user.home'), '.moneydance-snapshot-delivery')
        self.path = Paths.get(self.directory, 'configuration.dpapi')

    def load(self, book_id=None):
        if not Files.exists(self.path): return None
        require(not Files.isSymbolicLink(self.path) and Files.size(self.path) <= 65536, 'INVALID_CONFIG_FILE')
        try:
            raw = ''.join(chr(int(b)&255) for b in Files.readAllBytes(self.path))
            payload = protect_call(self.helper,'unprotect',raw)
            return validate(json.loads(payload.decode('utf-8')), book_id)
        except (Exception, JavaException):
            raise ConfigError('CONFIG_LOAD_FAILED')

    def save(self, config, book_id):
        value = validate(config, book_id)
        protected = protect_call(self.helper,'protect',json.dumps(value,ensure_ascii=True).encode('utf-8'))
        directory = Paths.get(self.directory)
        require(not Files.isSymbolicLink(directory), 'UNSAFE_CONFIG_PATH')
        Files.createDirectories(directory)
        temporary = Files.createTempFile(directory,'.settings-','.tmp')
        try:
            # A newly created file belongs to the executing Windows token. Java
            # user.home can describe a different profile in an elevated process.
            owner = Files.getOwner(temporary)
            restrict(directory,owner)
            restrict(temporary,owner)
            stream = FileOutputStream(temporary.toFile())
            try:
                stream.write(array([ord(b) if ord(b)<128 else ord(b)-256 for b in protected],'b'))
                stream.getFD().sync()
            finally: stream.close()
            Files.move(temporary,self.path,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING)
        finally:
            Files.deleteIfExists(temporary)
        return copy.deepcopy(value)
