# Validation guide: Encrypted Snapshot Delivery

Phases 1–4 have local implementation; live Phase 4 Azure acceptance remains pending.
Record results in scripts/extension-validation.md as implementation proceeds.
Use synthetic data first; do not commit private logs, keys, configurations or exports.

## Existing baseline

From the repository root:

```powershell
npm test
npm run serve
```

Open the server's `/tests/browser/` harness and confirm the existing tests pass.
The temporary probe can be checked separately with the command in
scripts/extension-preflight.md. It does not validate persistent installation.

## Install and configure (US1)

Use the official DevKit packaging/signing procedure recorded in
scripts/extension-validation.md. From PowerShell at the repository root:

```powershell
# Only for a fresh signing setup (refuses to overwrite existing keys):
./scripts/package-extension.ps1 -GenerateKeys
# Subsequent builds with the same signing identity:
./scripts/package-extension.ps1
```

The current workspace already has generated signing keys; use the second command.
Output is dist/snapshot_delivery.mxt. DevKit 5.1 KeyAdmin is used directly because
the advertised 6.0 download returned 404. This is genuine personal signing, not
vendor-reviewed signing. Keep the signing directory private.
Install the resulting MXT through Moneydance's extension manager. Use the synthetic
book and genuine synthetic-destination credentials. Set encryption password and
blob destination in Extensions > Snapshot Settings. Restart three times, checking
menus and protected configuration persist without Developer Console loading.
Invalid settings must prevent delivery. Inspect only sanitized results, not secrets.

## Manual encrypted delivery (US2)

Follow [the manual Phase 4 checklist](../../scripts/phase4-publish.md), including
actual storage policy and service-SAS lifetime verification. Install module build 2.
After downloading the synthetic ciphertext through the Azure portal:

```powershell
node tests/tools/decrypt-synthetic.mjs --synthetic --input UI/data/published.synthetic.enc --output UI/data/decrypted.synthetic.json
node scripts/compare-preflight.mjs UI/data/decrypted.synthetic.json UI/data/preflight-reference.private.json
```

The password prompt is hidden; no password argument is supported. The optional
output is synthetic plaintext and refuses overwrite. Local runtime checks:

```powershell
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B tests/runtime/encryption_test.py
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B tests/runtime/delivery_test.py
npm test
```

Loopback HTTP and injected responses are local tests, not Azure policy/TLS or
installed Moneydance acceptance. Automatic close publication remains Phase 5.

Publish a known synthetic book with Publish Snapshot. Confirm HTTP success, fetch
the ciphertext, decrypt with the contract test utility and compare the inner v1
snapshot using the existing validator/reference comparison. Preserve the source
preflight treatment of compact coverage and excluded metadata. The implementation
must document exact test-utility commands here before claiming this check passes.

Exercise injected capture/encryption failures, denied credentials, network loss
and response loss after commit using a controlled test endpoint. Prior complete
data must remain readable; ambiguous results must say unknown. Test warning at
31 days, exactly 30 days, expiry and unknown expiry, then use the named settings
menu to renew without reinstalling. Check password changes affect only new exports.

## Normal exit (US3)

Finish a final fictional edit, exit with window X, reopen, retrieve/decrypt and
compare the final saved values. Repeat with menu Exit if available.
Complete three normal close/reopen cycles after one installation, making a distinct
synthetic edit before each close. Retrieve and decrypt each publication, verify
that edit and expected financial values, and check persistent settings and the
next-launch operation result. Installation-only restarts do not satisfy this test.

Check ordinary
saves cause no capture; duplicate notifications cannot publish twice. Book switching
may capture but must not upload, retain another book or publish an old candidate.
Exercise canceled exit only if the application provides a normal cancel path.
Use deterministic lifecycle tests for cases unavailable in the UI, labeling them
as simulations. Test shutdown during an ongoing manual attempt and offline exit.
Record both operation time and incremental shutdown delay against 60 seconds.
Start the shutdown deadline at the first configured-book closing notification;
include waiting for an ongoing manual attempt before capture. Enforce the earlier
of that deadline and the operation's capture-start deadline. Test duplicate closing
before/after capture and during publication: it must preserve the candidate and
deadlines without recapturing. Verify confirmed cancellation invalidates the cycle;
record the actual detection mechanism rather than assume a cancellation callback.

## Viewer and device (US4)

Run the updated browser harness. Real mode prompts without financial content;
correct password unlocks, wrong password permits retry with one network fetch.
Tampering, unsupported/truncated envelope and invalid inner finances fail closed.
Exact test=true remains password-free; missing real data has only explicit fallback.
Check BFCache back/forward and final disposal, fixed page date, as-of footer,
account balances, full history, search, paging and future disclosure.

Verify normal autofill using Keeper and LastPass on the available desktop/Pixel
installations and built-in passwords on iOS Safari. Record platform/version and
normal user interactions; do not count manual typing as autofill success.

Finally use the real book privately. On Pixel 8 record bytes/accounts/entries,
browser, route/cache state and five download+decrypt+validate+render durations,
excluding only human password wait. Each must be below ten seconds. Record twenty
searches including debounce, each below two seconds. Observe crashes/memory warnings.
Verify Azure/Cloudflare serves a replaced object without stale edge caching and
that website assets/configuration contain no upload credential. No Part 1 plaintext
timing can stand in for this encrypted acceptance run.
