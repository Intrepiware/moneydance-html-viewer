# Transaction browsing implementation and acceptance

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
