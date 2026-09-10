# -*- coding: utf-8 -*-
"""Synthetic pipeline and native HTTP contract tests; never contact Azure."""
import os
import runpy
import unittest
import datetime
import json
import threading
import tempfile
import shutil
from java.lang import String
from java.util.concurrent import CompletableFuture
from java.io import IOException

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
api=runpy.run_path(os.path.join(ROOT,'extension','delivery.py'))
http=runpy.run_path(os.path.join(ROOT,'extension','azure_upload.py'))
config_api=runpy.run_path(os.path.join(ROOT,'extension','configuration.py'))
exporter=runpy.run_path(os.path.join(ROOT,'export_json.py'),init_globals={'_EXPORT_LIBRARY_ONLY':True})
fixtures=runpy.run_path(os.path.join(ROOT,'tests','runtime','configuration_test.py'))


class Store(object):
    def __init__(self): self.results=[]
    def save(self,value): self.results.append(dict(value))


class Response(object):
    def __init__(self,status): self.status=status
    def statusCode(self): return self.status


class Client(object):
    def __init__(self,status=201,loss=False,pending=False,drained=True):
        self.status,self.loss,self.pending,self.drained=status,loss,pending,drained
        self.calls=[]; self.closed=False; self.future=CompletableFuture()
    def sendAsync(self,message,handler):
        self.calls.append(message)
        if self.loss: self.future.completeExceptionally(IOException('SYNTHETIC-SECRET-DO-NOT-LOG'))
        elif not self.pending: self.future.complete(Response(self.status))
        return self.future
    def shutdownNow(self): self.closed=True
    def awaitTermination(self,duration): return self.drained


class DeliveryTests(unittest.TestCase):
    def test_actual_http_client_put_no_redirect_or_body_replay(self):
        from BaseHTTPServer import HTTPServer, BaseHTTPRequestHandler
        from java.net import URI
        from java.net.http import HttpClient, HttpRequest
        received=[]
        mode=[201]
        class Handler(BaseHTTPRequestHandler):
            def log_message(self,*args): pass
            def do_PUT(self):
                length=self.headers.getheader('Content-length')
                body=self.rfile.read(int(length))
                received.append(('PUT',body,length))
                if mode[0]==0: return  # Commit simulation followed by response loss.
                self.send_response(mode[0])
                if mode[0]==307: self.send_header('Location','/redirect-target')
                self.send_header('Content-Length','0'); self.end_headers()
        server=HTTPServer(('127.0.0.1',0),Handler)
        worker=threading.Thread(target=server.serve_forever); worker.daemon=True; worker.start()
        class LoopbackClient(object):
            # Test-only HTTP route; production request still requires HTTPS Azure URL.
            def __init__(self):
                self.delegate=HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER).version(HttpClient.Version.HTTP_1_1).build()
            def sendAsync(self,message,handler):
                builder=HttpRequest.newBuilder(URI('http://127.0.0.1:%d/blob' % server.server_address[1]))
                builder.timeout(message.timeout().get())
                for item in message.headers().map().entrySet():
                    for value in item.getValue(): builder.header(item.getKey(),value)
                return self.delegate.sendAsync(builder.PUT(message.bodyPublisher().get()).build(),handler)
            def shutdownNow(self): self.delegate.shutdownNow()
            def awaitTermination(self,duration): return self.delegate.awaitTermination(duration)
        try:
            for status,expected in [(201,'success'),(307,'failure'),(0,'unknown')]:
                mode[0]=status; received[:]=[]
                result=http['upload'](fixtures['config'](),String('synthetic ciphertext').getBytes('UTF-8'),
                    exporter['Deadline'](5),LoopbackClient)
                self.assertEqual(result['outcome'],expected)
                self.assertEqual(received,[('PUT','synthetic ciphertext','20')])
        finally:
            server.shutdown(); server.server_close(); worker.join(2)

    def test_status_allowlist_serialization_ceiling_and_cancel(self):
        directory=tempfile.mkdtemp(dir=os.path.join(ROOT,'build'))
        try:
            store=api['StatusStore'](directory,config_api['restrict'])
            result={'outcome':'success','stage':'upload','code':'PUBLISHED','elapsedMs':20,
                'completedAt':'2026-09-09T12:00:00Z','password':'SYNTHETIC-SECRET'}
            store.save(result)
            with open(os.path.join(directory,'last-delivery.json')) as stream: stored=json.load(stream)
            self.assertNotIn('password',stored)
            result['code']='PRIVATE VALUE'
            self.assertRaises(ValueError,store.save,result)
            deadline=exporter['Deadline'](); deadline.cancel()
            self.assertRaises(exporter['ExportError'],api['serialize'],{'synthetic':'only'},deadline)
            namespace=api['serialize'].func_globals
            previous=namespace['MAX_PLAINTEXT']; namespace['MAX_PLAINTEXT']=5
            try: self.assertRaises(ValueError,api['serialize'],{'synthetic':'only'},exporter['Deadline']())
            finally: namespace['MAX_PLAINTEXT']=previous
        finally: shutil.rmtree(directory)

    def test_expiry_warning_boundaries_and_no_save_trigger(self):
        ui=runpy.run_path(os.path.join(ROOT,'extension','snapshot_extension.py'))
        from urllib import unquote
        class Context(object):
            def __init__(self): self.urls=[]
            def showURL(self,uri): self.urls.append(unquote(uri))
        extension=ui['SnapshotExtension']()
        extension.context=Context(); extension.config_api=config_api
        now=datetime.datetime.utcnow()
        for days,expected in [(31,None),(30,'expire soon'),(0,'have expired')]:
            extension.context.urls[:]=[]
            extension.warn({'credentialExpiresAt':(now+datetime.timedelta(days=days)).strftime('%Y-%m-%dT%H:%M:%SZ')})
            if expected is None: self.assertEqual(extension.context.urls,[])
            else:
                self.assertIn(expected,extension.context.urls[0])
                self.assertIn('Extensions &gt; Snapshot Settings',extension.context.urls[0])
                self.assertIn('<font color="#d32f2f">',extension.context.urls[0])
        extension.warn({})
        self.assertIn('unknown expiry',extension.context.urls[-1])
        def forbidden(): self.fail('An ordinary save must not publish')
        extension.publish=forbidden
        for event in ('file:presave','file:postsave','file:closing','app:exiting'):
            extension.handle_event(event)

    def test_native_request_contract_and_safe_outcomes(self):
        for status,expected in [(201,'success'),(403,'failure'),(307,'failure'),(500,'unknown')]:
            client=Client(status)
            body=String('synthetic ciphertext').getBytes('UTF-8')
            result=http['upload'](fixtures['config'](),body,exporter['Deadline'](),lambda:client)
            self.assertEqual(result['outcome'],expected)
            self.assertEqual(len(client.calls),1)
            message=client.calls[0]
            self.assertEqual(message.method(),'PUT')
            self.assertIn('api-version=2023-11-03',message.uri().getRawQuery())
            self.assertEqual(message.bodyPublisher().get().contentLength(),len(body))
            for key,value in [('x-ms-version','2023-11-03'),('x-ms-blob-type','BlockBlob'),
                              ('cache-control','no-store'),('content-type','application/octet-stream')]:
                self.assertEqual(message.headers().firstValue(key).get(),value)
            self.assertTrue(client.closed)
        lost=Client(loss=True)
        result=http['upload'](fixtures['config'](),body,exporter['Deadline'](),lambda:lost)
        self.assertEqual(result['outcome'],'unknown')
        self.assertNotIn('SYNTHETIC-SECRET',str(result))
        pending=Client(pending=True,drained=False)
        result=http['upload'](fixtures['config'](),body,exporter['Deadline'](0.1),lambda:pending)
        self.assertEqual(result['outcome'],'unknown')
        self.assertFalse(result['transportDrained'])
        self.assertTrue(pending.future.isCancelled())

    def pipeline(self, fail=None, upload=None):
        self.calls=[]; self.store=Store()
        def capture(deadline):
            self.calls.append('capture')
            if fail=='capture': raise ValueError('PRIVATE SOURCE NAME')
            return []
        def build(records,instant,version,deadline):
            self.calls.append('validate')
            if fail=='validate': raise ValueError('PRIVATE BALANCE')
            return {'synthetic':'only'}
        def encrypt(plain,password,deadline):
            self.calls.append('encrypt')
            if fail=='encrypt': raise ValueError('SECRET PASSWORD')
            return String('synthetic ciphertext').getBytes('UTF-8')
        def put(config,body,deadline):
            self.calls.append('upload')
            self.assertEqual(str(String(body,'UTF-8')),'synthetic ciphertext')
            return {'outcome':'success','code':'PUBLISHED','transportDrained':True}
        service=api['Delivery']({'Deadline':exporter['Deadline'],'build_snapshot':build},
            config_api['validate'],encrypt,upload or put,self.store)
        return service,capture

    def test_order_failures_and_frozen_configuration(self):
        for fail in (None,'capture','validate','encrypt'):
            service,capture=self.pipeline(fail)
            result=service.run(fixtures['config'](),'synthetic-book',capture,'synthetic')
            if fail is None:
                self.assertEqual(self.calls,['capture','validate','encrypt','upload'])
                self.assertEqual(result['outcome'],'success')
            else:
                self.assertEqual(result['outcome'],'failure')
                self.assertEqual(result['stage'],fail)
                self.assertNotIn('upload',self.calls)
            self.assertNotIn('PRIVATE',str(self.store.results))
            self.assertNotIn('SECRET',str(self.store.results))
        service,capture=self.pipeline()
        value=fixtures['config']()
        original=value['encryptionPassword']
        def changed(deadline): value['encryptionPassword']='changed'; return capture(deadline)
        def check(plain,password,deadline):
            self.assertEqual(password,original)
            return String('synthetic ciphertext').getBytes('UTF-8')
        service.encrypt=check
        self.assertEqual(service.run(value,'synthetic-book',changed,'synthetic')['outcome'],'success')
        self.assertEqual(service.run(value,'other-book',capture,'synthetic')['code'],'CONFIGURATION_FAILED')

    def test_busy_cancellation_deadline_and_undrained_transport(self):
        service,capture=self.pipeline()
        busy=[]
        def nested(deadline):
            busy.append(service.run(fixtures['config'](),'synthetic-book',capture,'synthetic'))
            return capture(deadline)
        service.run(fixtures['config'](),'synthetic-book',nested,'synthetic')
        self.assertEqual(busy[0]['code'],'BUSY')
        def cancel(deadline): deadline.cancel(); return []
        self.assertEqual(service.run(fixtures['config'](),'synthetic-book',cancel,'synthetic')['code'],'EXPORT_CANCELLED')
        def timeout(deadline): deadline.end=0; return []
        self.assertEqual(service.run(fixtures['config'](),'synthetic-book',timeout,'synthetic')['code'],'EXPORT_TIMEOUT')
        def unknown(config,body,deadline):
            return {'outcome':'unknown','code':'UPLOAD_OUTCOME_UNKNOWN','transportDrained':False}
        service,capture=self.pipeline(upload=unknown)
        self.assertEqual(service.run(fixtures['config'](),'synthetic-book',capture,'synthetic')['outcome'],'unknown')
        self.assertEqual(service.run(fixtures['config'](),'synthetic-book',capture,'synthetic')['code'],'DELIVERY_UNAVAILABLE')

    def test_real_builder_crypto_and_previous_ciphertext_survives_failures(self):
        model=runpy.run_path(os.path.join(ROOT,'tests','runtime','export_deadline_test.py'))
        crypto=runpy.run_path(os.path.join(ROOT,'extension','encryption.py'))
        state={'blob':None,'mode':'ok'}
        def put(config,body,deadline):
            if state['mode']=='denied': return {'outcome':'failure','code':'UPLOAD_REJECTED','transportDrained':True}
            state['blob']=body
            return {'outcome':'unknown' if state['mode']=='loss' else 'success',
                    'code':'UPLOAD_OUTCOME_UNKNOWN' if state['mode']=='loss' else 'PUBLISHED','transportDrained':True}
        service=api['Delivery'](exporter,config_api['validate'],crypto['encrypt'],put,Store())
        capture=lambda deadline: exporter['capture_stable'](model['Book'](),deadline)
        config=fixtures['config']()
        self.assertEqual(service.run(config,'synthetic-book',capture,'synthetic')['outcome'],'success')
        first=state['blob']
        state['mode']='denied'
        self.assertEqual(service.run(config,'synthetic-book',capture,'synthetic')['outcome'],'failure')
        self.assertIs(first,state['blob'])
        state['mode']='loss'
        self.assertEqual(service.run(config,'synthetic-book',capture,'synthetic')['outcome'],'unknown')
        from javax.crypto import Cipher,SecretKeyFactory
        from javax.crypto.spec import PBEKeySpec,SecretKeySpec,GCMParameterSpec
        for body in (first,state['blob']):
            spec=PBEKeySpec(String(config['encryptionPassword']).toCharArray(),body[9:25],600000,256)
            key=SecretKeyFactory.getInstance('PBKDF2WithHmacSHA256').generateSecret(spec).getEncoded()
            spec.clearPassword()
            cipher=Cipher.getInstance('AES/GCM/NoPadding')
            cipher.init(Cipher.DECRYPT_MODE,SecretKeySpec(key,'AES'),GCMParameterSpec(128,body[25:37]))
            cipher.updateAAD(body[:37])
            snapshot=json.loads(unicode(String(cipher.doFinal(body[37:]),'UTF-8')))
            self.assertEqual(snapshot['accounts']['children'][0]['closingBalanceCents'],12500)
        # Execute the independent Node/Web Crypto utility on native JVM output.
        import subprocess
        directory=tempfile.mkdtemp(dir=os.path.join(ROOT,'build'))
        try:
            path=os.path.join(directory,'synthetic.enc')
            with open(path,'wb') as target: target.write(''.join(chr(int(b)&255) for b in first))
            process=subprocess.Popen(['node',os.path.join(ROOT,'tests','tools','decrypt-synthetic.mjs'),
                '--synthetic','--input',path],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
            stdout,stderr=process.communicate(config['encryptionPassword'].encode('utf-8')+'\n')
            self.assertEqual(process.returncode,0,stderr)
            self.assertEqual(json.loads(stdout)['status'],'VALID')
        finally: shutil.rmtree(directory)


if __name__=='__main__': unittest.main()
