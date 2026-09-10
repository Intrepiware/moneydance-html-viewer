# -*- coding: utf-8 -*-
"""Serialized manual/exit delivery, detached close candidates and safe outcomes."""
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
         'EXPORT_TIMEOUT','EXPORT_CANCELLED','EXPORT_TOO_LARGE','CONFIGURATION_FAILED',
         'DELIVERY_UNAVAILABLE')


def safe_status(result):
    if result.get('stage') not in STAGES or result.get('code') not in CODES:
        raise ValueError('INVALID_STATUS')
    if result.get('outcome') not in ('success','failure','unknown'): raise ValueError('INVALID_STATUS')
    value = dict((key,result[key]) for key in ('outcome','stage','code','completedAt','elapsedMs'))
    datetime.datetime.strptime(value['completedAt'],'%Y-%m-%dT%H:%M:%SZ')
    if 'shutdownElapsedMs' in result: value['shutdownElapsedMs'] = result['shutdownElapsedMs']
    for name in ('elapsedMs','shutdownElapsedMs'):
        if name in value and (isinstance(value[name],bool) or not isinstance(value[name],(int,long)) or value[name] < 0):
            raise ValueError('INVALID_STATUS')
    return value


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
        value = safe_status(result)
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

    def load(self):
        if not Files.exists(self.path): return None
        if Files.isSymbolicLink(self.directory) or Files.isSymbolicLink(self.path) or Files.size(self.path) > 4096:
            raise ValueError('INVALID_STATUS')
        return safe_status(json.loads(unicode(String(Files.readAllBytes(self.path),'UTF-8'))))


class Delivery(object):
    def __init__(self, exporter, validate_config, encrypt, upload, status_store):
        self.exporter, self.validate_config = exporter, validate_config
        self.encrypt, self.upload, self.status_store = encrypt, upload, status_store
        self.lock = threading.Lock()
        self.active = None
        self.stopped = False
        self.transport_blocked = False
        self.unknown_upload = False
        self.state_lock = threading.RLock()
        self.record_lock = threading.Lock()
        self.cycle = None

    def cancel(self):
        self.stopped = True
        if self.active is not None: self.active.cancel()
        self.reset_close()

    def reset_close(self):
        """End a close cycle on opening/unload or an independently confirmed cancel."""
        with self.state_lock:
            cycle, self.cycle = self.cycle, None
            if cycle is not None:
                cycle['shutdown'].cancel()
                if cycle['deadline'] is not None: cycle['deadline'].cancel()
                self.clear_candidate(cycle)

    def clear_candidate(self, cycle):
        cycle['records'] = None
        if cycle['config'] is not None: cycle['config'].clear()
        cycle['config'] = None

    def start_close(self, book_id, load_config, source_version, shutdown=None):
        with self.state_lock:
            if self.stopped or self.cycle is not None: return
            # Starts before loading settings or waiting for any manual operation.
            shutdown = shutdown or self.exporter['Deadline'](60)
            cycle = {'bookId':book_id,'shutdown':shutdown,'started':shutdown.end-60000000000,
                'state':'loading','records':None,'config':None,'deadline':None,
                'captureStarted':None,'instant':None,'version':source_version,'error':None,'closed':False}
            self.cycle = cycle
            if self.active is not None:
                self.active.end = min(self.active.end,shutdown.end)
                self.active.cancel()
        value = None
        try:
            value = load_config()
            shutdown.check()
            if value is None or value.get('configuredBookId') != book_id:
                with self.state_lock:
                    if self.cycle is cycle: self.reset_close()
                return
            frozen = self.validate_config(value,book_id,delivery=True)
            with self.state_lock:
                if self.cycle is not cycle:
                    frozen.clear(); return
                cycle['config'], cycle['state'] = frozen, 'armed'
                # A queued EDT capture can finish cancellation without the EDT.
                # This lets postsave safely drain it even when postsave is on EDT.
                if self.active is not None:
                    self.active.end = min(self.active.end,shutdown.end)
                    self.active.cancel()
        except (Exception, JavaException) as error:
            cycle['error'] = self.failure_code(error,'CONFIGURATION_FAILED')
            cycle['state'] = 'failed'
        finally:
            if value is not None: value.clear()

    def wait_for_turn(self, deadline):
        while True:
            deadline.check()
            if self.lock.acquire(False): return
            threading.Event().wait(0.01)

    def capture_close(self, capture):
        with self.state_lock:
            cycle = self.cycle
            if cycle is None or cycle['state'] != 'armed': return
            cycle['state'] = 'capturing'
        acquired = False
        try:
            self.wait_for_turn(cycle['shutdown']); acquired = True
            with self.state_lock:
                if self.cycle is not cycle: return
                if self.transport_blocked: raise ValueError('DELIVERY_UNAVAILABLE')
                if self.unknown_upload: raise ValueError('UPLOAD_OUTCOME_UNKNOWN')
                deadline = self.exporter['Deadline'](60)
                deadline.end = min(deadline.end,cycle['shutdown'].end)
                cycle['deadline'], cycle['captureStarted'] = deadline, deadline.clock()
                cycle['instant'] = datetime.datetime.utcnow()
                self.active = deadline
            records = capture(deadline)
            deadline.check()
            with self.state_lock:
                if self.cycle is cycle and cycle['state'] == 'capturing':
                    cycle['records'], cycle['state'] = records, 'captured'
        except (Exception, JavaException) as error:
            with self.state_lock:
                if self.cycle is cycle:
                    cycle['error'] = self.failure_code(error,'CAPTURE_FAILED')
                    cycle['state'] = 'failed'
        finally:
            if acquired:
                self.active = None
                self.lock.release()

    def finish_close(self):
        with self.state_lock:
            cycle = self.cycle
            if cycle is None or cycle['state'] in ('publishing','finished'): return None
            ready = cycle['state'] == 'captured' and cycle['closed']
            cycle['state'] = 'publishing'
            if not ready and self.active is not None: self.active.cancel()
        try:
            if ready:
                result = self.run(cycle['config'],cycle['bookId'],lambda deadline:cycle['records'],
                    cycle['version'],closing=cycle)
            else:
                acquired = False
                try:
                    self.wait_for_turn(cycle['shutdown']); acquired = True
                except (Exception, JavaException) as error:
                    cycle['error'] = self.failure_code(error,'CAPTURE_FAILED')
                    # A still-running older attempt may have reached the network.
                    if self.active is not None: cycle['error'] = 'UPLOAD_OUTCOME_UNKNOWN'
                finally:
                    if acquired: self.lock.release()
                uncertain = cycle['error'] == 'UPLOAD_OUTCOME_UNKNOWN' or self.unknown_upload
                result = self.record('unknown' if uncertain else 'failure',
                    'upload' if uncertain else 'capture',
                    'UPLOAD_OUTCOME_UNKNOWN' if uncertain else cycle['error'] or 'CAPTURE_FAILED',
                    cycle['shutdown'],cycle['captureStarted'],cycle)
            return result
        finally:
            with self.state_lock:
                cycle['state'] = 'finished'
                self.clear_candidate(cycle)

    def confirm_closed(self):
        with self.state_lock:
            if self.cycle is not None: self.cycle['closed'] = True

    def before_save(self):
        with self.state_lock:
            cycle = self.cycle
            # postsave is also emitted after a failed save on build 5253. If a
            # later save occurs, an earlier candidate cannot represent that save.
            if cycle is not None and cycle['state'] in ('capturing','captured') and not cycle['closed']:
                cycle['error'], cycle['state'] = 'CAPTURE_FAILED', 'failed'
                if cycle['deadline'] is not None: cycle['deadline'].cancel()
                self.clear_candidate(cycle)

    def failure_code(self, error, fallback):
        text = str(error)
        return text if text in ('EXPORT_TIMEOUT','EXPORT_CANCELLED','EXPORT_TOO_LARGE','DELIVERY_UNAVAILABLE','UPLOAD_OUTCOME_UNKNOWN') else fallback

    def record(self, outcome, stage, code, deadline, start, cycle=None):
        elapsed = max(0,long((deadline.clock()-start)/1000000)) if start is not None else 0
        result = {'outcome':outcome,'stage':stage,'code':code,'elapsedMs':elapsed,
                  'completedAt':datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')}
        if cycle is not None:
            result['shutdownElapsedMs'] = max(0,long((cycle['shutdown'].clock()-cycle['started'])/1000000))
        with self.record_lock:
            # A manual worker finishing late must not replace the shutdown result.
            with self.state_lock:
                superseded = (cycle is None and self.cycle is not None and
                    self.cycle['state'] in ('publishing','finished'))
                superseded = superseded or (cycle is not None and self.cycle is not cycle)
            if not superseded:
                try: self.status_store.save(result)
                except (Exception, JavaException): result['statusSaved'] = False
                else: result['statusSaved'] = True
        return result

    def run(self, config, book_id, capture, source_version, progress=lambda stage: None, closing=None):
        if self.stopped or self.transport_blocked: return {'outcome':'failure','code':'DELIVERY_UNAVAILABLE'}
        if not self.lock.acquire(False): return {'outcome':'failure','code':'BUSY'}
        with self.state_lock:
            if self.cycle is not closing:
                self.lock.release()
                return {'outcome':'failure','code':'BUSY'}
        deadline = closing['deadline'] if closing is not None else None
        start = closing['captureStarted'] if closing is not None else None
        plaintext, frozen = None, None
        stage, code, outcome = 'capture','CONFIGURATION_FAILED','failure'
        try:
            frozen = self.validate_config(config,book_id,delivery=True)
            deadline = closing['deadline'] if closing is not None else self.exporter['Deadline'](60)
            self.active = deadline
            start = closing['captureStarted'] if closing is not None else deadline.clock()
            with self.state_lock:
                if self.stopped or self.cycle is not closing: deadline.cancel()
            deadline.check()
            progress(stage)
            code = 'CAPTURE_FAILED'
            records = capture(deadline)
            deadline.check()
            stage, code = 'validate','VALIDATION_FAILED'; progress(stage)
            instant = closing['instant'] if closing is not None else datetime.datetime.utcnow()
            snapshot = self.exporter['build_snapshot'](records,instant,source_version,deadline)
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
            self.unknown_upload = outcome == 'unknown'
        except (Exception, JavaException) as error:
            # Recognize only a few fixed local codes; never persist raw messages.
            code = self.failure_code(error,code)
        finally:
            if plaintext is not None: Arrays.fill(plaintext,0)
            if frozen is not None: frozen.clear()
            result = self.record(outcome,stage,code,deadline,start,closing)
            self.active = None
            self.lock.release()
        return result
