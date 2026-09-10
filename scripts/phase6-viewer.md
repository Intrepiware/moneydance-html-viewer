# Phase 6: encrypted viewer validation

Status: Phase 6 closed on 2026-09-10. User reported the harness passed and chose
to waive LastPass/iOS Safari checks, leaving them untested. The earlier pending
instructions below are retained as optional reproduction steps, not blockers.

Accepted limitation (2026-09-10): iOS Chrome can still leave the viewport zoomed
or displaced after keyboard interaction. The user accepts pinching to undo the
zoom as a workaround. Further reproduction is not required for this accepted gap;
this does not establish unreported password-manager compatibility.

No extension rebuild is required. Deploy the updated UI files together; the worker,
client, app and configuration must be from the same version.

## Local synthetic check

From the repository root:

```powershell
npm test
node scripts/serve-ui.mjs --snapshot tests/browser/synthetic-snapshot.enc
```

Open http://127.0.0.1:8080/ and enter the public synthetic password
`synthetic-password`. Try a wrong password first, then the correct one without
reloading. Confirm balances, accounts, search, future rows and As of display.
The provided fixture was encrypted with production extension/encryption.py under
bundled Jython/Java, from tests/fixtures/valid-snapshot-v1.json; it contains no
private data. Its password is deliberately public and is not a production secret.

Open http://127.0.0.1:8080/tests/browser/ and report its results. The harness includes
the original plaintext tests plus real worker/form unlock, a wrong-password retry,
submit-time value reading without an input event, password clearing, balances and
persisted lifecycle. These simulated lifecycle/autofill events do not establish
actual BFCache or password-manager compatibility.

Exact `?test=true` continues to load plaintext synthetic data without a password.
Normal mode now requires an encrypted envelope; it never falls back to JSON.
The default reader path is `./data/snapshot.enc` in UI/config.js. Set it to your
same-origin encrypted blob path if different. Do not include an upload SAS token.
The local --snapshot option maps a selected encrypted file to /data/snapshot.enc.

## Installed browser acceptance

1. Load the synthetic encrypted snapshot on desktop and Pixel 8 over HTTPS (or
   localhost for desktop). Ordinary remote HTTP does not provide Web Crypto.
2. Verify wrong-password feedback and retry. In Network tools, confirm just one
   snapshot download across both attempts. Reloading begins a new session/download.
3. Unlock using normal saved-password autofill with Keeper, LastPass, and iOS Safari
   where available. Report browser/device, manager and result separately; manual
   typing and the harness's submit-time simulation do not substitute for autofill.
4. Verify the input clears after success, accounts/balances and searches work, and
   browser back/forward navigation does not expose stale replies or redownload a
   preserved session. Navigate away during unlocking and confirm no late UI appears.
5. Confirm a missing encrypted file offers the test-data link. Malformed/truncated
   files must fail without showing financial data. Authentication failure may mean
   either a wrong password or damaged ciphertext; retries reuse those same bytes.

T027 remains pending actual device/autofill evidence. Browser harness execution is
also pending in T026 because no browser was available to the agent. Private full-book
performance and live cache/freshness checks remain Phase 7; do not equate synthetic
or Node results with those acceptance checks.
