# Data Model: Encrypted Snapshot Delivery

Design contract; implementation and runtime acceptance remain pending. Snapshot v1
is unchanged. No generation IDs, dataset history or periodic refresh are introduced.

## Installation and configuration

One persistent MXT identity owns two registered actions: Snapshot Settings and
Publish Snapshot. Its packaged shared exporter loads without running its chooser.

Configuration v1 contains configuredBookId (stable source root UUID), HTTPS blob
destination, credentialIssuedAt, credentialExpiresAt (UTC instants or explicitly
unknown), and a DPAPI CurrentUser-protected bundle containing encryptionPassword
and serviceSas. Store in the Windows user profile with user-restricted permissions;
never in the book, extension package, repository or viewer. Destination excludes
the SAS query. Freeze the configuration for each attempt. Reject blank passwords,
invalid HTTPS destinations, missing authorization and another book's identity.
Renewal replaces credentials without reinstalling. A password change affects only
subsequent successful publications. Reject unpaired Unicode surrogates; preserve
all other password characters, without trimming or normalization.

Known expiry produces states valid, warning (at or within 30 days), expired.
Unknown stays unknown; do not infer non-expiring. Verify 22–24-month issuance-to-
expiry lifetime against real issuance metadata and storage policy, not SAS start
time alone. Default issuance target is 23 calendar months.

## Detached snapshot and close candidate

Reuse capture/build_snapshot and the strict snapshot-v1 contract. Relevant source
reads and stable double capture occur on the EDT; detached transformation,
serialization and encryption occur off it. No Java account/book nodes survive
capture. The candidate contains configuredBookId, frozen configuration, detached
records or serialized snapshot, capture instant and the operation deadline.
It is memory-only and is not financial data in the status log.

State: idle → closingArmed → captured → publishing → finished. Closing the
configured book arms one capture; its postsave consumes the arm. Ordinary saves
do nothing. Within an active close cycle, duplicate closing notifications do not
reset the arm, discard a successful candidate, restart deadlines or initiate another
capture. Duplicate postsave/exiting notifications cannot capture or publish twice.
Opening any book ends the cycle and invalidates its arm/candidate. Confirmed exit
cancellation also ends the cycle and invalidates the candidate before another close
attempt; it never reports success. Only a close after the previous cycle has ended
starts a fresh cycle. If closing does not reach postsave, no candidate is usable.
How cancellation is detected must be verified in the actual runtime; do not assume
an undocumented cancellation callback or treat a duplicate close as proof of cancellation.
Only app:exiting publishes automatically. Rare book switching may incur capture
cost, per user approval, but never publishes by itself.

## Delivery attempt

Fields: trigger (manual/exit), stage (capture/validate/encrypt/upload), start and
monotonic deadline, outcome (success/failure/unknown), safe code and completion
time. One attempt owns the pipeline. Repeated manual commands report busy.
Shutdown must serialize behind or cancel/drain an earlier attempt within the
remaining deadline; an earlier manual snapshot cannot substitute for final state.
Do not launch another PUT while an older request may still be active. A timed-out
ambiguous PUT is not blindly retried; manual retry captures fresh data.

Each operation has a 60-second budget beginning with capture. Additionally, the
first closing notification for the configured book starts a 60-second shutdown
deadline. All extension work during closing, including waiting for or draining an
existing manual operation before capture, counts against that deadline. Use the
earlier applicable deadline; neither exit nor duplicate notifications reset it.
Measure operation duration and incremental shutdown duration separately. Check
the deadline during source traversal, transformation and between stages; use
cancellable bounded HTTP. Never Thread.stop. Timeout of queued EDT work cancels
it before execution; a running source call must return before its next cooperative
check. Actual runtime bounds remain a release gate, not a claimed guarantee from
the diagnostic's five-second wait.

Persist only last outcome, stage, safe code, completion UTC and elapsed duration.
For exit results, `elapsedMs` measures capture-to-completion and `shutdownElapsedMs`
measures first-closing-to-completion, including settings loading and manual drain.
Never persist payload, password, SAS, full URL, source names or raw exception text.
Response loss after transmission is unknown, not proven remote failure.

### Build 5253 lifecycle implementation evidence

Actual event names have the `md:` prefix. `postsave` is not proof of a successful
save: inspection found it is emitted even on the failed-save return path. Require
the subsequent `file:closed` before consuming a candidate at `app:exiting`. Another
presave before closed, after capture has started, makes the candidate ambiguous;
fail closed instead of recapturing or publishing it. Opening/unload resets the cycle.
No dedicated canceled-exit event was established. Immediate reset on an independently
confirmed cancellation is tested as a state transition, but its actual runtime
notification remains unverified; do not infer cancellation from duplicate closing.
An aborted save may require reopening the configured book before a fresh close cycle.

## Viewer session

States: loading → locked → unlocking → ready; wrong password/authentication failure
returns to locked with ciphertext retained. Unsupported envelope, fetch or validated
financial-data failure is terminal and requires reload. Test mode loads plaintext
directly. Fixed effectiveDate is the user's local page-load date, including across
password retries and BFCache restoration. ExportDate remains the source export
instant, displayed in the user's timezone.

Worker owns ciphertext, decryption and validated model. Discard ciphertext after
successful validation; clear the password input and release password/key/plaintext
references when no longer needed. No promises of guaranteed zeroization in managed
memory. Keep only existing viewing data through BFCache; final disposal terminates
the worker. No application localStorage, sessionStorage, IndexedDB or service-worker
caching of secrets or financial payloads. User-managed password storage is allowed.
