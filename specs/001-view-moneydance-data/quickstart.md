# Validation Quickstart

This guide specifies commands and scenarios to be delivered during implementation. The referenced scripts/tests do not exist yet; do not interpret this guide as a completed test run.

## Prerequisites

- User's Moneydance 2024.4 with a test/copy book for controlled cases and access to known main-book register values.
- Node 20.9.0 or compatible newer runtime. Standalone Python is not required; source probes/export run under **Jython 2.7** inside Moneydance's script facility. Python 3 test success does not demonstrate exporter compatibility.
- Pixel 8 and desktop browser. Full-history private snapshot stays untracked; synthetic fixtures are safe for shared testing.
- Implementation adds the files listed in plan.md, including a locked development schema validator and npm manifest. Install the locked development dependencies with `npm ci` once that manifest exists.

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
