# -*- coding: utf-8 -*-
"""Deterministic synthetic lifecycle tests, not installed Moneydance evidence."""
import os
import runpy
import threading
import unittest
from java.util.concurrent import CountDownLatch, TimeUnit

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
base=runpy.run_path(os.path.join(ROOT,'tests','runtime','delivery_test.py'))
exporter=base['exporter']
config=base['fixtures']['config']


class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.helper=base['DeliveryTests']('test_order_failures_and_frozen_configuration')
        self.service,self.capture=self.helper.pipeline()
        self.now=[0]
        self.service.exporter['Deadline']=lambda seconds=60: exporter['Deadline'](seconds,lambda:self.now[0])

    def close(self, book='synthetic-book'):
        return self.service.start_close(book,config,'synthetic')

    def finish(self):
        self.service.confirm_closed()
        return self.service.finish_close()

    def test_duplicates_keep_candidate_and_deadline_and_publish_once(self):
        self.close(); cycle=self.service.cycle
        end=cycle['shutdown'].end
        self.now[0]+=1000000000; self.close()
        self.assertIs(self.service.cycle,cycle)
        self.assertEqual(cycle['shutdown'].end,end)
        self.service.capture_close(self.capture)
        records=cycle['records']
        self.close(); self.service.capture_close(self.capture)
        self.assertIs(cycle['records'],records)
        original=self.service.upload
        def upload(cfg,body,deadline):
            self.close()
            self.assertIsNone(self.service.finish_close())
            return original(cfg,body,deadline)
        self.service.upload=upload
        result=self.finish()
        self.assertEqual(result['outcome'],'success')
        self.assertEqual(self.helper.calls,['capture','validate','encrypt','upload'])
        self.assertIsNone(self.service.finish_close())
        self.assertIsNone(cycle['records'])
        self.assertIsNone(cycle['config'])

    def test_save_without_close_switch_other_book_and_confirmed_cancel(self):
        self.service.capture_close(self.capture)
        self.assertEqual(self.helper.calls,[])
        self.close(); self.service.capture_close(self.capture)
        old=self.service.cycle
        self.service.reset_close()  # Opening a book or confirmed cancellation.
        self.assertIsNone(old['records']); self.assertIsNone(old['config'])
        self.assertIsNone(self.service.finish_close())
        self.close('other-book')
        self.service.capture_close(self.capture)
        self.assertIsNone(self.service.finish_close())
        self.assertNotIn('upload',self.helper.calls)
        self.close(); self.service.capture_close(self.capture)
        self.assertEqual(self.finish()['outcome'],'success')
        self.assertEqual(self.helper.calls.count('capture'),2)

    def test_waiting_consumes_shutdown_budget_and_never_resets_it(self):
        self.close()
        def wait(deadline):
            self.now[0]=61000000000
            deadline.check()
        self.service.wait_for_turn=wait
        self.service.capture_close(self.capture)
        self.close()
        result=self.finish()
        self.assertEqual(result['code'],'EXPORT_TIMEOUT')
        self.assertEqual(self.helper.calls,[])
        self.assertEqual(result['shutdownElapsedMs'],61000)

    def test_capture_budget_preserved_until_exit(self):
        self.close()
        self.now[0]=20000000000
        self.service.capture_close(self.capture)
        self.assertEqual(self.service.cycle['deadline'].end,60000000000)
        self.now[0]=61000000000
        self.assertEqual(self.finish()['code'],'EXPORT_TIMEOUT')
        self.assertNotIn('upload',self.helper.calls)

    def test_shutdown_cancels_and_drains_manual_then_captures_fresh(self):
        entered=threading.Event(); results=[]
        def manual(deadline):
            entered.set()
            while True:
                deadline.check()
                threading.Event().wait(0.005)
        worker=threading.Thread(target=lambda:results.append(self.service.run(config(),'synthetic-book',manual,'synthetic')))
        worker.daemon=True; worker.start()
        self.assertTrue(entered.wait(2))
        self.close(); self.service.capture_close(self.capture)
        worker.join(2)
        self.assertFalse(worker.is_alive())
        self.assertEqual(results[0]['code'],'EXPORT_CANCELLED')
        self.assertEqual(self.finish()['outcome'],'success')
        self.assertEqual(self.helper.calls.count('capture'),1)

    def test_late_manual_start_is_blocked_and_missing_capture_fails(self):
        self.close()
        result=self.service.run(config(),'synthetic-book',self.capture,'synthetic')
        self.assertEqual(result['code'],'BUSY')
        result=self.service.finish_close()
        self.assertEqual(result['outcome'],'failure')
        self.assertEqual(result['code'],'CAPTURE_FAILED')
        self.assertNotIn('upload',self.helper.calls)

    def test_undrained_transport_and_unload_never_publish(self):
        self.close(); self.service.transport_blocked=True
        self.service.capture_close(self.capture)
        self.assertNotEqual(self.service.finish_close()['outcome'],'success')
        self.assertNotIn('upload',self.helper.calls)
        self.service.transport_blocked=False
        self.service.reset_close(); self.close()
        self.service.capture_close(self.capture)
        self.service.cancel()
        self.assertIsNone(self.service.finish_close())

    def test_failed_save_cannot_publish_or_reuse_candidate_on_retry(self):
        self.close(); self.service.capture_close(self.capture)
        # Failed save can emit postsave but cannot emit file:closed on build 5253.
        self.assertEqual(self.service.finish_close()['outcome'],'failure')
        self.assertNotIn('upload',self.helper.calls)
        self.service.reset_close(); self.close()
        self.service.capture_close(self.capture)
        self.close()  # Duplicate closing alone must preserve the candidate.
        self.service.before_save()  # A subsequent save makes final state ambiguous.
        self.service.capture_close(self.capture)
        self.assertEqual(self.finish()['outcome'],'failure')
        self.assertEqual(self.helper.calls.count('capture'),2)
        self.assertNotIn('upload',self.helper.calls)

    def test_unknown_manual_outcome_is_not_followed_by_automatic_put(self):
        def unknown(cfg,body,deadline):
            return {'outcome':'unknown','code':'UPLOAD_OUTCOME_UNKNOWN','transportDrained':True}
        self.service.upload=unknown
        self.assertEqual(self.service.run(config(),'synthetic-book',self.capture,'synthetic')['outcome'],'unknown')
        self.helper.calls[:]=[]
        self.close(); self.service.capture_close(self.capture)
        self.assertEqual(self.finish()['outcome'],'unknown')
        self.assertEqual(self.helper.calls,[])

    def test_real_prefixed_events_and_edt_capture_detach_book_before_exit(self):
        ui=runpy.run_path(os.path.join(ROOT,'extension','snapshot_extension.py'))
        model=runpy.run_path(os.path.join(ROOT,'tests','runtime','export_deadline_test.py'))
        from javax.swing import SwingUtilities
        class Context(object):
            def __init__(self):
                self.book=model['Book']()
                self.book.root.getUUID=lambda:'synthetic-book'
            def getCurrentAccountBook(self): return self.book
            def getBuild(self): return 5253
        class Store(object):
            def load(self): return config()
        extension=ui['SnapshotExtension']()
        extension.context=Context(); extension.store=Store()
        extension.exporter=exporter; extension.delivery=self.service
        extension.later=lambda action:None
        for event in ('md:file:presave','md:file:postsave'):
            extension.handle_event(event)
        self.assertIsNone(self.service.cycle)
        extension.handle_event('md:file:closing')
        errors=[]
        def saved():
            try:
                extension.handle_event('md:file:presave')
                extension.handle_event('md:file:postsave')
            except BaseException as failure: errors.append(failure)
        SwingUtilities.invokeAndWait(ui['OnEDT'](saved))
        if errors: raise errors[0]
        self.assertEqual(self.service.cycle['state'],'captured')
        extension.handle_event('md:file:closed')
        extension.context.book=None  # The actual exit callback has no readable book.
        extension.handle_event('md:app:exiting')
        extension.handle_event('md:app:exiting')
        self.assertEqual(self.helper.calls.count('upload'),1)
        self.assertEqual(self.helper.store.results[-1]['outcome'],'success')
        extension.handle_event('md:file:opening')
        self.assertIsNone(self.service.cycle)

    def test_edt_postsave_drains_canceled_queued_manual_capture(self):
        ui=runpy.run_path(os.path.join(ROOT,'extension','snapshot_extension.py'))
        from javax.swing import SwingUtilities
        from java.lang import System
        self.service.exporter['Deadline']=exporter['Deadline']
        class Root(object):
            def getUUID(self): return 'synthetic-book'
        class Book(object):
            def getRootAccount(self): return Root()
        class Context(object):
            def __init__(self): self.book=Book()
            def getCurrentAccountBook(self): return self.book
        extension=ui['SnapshotExtension']()
        extension.context=Context()
        reads=[]
        extension.exporter={'capture_stable':lambda book,deadline:reads.append('capture') or []}
        done=CountDownLatch(1); errors=[]; results=[]
        def on_edt():
            try:
                worker=threading.Thread(target=lambda:results.append(self.service.run(config(),'synthetic-book',
                    lambda deadline:extension.capture_current('synthetic-book',deadline),'synthetic')))
                worker.daemon=True; worker.start()
                limit=System.nanoTime()+2000000000
                while self.service.active is None and System.nanoTime()<limit: threading.Event().wait(0.005)
                self.assertIsNotNone(self.service.active)
                self.close()
                self.service.capture_close(lambda deadline:extension.capture_current('synthetic-book',deadline))
                worker.join(1)
                self.assertFalse(worker.is_alive())
                self.assertEqual(self.finish()['outcome'],'success')
            except BaseException as error: errors.append(error)
            finally: done.countDown()
        SwingUtilities.invokeLater(ui['OnEDT'](on_edt))
        self.assertTrue(getattr(done,'await')(5,TimeUnit.SECONDS))
        if errors: raise errors[0]
        self.assertEqual(results[0]['code'],'EXPORT_CANCELLED')
        self.assertEqual(reads,['capture'])

    def test_status_reload_and_late_manual_result_cannot_hide_shutdown_failure(self):
        self.close(); self.finish()
        count=len(self.helper.store.results)
        self.service.record('success','upload','PUBLISHED',None,None)
        self.assertEqual(len(self.helper.store.results),count)
        self.assertEqual(self.helper.store.results[-1]['outcome'],'failure')
        import tempfile,shutil,json
        directory=tempfile.mkdtemp(dir=os.path.join(ROOT,'build'))
        try:
            store=base['api']['StatusStore'](directory,base['config_api']['restrict'])
            self.assertIsNone(store.load())
            store.save(self.helper.store.results[-1])
            reopened=base['api']['StatusStore'](directory,base['config_api']['restrict'])
            self.assertEqual(reopened.load()['outcome'],'failure')
            self.assertIn('shutdownElapsedMs',reopened.load())
            with open(os.path.join(directory,'last-delivery.json'),'w') as target:
                json.dump({'code':'PRIVATE CONTENT'},target)
            self.assertRaises(ValueError,reopened.load)
        finally: shutil.rmtree(directory)

    def test_next_launch_displays_sanitized_status_once(self):
        ui=runpy.run_path(os.path.join(ROOT,'extension','snapshot_extension.py'))
        from urllib import unquote
        shown=threading.Event()
        class Context(object):
            def __init__(self): self.urls=[]
            def showURL(self,uri): self.urls.append(unquote(uri)); shown.set()
        class ConfigStore(object):
            def load(self): return config()
        class LastStatus(object):
            def __init__(self): self.reads=0
            def load(self):
                self.reads+=1
                return {'outcome':'failure','stage':'upload','code':'UPLOAD_REJECTED',
                    'completedAt':'2026-09-09T12:00:00Z','elapsedMs':10,'shutdownElapsedMs':20}
        extension=ui['SnapshotExtension']()
        extension.context=Context(); extension.config_api=base['config_api']; extension.store=ConfigStore()
        extension.delivery=self.service; extension.later=lambda action:action()
        status=LastStatus(); self.service.status_store=status
        extension.check_warning()
        self.assertTrue(shown.wait(2))
        self.assertIn('Last snapshot (2026-09-09T12:00:00Z)',extension.context.urls[0])
        self.assertIn('failed at upload',extension.context.urls[0])
        extension.check_warning()
        self.assertEqual(status.reads,1)


if __name__=='__main__': unittest.main()
