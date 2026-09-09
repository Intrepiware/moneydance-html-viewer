# Extension staging layout

Identity: `snapshot_delivery`. Phase 1 scaffolding only; no installable extension yet.

The future packager must stage an explicit allowlist, not zip the repository:

- MXT root: script_info.dict, snapshot_extension.py and required Python modules.
- MXT root: export_json.py copied from the repository's shared source, never a fork.
- com/moneydance/modules/features/snapshot_delivery/meta_info.dict: metadata.
- protect-secrets.ps1: bundled helper resource when implemented in US1.

Class initializer and metadata are implemented in T007, packaging in T010. Do not
create a misleading placeholder MXT. Packaged code cannot assume __file__ exists;
load bundled source via the extension wrapper's getResourceAsStream, using an
isolated namespace with _EXPORT_LIBRARY_ONLY=True for the shared exporter. Keep
the wrapper/controller only; never retain the book or UI across lifecycle events.
Runtime resource loading is verified in the installed US1 milestone.

Keys and downloaded tooling belong outside this directory. Exclude .workspace,
tests, UI/data, logs, configuration, signing material and private files from MXTs.
