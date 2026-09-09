# Extension validation evidence

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
