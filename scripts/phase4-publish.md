# Phase 4: manual encrypted publication

Historical build-2/3 checklist. Build 4 adds automatic exit publication; see
[phase5-exit.md](phase5-exit.md). Its ordinary-save behavior remains unchanged.

Use a synthetic Moneydance book and a dedicated test blob. Automatic close/exit
publication and the viewer's password screen are not enabled in this build.

## Prepare Azure and install

1. Verify your storage account allows service SAS access and its expiration policy
   permits a 23-calendar-month credential. If policy does not permit 22–24 months,
   report that constraint rather than weakening policy or substituting an account key.
2. Create a **blob-scoped service SAS** for the exact test blob with **Write only**,
   **HTTPS only**, and expiry 23 months after issuance. Do not use an account SAS or
   user-delegation SAS. Record actual issuance and expiry privately; `st` describes
   validity start, not proof of issuance.
3. Install `dist/snapshot_delivery.mxt` using Manage Extensions > Add from File and
   restart Moneydance. This is module build 3 with the same personal signing identity.
   See [build-extension.md](build-extension.md) for rebuilding instructions.
4. Open the synthetic book and Snapshot Settings. Enter the exact HTTPS blob URL
   without query, a synthetic encryption password, and the SAS token or full SAS URL.
   Verify autofilled expiry/issuance and correct issuance for an older token. Pasting
   a SAS URL does not change the separately configured destination. Save does not
   make an Azure request.

## Publish and compare

1. Save the synthetic book. Choose **Extensions > Publish Snapshot**. Expect capture,
   validation, encryption and upload progress followed by a success message. Capture
   briefly occupies Moneydance's UI; encryption/networking run off the UI thread.
   Note total time against the 60-second budget. A repeated menu selection must
   report publication is already in progress.
2. Download the test blob through your authenticated Azure portal to
   `UI/data/published.synthetic.enc`. The upload SAS has no read permission; do not
   add Read just to download with it. Keep upload credentials out of public assets.
3. From the repository root, run:

   ```powershell
   node tests/tools/decrypt-synthetic.mjs --synthetic --input UI/data/published.synthetic.enc --output UI/data/decrypted.synthetic.json
   node scripts/compare-preflight.mjs UI/data/decrypted.synthetic.json UI/data/preflight-reference.private.json
   ```

   Enter the synthetic password at the hidden prompt. Expect `VALID` and passing
   reference comparisons; historical dates outside compact coverage remain labeled.
   The utility authenticates before parsing and uses the existing financial validator.
   `--output` is optional and refuses to overwrite; use new filenames on later runs.
   `--synthetic` is your confirmation the data is fictional, not automated detection.
   Never supply passwords in command arguments. The web viewer cannot open ciphertext yet.
4. Try a wrong password once: expect `SYNTHETIC_DECRYPT_OR_VALIDATION_FAILED`, with no
   decrypted output. Retry the correct password against the same download.
5. Make a known synthetic edit, save and publish again. Download/decrypt to new files
   and verify that edit. Reconcile private reference expectations for intentional
   changes. Confirm publication itself does not modify source values.

## Failures and settings

- Keep the first successful download. Try publication offline and observe bounded
  failure or **unknown**. Restore networking and download/decrypt the blob. A lost
  response can leave the earlier or new complete snapshot; it does not prove old
  bytes were preserved. Verify the remote result before another manual attempt,
  which always captures fresh data. No automatic retry or old-payload queue exists.
- Test denial by changing one signature character in a copy of the synthetic SAS,
  leaving structural fields intact. Expect upload rejection. Restore the genuine
  SAS and actual issuance afterward.
- If local transport cancellation cannot be confirmed, further attempts are blocked
  in that session. Verify the remote result and restart Moneydance.
- Change the synthetic password and publish. The new download requires the new
  password; the old download retains its old password. Canceling settings edits
  must preserve saved credentials.
- Ordinary saves and closing Moneydance must not automatically publish in Phase 4.

Runtime tests simulate warning boundaries at 31 days, 30 days, expiry and unknown.
For installed warning/menu checks without changing the Windows clock, temporarily
save a **fake synthetic** SAS with matching `se`/expiry 30 days from now and issuance
23 calendar months before that expiry. Verify the status warning directs to
**Extensions > Snapshot Settings** on settings access and startup. For expiry, use
one day ago and issuance 23 months before that date; publication must be blocked.
These values test presentation, not actual Azure issuance/authorization. Restore the
genuine test SAS and dates afterward.

Report publication time, financial comparisons, failure behavior, warning/menu
results, and whether actual Azure policy/lifetime were checked. Do not share tokens,
passwords, account URLs or private exports. Sanitized last-operation status is at
`~/.moneydance-snapshot-delivery/last-delivery.json`.
