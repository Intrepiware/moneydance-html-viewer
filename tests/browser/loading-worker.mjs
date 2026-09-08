import { createSnapshotHandler } from '/src/snapshot-worker.mjs';
// Observe actual requests in the test worker; do not substitute fixture responses.
let count=0;
const handle=createSnapshotHandler({baseUrl:location.href,
  fetchSnapshot:(...args)=>{count++;return fetch(...args);},
  postMessage:message=>postMessage({...message,testFetchCount:count})});
onmessage=event=>{void handle(event.data);};
