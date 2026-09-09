# Extension staging layout

Identity: `snapshot_delivery`. Phase 3 includes persistent settings and menus.
Publish Snapshot explains that publication is not yet enabled; no capture, network
delivery or close hook is active in this build.

The packager stages an explicit allowlist, not the repository:

- MXT root: script_info.dict, snapshot_extension.py and required Python modules.
- MXT root: export_json.py copied from the repository's shared source, never a fork.
- com/moneydance/modules/features/snapshot_delivery/meta_info.dict: metadata.
- protect-secrets.ps1: bundled helper resource when implemented in US1.

Class initializer and metadata are implemented in T007, packaging in T010.
Packaged code cannot assume __file__ exists;
load bundled source via the extension wrapper's getResourceAsStream, using an
isolated namespace with _EXPORT_LIBRARY_ONLY=True for the shared exporter. Keep
the wrapper/controller only; never retain the book or UI across lifecycle events.
Runtime resource loading is verified in the installed US1 milestone.

Build using `scripts/package-extension.ps1` after one genuine key generation with
`-GenerateKeys`. The script calls official DevKit 5.1 KeyAdmin (the advertised 6.0
download was unavailable). Output is dist/snapshot_delivery.mxt. Signing private
key and its DPAPI-protected passphrase stay in .workspace/tools/snapshot-signing;
never publish that directory. Keys are personal/unverified, not vendor approval.

See [manual build and reinstall instructions](../scripts/build-extension.md) for
rebuilding after editing the shared `export_json.py` or extension resources.

Settings are stored atomically as a single DPAPI-protected configuration payload
under the user's .moneydance-snapshot-delivery directory. Protecting the complete
payload also protects destination/book metadata. Only the creating Windows user
has an explicit allow entry. Helper source, not secret input, is passed via
EncodedCommand; request/response bytes use private pipes with a 15-second timeout.
The initial destination validator supports public Azure blob.core.windows.net
endpoints with blob-scoped write-only HTTPS service SAS and explicit issuance/expiry.
No Azure connection or policy test occurs while saving settings.

Keys and downloaded tooling belong outside this directory. Exclude .workspace,
tests, UI/data, logs, configuration, signing material and private files from MXTs.
