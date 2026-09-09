# -*- coding: utf-8 -*-
"""One bounded, nonredirecting ciphertext PUT. Never print request exceptions."""
from java.lang import Exception as JavaException
from java.net import URI
from java.net.http import HttpClient, HttpRequest, HttpResponse
from java.time import Duration, ZonedDateTime, ZoneOffset
from java.time.format import DateTimeFormatter
from java.util.concurrent import TimeUnit, TimeoutException, Flow
from java.util.concurrent.atomic import AtomicBoolean
from urllib import unquote

SERVICE_VERSION = '2023-11-03'


class EmptySubscription(Flow.Subscription):
    def request(self, count): pass
    def cancel(self): pass


class OneShotBody(Flow.Publisher):
    """Prevent a platform retry from replaying the upload body."""
    def __init__(self, ciphertext):
        self.body = HttpRequest.BodyPublishers.ofByteArray(ciphertext)
        self.used = AtomicBoolean(False)

    def subscribe(self, subscriber):
        if self.used.compareAndSet(False,True): self.body.subscribe(subscriber)
        else:
            from java.io import IOException
            subscriber.onSubscribe(EmptySubscription())
            subscriber.onError(IOException('UPLOAD_REPLAY_DISABLED'))


def request(config, ciphertext, milliseconds):
    # SAS sv controls authorization; api-version explicitly selects PUT semantics.
    parts = [part for part in config['serviceSas'].lstrip('?').split('&')
             if unquote(part.split('=',1)[0]) != 'api-version']
    parts.append('api-version='+SERVICE_VERSION)
    uri = URI(config['destination'] + '?' + '&'.join(parts))
    if uri.getScheme() != 'https': raise ValueError('HTTPS_REQUIRED')
    return (HttpRequest.newBuilder(uri).timeout(Duration.ofMillis(milliseconds))
        .header('x-ms-version',SERVICE_VERSION)
        .header('x-ms-date',DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now(ZoneOffset.UTC)))
        .header('x-ms-blob-type','BlockBlob')
        .header('Content-Type','application/octet-stream')
        .header('Cache-Control','no-store')
        .header('x-ms-blob-cache-control','no-store')
        .PUT(HttpRequest.BodyPublishers.fromPublisher(OneShotBody(ciphertext),long(len(ciphertext)))).build())


def upload(config, ciphertext, deadline, client_factory=None):
    """A thrown/lost response after sendAsync is conservatively unknown.

    No application retry. transportDrained=false keeps the coordinator closed to
    new attempts when cancellation cannot confirm local transport termination.
    """
    client, future = None, None
    sent = False
    outcome = {'outcome':'failure','code':'UPLOAD_NOT_SENT','transportDrained':True}
    try:
        deadline.check()
        remaining = max(1,long((deadline.end-deadline.clock())/1000000))
        message = request(config,ciphertext,remaining)
        if client_factory is None:
            client = (HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NEVER)
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(min(10000,remaining))).build())
        else: client = client_factory()
        deadline.check()
        sent = True
        future = client.sendAsync(message,HttpResponse.BodyHandlers.discarding())
        while True:
            deadline.check()
            try:
                response = future.get(20,TimeUnit.MILLISECONDS)
                break
            except TimeoutException: pass
        status = response.statusCode()
        if status == 201: outcome = {'outcome':'success','code':'PUBLISHED','transportDrained':True}
        elif 300 <= status < 500:
            outcome = {'outcome':'failure','code':'UPLOAD_REJECTED','transportDrained':True}
        else:
            outcome = {'outcome':'unknown','code':'UPLOAD_OUTCOME_UNKNOWN','transportDrained':True}
    except (Exception, JavaException):
        if sent: outcome = {'outcome':'unknown','code':'UPLOAD_OUTCOME_UNKNOWN','transportDrained':True}
    finally:
        if future is not None and not future.isDone(): future.cancel(True)
        if client is not None:
            try:
                client.shutdownNow()
                # Do not add a fresh timeout after the shared budget has elapsed.
                remaining = max(0,long((deadline.end-deadline.clock())/1000000))
                outcome['transportDrained'] = client.awaitTermination(Duration.ofMillis(min(100,remaining)))
            except (Exception, JavaException): outcome['transportDrained'] = False
    return outcome
