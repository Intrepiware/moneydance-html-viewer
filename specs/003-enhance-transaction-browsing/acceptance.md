# Transaction browsing implementation and acceptance

## US3 source preflight (re-run)

Acceptance review: Mike's 2026-09-24 results below complete **T015, T016 and T038**. The direct synthetic export passed validation (116 accounts, 11 entries) and all nine reference comparisons. All nine source probes pass in Moneydance build 5253 / Jython 2.7.2. The user rebuilt/reinstalled the extension, checked its encrypted output in desktop Chrome/mobile Brave against Moneydance and the test script, confirmed excluded-account behavior, and separately recorded all nine comparisons passing for the extension's export. `compare-preflight.mjs` calls `validateSnapshot` before comparing, so that pass also establishes validation of the extension output; no duplicate validator run is needed. The user explicitly confirmed unchanged source records/balances after export. This evidence supersedes the earlier failures and pending source-verification notes below. Browser interaction and full-history device gates remain pending; export/decryption timings do not substitute for T041's details-opening timing. No private export was read or tests rerun for this acceptance review.

All Tests pass:

```
Beginning file C:\Working\Sandbox\moneydance\Export Json\scripts\moneydance-preflight.py at Thu Sep 24 19:42:22 CDT 2026

Jython: 2.7.2
Moneydance build: 5253
Allocation case 1: PASS
Allocation case 2: PASS
Allocation case 3: PASS
Allocation case 4: PASS
Allocation case 5: PASS
Allocation case 6: PASS
Allocation case 7: PASS
Allocation case 8: PASS
Allocation case 9: PASS
PREFLIGHT_REFERENCE_CHECKS_PASS: manually confirm coverage and source UI order; this is not viewer/device acceptance
Finished running normally at Thu Sep 24 19:42:26 CDT 2026
```

Validation of the exported json also worked:

```
PS C:\Working\Sandbox\moneydance\Export Json> node scripts/validate-snapshot.mjs .workspace/private/us3-source.json
{"status":"VALID","accounts":116,"entries":11}
PS C:\Working\Sandbox\moneydance\Export Json> node scripts/compare-preflight.mjs .workspace/private/us3-source.json .workspace/private/us3-reference.private.json
Allocation case 1: PASS
Allocation case 2: PASS
Allocation case 3: PASS
Allocation case 4: PASS
Allocation case 5: PASS
Allocation case 6: PASS
Allocation case 7: PASS
Allocation case 8: PASS
Allocation case 9: PASS
REFERENCE_COMPARISONS_PASS
```

Built the extensions following the instructions in build-extensions.md, and reinstalled into Moneydance. Exported an encrypted snapshot of the synthetic Account book (under 2 sec export). File decrypted in both desktop Chrome and mobile Brave in less than 1 second each. Verified transaction data against moneydance and the test script. Observed transactions that referenced the archived account, but offered no navigation to that account (as expected).

Ran compare-preflight.mjs against a file exported by the extension, and all tests passed:

```
Allocation case 1: PASS
Allocation case 2: PASS
Allocation case 3: PASS
Allocation case 4: PASS
Allocation case 5: PASS
Allocation case 6: PASS
Allocation case 7: PASS
Allocation case 8: PASS
Allocation case 9: PASS
REFERENCE_COMPARISONS_PASS
```

Confirmed exporting left MOneydance's source records/balances unchanged.

## US3 source preflight — 2026-09-24

Diagnostic rerun at 19:36 CDT after the user corrected one source record: cases 1, 2, 7 and 8 pass. Cases 3, 5 and 9 fail only memo comparisons: actual source text is US3 Refund, US3 Salary and US3 Excluded. Cases 4 and 6 cannot select the shortened Refund/Salary descriptions. Corrected the supplied reference and setup guide to retain full transaction descriptions for these single-category cases; amounts, tags and exporter logic are unchanged. The matching full-text selectors for cases 4/6 follow the source split text observed on the parent side and still require rerun confirmation. The user's local reference was not read or modified. Full source acceptance remains pending.

User ran the source probe in Moneydance build 5253 / Jython 2.7.2 at 19:30 CDT. Allocation cases 1–2 passed; 3–9 returned FAIL_OR_API_UNVERIFIED. The original aggregate result does not establish which field or API failed. Source acceptance remains pending. The probe now reports failed comparisons and selector counts separately; expectations and exporter behavior are unchanged. Await the diagnostic rerun before diagnosing or changing financial expectations.

## US3 implementation — 2026-09-21

Subsequent presentation revision: removed all modal Memo/Tags labels, shared the register memo color/size rule, and retained separate memo/tag lines. Updated the mockup and design requirements. Syntax/whitespace checks passed; visual/manual acceptance remains pending. Include this revision in T040's both-theme walkthrough.

The user recorded mockup approval in `mockups/README.md` before implementation resumed. T054 is complete. Implemented selected-entry details, full paths, signed right-aligned amounts, split-specific tags, optional memo/tag sections, checked bottom totals and the approved header/footer. Native dialog dismissal restores invoking focus and scroll; details use a separate client request lane and stale replies are ignored. No US4 navigation or US5 grouping was implemented.

Automated evidence (Codex, Windows, Node 20.9.0 and Moneydance-bundled Jython):

- Initial details test failed because the projection did not exist, then passed after implementation.
- Selected Node unit/contract suite: **55/55 passed**. Excluded `fixtures.test.mjs` and `decrypt-synthetic.test.mjs` because they read user-controlled `UI/data/test-snapshot.json`; that file and the large private export were not read. Existing demo-fixture equality issue is not claimed fixed. After the final destination-availability/index changes, the affected details/worker/snapshot subset passed **23/23**.
- Bundled Jython: **4 allocation + 5 tag + 5 exporter/deadline + 7 delivery tests passed**. Allocation tests use fake source objects; they do not establish actual Moneydance behavior.
- Dedicated synthetic fixture validates: **14 accounts, 109 entries**. Its paycheck's independently specified splits sum to $2,000; legacy, repeated, excluded, refund, many-split and selected-side cases are separate.
- JavaScript module syntax checks and whitespace checks passed. One existing running-overflow test needed its allocations cleared to isolate running-balance overflow now that allocation sums validate first.
- Extension rebuild succeeded after approved escalation for the signing directory ACL. Output: `dist/snapshot_delivery.mxt`; SHA256 `A35566E9A72B95F21124E7C073F693998914B4E07B0A8D583C511DC1271ECF34`. This is a build result, not installed-extension/source verification.

T012 source recipe/reference/probe and T013–T014 implementation are delivered. T016 validator/schema work is implemented; final revalidation of T015's actual synthetic export is pending. T017–T019 implementation is delivered. T020 browser coverage is written but **not executed**: browser control has no available browser surface. Desktop/phone visual behavior remains unverified.

### US3 user verification — passed

Acceptance review — 2026-09-30: Mike's Brave 1.96.59 desktop walkthrough and full browser harness ALL PASS complete **T020 and T039**. The harness includes US3 checks at 1280/360/412px. The actual Pixel 8 walkthrough confirms paycheck amounts, escaped/wrapping text and many-split scrolling. Desktop results cover legacy unavailable amounts/totals, uncategorized state, refunds, repeated allocations and selected-side repair scope; previous source checks establish excluded-destination behavior. The user accepts the selected-entry repair presentation, consistent with the existing spec; no financial-scope change is needed.

Explicit user-directed omission: Mike accepts skipping the remaining phone value examples using desktop results as alternative evidence. Those phone cases were not executed and are not labeled passing device tests.

Latest acceptance review — 2026-09-30: Mike's additional manual results complete **T040 and T041**. Desktop checks confirm the accessible dialog role/name, keyboard focus excluded from background controls, Escape and close-button dismissal preserving account/search/page/scroll and invoking-button focus, both themes, and immediate-close/rapid-row behavior without stale displays. Desktop and actual Pixel walkthroughs cover later-page and search opening, readable long content, bounded scrolling and restored context/focus. Production real-dataset checks report paycheck split details opening in less than one second on both devices, with no additional download or password prompt after search, paging or modal interaction. Initial page loads (3.29 seconds desktop, 6 seconds phone) are separate from T041's details-opening measurement; the phone download-duration explanation is the user's hypothesis, not a verified diagnosis. All US3 manual tasks are complete and US4 is eligible to begin. No application changes, private export reads or fresh automated test runs were made by this review.

Follow the US3 section in [quickstart.md](quickstart.md). Run the updated browser harness and the dedicated `/tests/browser/details.html` preview. For source checks use [us3-source-checks.md](../../scripts/us3-source-checks.md), with nine independent allocation references, direct-script and installed-extension comparisons.

| Gate        | Status  | Evidence required                                                                                                                                                                           |
| ----------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T016        | Passed  | Actual synthetic export validates and all nine reference comparisons pass; see user results above                                                                                           |
| T015 / T038 | Passed  | Direct and installed-extension source comparisons, viewer inspection and unchanged source records/balances confirmed by Mike on 2026-09-24                                                  |
| T020 / T039 | Passed  | Mike's 2026-09-30 Brave 1.96.59 desktop walkthrough, actual Pixel 8 representative cases and full harness ALL PASS; remaining phone value examples explicitly omitted with desktop evidence |
| T040        | Passed  | Mike's 2026-09-30 desktop keyboard/accessibility, both-theme, immediate-close and desktop/phone dismissal/context/focus restoration results                                                 |
| T041        | Passed  | Production real-dataset paycheck details open in less than one second on desktop and actual Pixel; no additional download or password prompt observed                                       |

Record tester/date/browser/device, observed results, defects and retests here. US3's manual gate is satisfied by the recorded user-run results; no manual task is marked passed by automated evidence.

### Results

**Test:** http://127.0.0.1:8080/tests/browser/details.html  
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Desktop  
**Results:**

- Page 2 of Details Checking loaded successfully
- Payroll search located Employer LLC Payroll transaction
  - Clicking "Split" loaded the modal successfully with sub transactions listed and expected amounts that total $2,000
- Repeated search located "Repeated Dining" transaction.
  - HTML code (with js injection, nice) successfully escaped.
  - Repeated letters also wrapped onto next row
- Legacy search located "Legacy partial amounts"
  - Transaction -$92, but Personal:Dining:Dining Out displayed "Unavailable", as did the total
- Uncategorized search located "Uncategroized example". Modal showed no splits with the message: "Uncategorized -- no allocations are available for this entry.". Total shows Unavailable.
- Many search located "Many allocations" transaction. Modal showed 12 splits for $10. Modal scrolls nicely.
- Refund search located "Refund". Modal shows one positive split for $25 with category Personal:Dining:Dining Out.
- Home Savings, Rainy Day Savings, and Home:Repairs is a little odd, although I'm not sure what I expected. In Home Savings and Rainy Day Savings, I can see a transaction for -$4,000 and -$1,000 respectively. But the splits in each transaction don't seem to know about each other. The corresponding Home:Repairs transaction _does_ show splits from both accounts, however. **I am OK with this implementation.** This was a somewhat contrived example, and I don't think I really described the process well when I initially included it in the scope.

**Test:** http://127.0.0.1:8080/tests/browser/details.html  
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Pixel 8  
**Results:**

- Payroll search located Employer LLC Payroll transaction
  - Clicking "Split" loaded the modal successfully with sub transactions listed and expected amounts that total $2,000
- Repeated search located "Repeated Dining" transaction.
  - HTML code (with js injection, nice) successfully escaped.
  - Repeated letters also wrapped onto next row
- Many search located "Many allocations" transaction. Modal showed 12 splits for $10. Modal scrolls nicely.

I am OK skipping the other tests and accepting the behavior on desktop as proof that mobile works.

**Test:** http://127.0.0.1:8080/tests/browser/
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Desktop  
**Results:**

PASS real worker/client: exact test selection, missing real/test, invalid test, no fallback
PASS real app DOM: missing link, test indicator, account selection, $1,045, no All Accounts total
PASS hidden hierarchy DOM: active descendant accessible, excluded ancestor absent, source parent total
PASS register fixture loaded
PASS register DOM: paging, direct scope, future dates, categories, checks, memo, escaped text, mobile balance, stale replies
PASS search DOM: descriptions/memos/allocations, descendant scope, clear, paging, future disclosure, rapid changes and balances
Synthetic search timings including debounce (ms): 108, 105, 118, 117, 113, 121, 108, 102, 105, 115, 103, 112, 118, 111, 117, 117, 104, 114, 117, 113. Real-data Pixel 8 timing remains a separate check.
PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry
PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection
PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal
PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle
PASS US3 1280px: paycheck, alignment, themes, literal/empty fields, unavailable total, dismissal and late replies
PASS US3 360px: paycheck, alignment, themes, literal/empty fields, unavailable total, dismissal and late replies
PASS US3 412px: paycheck, alignment, themes, literal/empty fields, unavailable total, dismissal and late replies
PASS US1 1280px: both themes, columns, money, icons and controls
PASS US1 1440px: both themes, columns, money, icons and controls
PASS US1 360px: both themes, columns, money, icons and controls
PASS US1 412px: both themes, columns, money, icons and controls
PASS US2 1280px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 1440px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 360px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 412px: tags, escaping, wrapping, money, search and page/account changes
ALL PASS

**Test:** http://127.0.0.1:8080/tests/browser/details.html  
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Desktop  
**Results:**

- Opened "Many" transaction after navigating to page 2. Splits have full category heirarchy, memos, and modal has scrolling.
  - Dialog appeared in less than 1 second
  - Pressed tab several times after dialog opened. Focus shifted to close button, scroll area, then browser chrome elements. Focus never unexpectedly landed on the obscured search textbox or elements behind the modal.
  - Opened accessibility tab in Chrome. Found the dialog had Role: dialog and Name: Split Details as expected
  - Pressing escape closes the dialog and returns focus back to the web application behind it.
  - Pressing the close button also closes the dialog and returns focus back to the web application behind it.
  - Closing with Escape or the close button preserved the account, search, page and scroll position, and returned keyboard focus to the invoking Split/category button
  - Rapidly clicked (open then immediately closed) multiple rows. Was unable to make earlier mouse clicks affect later dialog displays.
- Same experience when transaction accessed by searching for "Many"
- Successfully toggled between light and dark themes.

**Test:** http://127.0.0.1:8080/tests/browser/details.html  
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Pixel  
**Results:**

- Opened "Many" transaction after navigating to page 2. Splits have full category heirarchy, memos, and modal has scrolling.
  - Dialog appeared in less than 1 second
- Same experience when transaction accessed by searching for "Many"
- Pressing the close button preserved the account, search, page and scroll position, and returned keyboard focus to the invoking Split/category button

**Test:** Production site with real dataset
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Desktop  
**Results:**

- Initial page loads from ctrl+refresh in 3.29 seconds
- Correct password unlocks data in < 1 second
- Searched for a paycheck transaction
  - Splits dialog loads in less than one second
  - Closing the dialog preserved the account, search, page and scroll position, and returned keyboard focus to the invoking Split/category button
- No additional download or password prompt observed after searching, paginating, viewing or closing a modal.

**Test:** Production site with real dataset
**Tester:** Mike  
**Date:** 2026-09-30  
**Browser:** Brave 1.96.59  
**Device:** Pixel  
**Results:**

- Initial page loads from ctrl+refresh in 6 seconds
  - The page layout displays almost immediately, but the pinwheel displays for six seconds while it downloads the encrypted payload. **I am fairly certain this duration is caused by the size of the file**
- Correct password unlocks data in < 1 second
- Searched for a paycheck transaction
  - Splits dialog loads in less than one second
  - Closing the dialog preserved the account, search, page and scroll position, and returned keyboard focus to the invoking Split/category button
- No additional download or password prompt observed after searching, paginating, viewing or closing a modal.

## US2 source-tag defect and correction (2026-09-20)

After successful UI acceptance, the user reported a real transaction with a tag stored under split `0.tags` in Moneydance Raw Details, but an empty exported parent-row tags array. Inspection of `export_json.py` found that tag collection used `(parent, txn)`; for a parent row these are the same transaction, so child-split tags were skipped. This occurs before encryption. The raw excerpt supplied in chat was sufficient; the user's large export was not read, and no private transaction values or IDs were copied into tests or documentation.

Corrected capture to collect distinct parent plus child-split tags for parent rows, while split rows retain parent plus selected-split tags only. Output remains sorted, literal and deduplicated. Deadline checks cover traversal. Moneydance's [AbstractTxn API](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/AbstractTxn.html) documents that a parent's other transactions are its splits, while a split's other transaction is its parent. No balances, amounts, encryption or UI rendering behavior changed. Direct execution uses the corrected source immediately; an installed extension needs a later rebuild/reinstall to receive it.

Validation: `tests/runtime/export_tags_test.py` (5), `tests/runtime/export_deadline_test.py` (5) and `tests/runtime/delivery_test.py` (7) all passed with the bundled Moneydance Java/Jython runtime. The tag cases use synthetic source doubles to cover split-only tags, parent/split scope, duplicate handling, Unicode/literal text, unchanged source tag lists, wrapper identity and cancellation. These tests supplement but do not establish actual Account Book acceptance. `git diff --check` passed.

T052 and T053 are complete. Actual-Moneydance verification confirms the missing-tag defect is fixed in plaintext export and encrypted viewer loading, parent rows collect and deduplicate split tags, individual split rows exclude sibling-only tags, and export leaves source records unchanged. Prior T036/T037 UI acceptance remains valid; US2's source-verification gate is satisfied. US3 has not started.

### T053 user verification — passed

- Date and Moneydance version: 20 Sep 2026, Moneydance 2024.4

1. Exported the real Account Book to a file. Inspected contents, found expected tags in the export. Amount and balance are correct.
2. Encrypted snapshot loads with tags as expected in the ui
3. Created $15 transaction with two splits, $10 for Example.Travel and $5 for Example.Meals. Confirmed parent transaction did not have tags and raw details show the tags were saved to the splits as expected. Exported the data. Inspected the file, both tags saved to the parent transaction. Both tags loaded in the web ui.
4. Changed the splits on previous transaction so both tagged Example.Travel. Inspected the exported file, confirmed one occurrence of "Example.Travel". Tag also appeared once in the web ui.

5. Follow-up confirmation from the user: the other side of each split contains its correct tag, not its sibling's tag.
6. Follow-up confirmation from the user: exporting leaves Moneydance source records unchanged.

Review: the user-run results and follow-up confirmations complete T053 in Moneydance 2024.4 on 2026-09-20. The original missing-tag defect, parent union, deduplication, split isolation, correct amount/balance and source immutability are verified. No export file was read by the assistant during this review. No application changes or additional test runs were required to record acceptance.

## US2 implementation and completed acceptance (2026-09-20)

The user invoked speckit-implement after completing the US1 gate. US2 now copies exported tags into page rows and displays escaped wrapping badges beneath description/memo/check details with a Tags label. Empty tag arrays render no container. Search fields, financial amounts/balances, exporter, extension and schema remain unchanged. No US3–US5 implementation was started.

T009–T011 and manual tasks T036–T037 are complete. The user supplied full harness passes on desktop and Pixel 8, including all four US2 widths, and detailed manual results with no defects observed. The US2 manual gate is satisfied. No pre/post implementation hooks are registered (`hooks: {}`). The requirements checklist remains read-only, with all 16 items checked.

Evidence:

- New tag projection/search tests failed before implementation because rows omitted tags, then passed after implementation. All 12 focused register/search tests passed, covering exact tag order/text, paging, source immutability, unchanged money and tag-only nonmatching.
- Full `npm test`: **50/51 passed**. The only failure is the previously documented `synthetic budget fixture preserves the requested financial scenario` comparison of the locally customized `UI/data/test-snapshot.json` with the canonical synthetic fixture. Neither data file was overwritten. Existing TLS listener warnings also occurred. No full-suite pass is claimed.
- New `tests/fixtures/tags-v1.json` validates: 4 accounts, 105 entries. Independent financial reference: $200 opening balance minus 105 × $1 produces $95 closing balance; each displayed row retains its original running balance. No source-Moneydance validation claim is made for this constructed fixture.
- An ephemeral local server served the manual preview and browser modules successfully; its dedicated tag JSON route loaded and validated all 105 entries and the $95 closing balance. Server regression tests also verify the explicit fixture route without opening the fixture directory generally.
- Browser module syntax checks and `git diff --check` passed during implementation. No browser was connected for agent execution; the user subsequently ran the complete harness successfully on desktop and Pixel 8, as recorded below. These user-executed results supersede the earlier pending browser status.

Manual setup and exact cases are documented in [quickstart.md](quickstart.md#transaction-tags--us2-manual-acceptance). Restart `npm run serve`, run `/tests/browser/`, then inspect `/tests/browser/tags.html` at the required widths/in both themes and on Pixel 8. The preview uses a fixed synthetic fixture and does not change application configuration or demo data.

Constitution review: monetary/reference tests preserve financial fidelity; no exporter/runtime changes; synthetic-only shared fixtures and no private diagnostic output; existing templates/query flow retained; automated and unrun browser/device evidence distinguished; no new dependencies.

Acceptance review: the reported environments are Brave 1.95.104 desktop at 1920 × 917 and Brave 1.95.102 on Pixel 8 at 411 × 760, both tested on 2026-09-20. Manual tag cases, source-reference amounts/balances, search exclusion, paging and account changes passed. The harness additionally covers 1280/1440/360/412px. This completes US2 acceptance without claiming later-story full-history performance or a fresh full Node-suite pass. No application changes or further test runs were needed for this review; US3 has not started.

### US2 Test Harness results (desktop):

http://127.0.0.1:8080/tests/browser/:

```
Viewer acceptance tests
Uses synthetic data only. Run with the local viewer server.

Running…
PASS real worker/client: exact test selection, missing real/test, invalid test, no fallback
PASS real app DOM: missing link, test indicator, account selection, $1,045, no All Accounts total
PASS hidden hierarchy DOM: active descendant accessible, excluded ancestor absent, source parent total
PASS register fixture loaded
PASS register DOM: paging, direct scope, future dates, categories, checks, memo, escaped text, mobile balance, stale replies
PASS search DOM: descriptions/memos/allocations, descendant scope, clear, paging, future disclosure, rapid changes and balances
Synthetic search timings including debounce (ms): 101, 114, 116, 115, 101, 103, 133, 104, 108, 116, 119, 119, 115, 118, 114, 117, 106, 113, 117, 118. Real-data Pixel 8 timing remains a separate check.
PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry
PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection
PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal
PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle
PASS US1 1280px: both themes, columns, money, icons and controls
PASS US1 1440px: both themes, columns, money, icons and controls
PASS US1 360px: both themes, columns, money, icons and controls
PASS US1 412px: both themes, columns, money, icons and controls
PASS US2 1280px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 1440px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 360px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 412px: tags, escaping, wrapping, money, search and page/account changes
ALL PASS
```

### US2 Test Harness results (Pixel 8):

http://127.0.0.1:8080/tests/browser/:

```
Viewer acceptance tests
Uses synthetic data only. Run with the local viewer server.

Running…
PASS real worker/client: exact test selection, missing real/test, invalid test, no fallback
PASS real app DOM: missing link, test indicator, account selection, $1,045, no All Accounts total
PASS hidden hierarchy DOM: active descendant accessible, excluded ancestor absent, source parent total
PASS register fixture loaded
PASS register DOM: paging, direct scope, future dates, categories, checks, memo, escaped text, mobile balance, stale replies
PASS search DOM: descriptions/memos/allocations, descendant scope, clear, paging, future disclosure, rapid changes and balances
Synthetic search timings including debounce (ms): 108, 106, 112, 116, 113, 109, 112, 112, 112, 109, 108, 112, 110, 111, 111, 110, 117, 111, 112, 111. Real-data Pixel 8 timing remains a separate check.
PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry
PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection
PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal
PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle
PASS US1 1280px: both themes, columns, money, icons and controls
PASS US1 1440px: both themes, columns, money, icons and controls
PASS US1 360px: both themes, columns, money, icons and controls
PASS US1 412px: both themes, columns, money, icons and controls
PASS US2 1280px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 1440px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 360px: tags, escaping, wrapping, money, search and page/account changes
PASS US2 412px: tags, escaping, wrapping, money, search and page/account changes
ALL PASS
```

### US2 manual results — desktop

- Tester/date/browser version/device or viewport: 20 Sep 2026, Brave 1.95.104 desktop, 1920 x 917
- Browser harness result (including four PASS US2 lines): All pass, see above
- T036 tags/literal text/layout: Inspected transactions created as per T036 and described in quickstart.md:
  - Text readable on all lines
  - No tags: displayed as expected
  - One tag: transaction displays with single tag
  - Many tags: all 10 tags displayed in exact specified order
  - Long tag: wraps to next line
  - Markup tag: rendered with literal markup/handlebars code (not translated to actual HTML or handlebars)
- T037 search/paging/account changes:
  - Markup tag: one search result, same three tags, amount -$1, running balance $99
  - memo-103: rendered with tagonly-orchid tag, -$1 amount, balance $96, Check Num \#007
  - Confirmed tagonly-orchid unsearchable
  - Cleared search, results returned. Results paged as expected. Found later-page-tag transaction, -$1 amount, $199 balance. No tag leakage.
  - Empty Savings account contains no transactions or orphaned tag displays. Selecting All Accounts shows tagged rows again. Selecting Tag Test Checking also displays tagged rows.
- Defects and retest results: no defects observed

### US2 manual results — mobile

- Tester/date/browser version/device or viewport: 20 Sep 2026, Brave 1.95.102 Pixel 8, 411 x 760
- Browser harness result (including four PASS US2 lines): All pass, see above
- T036 tags/literal text/layout: Inspected transactions created as per T036 and described in quickstart.md:
  - Text readable on all lines
  - No tags: displayed as expected
  - One tag: transaction displays with single tag
  - Many tags: all 10 tags displayed in exact specified order
  - Long tag: wraps to next line
  - Markup tag: rendered with literal markup/handlebars code (not translated to actual HTML or handlebars)
- T037 search/paging/account changes:
  - Markup tag: one search result, same three tags, amount -$1, running balance $99
  - memo-103: rendered with tagonly-orchid tag, -$1 amount, balance $96, Check Num \#007
  - Confirmed tagonly-orchid unsearchable
  - Cleared search, results returned. Results paged as expected. Found later-page-tag transaction, -$1 amount, $199 balance. No tag leakage.
  - Empty Savings account contains no transactions or orphaned tag displays. Selecting All Accounts shows tagged rows again. Selecting Tag Test Checking also displays tagged rows.
- Defects and retest results: no defects observed

## T001 harness failure and fixture isolation fix

The user ran the harness and reported: the real worker/client selection checks passed, then `FAIL: Checking source recursive total`. The balance harness loaded the editable `UI/data/test-snapshot.json` while asserting the canonical synthetic fixture's $1,045.00 Checking total. The local demo file differs from that fixture, as already recorded below.

Fixed `tests/browser/balances.mjs` to use `/tests/browser/baseline.json`, an explicit server route to `tests/fixtures/valid-snapshot-v1.json`, including its no-fallback scenarios. The user's demo data is preserved. Server regression coverage verifies the baseline route stays independent when demo data changes, while direct fixture-directory access remains blocked.

Validation: four server/balance unit tests passed; browser-module syntax check passed. The user subsequently reran the full browser harness and reported ALL PASS, resolving the reported failure. T001 and T007 are now complete.

## Latest browser acceptance result — user-reported ALL PASS

The supplied output confirms successful worker/client selection and no-fallback checks; real app balances ($1,045 Checking), hidden hierarchy, register paging/future dates/escaping, search and stale replies, loading/error contracts, persisted lifecycle, and encrypted unlock with the Jython fixture. All US1 checks passed at 1280px, 1440px, 360px and 412px, covering both themes, columns, money visibility, icons and controls. The harness finished with `ALL PASS`.

The 20 synthetic search timings, including debounce, ranged from 103 to 118 ms. These are synthetic browser timings, not full-history Pixel 8 performance evidence. Browser/version and run date were not supplied with this report. This evidence is user-executed, not an agent browser run.

This result supersedes earlier pending browser-harness statements below. Together with the recorded manual checks, it completes the requested US1 work. It does not claim a fresh full `npm test` pass or complete the separate Moneybot/installed-extension checks M003–M005. No application changes or further test runs were needed to reconcile this report.

Date: 2026-09-19. Scope explicitly limited to User Story 1 and Material icons
after the prior implementation was rolled back. The working tree began clean.

## Changes

- Desktop date is 90px with 15px horizontal padding; category is 180px;
  amount/balance remain 120px each. Description receives all remaining space.
  Description/category use single-line ellipses and full text on hover. This
  user-requested revision replaces the earlier proportional/wrapping layout
  and applies only above 768px.
- All Font Awesome markup and its stylesheet dependency are replaced with the
  specified Google Material Symbols, including utilities and theme changes.
  Decorative symbols are hidden from assistive technology; icon buttons have names.
- Account-label icons use existing `App.nodes` metadata. No query, worker,
  financial validation, exporter, extension, fixture or schema changes.
- Sixteen official SVGs are served locally, with pinned provenance and Apache
  license in `UI/assets/icons/`. No packages added. Existing ignore rules cover
  applicable dependencies, private data and build outputs; no additional tooling
  or ignore changes were needed.

## Evidence

- Baseline `npm test`: 48/48 pass.
- New SVG route test failed with 404 before implementation, then passed after it.
- Initial US1 `npm test`: **48/48 pass**, including the added SVG MIME/HEAD and forbidden
  path assertions in the existing server test. Existing TLS listener warnings
  occurred before and after the change; no test failures.
- Desktop layout revision: `npm test` reports **47/48 pass**. The existing
  `synthetic budget fixture preserves the requested financial scenario` test
  fails because the already-modified `UI/data/test-snapshot.json` differs from
  the canonical fixture. That pre-existing local data change was preserved.
  Browser assertions now check fixed widths, description priority, ellipses and
  full hover text; visual execution remains pending.
- Fresh `npm run serve -- --port 0`: all 16 official SVGs returned HTTP 200,
  `image/svg+xml`, and byte-for-byte matching content. UI and harness routes also
  returned HTTP 200. This is an HTTP check, not a rendered-browser check.
- App/browser-harness syntax checks and `git diff --check` pass.
- Browser automation returned `apps: [], browsers: []`. Baseline browser execution
  and final visual walkthrough are **pending**, not passed.
- `tests/browser/browsing.mjs` adds US1 assertions at 1280/1440/360/412px in both
  themes: fixed column widths/single-line truncation, scrolled header alignment, money visibility,
  no page overflow, exact icon mappings, names, theme/sidebar/pagination/search
  controls, and no Font Awesome requests. Frames are disposed after each scenario.

Run `npm run serve` and open `/tests/browser/` to execute the complete harness.
Restart any older server process so the new icon route is active. For a visual
walkthrough, use `/?test=true`, both themes and the four widths above. Actual
Pixel 8 appearance/touch validation remains pending. Existing accepted iOS
limitations are unchanged. Source-runtime validation is not needed for this
presentation-only change; US2–US5 are outside this implementation scope.

## Governance

Financial fidelity/runtime/privacy: financial code and source data unchanged;
synthetic tests only. Simplicity: reuse accepted markup, controls and metadata.
Evidence: unrun visual/device checks explicitly pending. Dependencies: official
local SVG assets only, no packages or new external runtime requests.

`.specify/extensions.yml` contains `hooks: {}`; no pre/post hooks to dispatch.
Task markers record only evidenced completion; visual acceptance remains open.

## Count formatting and direct Moneybot amendment (2026-09-19)

Implemented comma-grouped summary counts in both ready and page-render paths without alignment changes. Browser harness now covers 0, 999, 1,000, 2,963 and 1,234,567 and unchanged alignment; browser execution and manual T050 remain pending.

Standalone exporter now prompts for an optional masked password and clearly states that blank saves plaintext JSON. Cancel saves nothing; nonempty input uses the existing encrypted envelope. Extension entry guard and extension modules remain unchanged. No extension was rebuilt or installed.

Automated evidence using bundled Moneydance Java/Jython (synthetic data, not actual source-runtime acceptance):

- `tests/runtime/encryption_test.py`: 6 passed, including independent vectors for both encryption helpers, ciphertext round-trip, plaintext save, failure preservation, and mocked modal blank/cancel/whitespace cases on the Swing EDT.
- `tests/runtime/export_deadline_test.py`: 5 passed.
- `tests/runtime/delivery_test.py`: 7 passed, including the real builder/encryption pipeline and prior-ciphertext preservation.
- `node --test tests/unit/encryption-vectors.test.mjs tests/unit/encrypted-viewer.test.mjs`: 9 passed.

Actual Moneybot dialogs/source comparison, visual count acceptance and rebuilt installed-extension behavior remain unverified. M003–M005 in feature 002 and T050 in feature 003 remain unchecked. No later browsing story was implemented. No full-suite pass is claimed; the pre-existing edited test-snapshot fixture mismatch remains outside this change.

## Full category hover paths (2026-09-19)

Page rows now carry a full colon-separated category title from existing destination ancestry, excluding ROOT. Visible category labels, truncation, Split/Uncategorized behavior and search fields remain unchanged. Applies to direct register and search rows. No exporter or later-story functionality changed.

`node --test tests/unit/register.test.mjs tests/unit/search.test.mjs tests/unit/worker.test.mjs`: 19 passed. Browser harness includes escaped hierarchical title/short-label assertions; browser execution and the updated T035 manual hover check remain pending.

## US 1 Manual testing result

Confirmed specified dimensions of date, category, amount, and balance. Remaining width given to description. Elipses truncation used when category or description is too long to display. No noticeable difference viewing the app on a Pixel 8 via ngrok. In Pixel 8, amounts appear unobscured and the page contains no horizontal scrolling.

Verified following icons:

- top-left: checkbook
- all accounts: checkbook
- bank: account_balance
- credit card: credit_card
- expense: sell
- income: paid
- asset: money_bag
- loan: payment_arrow_down

Additional notes:

- labels appear correct in search
- light/dark mode icon is correct
- navigated to search using the ctrl+f shortcut
- confirmed the search clear icon appears when text entered, and clears the input when clicked
- confirmed icons are correct in both light and dark mode
- I don't use liabilities, but the icon you chose is fine
- touch targets are unchanged
- no network traffic related to font-awesome in the browser developer toolbar
- confirmed the title text of nested categories contains the full heirarchy separated by colons
- split categories are unchanged
- confirmed sticky headers remain aligned
- accessibility names are present for certain elements on the page, and appear fine to my untrained eye.
- confirmed transaction counts appear with thousands separators
- tested fallback by artificially inserting an account with an "Unknown" type. confirmed icon appeared as material account_balance in both light and dark mode.
- opened and closed the sidebar using keyboard in desktop
- tested sidebar navigation by opening and closing using the hamburger menu and x icon. Also hid sidebar by clicking shaded area behind the sidebar.
- confirmed the theme toggle element contains aria-hidden="true"
- confirmed theme toggle parent button has accessibility name "Toggle Light/Dark Mode"
- confirmed accessibility names of hamburger button ("Open navigation"), sidebar close button ("Close navigation"), clear search button ("Clear search")
- account button does not have an accessibility name (?) but the icon has aria-hidden="true"

## Review of user-reported manual results

The user reports performing the instructed walkthrough. These results supersede the earlier pending status for T035: column sizing, truncation, category hierarchy titles, sticky alignment and actual Pixel 8 layout/touch behavior passed. Testing included desktop browser developer tools and Pixel 8 via ngrok; exact test date, browser versions and viewport sizes were not supplied separately.

T008 is complete. The additional notes confirm UNKNOWN fallback uses account_balance in both themes, sidebar keyboard/touch opening and closing, overlay dismissal, utility accessible names and hidden decorative icons. Earlier evidence covers All Accounts/LOAN and other listed icons, search, themes, touch targets and absence of Font Awesome requests. The unused LIABILITY check remains an explicit user-accepted omission, not an executed pass.

The account-icon question is resolved by the user's observation of aria-hidden="true": the decorative icon should not have an accessible name. Source inspection confirms its parent account header is an existing clickable div, without button semantics or keyboard focus support. This is a separate account-navigation accessibility limitation, not a failed decorative-icon check; no claim of comprehensive accessibility acceptance is made and no application change is included in this review.

T050 is complete based on the user's confirmation that transaction counts display thousands separators. T035 remains complete. All three US1 manual tasks now pass and the manual gate is satisfied. Browser harness execution and the separate Moneybot/installed-extension checks M003–M005 remain unreported. No application tests were rerun for this documentation review, and no later story implementation began. Earlier pending statements above are historical and superseded by this review for the manual checks only.
