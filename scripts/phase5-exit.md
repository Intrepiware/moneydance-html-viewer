# Phase 5: automatic publication on normal exit

Use the synthetic book and test Azure destination that passed Phase 4. Build 4
enables automatic publication; do not point it at your real book for this check.
No viewer password screen is included yet. Reinstall `dist/snapshot_delivery.mxt`
through Manage Extensions > Add from File and restart Moneydance once.

## Three close/reopen cycles

For each of three cycles, make a distinct fictional transaction edit so that the
new publication can be distinguished from the previous one. Record the expected
description, amount and resulting account balance privately.

1. Make the edit in the synthetic book. Finish editing the transaction, then close
   Moneydance normally. Use the window X for at least one cycle and File > Quit for
   at least one cycle. Do not use Publish Snapshot for these three cycles.
2. Time the shutdown. The extension budget is 60 seconds starting with closing,
   including settings loading and draining earlier manual work. Moneydance's own
   backup can add unrelated time. The status file includes `elapsedMs` (capture to
   completion) and `shutdownElapsedMs` (closing to completion); these do not replace
   your observation of actual added shutdown time.
3. Reopen Moneydance. Look for the last snapshot result and completion timestamp in
   the status bar. Settings and menus should still be present without reinstallation.
4. Verify Azure's blob modification date changed. Download to a new local filename
   using Storage Explorer or the portal and decrypt:

   ```powershell
   node tests/tools/decrypt-synthetic.mjs --synthetic --input UI/data/exit-1.synthetic.enc --output UI/data/exit-1.synthetic.json
   node scripts/compare-preflight.mjs UI/data/exit-1.synthetic.json UI/data/preflight-reference.private.json
   ```

   Use `exit-2` and `exit-3` for the following cycles. Update private references for
   intentional edits, or compare the new transaction and balances directly as you
   did in Phase 4. Verify each cycle's distinct edit, not just schema validity.

## Other installed checks

- **Ordinary save:** save a synthetic edit while remaining in Moneydance. The Azure
  modification date must not change. There must be no automatic export/upload.
- **Book switch:** switch to another synthetic book. A close-associated capture may
  briefly pause the UI, but Azure must not change. Return to the configured book;
  its next normal exit must use a fresh capture. Exiting from an unconfigured book
  must not publish it to the configured destination.
- **Offline exit:** note the last successful blob date, enable airplane mode, make
  a synthetic edit, and exit. Reopen and check a failure/unknown status instead of
  success. Restore networking and verify the previous complete publication still
  decrypts. A lost response can mean the new complete object was committed; do not
  infer preservation merely from the error message.
- **Manual overlap:** select Publish Snapshot and promptly exit while it is active.
  The earlier attempt is canceled/drained before the final capture. A canceled or
  uncertain result is acceptable when the transport cannot be safely resolved;
  the extension must not overlap PUTs or claim an earlier snapshot is the final one.
  If the operation is too fast to overlap, report that; deterministic tests cover it.
- **Canceled exit, if available:** cancel a normal Moneydance exit prompt without
  forcing a disk failure or killing the process. Verify no publication occurs. Report
  exactly which prompt offered Cancel. Do not manufacture a failure in your data file.
  No dedicated cancellation event has been established on this build. This remains
  an explicit acceptance limit, not a claimed supported callback.

After an aborted/failed closing save, the extension refuses to reuse an ambiguous
capture. Reopen the configured book to reset the close cycle before retrying.
An unknown manual upload is not followed by an automatic upload in that session;
verify the remote result and perform a fresh successful manual publication first,
or restart after verification if local transport could not be drained.

The sanitized status file is
`~/.moneydance-snapshot-delivery/last-delivery.json`. It contains fixed outcome/stage/
code, completion UTC and durations only. Report those values and timings alongside
the three financial comparisons; do not share secrets or private data. If a shutdown
is unexpectedly slow, copy this file immediately after reopening, before another
manual publication or exit overwrites it. In PowerShell:

```powershell
Get-Content "$env:USERPROFILE/.moneydance-snapshot-delivery/last-delivery.json"
```

Compare `shutdownElapsedMs` to the observed total shutdown time. This distinguishes
time inside the measured extension cycle from additional Moneydance shutdown work;
it does not identify the exact slow operation within that cycle. Installed normal
exit success is recorded in extension-validation.md; the reported offline delay
and full-book deadline acceptance remain unresolved.
