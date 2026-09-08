# Validation Quickstart

This guide specifies commands and scenarios to be delivered during implementation. The referenced scripts/tests do not exist yet; do not interpret this guide as a completed test run.

## Prerequisites

- User's Moneydance 2024.4 with a test/copy book for controlled cases and access to known main-book register values.
- Node 20.9.0 or compatible newer runtime. Standalone Python is not required; source probes/export run under **Jython 2.7** inside Moneydance's script facility. Python 3 test success does not demonstrate exporter compatibility.
- Pixel 8 and desktop browser. Full-history private snapshot stays untracked; synthetic fixtures are safe for shared testing.
- Setup provides a private npm manifest and dependency-free lockfile. Use `npm ci --ignore-scripts` to verify the locked setup. Node built-ins provide current tests/server; the maintained schema and shared financial validator remain T007/T009 work.

## Automated Checks (after implementation)

From the repository root in PowerShell:

```powershell
npm ci
node --test tests/unit/*.test.mjs tests/contract/*.test.mjs
node scripts/validate-snapshot.mjs tests/fixtures/valid-snapshot-v1.json
node scripts/validate-snapshot.mjs tests/fixtures/invalid-balance-v1.json
node scripts/serve-ui.mjs --host 127.0.0.1 --port 8080 --snapshot tests/fixtures/valid-snapshot-v1.json
```

The validator exits 0 for valid data and nonzero for invalid data, printing only counts/error codes/field paths, not financial values. The invalid-balance command is expected to fail. The server serves UI at `http://127.0.0.1:8080/`, the selected snapshot at `/data/snapshot.json`, and synthetic browser tests at `/tests/browser/`; it must restrict routes to those resources and prevent directory traversal. Browser test page must show an explicit pass/fail summary and exercise actual worker messaging. No cloud access is needed.

## Source Financial Validation

Run the planned `scripts/moneydance-preflight.py` inside Moneydance, then the updated `export_json.py`. Do not run either with Node or standalone Python. Preflight records installed runtime and validates supported method availability without modifying the book. Export a controlled snapshot first and provision it manually as the supplied data.

Reference matrix: debit, credit, opening balance with zero entries, multiple splits, same-day ordering, two-sided transfer, future entry, inactive child with nonzero contribution, active descendant of excluded parent, income/expense sign convention, and included cash transfer to excluded investment account. Compare source display values at exactly the same effective date. Each full register must reconcile opening through closing; each row must match its source amount/running balance. Sidebar recursive balances must include hidden contributions without counting child totals twice. A mismatch fails financial acceptance, even when the file is schema-valid.

Historical unversioned samples must fail with a re-export message, not display guessed balances. A fresh v1 export is required for successful full-history validation. Keep the old files and compact schema unchanged as compatibility evidence.

## Browser Scenarios

| Scenario | Expected result |
| --- | --- |
| Select parent, then child, then All Accounts | Direct normal registers; complete combined list; no overall total anywhere |
| Search description, memo-only and split-memo-only text | Selected account plus included descendants; correct account identity; no duplicate matching entry |
| Search 50, -50, and formatted amounts | Partial numeric matches; minus affects amount branch only; independent text matches still work |
| Clear search, paginate, switch accounts rapidly | Correct scope restored; balances unchanged; stale worker responses ignored |
| Mobile register | Per-row running balance available without desktop mode; accepted density retained |
| Empty, corrupt, unsafe integer, duplicate entry, missing financial metadata | Valid-empty distinct from visible failure; no invented balances |
| Initial load fails, then page reloads | Visible error; reload makes a fresh request without restoring prior data |
| Repeated searches, account changes, and paging | Network inspection shows no additional snapshot requests; each page reload makes one fresh request |
| Export time near midnight and DST transition in two device zones | Correct local instant and timezone indicator in bottom-left footer; unchanged transaction dates; cutoff follows each device-local page-load date |
| Missing, null, wrong-type, or malformed export timestamp with valid balance timelines | INVALID_SNAPSHOT; visible export-date error and no rendered financial data in real and test modes |

Use synthetic cases for timezone and malformed data tests. The fixture harness must assert expected rows/labels as well as render them; manual inspection alone does not establish financial equality.

## Pixel 8 Acceptance

For phone access use an explicitly chosen private LAN bind after synthetic desktop validation:

```powershell
node scripts/serve-ui.mjs --host 0.0.0.0 --port 8080 --snapshot tests/fixtures/valid-snapshot-v1.json
```

Open `http://<desktop-private-address>:8080/` on the phone. This is a temporary development session, not deployment; stop the server when finished. Use personal data only on the user's trusted private network with deliberate access, never a public tunnel. Network/firewall setup may require separate environment permission.

Repeat with the fresh private full-history v1 export selected via `--snapshot` when ready. Record snapshot byte size, entry/account counts, effective date, browser/device, network, cache conditions, and timing aggregates without content values. Five initial trials must be under 10 seconds from navigation/load request to usable first rows and balances. Twenty representative searches must be under two seconds from completed query to rendered page, including debounce. Test initial-load peak memory and rapid input separately; no required history or descendants may be dropped to improve results silently.

Have the user complete envelope-balance lookup and most-recent purchase lookup and confirm readability. Passing desktop emulation is not passing Pixel 8. Record SC-001–007 outcomes in a later validation report. Decryption remains excluded: explicitly mark the eventual combined 10-second target unverified, regardless of current loading results.

## Page-load Date Regression

Use the same snapshot with an entry dated September 6. Load with local date September 5: sidebar excludes it. Reload with local date September 6: sidebar includes it; register running balances and export timestamp are unchanged. Repeat with a hidden descendant contribution and in two timezones straddling midnight. An open page keeps its captured date until reload. Verify the baseline at balanceStartDate (UTC export date minus one day), subsequent changes and after-last-checkpoint dates; a cutoff before coverage must fail visibly. Compare compact versus full reference timelines at every supported change date, including hidden effects, and confirm earlier points are absent while all entries/running balances remain intact. Verify missing, null, or malformed exportDate fails loading even with valid balanceStartDate; do not invent unexported activity.

## Test Dataset Selection (US1 Acceptance 5–6 / FR-019)

Supply the v1 synthetic file at UI/data/test-snapshot.json. Navigate with ?test=true and confirm synthetic balances plus a Test data indicator; network inspection must show one test-snapshot request and no real-snapshot request. Without the parameter (also with test=false), confirm real data is selected. Make the real export unavailable: expect HTTP 404, a missing-file message, and a link preserving other page parameters while adding test=true. Follow it and confirm a fresh page loads test data. Missing or malformed test data must error without fetching the real export. Other real-load errors must never silently fall back. Apply the same financial/date validation to both sources.

## Historical T011 handoff (superseded by implementation reports)

The maintained schema, cents module, snapshot validator and CLI now exist. See [export-validation.md](../../scripts/export-validation.md) for the updated exporter run and automated comparison against the existing private reference. The exporter implementation remains unverified until this Moneydance run; T012 and later UI tasks have not started.

## Phase 3 is available for local verification

The balance sidebar and account selection are implemented. Register/search and
the export-date footer remain later-phase work; their controls are not active.
Run `npm test` for the implemented Node tests (31 passing as of September 7).

```powershell
node scripts/serve-ui.mjs --snapshot UI/data/snapshot.json
```

Open `http://127.0.0.1:8080/?test=true` for synthetic balances, or omit the query
parameter for your export. Open `http://127.0.0.1:8080/tests/browser/` for the browser
acceptance harness; it uses only synthetic data and intentional failing URLs,
regardless of the supplied private snapshot. It must finish with `ALL PASS`.
The server exposes the existing synthetic hidden-ancestor fixture through the
specific `/tests/browser/hidden-ancestor.json` route without exposing the rest of
the fixtures directory.

For Pixel 8 verification (T017), first serve synthetic data on your trusted local
network using the server's explicit `--host` option. Check sidebar open/close,
Checking $1,045 after September 6, sub-account selection, no All Accounts total,
and the browser harness. Then compare a fresh real export with the source-agreed
balances at the same local date. Record results in validation.md. Browser and
Pixel 8 checks have not yet been run; desktop Node tests do not complete T017.

## Phase 4 register verification

Register browsing now shows direct-account history in descending source order,
100 rows per page, with unchanged source running balances. All Accounts includes
every included account-side row, including both transfer sides. Checking has no
own rows in the synthetic budget example; select a budget to see its register.
Search is now enabled by Phase 5; see the search verification section below.

Run `npm test`, then start the server above and open `/tests/browser/`. The harness
now includes a 205-row synthetic register via `/tests/browser/register-pages.json`:
check paging, same-day order, future entries, check number `0007`, category labels,
full memo, escaped text and mobile running balances. The first row has balance
$328.45; the final row has $124.45, including the $123.45 opening balance. This
fixture is intentionally synthetic and is generated by `npm run fixtures`.

For T022, run the browser harness and compare your real account register against
Moneydance: opening balance effects, same-day ordering, split/transfer entries,
future transactions, amounts and running balances. Switch All Accounts → child →
All Accounts and page through an account with over 100 entries. On Pixel 8 confirm
running balances and memo text are readable. Report mismatches and harness results;
these new register/device checks remain unverified in this implementation session.

## Phase 5 search verification

The existing search field now searches description, transaction memo, allocation
memos and partial USD amounts. Matching is case-insensitive, using the full typed
query as a substring of each individual field. Account/category names, tags and
check numbers are not search fields. Examples: `50` matches either sign and larger
amounts such as 150.25; `-50` restricts amount matches to negatives, while memo and
description matches remain independent. Dollar signs and valid grouping commas
are optional for amount searches.

A search on a parent includes accessible descendants. Clearing the field restores
the parent's direct register. Switching accounts keeps the query and resets future
visibility; future matches are summarized by the yellow bar until revealed. Paging
and searching preserve sidebar and originating-account running balances.

Run `/tests/browser/` again: the harness now runs balance, register and search
scenarios and must finish with ALL PASS. It also prints 20 synthetic search times
including the 100 ms debounce. No server-route change is needed for this phase.
These small-fixture timings are not full-data performance evidence.

For T027, on Pixel 8 with your real export, check description-only, memo-only,
allocation-memo-only, amount and descendant matches; clearing search; no results;
rapid typing/account changes; and unchanged balances. Measure 20 representative
queries from the last input change until the resulting rows appear (including
debounce). Report browser, dataset entry count, and timing range/individual times,
without private search text. The provisional target is under two seconds per query.
T027 remains pending those reported acceptance and timing results.

## Phase 6 snapshot freshness and failures

The sidebar footer now shows `As of:` with the export instant in the device's
locale/timezone (including the timezone label). Check it on desktop and by opening
the sidebar on Pixel 8. Changing the selected account must not change this label.
It describes export age, independently of the page-load transaction cutoff.

Restart the local server to enable the new loading-fixture routes, then refresh
`/tests/browser/`. The added loading suite tests invalid timestamps in real and
test modes, unknown version, malformed/invalid input, missing files, valid-empty
data, query errors, actual worker failure, no stale footer/accounts and one-fetch
behavior. It should finish with ALL PASS. A deliberately failing test worker is
part of this suite; its failure must produce the expected visible error state.

Valid empty data shows a successful-load message with its As of label. Failed
loads show a prominent error and reload guidance, with no stale financial content
or timestamp. Invalid timestamps specifically request a new Moneydance export.
No automatic retry or dataset fallback is added.

T032 remains open until the browser run and local-time footer check are reported.
`npm test` currently passes 37 tests; Phase 7 remains separate.
