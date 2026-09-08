# Validation Quickstart

The exporter, viewer, CLI and synthetic test harness are implemented. See
[validation.md](validation.md) for actual results and remaining device evidence.

## Prerequisites

- Node 20.9.0 or compatible newer runtime. The private npm project has no package dependencies.
- Moneydance with Jython 2.7 for `export_json.py` and the source probe. The verified source runtime is Jython 2.7.2 / Moneydance build 5253. Do not run these scripts with standalone Python or Node.
- Desktop browser and Pixel 8. Keep real exports in ignored `UI/data/`; share only synthetic fixtures or sanitized results.

## Automated and Browser Checks

Run from the repository root in PowerShell:

```powershell
npm test
node scripts/validate-snapshot.mjs tests/fixtures/valid-snapshot-v1.json
node scripts/validate-snapshot.mjs tests/fixtures/invalid-balance-v1.json
node scripts/validate-snapshot.mjs specs/001-view-moneydance-data/contracts/example-export.json
node scripts/serve-ui.mjs --snapshot UI/data/snapshot.json
```

The valid examples exit 0 with 10 accounts and 13 entries. The invalid example
intentionally exits 1 with `INVALID_SNAPSHOT`, field `entry.runningBalanceCents`.
`npm test` runs all 37 unit/contract checks, including server isolation, actual
isolated worker messaging, financial invariants, search and timestamp handling.

Open `http://127.0.0.1:8080/tests/browser/` and expect `ALL PASS`. The harness runs
actual worker/client and app DOM checks for balances, registers, search and loading
states. It uses synthetic fixtures, regardless of the private snapshot selected
for the normal viewer. Restart an older server after route changes.

Open `http://127.0.0.1:8080/?test=true` for the synthetic viewer; omit `test=true`
for the configured real snapshot. Only the exact value `true` selects test data.
A missing real file displays an error and a test-data link preserving other URL
parameters. Invalid or missing test data fails without fetching real data.

The server defaults to loopback and only exposes explicit UI/test routes and the
selected snapshot. It does not expose other private files or directories.
`npm run fixtures` regenerates synthetic fixtures from the documented example.

## Private Export Validation

Run `export_json.py` inside Moneydance, then:

```powershell
node scripts/validate-snapshot.mjs UI/data/snapshot.json
```

Normal errors contain only codes and field names. For local troubleshooting:

```powershell
node scripts/validate-snapshot.mjs --debug UI/data/snapshot.json
```

`--debug` additionally prints the failing entity and full stack trace. That output
can contain private financial details; keep it local. The viewer uses normal safe
errors. Old unversioned exports require re-export; their balances are not guessed.

For controlled source comparisons and failed-save/cancel checks, follow
[export-validation.md](../../scripts/export-validation.md) and
[moneydance-preflight.md](../../scripts/moneydance-preflight.md). Schema validation
alone does not establish agreement with Moneydance. Source checks already recorded
in validation.md need repeating when exporter semantics change.

## Verified Viewer Behavior

- Sidebar balances use the device-local date captured at page load. Hidden contributions remain in source totals; accessible descendants of hidden ancestors remain selectable.
- Normal registers show direct-account history, newest first, 100 rows per page. All Accounts retains included transfer counterparts and has no monetary total.
- Dates display MM/dd with sticky year headings. Mobile rows retain running balances and memo text.
- Future entries are hidden behind a centered pale-yellow summary. Reveal shows them; selecting an account resets disclosure. No history is removed from the snapshot.
- Search matches description, transaction memo, allocation memos and partial USD amounts. Nonempty search includes descendants; clearing restores direct-account scope. Account/category names, tags and checks are not extra search fields. Unsigned amounts match either sign; a minus restricts the amount branch only.
- The clear X empties search; desktop Ctrl+F / Cmd+F focuses it. Search includes a 100 ms debounce and discards stale replies. Balances never change because of filtering.
- The As of footer replaces Read-Only Mode using its original muted font/color and centered alignment. It shows the export instant in the device locale/timezone, independently of the balance cutoff. Transaction calendar dates are never timezone-converted.
- Loading is prominent; valid empty data and failures are distinct. Errors remove financial content and the footer. Reload is the only retry; searches, paging and account changes do not download another snapshot.

Synthetic tests cover local-date boundaries, hidden contributions, compact timeline
coverage, UTC midnight/DST formatting and missing/null/malformed timestamps in both
source modes. A cutoff before balanceStartDate fails; full register history remains
intact. An open page keeps its captured date until reload.

## Remaining Pixel 8 Performance Record (T034)

Use the actual large export in the ordinary viewer, not the small harness fixture.
For temporary trusted-LAN access:

```powershell
node scripts/serve-ui.mjs --host 0.0.0.0 --port 8080 --snapshot UI/data/snapshot.json
```

Open `http://<desktop-private-address>:8080/` on Pixel 8. Stop the development server
when finished. This command does not implement deployment or cloud delivery.

1. Record browser/version, network/access route, local test date, snapshot byte size and validator account/entry counts. Do not record account names or search text.
2. Reload five times. For each trial, time from starting navigation/reload until both sidebar balances and the first register page are usable. Record all five times; each target is under 10 seconds. Snapshot fetch uses no-store; note whether other browser assets were already cached. A stopwatch is sufficient if reported as manual timing.
3. The user's earlier 20 representative real-data Pixel searches all finished comfortably under two seconds and remain accepted as manual threshold evidence. Confirm whether that sample used this same dataset/browser/network; provide missing context. Repeat only if conditions or data changed materially. Search timing runs from the final input change to usable results, including debounce. Cover description, memo, allocation memo, amount, descendants and no matches without sharing query text.
4. Note any tab reload/crash, persistent slowdown or memory warning after repeated searches and account switches. Code review confirms ownership boundaries; actual Pixel peak memory has not been measured. If profiling memory, record only aggregate memory values.

Suggested report:

```text
Pixel 8 browser/version:
Network/access route and date:
Snapshot bytes / accounts / entries:
Other assets cached: yes/no/unknown
Five initial loads (seconds):
20-search sample: prior sample same conditions / new sample and results
Reloads, crashes or memory warnings:
```

Earlier user feedback established readable account lookup, register viewing and
search on Pixel, plus source balance agreement. The earlier informal 7–8 second
ngrok load is not five recorded trials. No repeat of already-passing functional
checks is required for documentation cleanup.

Encryption/decryption, Azure upload, deployment, close hooks, investment
presentation, net worth and transaction entry remain deferred. Even five passing
load trials would not validate the later combined loading-plus-decryption target.
