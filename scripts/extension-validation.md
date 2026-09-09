# Extension validation evidence

## Installed expiry checks and red warning update — 2026-09-09

User confirmed the Azure policy permits the current 23-month SAS. With expiry
2028-08-10, actual Moneydance restarts showed no warning on July 9/10 (32/31 days),
and a gray warning on July 11/13 and August 3/9 (30/28/7/1 days). After the expiry
time on August 10, August 11, and August 11 of 2029, the text said credentials
have expired. These are user-reported installed checks using changed system time.
This closes the policy/lifetime and installed warning-boundary evidence gaps.
User then verified build 3 with system dates 2028-08-03 and 2028-08-11: warnings
were red in both cases, the latter said "have expired", and attempting Publish
Snapshot with expired credentials produced the expected error. T017 is complete.

Build 3 makes credential warnings red (#d32f2f) using escaped HTML in the public
status-text URI; normal progress remains plain text. Read-only inspection of the
installed MainFrame/AccountPanel status methods confirmed forwarding to JLabel.setText.
No internal component or shared color is changed. The targeted Jython boundary/
warning markup/save-suppression test passed. User confirmed the actual red appearance.

Rebuilt `dist/snapshot_delivery.mxt` with existing personal KeyAdmin keys. SHA256:
`5AAF174993C017503EC23BF6D5C76A445554735AB052CE0803F42AF4629533AC`.

## Phase 4 local implementation — 2026-09-09

Module build 2: `dist/snapshot_delivery.mxt`, SHA256
`CACB171787944A3DF06989117FBDC46A878F9B954F9E219865D51650D14C49AC`.
Built with `./scripts/package-extension.ps1` using the existing personal KeyAdmin
signing material. The allowlist now includes nine resources plus signing metadata.
No extension installation or Azure write was performed by the agent.

T012–T016 local implementation is complete. Two native encryption tests pass,
including all six fixed vectors through production encryption, fresh salt/IV and
size/password rejection. Seven delivery tests pass under bundled Java/Jython:
actual Java HTTP client sends one fixed-length body to a synthetic loopback endpoint,
rejects redirects and reports response loss; injected transport timeout/quarantine;
stage failures, busy requests, frozen settings, cancellation and deadline rejection;
safe status persistence, serializer ceiling, expiry warnings and inactive save/exit
callbacks. Native source-fixture build/encryption is also decrypted by the actual
Node/Web Crypto utility and validated with the existing financial validator.
Failed-publication readability tests use synthetic simulated storage; they do not
prove live Azure behavior. Two targeted settings/resource regression tests pass.

`npm test`: 41 tests passed. Test discovery is now explicitly scoped to tests/unit
and tests/contract because whole-repository discovery failed on protected signing
and prior DPAPI-test directories. It retains every existing Node test. The previously
observed TLSSocket listener warnings still appear; no related test failed.

Upload uses native Java HttpClient, HTTP/1.1, no redirects, no application retries,
and a one-subscription body to prevent platform replay. SAS requests explicitly
select API version 2023-11-03 without changing signed authorization version `sv`;
headers specify BlockBlob, fixed length and no-store. A lost response/uncertain server
error is unknown; if local transport termination cannot be confirmed, further
attempts in that session are blocked. No previous blob is deleted first. Operations
share one cooperative 60-second budget; noninterruptible JVM/source calls and real
runtime timing remain acceptance obligations. Status text uses Moneydance's public
setprogress URI, with no component interception or polling.

Sources checked during implementation:
[Put Blob](https://learn.microsoft.com/en-us/rest/api/storageservices/put-blob),
[service versions](https://learn.microsoft.com/en-us/rest/api/storageservices/versioning-for-the-azure-storage-services),
[Java HttpClient](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html),
[Moneydance progress URI](https://moneydance.com/dev/urischeme).

**T017 and Phase 4 are complete**. Installed expired-credential publication
blocking and red warning confirmation are recorded above.
Follow [phase4-publish.md](phase4-publish.md). No real-data publication, automatic
exit integration or viewer unlock has been enabled as an acceptance claim.

### Phase 4 manual results — user reported

- Build 2 installed successfully; actual Azure settings saved and SAS paste updated
  issue/expiry dates as expected.
- Three initial publications succeeded; the last measured 1.56 seconds. The first
  two felt similar but were not timed. Azure modification dates updated.
- Downloaded ciphertext rejected an incorrect password and decrypted with the
  correct password. All preflight comparisons passed.
- A new synthetic transaction appeared with the expected changes after another
  publication/download/decryption and before/after JSON comparison.
- Airplane-mode publication showed an error and the Azure blob date stayed unchanged.
  Poisoned SAS input produced an error; restored credentials allowed publication.
- Password-change decryption initially appeared to fail because the output file
  already existed. After removing it, decryption succeeded. This was a utility
  output-file error, not a demonstrated encryption failure.
- The utility now rejects existing output before prompting. User verified that
  error and successful decryption to a new filename. Two targeted utility tests pass.

Later confirmation of actual credential lifetime/policy and installed warning
presentation and expired-credential publication blocking is recorded above.
Busy-request handling and ordinary-save suppression have local automated coverage;
the user has not separately reported the optional installed checks from the guide.

## Settings convenience update — 2026-09-09

Added best-effort SAS expiry autofill for tokens and full SAS URLs, current UTC
issuance on SAS edits, and preservation of saved dates on dialog opening. Invalid,
missing or duplicate expiry values leave the existing expiry untouched. Issuance
remains manually editable for older credentials; Save retains strict validation.
The separately configured destination is not replaced by a pasted SAS URL.

Two targeted tests passed under bundled Jython: actual Swing document events on
the EDT (token/URL parsing, malformed dates, issuance updates and listener cleanup),
and packaged initializer/resource-loading regression. Installed dialog verification
for this update remains manual; the earlier package hash and installation results
below describe the original Phase 3 build. Rebuild/reinstall using
[build-extension.md](build-extension.md) to try the updated source.

## Phase 3 implementation — 2026-09-09

Built `dist/snapshot_delivery.mxt`, SHA256
`1477B95B021FAFBB5BEAB92B3FFB53D7E43D0F916AC699455604A0EA47D0B46D`.
This is genuinely personally signed by the official KeyAdmin tool; it is not
vendor-reviewed. The user installed it by accepting Moneydance's signature warning;
this establishes installation with explicit override, not trusted signature validation.
Run the manual checklist in [phase3-install.md](phase3-install.md).

The 6.0 URL linked from the test documentation returned 404. Downloaded the kit
linked from the main official developer site instead:
https://infinitekind.com/dev/moneydance-devkit-5.1.tar.gz
Archive SHA256: 0314F04863EE924A2DD12B038374C90342533E4E787607E300000A76ACD32382.
Its src/build.xml specifies these actual tool calls:

```text
java -cp <devkit>/lib/* com.moneydance.admin.KeyAdmin genkey <priv_key> <pub_key>
java -cp <devkit>/lib/* com.moneydance.admin.KeyAdmin signextjar <priv_key> 99 snapshot_delivery <unsigned.mxt>
```

scripts/package-extension.ps1 uses those tools directly, an explicit six-resource
archive allowlist and signed-output checks. No Ant/Gradle installation is required
for Python packaging. It refuses to overwrite keys, generates a random passphrase,
protects that passphrase with CurrentUser DPAPI, and keeps it and the genuine keys
in the user-restricted ignored .workspace/tools/snapshot-signing directory. No
passphrase in arguments or logs. Initial generation and a repeat build succeeded.

Five configuration tests passed under bundled Jython, executed as the actual
Windows user because sandbox impersonation cannot use DPAPI reliably. Tests cover
native protection round-trip in separate helpers, corrupted input, timeout and
malformed helper output; settings recovery in a fresh store, restrictive ACL,
wrong-book rejection and rejected-update preservation; settings scope/date/expiry
rules; initializer resource loading without __file__ and teardown. The first runs
found and corrected Java write overloads and Unicode resource compilation. These
are local tests with synthetic credentials and a fake extension wrapper, not an
installed Moneydance restart result.

T006–T011 complete. User confirmed both menus, saving/reopening settings, separate
invalid-URL and blank-password rejection, and cancel discarding unsaved edits.
At least three actual restarts using File > Quit and window X preserved the
extension and saved settings; book switching also preserved installation.
Moneydance displayed an invalid-or-missing/untrusted-signature warning, and the
user chose to continue. The warning does not establish which signature condition
caused it, and override acceptance is not proof of cryptographic trust.
These are user-reported Moneydance results, separate from the local tests above.
No Phase 4+
delivery, shutdown capture or viewer decryption is enabled. The separate three
publishing restart cycles still belong to Phase 5.

## Phase 1: packaging research (T001/T002)

Reviewed 2026-09-08: [official Python guide](https://test.infinitekind.com/developer-python)
and [Developer Kit resources](https://test.infinitekind.com/developer).
The documented sample command, run inside the extracted official DevKit, is:

```text
./gradlew clean genkeys mypythonextension
```

`genkeys` is a one-time genuine signing-key operation, not required on every build.
The resulting sample is dist/mypythonextension.mxt. Personal unverified signing is
supported; vendor-reviewed signing is separate. Install via Extensions > Manage
Extensions > Add from File. A packaged class uses an initializer in script_info.dict.
Python files/script_info go at archive root; meta_info.dict goes under
com/moneydance/modules/features/<extension-id>/. Packaged classes cannot assume
__file__; the wrapper provides getResourceAsStream on this build. Use an isolated
namespace for shared exporter library loading. See extension/README.md for staging.

No DevKit downloaded, keys generated, package built or installed in Phases 1/2.
The exact Windows wrapper invocation and DevKit version must be recorded when
T010 acquires the kit; do not substitute jarsigner/keytool or invent an executable.
No global gradle/javac found on PATH. Existing PATH java points to an Oracle Java8
shim, so local tests explicitly use Moneydance's Java. These facts are not a claim
that all build tools are absent elsewhere.

Local runtime: bundled Temurin 21.0.5+11-LTS; Moneydance user probes build 5253,
Jython 2.7.2; Node v20.9.0. Gradle/DevKit version and packaging remain US1 checks.
No production dependency added. Git exclusions protect packages, keystores and
private config; future packaging must use an allowlist, not rely on gitignore.

## Phase 2: local validation and commands

Run from repo root:

```powershell
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B tests/runtime/export_deadline_test.py
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B tests/runtime/encryption_test.py
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B tests/runtime/extension_probe_test.py
node --test tests/unit/encryption-vectors.test.mjs
npm test
```

The deadline suite uses fake source objects: expiration/cancellation, source stamp
change rejection, equivalent financial output and queued-EDT timeout with zero
source reads. A running Java call cannot be forcibly interrupted; checks are
cooperative. No hard shutdown bound is claimed before actual full-book acceptance.

Encryption known answers are generated by Node/OpenSSL and committed as synthetic
fixtures. JCA verifies exact keys and ciphertext; Node Web Crypto verifies decryption
and malformed inputs. This is real native crypto execution, not browser-device
acceptance. Contract parsers here are test-only oracles, not production components.
Production T012/T022 must pass the same vectors. No upload/decryption UI implemented.

Executed locally: 40 Node tests passed, five exporter deadline tests passed, one
JCA test passed for all six vectors, and nine existing probe tests passed. The
Node runner emitted MaxListenersExceededWarning for TLSSocket close listeners;
there were no test failures. Its origin has not been diagnosed in this phase.
Git whitespace checks passed; private/package ignore examples were verified.

## User source validation (T004 passed 2026-09-09)

User ran the deadline validation in Moneydance and reported DEADLINE_SOURCE_PASS:
18 entries, stable=true, outputEqual=true, timeoutRejected=true, normal completion.
Standalone snapshot.synthetic.json validated with 118 accounts and 18 entries.
Initial Case 1 reference failures were traced to three additions made for the
shutdown probes. The user confirmed those additions and the intentional 2036 date.
The private reference was updated from that confirmation, including independently
calculated running/closing balances and current/future date checkpoints. Re-running
both validators returned VALID and REFERENCE_COMPARISONS_PASS. Earlier dates outside
compact coverage retain the prior source-preflight evidence; they were not retested.
No source records were changed. Chooser cancellation was not newly reported in this
run; the earlier cancellation result remains the evidence for that unchanged path.

Reproduction instructions:

1. Open the original synthetic book in Moneydance; finish any row edits.
2. Run scripts/export-deadline-validation.py in Developer Console. Expect
   DEADLINE_SOURCE_PASS with stable/outputEqual/timeoutRejected true. Share its
   single sanitized result. It reads the book but writes neither records nor JSON.
3. Run the updated export_json.py normally. Save a new synthetic snapshot and run:

```powershell
node scripts/validate-snapshot.mjs UI/data/snapshot.json
node scripts/compare-preflight.mjs UI/data/snapshot.json UI/data/preflight-reference.private.json
```

Use the path actually saved. Expect VALID and REFERENCE_COMPARISONS_PASS; retain
existing compact-coverage exclusions. Also confirm chooser cancellation still
reports EXPORT_CANCELLED. Do not alter references to make an unexplained failure pass.
Local fake-source checks do not complete this required actual-source validation.

## Later acceptance

US1 persistent restart/settings, US2 actual synthetic Azure delivery and warnings,
US3 final-edit/shutdown timing, and US4 browser/password-manager/Pixel checks remain
unrun. Follow specs/002-encrypted-snapshot-delivery/quickstart.md as those phases
are implemented. No repeated production probe or real cloud action is requested now.
