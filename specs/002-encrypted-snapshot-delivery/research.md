# Part 2 Research

**Date**: 2026-09-08  
**Status**: User approved capture on book close and plain expiry status text directing to an Extensions-menu settings action. Early exit detection and clickable-status API discovery are no longer design blockers. Persistent installation, full-book shutdown deadlines and end-to-end acceptance remain unverified. Phase 1 artifacts have not yet been generated. Earlier probe entries below are historical evidence; the latest accepted decisions supersede their blockers.

## Persistent Jython extension and genuine signing

**Decision**: Use the official packaged Jython MXT extension mechanism with a persistent initializer and registered actions. Retain Jython 2.7 export logic. Obtain the official DevKit and follow its real key-generation/package-signing workflow. Personal unverified signing is described by the vendor; do not invent a certificate or substitute a manually launched script for installation.

**Rationale**: The vendor distinguishes packaged extensions from console scripts, documents initializer context, and warns against retaining transient book/UI globals. Actual installed restart behavior still needs testing.

**Alternatives**: Console script each session fails FR-001; rewriting the exporter in another language violates the existing compatibility requirement; generic keytool/jarsigner instructions are not a substitute for verifying Moneydance's prescribed packaging process.

**Evidence**: [Official Python extension guide](https://test.infinitekind.com/developer-python), [developer resources](https://test.infinitekind.com/developer). No keys, certificates or signed package were generated in this planning run.

## Shutdown lifecycle — unresolved gate G2

**Decision**: Do not select an unproven event as a guaranteed final-state publication hook. Probe normal exit, canceled exit, save and book-close ordering in the actual installed runtime before implementing automatic publication.

**Rationale**: Vendor resources list save and application-exit notifications, but do not establish the ordering and completion guarantees needed by FR-005. An event name alone cannot establish that a final saved book is available or that a background upload can finish before termination. The existing exporter uses EDT capture; blocking the EDT while waiting for work that needs it risks deadlock.

**Alternatives**: Every-save publication changes the requested trigger; holding a book after close does not prove source correctness; a post-exit external script changes scope; unbounded shutdown waiting violates failure behavior.

**Required evidence**: Sanitized event names/order, whether EDT, book-available boolean and operation timing on a synthetic book. Verify final user edits are captured, canceled exits do not falsely succeed, and remaining deadline stops safely. Record operation elapsed and incremental shutdown duration separately. No private records are needed to establish this sequence.

**Source**: [Official application events](https://test.infinitekind.com/developer). Runtime ordering remains unverified.

## Expiry status — G3 design resolved by user decision

**Decision**: The user explicitly approved plain status warning text directing to Extensions > Snapshot Settings, which opens Azure configuration and renewal instructions. Use the public status-text and registered-feature facilities; do not attach click listeners to internal status panels.

**Evidence**: [Official URI scheme](https://moneydance.com/dev/urischeme) documents progress text/meter. Local public API inspection reported MoneydanceGUI.setStatus(String,double) and Main.setStatus(String), but no documented click action. Additional parent-agent reflection of com.moneydance.apps.md.view.gui.StatusPanel found declared size/updateUI methods only and no declared fields. This is not proof no solution exists; it does not establish a supported implementation.

**Required evidence**: Installed extension shows the expiry warning at the required times; the named menu action opens configuration and renewal instructions; normal Moneydance progress remains usable. No status-bar click behavior is required.

## Native crypto and interoperable envelope

**Decision**: Candidate AES-256-GCM with 128-bit tag, unique random 96-bit IV and fresh 128-bit salt per export; PBKDF2-HMAC-SHA256 at 600,000 iterations. Use Java JCA and browser Web Crypto rather than adding a crypto package. Version the binary envelope and authenticate header parameters. Keep inner snapshot v1 unchanged. Freeze exact bytes/password encoding in Phase 1 only after compatibility gates close.

**Rationale**: Authenticated encryption rejects modified data. Native APIs exist on both sides. OWASP's PBKDF2 work factor is a conservative design baseline, not proof that Pixel timing or a particular password is adequate. Require non-ASCII, combining-character and supplementary-character interoperability vectors before accepting password encoding.

**Alternatives**: CBC without authentication is insufficient; custom primitives are unnecessary; a WASM/native crypto library adds dependencies before evidence of need; base64 JSON would add size without a current benefit.

**Sources**: [Java Cipher](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/javax/crypto/Cipher.html), [Web Crypto deriveKey](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey), [AES-GCM parameters](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams), [OWASP password guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). These establish facilities/guidance, not executed interoperability or performance.

## Desktop secret persistence

**Decision**: Candidate Windows DPAPI CurrentUser-protected password/SAS bundle scoped to a book identifier in the Windows profile. Prefer a verified native Moneydance facility if one is established; otherwise use a narrow PowerShell/.NET pipe bridge. Do not save its unlocking key beside the encrypted secrets.

**Rationale**: Unattended exit requires recoverable desktop secrets. DPAPI uses the user's Windows context; no extra Jython native binding is necessary. Secret bytes must travel through stdin/stdout pipes, not command arguments, environment variables, logs or plaintext temporary files. Restrict file permissions and launch the helper without a visible window. DPAPI is not protection against code already running as the same user.

**Alternatives**: Plaintext preferences or encoding-only storage do not protect credentials; asking every session contradicts unattended operation; a new password-vault service is excess scope.

**Source**: [Microsoft data protection](https://learn.microsoft.com/en-us/dotnet/standard/security/how-to-use-data-protection). Actual helper execution and recovery after restart remain validation obligations.

## Azure authorization

**Decision**: Recommend a blob-scoped, HTTPS-only service SAS granting write access to the one publication blob, issued for 23 calendar months only when the storage policy allows it. Store actual issuance/start/expiry metadata; do not mislabel start time as proven issuance time. Renew through extension configuration/instructions and warn at 30 days. Never put this upload credential in the viewer.

**Rationale**: The no-expiry preference is considered but does not justify full-account privileges. Account keys have no automatic expiry but broad access; managed identity needs infrastructure not established for this desktop; user-delegation SAS cannot provide a manually renewed 22–24-month lifetime. A service SAS provides a smaller authorization surface. Existing account policy is unknown and must be checked before provisioning. No real account settings were inspected or changed.

**Alternatives**: A full account key is not the default; user-delegation SAS is limited to seven days; Azure/Arc identity infrastructure or a token backend expands scope. If policy rejects 23 months, return the conflict rather than silently shorten the secret lifetime.

**Sources**: [Storage account keys](https://learn.microsoft.com/en-us/azure/storage/common/storage-account-keys-manage), [user delegation SAS](https://learn.microsoft.com/en-us/rest/api/storageservices/create-user-delegation-sas), [SAS expiration policy](https://learn.microsoft.com/en-us/azure/storage/common/sas-expiration-policy).

## Complete publication and HTTP deadlines

**Decision**: One Java HttpClient PUT of complete ciphertext as a BlockBlob with explicit connect/request deadlines, fixed content length, no redirects and sanitized errors. HTTP 201 establishes acknowledged success; a lost response after transmission yields unknown outcome. Serialize the single producer, do not blindly retry an older payload. Multi-block staging and independent-writer conflict machinery are unnecessary for the present file size and scope.

**Rationale**: Azure supports single-PUT sizes far above the current file and consistent reader views during writes. Atomic publication does not guarantee the client learns whether a timed-out request committed. Do not delete a prior object before writing or treat every timeout as definite preservation of its prior bytes.

**Sources**: [Put Blob](https://learn.microsoft.com/en-us/rest/api/storageservices/put-blob), [Azure concurrency](https://learn.microsoft.com/en-us/azure/storage/blobs/concurrency-manage), [Java request timeout](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpRequest.Builder.html). Local bundled Java reports Temurin 21.0.5; no HTTP upload was performed.

## Website read path and cache

**Decision**: Preserve a same-origin HTTPS read URL for the encrypted blob; plaintext synthetic data keeps its existing explicit path. Configure no-store at origin and bypass snapshot caching in Cloudflare, then verify behavior after replacement. This configuration is a required delivery check, not construction of a new hosting platform.

**Rationale**: fetch no-store alone cannot establish edge freshness. Azure static website content is public at its website endpoint, even with private container settings; only ciphertext and nonsecret assets belong there. Client-side decryption does not protect against compromised website code. Do not publish upload secrets or describe ciphertext hosting as access control for them.

**Sources**: [Azure static website access](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website), [Cloudflare cache controls](https://developers.cloudflare.com/cache/concepts/cache-control/).

## Viewer unlock and password managers

**Decision**: Stable visible form, password input with current-password autocomplete, explicit Unlock submission; read the current field value at submit time rather than requiring an input event from autofill. Download ciphertext once into the worker; retryable authentication failure retains it and does not terminate the worker. Successful authentication precedes inner parsing/validation and financial rendering. No app-managed persistent password storage. Preserve BFCache session behavior and dispose on final departure.

**Rationale**: The current worker client terminates on any error; password failure therefore needs a distinct recoverable result. Platform password managers control prompts and user verification; no promise of zero-interaction fill on every platform. No manager-specific SDK or automated form submission is needed.

**Sources**: [Keeper browser extensions](https://docs.keeper.io/user-guides/browser-extensions), [LastPass autofill](https://blog.lastpass.com/posts/how-to-use-lastpass-autofill), [Apple autofill workflow](https://developer.apple.com/documentation/security/about-the-password-autofill-workflow). Test actual managers on agreed desktop/Pixel/iOS environments; no such Part 2 test has run.

## Local inspection and limits

- The actual Git branch is feature-moneydance-extension-and-encryption; setup-plan's BRANCH field resolves to the feature identifier, not that Git branch.
- Read installed C:/Program Files/Moneydance/lib JAR metadata and reflected public class signatures through its bundled Java/Jython, without opening a book or launching the Moneydance UI. Java is 21.0.5. keytool/jarsigner/javac were not found on PATH in this session; no conclusion is drawn about their availability elsewhere.
- No certificate, secret, cloud change, installation or financial mutation occurred. Read-only class inspection is not a source-runtime shutdown test.
- Constitution v1.1.0 was reviewed. No added production package is proposed; platform facilities avoid transitive dependency growth. A concrete status/lifecycle solution must still satisfy maintainability and supported-runtime constraints.
- Phase 0 exits with two explicit unresolved integration gates (G2/G3). G1 installation is a documented supported approach awaiting acceptance testing. Azure policy, DPAPI and crypto interoperability are subsequent environment/acceptance checks. Do not label the plan ready for unrestricted implementation or generate finalized Phase 1 contracts from guessed Moneydance capabilities.

## Compatibility probe prepared — 2026-09-08

scripts/extension-preflight.py now provides a temporary Developer Console runtime
extension using the vendor's moneydance_extension discovery convention. It records
sanitized lifecycle events to a selected new log file, inspects public UI signatures
without changing the status bar, and offers a single optional two-second app-exit
callback hold. Instructions are in scripts/extension-preflight.md.

Three tests pass under installed Moneydance Java/Jython with fake source objects:
privacy-safe lifecycle/teardown logging, safe read failure, and one-shot bounded hold.
No actual Moneydance application exit, persistent installation or clickable status
integration has been verified yet. G2/G3 remain open pending the user's first
synthetic-book log. The temporary runtime probe is not presented as the persistent
extension required by FR-001.

## First actual runtime probe — user log, build 5253 / Java 21.0.5

Observed sequence: file:closing → file:presave → file:postsave → file:closed →
app:exiting → two-second hold completion → backupstarted → backupfinished.
All listed lifecycle callbacks were off the EDT. The source was readable with
15 transactions through file:closed; it was unavailable at app:exiting and later.
Initial/manual counts were 13/15, confirming the recorded post-edit count remained
visible during save/close. This is count evidence, not full financial equivalence.

The app-exiting hold completed in approximately 2.008 seconds before subsequent
backup events. No UNLOAD line was present, so do not depend on unload for final
status persistence. This does not yet prove a 60-second upload deadline.

G2 finding: app:exiting cannot perform source capture. Investigate a detached
candidate captured after the save during book closing, with publication deferred
until app:exiting. Book switch/close without application exit must not publish;
stale candidates must be invalidated. Do not retain a Java book reference after
close. This is a candidate requiring another probe, not an approved final design.

G3 remains unresolved: both UI scans failed after CONTEXT_API. Probe version 2
adds a failing-stage identifier and exception type only (no exception message).
Next diagnostic can be run without another shutdown: start a fresh log and inspect
UI capabilities, then stop logging. The original runtime log remains unchanged.

## Second actual runtime probe — version 2, build 5253 / Java 21.0.5

The user supplied `.workspace/data/extension-probe-exit-02.log` and confirmed a
preference for close-triggered syncing over nightly scheduling. No scheduled-task
or headless-export approach is being adopted.

The second run repeats the first run's event order: closing, presave, postsave,
closed, app:exiting, completed hold, backupstarted, backupfinished. Initial/manual
transaction counts were 15/17; 17 remained readable through closed. The book was
unavailable at app:exiting. All these lifecycle callbacks were off the EDT. The
one-shot hold completed in 2.017 seconds, and no UNLOAD event was logged.

This strengthens the observed lifecycle pattern on this build but does not close
G2: a detached final-state snapshot, safe EDT capture during shutdown, and bounded
publication still need validation. Capturing the book for the first time at
app:exiting is unsuitable in both observed runs.

G3 diagnostic is now narrower: getUI and reading the GUI class both succeeded
(`com.moneydance.apps.md.view.gui.MoneydanceGUI`). Public method inspection then
raised TypeError at gui_methods on both scans. Component scanning was therefore
never reached. This is a probe inspection failure, not evidence that status-bar
integration is unsupported. Diagnose the signature-inspection failure locally
before requesting another UI-only run; another identical shutdown run is not
needed to investigate this error.

## Version 3 diagnostic prepared

Reproduced the UI failure locally under installed Jython using the actual
MoneydanceGUI class: parameter-type `p.getName()` raises TypeError (expected one
argument). Explicit `Class.getName(p)` fixes signature inspection; the regression
test passes without creating a GUI or opening a book.

Added explicitly armed one-shot closing/postsave capture for the synthetic book,
reusing exporter functions through a library-only load flag. Ordinary saves do
not trigger capture. The candidate is serialized to detached bytes in memory,
with counts/timing logged and byte integrity checked at app:exiting. No financial
payload or digest is logged, written or uploaded. Seven actual-Jython tests pass
with fake source objects. Instructions and timeout limitations are recorded in
scripts/extension-preflight.md. Actual capture-during-shutdown results are pending;
G2/G3 remain open, including early distinction of book close from application exit.

## Third actual runtime probe — version 3, build 5253 / Java 21.0.5

User supplied `.workspace/data/extension-probe-exit-03.log` and reported shutdown
appeared to finish in under two seconds without an apparent crash. Capture after
postsave succeeded in 187 ms: 43,815 detached JSON bytes and 18 exported entries.
The source transaction count was 17 initially and 19 after editing, remaining 19
through closed. Source transaction counts and exported account-side entry counts
are different measures; their differing totals do not establish missing data.

EXIT_CANDIDATE reported unchanged=true after the live book became unavailable.
Backup started and finished afterward. The recorded closing-to-backupfinished
interval was 303 ms. There was no armed two-second hold or actual encryption/upload.
This verifies successful synthetic in-memory capture through the EDT during this
shutdown, including the exporter's internal checks and byte survival until exit.
It does not establish full-book performance, persisted-data equivalence, upload
completion, or early exit-versus-book-close discrimination; G2 remains open.

GUI_API now succeeds, confirming the signature-inspection fix in the actual app.
Both scans still fail with TypeError at component_scan, before any status component
is logged. The component traversal needs separate diagnosis; clickable status
integration remains unverified (G3). Do not ask for another identical capture run
to diagnose that UI error.

## Version 4 diagnostic prepared

Reproduced MainFrame class-name lookup TypeError under the bundled Jython runtime.
Used explicit Class.getName for UI/component classes, extending the parameter-type
fix. Public method inspection of Main, MoneydanceGUI and MainFrame found exit/close
actions but no obvious public exit-in-progress getter. No shutdown action was
invoked during local inspection, and absence from this inspection is not proof
that no supported hook exists.

The probe now logs filtered vendor class/method call paths at closing, postsave,
and app-exiting for comparison between normal book close/switch and application
exit. These are diagnostic only; do not build production gating on stack-name
matching. The requested paired run arms neither capture nor a delay. Instructions
are in scripts/extension-preflight.md. G2/G3 remain open pending runtime results.

## Fourth actual runtime probe — book creation/switch versus window X

User supplied extension-probe-close-04.log and extension-probe-exit-04.log.
The close workflow was File > New, creation of another synthetic book, then
switching back to the original. Application exit used the window X.

Both UI scans completed without reaching the 2,000-component limit (204 and 248
components). Each found two StatusPanel instances and a JProgressBar; one panel
had one mouse listener and the others had none. This confirms traversal works,
not which panel owns the visible status text or a supported extension click API.
The method filter is selective, so the reported mouseExit method is not a complete
inventory of component methods. G3 remains open.

Both book switches emitted closing/presave/postsave/closed followed by opening
and opened, with no app:exiting. New-book switching ran on the EDT; switching back
ran off the EDT. Thus neither closing-plus-postsave nor an off-EDT callback
distinguishes exit. The existing manually armed diagnostic would capture on a
book switch if armed; it must not be adopted unchanged as automatic exit gating.

Window X first caused an EDT save via MainFrame.goingAway, then the usual off-EDT
closing/save/closed/exiting sequence. Main.shutdown appears in the latter callback
call paths; switches instead show NewFileWizard or openAccountBook callers.
This is an observed internal call-path difference, not a supported exit signal.
Do not use stack matching or EDT status as production gating. Next investigation
must establish a supported pre-close exit indication or explicitly reconsider
whether book-close capture is acceptable; no such scope change is assumed.

Transient BOOK_READ_FAILED during opening/backupstarted on the return switch
resolved by backupfinished/opened (19 source transactions). The probe made no
capture or upload in either run. G2 remains open despite successful prior synthetic
capture, because early exit discrimination remains unverified.

## Accepted scope clarification and status integration review

The user works in one AccountBook and accepts capture delay during occasional
book switching. This supersedes earlier statements that early exit-versus-close
discrimination is a required blocker. Capture once at postsave following closing
of the configured book, publish only at app:exiting, and invalidate candidates
when another book opens. Ordinary saves do not capture. G2 now concerns final-state
fidelity, lifecycle cleanup and actual bounded execution, not an early exit flag.

Further local public API inspection found StatusPanel declares only updateUI and
size methods. MainFrame exposes setStatus(String,double) but no status-action
registration. FeatureModuleContext offers registered menu features and home-page
views, not a status-action registration in the inspected build. The vendor's
[URI documentation](https://moneydance.com/dev/urischeme) establishes text/progress
display, not a clickable extension action. Generic Swing mouse listeners exist,
but locating an internal panel by class and attaching one does not establish
ownership of the displayed warning or noninterference with existing behavior.

No supported clickable-status API was established. G3 remains open. The concrete
simpler alternative is plain status text identifying an Extensions-menu action
that opens Azure configuration and renewal instructions. That would change the
confirmed clickable-status acceptance criterion and therefore requires a user
decision; it has not been adopted or implemented. Another identical read-only
component scan would not resolve that product decision.
