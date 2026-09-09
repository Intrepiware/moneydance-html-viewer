# -*- coding: utf-8 -*-
"""Single-owner manual delivery, memory-only payloads and fixed safe outcomes."""
import datetime
import json
import threading
from java.lang import String, Exception as JavaException
from java.io import ByteArrayOutputStream, FileOutputStream
from java.nio.file import Files, Paths, StandardCopyOption
from java.util import Arrays

MAX_PLAINTEXT = 128 * 1024 * 1024
STAGES = ('capture','validate','encrypt','upload')
CODES = ('PUBLISHED','CAPTURE_FAILED','VALIDATION_FAILED','ENCRYPTION_FAILED',
         'UPLOAD_NOT_SENT','UPLOAD_REJECTED','UPLOAD_OUTCOME_UNKNOWN',
         'EXPORT_TIMEOUT','EXPORT_CANCELLED','EXPORT_TOO_LARGE','CONFIGURATION_FAILED')


def serialize(snapshot, deadline):
    # The shared builder performs source balance/reference checks. Do not fork
    # those financial rules here; serialize only its successfully returned result.
    output = ByteArrayOutputStream()
    chunks, buffered = [], 0
    encoder = json.JSONEncoder(ensure_ascii=True,allow_nan=False,separators=(',',':'))
    try:
        for chunk in encoder.iterencode(snapshot):
            deadline.check()
            chunks.append(chunk); buffered += len(chunk)
            if output.size()+buffered > MAX_PLAINTEXT: raise ValueError('EXPORT_TOO_LARGE')
            if buffered >= 65536:
                output.write(String(''.join(chunks)).getBytes('UTF-8'))
                chunks, buffered = [], 0
        if chunks: output.write(String(''.join(chunks)).getBytes('UTF-8'))
        deadline.check()
        return output.toByteArray()
    finally: output.close()


class StatusStore(object):
    def __init__(self, directory, restrict):
        self.directory, self.restrict = Paths.get(directory), restrict
        self.path = self.directory.resolve('last-delivery.json')

    def save(self, result):
        # Only fixed vocabulary plus dates/duration; no arbitrary exception text.
        if result.get('stage') not in STAGES or result.get('code') not in CODES:
            raise ValueError('INVALID_STATUS')
        if result.get('outcome') not in ('success','failure','unknown'): raise ValueError('INVALID_STATUS')
        value = dict((key,result[key]) for key in ('outcome','stage','code','completedAt','elapsedMs'))
        datetime.datetime.strptime(value['completedAt'],'%Y-%m-%dT%H:%M:%SZ')
        if not isinstance(value['elapsedMs'],(int,long)) or value['elapsedMs'] < 0: raise ValueError('INVALID_STATUS')
        if Files.isSymbolicLink(self.directory): raise ValueError('UNSAFE_STATUS_PATH')
        Files.createDirectories(self.directory)
        temporary = Files.createTempFile(self.directory,'.status-','.tmp')
        try:
            owner = Files.getOwner(temporary)
            self.restrict(self.directory,owner); self.restrict(temporary,owner)
            stream = FileOutputStream(temporary.toFile())
            try:
                stream.write(String(json.dumps(value)).getBytes('UTF-8'))
                stream.getFD().sync()
            finally: stream.close()
            Files.move(temporary,self.path,StandardCopyOption.ATOMIC_MOVE,StandardCopyOption.REPLACE_EXISTING)
        finally: Files.deleteIfExists(temporary)


class Delivery(object):
    def __init__(self, exporter, validate_config, encrypt, upload, status_store):
        self.exporter, self.validate_config = exporter, validate_config
        self.encrypt, self.upload, self.status_store = encrypt, upload, status_store
        self.lock = threading.Lock()
        self.active = None
        self.stopped = False
        self.transport_blocked = False

    def cancel(self):
        self.stopped = True
        if self.active is not None: self.active.cancel()

    def run(self, config, book_id, capture, source_version, progress=lambda stage: None):
        if self.stopped or self.transport_blocked: return {'outcome':'failure','code':'DELIVERY_UNAVAILABLE'}
        if not self.lock.acquire(False): return {'outcome':'failure','code':'BUSY'}
        deadline, plaintext, frozen = None, None, None
        stage, code, outcome, start = 'capture','CONFIGURATION_FAILED','failure',None
        try:
            frozen = self.validate_config(config,book_id,delivery=True)
            deadline = self.exporter['Deadline'](60)
            self.active = deadline
            start = deadline.clock()
            if self.stopped: deadline.cancel()
            progress(stage)
            code = 'CAPTURE_FAILED'
            records = capture(deadline)
            deadline.check()
            stage, code = 'validate','VALIDATION_FAILED'; progress(stage)
            snapshot = self.exporter['build_snapshot'](records,datetime.datetime.utcnow(),source_version,deadline)
            records = None
            plaintext = serialize(snapshot,deadline)
            snapshot = None
            stage, code = 'encrypt','ENCRYPTION_FAILED'; progress(stage)
            ciphertext = self.encrypt(plaintext,frozen['encryptionPassword'],deadline)
            Arrays.fill(plaintext,0); plaintext = None
            deadline.check()
            stage, code = 'upload','UPLOAD_NOT_SENT'; progress(stage)
            response = self.upload(frozen,ciphertext,deadline)
            outcome, code = response['outcome'], response['code']
            self.transport_blocked = not response.get('transportDrained',False)
        except (Exception, JavaException) as error:
            # Recognize only a few fixed local codes; never persist raw messages.
            if str(error) in ('EXPORT_TIMEOUT','EXPORT_CANCELLED','EXPORT_TOO_LARGE'):
                code = str(error)
        finally:
            if plaintext is not None: Arrays.fill(plaintext,0)
            if frozen is not None: frozen.clear()
            elapsed = max(0,long((deadline.clock()-start)/1000000)) if start is not None else 0
            result = {'outcome':outcome,'stage':stage,'code':code,'elapsedMs':elapsed,
                      'completedAt':datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}
            try: self.status_store.save(result)
            except (Exception, JavaException): result['statusSaved'] = False
            else: result['statusSaved'] = True
            self.active = None
            self.lock.release()
        return result
