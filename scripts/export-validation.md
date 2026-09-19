# Updated exporter validation (T011)

Use the same seven-case test book; no new transactions are required.

1. Run the updated repository-root `export_json.py` inside Moneydance's script
   facility. Keep editing/import/sync idle during capture. The UI may pause while
   the two source captures run. This initial validation is for the small test book.
2. In the password modal, leave the field empty and select OK for plaintext
   validation. The modal explicitly explains that empty means unencrypted JSON.
   Cancel/close aborts; whitespace-only input must be corrected or cleared.
   In the save dialog choose `UI/data/snapshot.json` in this repository. It is
   ignored by Git. The script reports `EXPORT_OK` with an entry count, or a safe
   error code; return any error without changing test data to work around it.
3. From the repository root, run:

   ```powershell
   node scripts/validate-snapshot.mjs UI/data/snapshot.json
   node scripts/compare-preflight.mjs UI/data/snapshot.json UI/data/preflight-reference.private.json
   ```

4. Return the exporter and command summaries. The comparison checks included
   reference entries/balances and exclusion of hidden/investment own rows. Dated
   expectations before the compact coverage boundary are explicitly reported as
   outside coverage; their prior Moneydance preflight evidence remains applicable.
5. After one successful save, validate failed-write preservation without touching
   financial records: select an existing directory as the destination (instead
   of a file) if the chooser permits it, or use a known unwritable destination.
   Expect `EXPORT_FAILED`. Revalidate the original snapshot; it must be unchanged.
   Canceling the chooser should report `EXPORT_CANCELLED` and leave it unchanged.
   Do not alter filesystem permissions on your Moneydance book for this test.

The exporter captures on the UI thread, rejects editing-mode objects when that API is available, and compares
two full detached reads including synchronization stamps. It aborts on a detected
change, source-balance mismatch or unsupported included currency/descendant
valuation. This optimistic read strategy is not a claim of a documented global
Moneydance transaction lock; concurrent sync remains an explicit validation risk.
Atomic replacement must be supported by the destination filesystem; no destructive
delete-and-retry fallback is used.

After controlled-book validation, a fresh full private-book export and its CLI
validation are required before full-data acceptance. Keep that file local and do
not paste its contents. Worker/UI integration and Pixel 8 trials are later tasks.

## Optional encryption for direct Moneybot execution

Open the repository-root `export_json.py` using Moneydance's **Window → Show
Moneybot Console → Open Script**, then **Run Script** with a synthetic book open.
The script is self-contained; it does not require installing/rebuilding the extension.
Supply a password to default to `snapshot.enc`, or leave empty to default to
`snapshot.json`. Passwords are not stored and surrounding spaces in a nonblank
password are significant. Cancel either modal to save nothing. Encryption errors
abort rather than falling back to plaintext. Only ciphertext reaches temporary
files when a password was supplied.

For encrypted validation, save a synthetic file as `UI/data/snapshot.enc` (preserve
any existing file first), serve with `npm run serve`, and open the viewer without
`?test=true`. Try a wrong password, then the correct one. Expect failed unlock then
the same financial data as the plaintext reference. Restore any pre-existing file.
Do not include passwords or private records in the acceptance report.

The extension loads this script with `_EXPORT_LIBRARY_ONLY=True`, bypassing both
standalone dialogs. Its configured encryption, publication and shutdown behavior
are unchanged. Rebuild/install validation must use the existing documented process
in `build-extension.md` and `extension-validation.md`; no installation is performed
by this source edit.

## Troubleshooting validation

Security metadata is now omitted unless required by an exported allocation or the
ancestry of a retained account. Retained securities may have an empty currency;
included accounts still require USD. On the next Moneydance export, verify that
unreferenced leaf securities disappear and run the validator again. Source
runtime verification of this pruning remains pending until that export is run.

Normal validation retains the compact JSON error report (status, code, and field)
and exits with status 1 on failure. For local troubleshooting, run:

```powershell
node scripts/validate-snapshot.mjs UI/data/snapshot.json --debug
```

`--debug` adds the complete failing entity and full stack trace to stderr. Account
and timeline failures include the account; entry and allocation failures include
the entry. Top-level failures include the snapshot. If reading or parsing fails,
there is no parsed entity; the diagnostic says so and prints the stack trace.
Debug output can contain private financial data; keep it local or sanitize it
before sharing. Successful validation has the same output with either mode.

The shared validator does not log diagnostics. It attaches entity context to its
error so the CLI can explicitly disclose it; the web worker retains its compact
error response. No constitution amendment is needed: these explicitly requested
local diagnostics are separate from the routine logs prohibited by Principle III.
