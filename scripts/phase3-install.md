# Phase 3 Moneydance installation check

This build stores settings only. It does not export, encrypt financial records,
upload, or publish at shutdown. Publish Snapshot explicitly reports that limitation.

1. In Moneydance, open the original synthetic book.
2. Select Extensions > Manage Extensions > Add from File and choose
   `dist/snapshot_delivery.mxt`. Moneydance may ask whether to accept a personally
   signed extension it has not reviewed. This package uses genuine keys generated
   by the official tool, not a vendor signature.
3. Confirm Extensions contains Snapshot Settings and Publish Snapshot.
4. Open Snapshot Settings. For this offline installation check use these values:

   - Blob URL: `https://example.blob.core.windows.net/view/snapshot.enc`
   - Password: any synthetic password you choose (not your real password)
   - SAS: `sr=b&sp=w&spr=https&sv=2023-11-03&se=2028-08-09T00%3A00%3A00Z&sig=SYNTHETIC`
   - Issued: `2026-09-09T00:00:00Z`
   - Expires: `2028-08-09T00:00:00Z`

   This token is deliberately fake; no network request is made in Phase 3. Real
   publication later requires an actual Azure-issued token and verified policy.
5. Save, reopen Settings, and confirm values persist with password and SAS masked.
   On the updated build, editing the SAS fills the expiry from `se` when valid
   and sets issuance to current UTC. Test a token, a token prefixed with `?`, and
   a full SAS URL; the separate Blob URL is unchanged. Invalid/missing expiry
   must leave the existing expiry unchanged without a parsing error. Issuance
   still updates. Correct issuance manually if using an older token. Reopening
   saved settings must preserve both dates. Cancel these trial edits.
6. Try an invalid URL or blank password. It must explain that settings were not
   saved, and reopening must show the previous valid settings. Cancel a settings
   edit and check that it also preserves the previous values.
7. Close/reopen Moneydance three times. Menus/settings must survive without running
   anything in Developer Console or reinstalling. Select Publish Snapshot once:
   expect the clear not-enabled message and no export or upload.
8. Report installation success/failure, settings recovery after all three restarts,
   invalid/canceled edit behavior, and any unexpected windows or errors. Do not
   share real secrets or the protected configuration file.

The configuration file is `~/.moneydance-snapshot-delivery/configuration.dpapi`
under the Moneydance Windows user's home directory. It is tied to that Windows
account and configured book. Switching books must not silently reassign settings.
Saving settings validates syntax/lifetime; it does not prove Azure authorization.

The Phase 3 restart check verifies installation persistence. The three actual
publishing close/reopen cycles remain a separate Phase 5 acceptance check.
