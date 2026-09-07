import { parentPort, workerData } from 'node:worker_threads';
import { createSnapshotHandler } from '../../UI/src/snapshot-worker.mjs';
const handle = createSnapshotHandler({ baseUrl: workerData.baseUrl, postMessage: data => parentPort.postMessage(data) });
parentPort.on('message', data => { void handle(data); });
