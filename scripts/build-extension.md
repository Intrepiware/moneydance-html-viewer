# Build and reinstall the Moneydance extension

Run these commands in PowerShell 7 (`pwsh`) as the same Windows user who created
the signing keys. The existing local setup already has the official DevKit and
keys; ordinary rebuilds do not need key generation or downloads.

## After editing export_json.py or extension code

1. Save your changes. Keep Python code compatible with Moneydance's Jython 2.7.
2. From the repository root, build and sign:

   ```powershell
   Set-Location 'C:\Working\Sandbox\moneydance\Export Json'
   ./scripts/package-extension.ps1
   ```

   The script copies the current root `export_json.py` directly into the MXT,
   along with the allowlisted extension resources. No separate source copy or
   Python compilation step is needed. It replaces `dist/snapshot_delivery.mxt`
   and prints its SHA256 hash on success. Editing source alone does not update
   the already installed extension.

3. In Moneydance, select **Extensions > Manage Extensions > Add from File** and
   select the rebuilt `dist/snapshot_delivery.mxt`. Follow the replacement prompt
   if shown. The personal signature warning may appear, as on the initial install.
4. Restart Moneydance to load the replacement resources. Confirm Snapshot Settings
   opens and retains your saved settings. Rebuilding does not reset the separate
   protected configuration file.

For exporter changes, also run the relevant synthetic export/validation checks in
[export-validation.md](export-validation.md). This Phase 3 extension loads the
exporter resource but does not yet publish snapshots, so installation alone does
not verify a changed export's financial output.

## Prerequisites and first build on a new setup

- PowerShell 7 and Moneydance's bundled Java (default
  `C:/Program Files/Moneydance/jre/bin/java.exe`).
- Official DevKit extracted at `.workspace/tools/moneydance-devkit-5.1`, including
  `lib/extadmin.jar`. Tool provenance is recorded in
  [extension-validation.md](extension-validation.md).
- For a new signing setup only, run `./scripts/package-extension.ps1 -GenerateKeys`.
  This generates personal keys and also builds the package. It refuses to
  overwrite existing keys. Do not use this switch for ordinary rebuilds.
- Alternative installed paths can be supplied with `-DevKit 'path/to/devkit'`
  and `-Java 'path/to/java.exe'`.

Signing material stays in `.workspace/tools/snapshot-signing`. Its passphrase is
protected with Windows CurrentUser DPAPI; use the original Windows account to
rebuild. Keep this directory private. No signing credentials are required on the
command line, and no Azure connection is made during a build.
