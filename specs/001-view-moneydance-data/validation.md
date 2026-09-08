# Implementation Validation

## Phases 1 and 2 execution

- T001–T003: setup completed. Private npm manifest and dependency-free lockfile;
  restricted local server; synthetic fixtures and test-mode data supplied.
- T004: read-only Jython 2.7 probe and reference-input instructions prepared.
  Candidate API signatures reviewed against official documentation. Actual Jython
  syntax/execution and Moneydance source behavior remain unverified.
- T005: BLOCKED pending execution in Moneydance with independently checked
  reference inputs. No Moneydance process was present during environment inspection.
- T006–T012: not started because the task dependency chain requires T005 evidence.
- Phases 3–7: outside this invocation's requested scope; not started.

## Checks performed

- Node v20.9.0 detected.
- `npm install --package-lock-only --ignore-scripts --offline`: passed; no packages added.
- `npm test`: 2 tests passed, 0 failed. Synthetic reference check preserves 13 entries,
  5 transactions, account references, running-balance recurrences, baseline dates,
  budget closing balances and Checking's 105000/104500-cent sidebar checkpoints.
- HTTP test checks real/test separation, missing-file 404, private-route denial,
  encoded/raw traversal rejection, malformed URLs, HEAD, method rejection and no-store.
- Test command emitted MaxListenersExceededWarning for TLSSocket listeners before
  TAP output. Tests passed; origin of the warning has not been established. The
  application server test uses local HTTP only; do not treat it as financial evidence.

These are setup checks only. No maintained v1 schema, financial validator, browser
integration acceptance, full-history performance measurements, Moneydance runtime
comparisons or Pixel 8 acceptance has been completed.

## Resume T005

Follow [the preflight instructions](../../scripts/moneydance-preflight.md).
Run `scripts/moneydance-preflight.py` in Moneydance's script facility with a
controlled/reference book and the private reference JSON. Return the sanitized
summary plus the exact Moneydance version/build. A passing summary still requires
manual confirmation of case coverage and source register order. Do not share the
private reference file or mark unverified cases complete.

The existing UI and export_json.py remain unchanged. Serving the existing UI is
not yet evidence that it consumes the new fixture or honors test=true; those
integrations have their own later tasks.

## User-reported initial Moneydance run

Jython 2.7.2; Moneydance build 5253; September 6, 2026. Case 1 completed 19 comparisons but reported FAIL. No exception was reported; the aggregate output cannot identify the failing comparison. All coverage labels remained UNVERIFIED because labels are credited only for passing cases. This does not establish that all 19 comparisons failed.

The probe now reports fixed per-comparison labels and PASS/FAIL, including reference row ordinal and field name without values. No accounting calculations or expected reference values were changed. Updated diagnostics require another Moneydance run. T005 remains incomplete.

Second user run: 30/31 comparisons passed; only reference-row-1-description failed. Screenshot shows Paycheck on the split-side register. Parent-versus-account-side description remains a hypothesis, not a verified rule. Added failed reference-row expected/actual values and a parent-description diagnostic at user request, without changing pass criteria or financial calculations. Diagnostic revision awaits Moneydance execution.

Third user run (build 5253, Jython 2.7.2): the sole mismatch is confirmed as an empty split-side description with parentDescription matching the reference and displayed register. All 30 other checks pass. The probe now resolves an empty account-side description from its parent, preserving nonempty account-side descriptions. Nonempty split/parent precedence remains unverified. Reference expectations and financial calculations are unchanged; the revised probe still needs runtime confirmation and the remaining T005 cases are outstanding.

## Confirmed Case 1 runtime result

User-reported run at September 6, 2026, 15:00:15 CDT: Jython 2.7.2, Moneydance build 5253. Case 1 PASS, all 31 comparisons passed after the empty split-description fallback. This establishes the tested account's source identities, three reference rows (dates, descriptions, signed amounts and running balances), opening/closing/current balances, two dated own/sidebar comparisons, and unchanged limited fingerprint.

The probe credits the configured debit-credit, same-day-order, split, transfer and future labels. These labels are not proof of both transfer sides or all split variants: the run compares only the configured Misc Spending Budget account. Opening-only, hidden-nonzero, active-under-hidden, income-sign and investment-cash remain UNVERIFIED. T005 remains incomplete. The remaining controlled-case recipe/reference inputs still need to be supplied; the user is not expected to invent them.

Expanded user run on build 5253 / Jython 2.7.2: Cases 1, 2, 4, 5, 6 and 7 passed. Case 3 passed 31/33 comparisons; the two failures were numeric source amounts compared against quoted numeric strings in the supplied reference. Confirmed this defect existed in the generated public example as well as the private copy. Removed quotes from those two amountCents fields in both files without changing the expected amounts or source book. All monetary/date/reference balance comparisons otherwise matched. Corrected reference rerun remains pending; T005 is not yet marked complete.

## Seven-case reference run passed

User-reported September 6, 2026 15:26:09 CDT run on Moneydance build 5253 / Jython 2.7.2: all seven cases passed, with 31 + 13 + 33 + 15 + 21 + 21 + 21 = 155 passing comparisons. No failed comparisons or runtime exceptions were reported. The result is PREFLIGHT_REFERENCE_CHECKS_PASS.

The probe checks amounts, descriptions, source identities, running/own/recursive balances and limited source fingerprints. It does not assert the configured account types or inactive flags. Final coverage confirmation is still needed that Preflight Hidden is inactive, its child active, and Preflight Investment an Investment account (USD cash only), as specified in the recipe. Existing screenshot establishes the three-row Case 1 register order. T005 remains unchecked pending those configuration confirmations; this is not a request to rerun successful financial comparisons.

## Register-versus-sidebar evidence for hidden hierarchy

User confirms opening balances of 5000 cents for Preflight Hidden and 2500 cents for its active child. Screenshots show the Hidden register has no rows and a 5000-cent footer; the child register shows the September 7 transfer of 1000 cents, a 3500-cent running balance and footer. Both sidebar entries show zero; their parent's sidebar shows 14000 cents. Combined with the passed current/date API checks, the source register/API values support the expected amounts but differ from the desktop sidebar presentation. Cause (configuration, display policy, or stale state) is not established. No source transactions or reference amounts should be changed to reproduce the sidebar zeros. The confirmed viewer requirement remains retaining hidden contributions; this finding must not be represented as exact desktop-sidebar parity.

## Resumed Phase 2 implementation

T005 accepted on seven-case runtime results plus user setup confirmation/register screenshots; retain the documented desktop-sidebar discrepancy as a presentation limitation rather than claiming sidebar parity. T006 retains compact source-generated timelines because hidden own history is not supplied to the viewer. T007/T008/T009 implemented: schema, safe cents, structural/financial validation, reference indexes and CLI. Ten Node tests passed; valid fixture accepted, corrupted running-balance fixture rejected with INVALID_SNAPSHOT. No added package dependencies.

T010 code is implemented but its runtime acceptance belongs to T011 and is pending. export_json.py now captures source data twice on the UI thread, validates source own/current/recursive totals, emits included account-side entries and compact checkpoints, and performs atomic sibling-file replacement. Memo, status, capture and file APIs beyond the prior preflight still require Moneydance execution. T012 remains unstarted behind the required T011 dependency. Follow scripts/export-validation.md using the existing test book; no new reference transactions are needed.

## Build 5253 exporter compatibility corrections

User reported missing isInEditingMode and completed export after commenting out both calls. Exported status was UNRECONCILED for all 12 entries, rejected by the contract expecting UNCLEARED. Exporter now checks editing mode only when the method is exposed and explicitly maps UNRECONCILED to UNCLEARED; unknown statuses still fail. Mandatory full double capture including source stamps remains in place. Applying just that status mapping to an in-memory copy of the user's snapshot passes validation (118 accounts, 12 included entries). The original exported file was not modified. All 10 Node tests pass. Corrected exporter runtime run and reference comparison remain pending.

## T011 Java exception boundary correction

User confirmed the corrected export validates (118 accounts, 12 included entries) and all applicable exported reference comparisons pass. Cancellation reports EXPORT_CANCELLED as expected. Attempting C:\Program Files\test.json fails at File.createTempFile with java.io.IOException before target replacement; Python Exception alone did not catch it in Jython. Added explicit java.lang.Exception handling at the top-level and UI-thread capture boundaries, retaining the safe EXPORT_FAILED message without exception contents. The access-denied rerun and original-file preservation confirmation remain pending; no claim of completed T011 yet.

## Phase 2 completion

User confirms corrected access-denied handling worked as expected; cancellation already passed. Original local snapshot still passes the CLI validator. Together with the successful controlled-book export/reference comparison, this completes the controlled T011 gate. Full private-book acceptance/performance remains outstanding, not implied by the test book.

T012 now provides UI/config.js, module worker loading/validation, compact visible account metadata with local-date balance lookup, client request IDs/stale-result rejection, disposal, same-origin enforcement and explicit test source selection. No UI integration, register-query implementation or search was added. Query handling is deferred to T020/T025 and currently reports INVALID_QUERY. All 14 Node tests pass, including a real isolated Node worker with HTTP fetch, handler errors and client lifecycle. This does not claim native browser/Pixel 8 acceptance; those story-phase checks remain pending. Phases 1 and 2 are marked complete; Phases 3 through 7 remain unchecked.

## Real-book excluded-security correction

The user encountered SOURCE_CLOSING_MISMATCH on an excluded security whose raw quantities and source balance use different semantics. The exporter had unnecessarily validated financial history for every account. It now captures/calculates financial history only for included accounts and descendants contributing to their totals; other accounts remain metadata-only, with all ancestry retained and included cash-side references preserved. Non-USD/security descendants of included accounts still fail UNVERIFIED_DESCENDANT_VALUATION. Removed the temporary full-record debug dump. This change requires a real Moneydance rerun; no Python runtime is installed locally (the py launcher reports none).

## Phase 3 balance browsing — 2026-09-07

T013–T016 implementation is present. The worker projects included accounts onto
nearest included ancestors using source timeline balances at the fixed local
page-load date. It retains original ancestry and full entries in worker memory.
The UI receives only navigation metadata, supports parent/child selection, hides
All Accounts totals on desktop/mobile/sidebar, labels explicit test data, and
provides a preserving-parameters test-mode navigation link for a missing real
export. Register/search controls remain unavailable pending their own phases.

Automated evidence: `npm test` passes 20 Node tests. New balance tests verify
September 5/6 Checking totals (105000/104500 cents), own-versus-recursive values,
opening-only balances, baseline coverage, and hidden hierarchy (105250 cents
including a 500-cent hidden contribution and 250-cent accessible child). Existing
worker tests prove one fetch and compact messages; server tests cover the explicit
synthetic hidden-hierarchy fixture route. No packages added or exporter changes
made during Phase 3.

Browser acceptance harness: `tests/browser/index.html` and `balances.mjs` exercise
actual browser worker/client loading plus real app markup/templates/controller.
Scenarios cover missing real export, preserving navigation parameters, explicit
synthetic selection, missing/malformed synthetic input without fallback, account
selection, the $1,045 total, no All Accounts totals, and accessible children under
hidden ancestors. **Unexecuted**: the browser tool reported no browser available.

T017 is **blocked/unverified**: no Pixel 8 access and no new user-reported
comparison of the rendered UI with current Moneydance data. Prior controlled-book
source evidence remains valid for its reported scope, but does not establish UI
or latest full-private-export acceptance. No Phase 4–7 tasks were implemented.

## Phase 3 manual acceptance — user report, 2026-09-07

The user reports all manual tests successful: synthetic and real exports loaded
on desktop; synthetic data uploaded by the user to Blob storage loaded on Pixel 8
and desktop; real data loaded on the phone through ngrok. The existing layout is
preserved as desired, and sidebar balances match the actual Moneydance interface.
T017 is accepted on this user-reported device/source verification. Execution of
the automated browser harness and a device date-change/reload trial were not
separately reported; the date-cutoff behavior has the existing automated evidence.

Real-data loading on Pixel 8 took approximately 7–8 seconds over ngrok and was
faster on the local desktop. This is an informal user measurement, not the five
instrumented trials required by T034 or evidence for future decryption timing.
The user's external hosting tests do not add cloud delivery implementation scope.

Follow-up: the loading status now has a theme-aware colored panel and CSS spinner,
removed on ready/error. Reduced-motion preferences disable rotation. No new
assets or dependencies. Visual verification of this follow-up remains pending.

## Phase 4 register implementation — 2026-09-07

T018–T021 implemented. `query.mjs` builds one global sorted index of entry IDs;
direct-account queries reverse the existing source-order IDs without mutating
history. Page DTOs contain at most 100 rows with original amount/running balance,
account identity, date, description, memo, supplied check number and category
label. The worker retains the full snapshot and performs no additional downloads.
The UI clears stale rows while paging/selecting, uses existing request-ID rejection,
shows explicit empty direct registers, and exposes running balance on mobile.
No source/exporter changes, dependencies, search implementation or deployment.

Automated evidence: 23 Node tests pass. New tests cover 205 entries with repeated
descriptions/amounts, same-day source order, future dates, page clamping, opening
balance effects, direct-only scope, All Accounts transfer counterparts, source
balance invariance, category labels and invalid queries. The isolated real worker
test now exercises an actual page reply and still verifies a single fetch.
Application and browser-scenario module syntax checks pass.

T019 browser scenarios are written and registered after the balance suite. They
use the real worker/client/controller and a 412px iframe to check paged rendering,
checks/memos/categories, escaping, empty parent registers, switching and mobile
running-balance visibility. **Unexecuted**: browser inventory returned no browsers.
T022 remains unchecked pending browser harness execution and actual Moneydance /
Pixel 8 register comparison. The user's successful Phase 3 balance checks are not
claimed as proof of these new register behaviors. Search remains Phase 5 work.

Future disclosure follow-up: worker/UI now hide future rows initially and display
a thin yellow summary/reveal control; account selection resets visibility. All 24
Node tests pass, including whole-register summary, cutoff equality, reveal paging
and unchanged running balances. Browser scenario updated; visual execution pending.

## Phase 4 acceptance — user confirmation

The user reports the browser harness finished with ALL PASS after restarting the
local server. Reported passing scenarios cover actual worker/client source
selection and failure handling; balance selection and hidden hierarchy; register
paging, direct scope, future dates, categories, checks, memo, escaping, mobile
running balances and stale replies.

The user also confirms all remaining requested manual checks passed: comparison
of dates, descriptions, amounts, running balances and same-day order with
Moneydance; transfer counterparts; future summary/reveal/reset; pagination;
All Accounts/account switching; and Pixel 8 readability and sticky year scrolling.
This is user-reported browser/device/source evidence, not agent-observed execution.
T022 is complete and Phase 4 is accepted. No later-phase work is implied.

## Phase 5 implementation — 2026-09-07

T023–T026 implemented. Worker search indexes lowercase description, transaction
memo and individual allocation memos plus exact signed USD strings. It scans the
global sorted entry-ID index with original ancestry intervals and retains only
the current search result ID list for paging/reveal. Scans yield every 512 entries
to permit newer requests; superseded results are neither posted nor cached. No
additional snapshot fetches, source edits, packages or cloud services were added.

The UI enables search after ready, debounces input by 100 ms, invalidates previous
responses immediately during that delay, resets to page 1, and cancels pending
input timers on account selection/disposal. Search results display originating
account identity. Clearing search restores direct-account scope; sidebar and source
running balances remain unchanged. Future disclosure applies to matching entries;
account selection retains the query and resets future visibility.

Evidence: 31 Node tests pass, including allowed fields, excluded fields,
case-insensitive whole-query matching, amount fragments/signs/formatting,
allocation-match deduplication, original hidden ancestry, search paging, no results,
future matching summaries, cancellation and debounce stale-response suppression.
The browser harness includes search scenarios and 20 synthetic timing samples.
Browser execution is unverified: the tool returned no connected browsers or apps.
T027 remains unchecked pending actual browser search acceptance and 20 real-data
Pixel 8 timings including debounce. Prior register acceptance does not establish
search acceptance or full-history latency. Phase 6 onward remains unimplemented.

## Phase 5 acceptance update — user report

The user reports ALL PASS from the complete browser harness, including the new
search DOM scenarios: description/memo/allocation matching, descendants, clear,
paging, future disclosure, rapid changes and unchanged balances. All earlier
balance and register harness scenarios also passed.

Twenty synthetic search timings including debounce were 101, 110, 102, 107, 102,
103, 117, 118, 118, 114, 110, 108, 117, 115, 119, 115, 115, 116, 119, 116 ms
(range 101–119 ms). The user also reports searches on Pixel are functional and
performant. This supports device functional acceptance and qualitative performance.
It does not establish a measured 20-query real-data Pixel 8 timing sample. T027
remains open only for that quantitative evidence; no repeat of passing functional
checks is requested. Clear-button/keyboard-shortcut checks were not separately
reported by the harness.

## Phase 5 acceptance completed — user confirmation

Following the real-data Pixel test instructions, the user confirms: "all 20
searches finished comfortably under two seconds". This completes the practical
20-query threshold check agreed in the conversation, including the visible wait
from finishing input until results appear. It is user-observed timing evidence,
not an instrumented millisecond measurement. The earlier 101–119 ms numbers remain
synthetic harness results and are not attributed to real-data searches.

Together with the previously reported ALL PASS browser harness and functional
Pixel search checks, this completes T027 and Phase 5 acceptance. Later-phase
full-data performance checks retain their own scope; no later tasks are marked
complete by this report.

## Phase 6 implementation — 2026-09-07

T028–T031 implemented. A shared strict export-instant check is used by snapshot
validation and Intl formatting. The sidebar footer renders export time with the
device locale/timezone; transaction calendar components remain unchanged. The UI
exposes loading/ready/empty/error state, distinguishes a valid empty export from
failure, clears timestamp/account/register content after error, and retains the
explicit missing-real-file test-data link. Client worker failures and received
error messages are terminal; stale replies cannot restore content afterward.

Evidence: all 37 Node tests pass, covering midnight/DST formatting, invalid dates,
empty/version distinctions, timestamp errors, worker construction/send/runtime/
message-decoding failures, terminal state, stale replies and existing register/
search/financial invariants. Syntax and diff checks pass. Handlebars 4.7.9's exact
CDN URL was fetched successfully after network approval; recursive account and
register templates compiled/rendered in Node VM with escaping and column spans
verified. This is template verification, not browser visual acceptance.

The browser loading suite uses the actual worker/client and test-only request
counting, plus real UI tests for empty/error states and a deliberately failing
worker. Both real/test selections exercise invalid export timestamps. New fixture
routes require restarting an already-running local server.

T032 remains unverified for browser execution: available browser/app inventory was
empty. The user still needs to run the new harness and check the footer on desktop
and Pixel. No Phase 7 performance/device acceptance is claimed.

## Phase 6 acceptance completed — user confirmation

The user reports ALL PASS from the complete browser harness. Loading contract
checks passed for timestamps in real/test modes, empty/version/financial failures,
invalid queries and reload-only retry. Loading DOM checks passed for empty/error
states, the export footer, stale content removal, actual worker failure and
cross-origin rejection. Earlier balance, register and search scenarios also passed.

The user confirms the As of date appears correct on Pixel and desktop. The date
replaces Read-Only Mode and inherits that label's font, muted color and centered
alignment, per the user's latest presentation request. T032 is complete and Phase 6
is accepted on this user-reported browser/device evidence.

The reported synthetic search sample ranges from 101–120 ms including debounce;
it remains synthetic evidence and is not a new real-data performance measurement.
Phase 7 checks remain separate and are not marked complete by this report.
