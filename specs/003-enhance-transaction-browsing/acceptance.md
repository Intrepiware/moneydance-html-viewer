# Transaction browsing implementation and acceptance

## US5 - More Acceptance Tests - 2026-10-10

Tester: Mike
Actual date: 2026-10-10
Desktop browser/version: 1.97.56
Pixel 8 browser/version: 1.97.56
Synthetic preview URL: http://127.0.0.1:8080/tests/browser/categories.html
Production viewer URL (omit private tokens): https://money.mikedevlin.site
The status tables below are Mike's recorded results. A ✅ confirms every expected result in that row.

## A. T045 — Sidebar controls and unchanged register

Status: blank = not run, ✅ = all expected results observed, ❌ = unexpected result. Add Notes only for failures or blocked steps (leave blocked steps blank). A ✅ is sufficient evidence; no written restatement is needed. Record tester/date/browser/device once for the run.

### A1. Accessible names and selected state (desktop)

| Step | Action / Instruction                                                                                                                                        | Expected Result                                                                                                | Status | Notes |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | :----: | ----- |
| A1.1 | Reload the synthetic preview. In DevTools Elements/Accessibility, inspect sidebar buttons `#show-accounts` and `#show-categories` (not the grouping pills). | Both have role **button**, with accessible names **Accounts** and **Categories**, respectively.                |   ✅   |       |
| A1.2 | Inspect their initial pressed states and visible styling.                                                                                                   | Accounts: `aria-pressed="true"`, visually selected. Categories: `aria-pressed="false"`, not visually selected. |   ✅   |       |
| A1.3 | Click Categories and inspect both buttons.                                                                                                                  | Categories becomes pressed and visually selected; Accounts becomes unpressed and not selected.                 |   ✅   |       |
| A1.4 | Click Accounts and inspect both buttons.                                                                                                                    | Accounts becomes pressed and visually selected; Categories becomes unpressed and not selected.                 |   ✅   |       |

### A2. Mouse and keyboard list switching (desktop)

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A2.1 | Reload. In All Accounts, search `Period`, wait for results, then go to page 2. | All Accounts is showing page 2 of the search results, with no overall Total Balance. | ✅ | |
| A2.2 | Observe the title, search text, count, page and first visible row. Click Categories, then Accounts. **Do not select a list item.** Compare after each click. | Only the sidebar list and selected icon change. Title, search, count, page and first visible row stay identical; no overall Total Balance appears. | ✅ | |
| A2.3 | Use Tab/Shift+Tab to focus Categories; press Enter. Focus Accounts; press Space. Compare after each activation. | Both controls work. Only the sidebar list/selected icon change; register title, search, count, page, first visible row and absence of overall balance remain unchanged. | ✅ | |
| A2.4 | Clear search, select Checking and observe its register/balance. Click Categories, then Accounts without selecting a list item. | Checking's register and displayed balance stay unchanged after each switch. | ✅ | |

### A3. Touch list switching (actual Pixel 8)

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A3.1 | On actual Pixel 8, open/reload the synthetic preview. Search `Period` in All Accounts, then go to page 2. | All Accounts shows page 2 of the results, with no overall Total Balance. | ✅ | |
| A3.2 | Observe title, search, count, page and first visible row. Open the sidebar; tap Categories, then Accounts without selecting a list item. Reopen the sidebar if necessary, then close it to compare. | Selected icon follows each tap. Register title, search, count, page and first visible row remain unchanged; no overall Total Balance appears. | ✅ | |
| A3.3 | Clear search, select Checking and observe its balance. Repeat Categories/Accounts icon-only switching, then close the sidebar. | Checking's register and balance remain unchanged. | ✅ | |


## B. T046 — Independent totals, search and future/empty states

Use the desktop synthetic preview. Counts refer to the complete matching set, not the current page. Category running balances remain intentionally hidden. Use ⬜ / ✅ / ❌ as in section A; a pass requires no explanatory notes.

### B1. Direct monthly totals and continuation

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B1.1 | Reload; select Categories → Living, clear search, select Month. Leave future hidden. | 109 transactions over two pages. Page 1: Feb 2025 **$0.00**, Jan 2025 **$100.00**. | ✅ |  |
| B1.2 | Go to page 2. | January repeats **$100.00** with a continued marker, followed by Dec 2024 **$7.00**. | ✅ |  |
| B1.3 | Inspect Living's sidebar balance and scope message. | Sidebar **$322.00**; no scope message. | ✅ |  |

Independent reference: January = 105 × $1 minus a $5 refund = $100; February = $20 minus $20 = $0. These activity totals exclude the $100 opening balance and Checking's -$1 counterpart. January's total covers all 106 entries, not just one page.

### B2. Annual totals across the year boundary

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B2.1 | Select Year; go to page 1 if necessary. | 2025 activity **$100.00**. | ✅ |  |
| B2.2 | Go to page 2. | 2025 repeats **$100.00** with continued marker; 2024 **$7.00**. | ✅ |  |
| B2.3 | Check count and sidebar balance. | 109 transactions; Living sidebar **$322.00**. | ✅ |  |

### B3. Descendant search and clearing search

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B3.1 | In Living, search `Period`; wait for results. | 111 transactions; centered **Matches in category + descendants**. | ✅ |  |
| B3.2 | Select Month; inspect both pages. | Feb 2025 **-$10.00**, Jan 2025 **$125.00** (same total on continuation), Dec 2024 **$7.00**. | ✅ |  |
| B3.3 | Select Year; inspect both pages. | 2025 **$115.00** (same total on continuation); 2024 **$7.00**. | ✅ |  |
| B3.4 | Clear search. | 109 transactions; 2025 **$100.00**, 2024 **$7.00**; scope message disappears. | ✅ |  |
| B3.5 | Select Month. | February **$0.00**, January **$100.00**. | ✅ |  |

### B4. Future disclosure and reset

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B4.1 | With Living, empty search and Month active, click the future reveal bar. | 110 transactions; Jan 2099 **$3.00**; historical totals unchanged; direct scope message stays hidden. | ✅ |  |
| B4.2 | Select Year. | 2099 **$3.00**; historical annual totals unchanged. | ✅ |  |
| B4.3 | Search `Period`. | 112 transactions; 2099 **$3.00**, 2025 **$115.00**, 2024 **$7.00**; **Matches in category + descendants**. | ✅ |  |
| B4.4 | Select Month; inspect the pages. | Jan 2099 **$3.00**, Feb 2025 **-$10.00**, Jan 2025 **$125.00**, Dec 2024 **$7.00**. | ✅ |  |
| B4.5 | Clear search; select Dining, then Living. | 109 transactions; no 2099 heading; future reveal bar available again. | ✅ |  |

No “Future included” scope sentence is expected. That older quickstart wording is obsolete; use counts, headings and the reveal control.

### B5. No results and empty category

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B5.1 | In Living, search `not-present`. | Zero matching transactions; explicit no-results state; no period headings or invented totals. | ✅ |  |
| B5.2 | Clear search; select Empty Income. | Explicit empty state; no period headings or totals. | ✅ |  |

### B6. Future-only category

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B6.1 | Select Future Only with search empty. | No rows or period headings; reveal bar offers one **$9** transaction. | ✅ |  |
| B6.2 | Activate the reveal bar; check Month and Year. | One transaction; **$9.00** total for the corresponding period in each mode. | ✅ |  |
| B6.3 | Inspect Future Only's sidebar balance. | Still **$100.00**; future disclosure does not change the effective-date balance. | ✅ |  |


## C. T047 — Remaining reference comparisons

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| C.1 | Reload synthetic preview; select Checking, search empty and future hidden. | Total Balance **$99.00**; one `Period opposite side` transaction, **-$1.00**; ordinary year dividers without category rollups. | ✅ |  |
| C.2 | Select All Accounts. | 113 transactions; ordinary year dividers; no overall Total Balance. | ✅ |  |
| C.3 | Click the future reveal bar. | 115 transactions; still no overall Total Balance. | ✅ |  |
| C.4 | Select Checking, then All Accounts. | Future disclosure resets; 113 transactions. | ✅ |  |

Already recorded navigation and desktop/Pixel dialog-restoration checks need not be repeated.

## D. T048 — No additional production snapshot fetch

Use the production encrypted viewer, not the synthetic preview. Existing timings already pass. Here, record baseline/final request counts in the supplied Notes cells; other passing steps need no notes. Never copy private response contents, passwords or URL tokens.

### D1. Desktop

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| D1.1 | Open production viewer (local setup: `http://127.0.0.1:8080/`). Open DevTools Network, enable recording, clear log; reload once. | Initial encrypted snapshot request is captured. | ✅ |  |
| D1.2 | Filter by actual snapshot filename (currently `snapshot.enc`), with All request types. Wait for loading; unlock once; count requests. | Viewer unlocks; baseline snapshot request count is available. Keep recording. | ✅ | Baseline count: 1 |
| D1.3 | Open the large category previously timed (2,452 entries in recorded dataset); select Month → Year → Month, waiting for each update. Do not reload. | Each register update completes; no page reload or new password prompt. | ✅ |  |
| D1.4 | Compare filtered snapshot request count with baseline, including cached requests. | Zero additional snapshot requests; final count equals baseline. | ✅ | Final count: 1 |

### D2. Actual Pixel 8 — accepted omission

On 2026-10-10 Mike accepted the risk of omitting the Pixel 8 production snapshot request-count check after remote debugging proved too burdensome. The previously recorded actual Pixel 8 production timings (0.33s category opening; 0.37s Month → Year; 0.34s Year → Month) and absence of another unlock prompt remain valid observations. No claim is made that the phone performed zero extra snapshot requests. Desktop production Network evidence is D1: one `snapshot.enc` request before the actions and one afterward.

**US5 manual gate review (2026-10-10):** A1–A3, B1–B6, C1–C4 and D1 are recorded as passed above. Prior desktop/Pixel navigation, details and production performance evidence covers the other T045–T048 requirements. T045–T048 are complete with D2's explicit accepted omission. T031's browser harness was previously completed. Earlier “pending” summaries in this file describe the implementation-time state and are superseded by this review.



## US5 design experiment — 2026-10-04

Badge consistency follow-up: bank and category ledger badges now share check-number font size, line height, padding, corner radius and theme background, retaining 44px mobile tap targets. Scope text is search-only (“Matches in category + descendants”); scope/navigation text is centered. Updated browser assertions compare badge styles and visible heights at 1280/360/412px in both themes, and cover the revised scope behavior. Manual visual checks are in quickstart.md. These browser/visual checks remain pending; no acceptance gates are marked complete by this change.

Follow-up visual refinements: mobile-only centered pills, tighter category header spacing, shorter/smaller scope text, lighter compact account badges retaining mobile touch targets, and neutral category amounts with signs preserved. Browser assertions cover mobile centering, touch-target size and neutral amount classes; rendered browser verification remains pending.

Implemented All Time / Year / Month pills, centered purple headings (`Jan 2025 · $100.00`), Total Balance only in All Time, annual sticky headings without rollups in All Time, and hidden category running balances on desktop/mobile. Underlying financial data and ordinary bank ledgers remain unchanged. Month remains the initial preference.

Automated evidence: 76 selected tests passed using `node scripts/run-tests.mjs --test-skip-pattern='synthetic budget fixture preserves|synthetic utility authenticates'`. The two data-dependent cases were excluded to avoid accessing private/demo exports. Browser assertions were updated but not executed here; rendered layout, Brave sticky behavior and device acceptance remain pending. No manual gates were marked complete.

## US5 implementation — 2026-10-03

Implemented T026–T030 after the completed US4 gate. Accounts/Categories icon buttons project existing eligible metadata into separate lists without changing the register until selection. Categories use monthly activity totals by default, with a session-only annual preference. Totals use checked cents over the complete disclosed matching set; continued pages repeat the full period total. Direct browsing excludes descendants, while category search includes matching category descendants. Opening balances and ordinary account-side counterparts are never added to activity. Running/sidebar balances and All Accounts population are preserved. Future-only categories keep their reveal control without fabricated periods.

Search and allocation navigation into categories select the Categories list and preserve grouping. Allocation destinations require a related entry with the exact transaction identity. Query grouping travels through the existing worker/client view lane; stale responses cannot replace a later grouping/navigation intent. No exporter/schema changes, new dependencies or persistent preferences were introduced. Sidebar projection is a small pure module for direct hierarchy tests; existing Material icons are reused.

Evidence (agent, Linux sandbox, Node 22.22.1; synthetic inputs only):

- Initial category tests demonstrated missing periods, grouping validation, overflow checks and category-transfer support before implementation. All nine final category tests pass, including hierarchical projection and client stale-response coverage.
- Selected Node unit/contract regression suite: **75 passed, 0 failed**, using `node scripts/run-tests.mjs --test-skip-pattern='synthetic budget fixture preserves|synthetic utility authenticates'`. The two named tests that read user-controlled `UI/data/test-snapshot.json` were excluded. No full `npm test` pass or resolution of the previously recorded demo/canonical-fixture mismatch is claimed.
- Plaintext and encrypted synthetic navigation worker tests also query annual category totals with one fetch and no additional unlock.
- The category preview HTML, modules, JSON fixture and sidebar module returned HTTP 200 with expected MIME types from an ephemeral local server. Module syntax checks passed. These are serving/syntax checks, not rendered-browser evidence.
- Browser cases are wired into `tests/browser/browsing.mjs` at 1280/360/412px in both themes, including list-only switching, 44px controls, hierarchy, continued totals, descendant search, future-only empty/reveal behavior, grouped details restoration, category navigation and session reset. **Not executed:** no installed or connected browser was available; the browser download endpoint required network approval unavailable in this session.
- Spec-Kit prerequisite check passed after normalizing the Bash scripts' CRLF endings to LF. Requirements checklist: 16/16 checked. Existing ignore rules cover private data and generated outputs; this private npm project needs no publishing ignore file. No before/after implementation hooks are registered.

Independent reference values and reproducible manual steps are in [US5 category acceptance](quickstart.md#us5-category-acceptance). T031 remains open for actual browser execution. T045–T048 remain unchecked until Mike records manual and actual Pixel 8 results; Phase 8 has not begun. No previous-story acceptance is claimed to prove these new category behaviors. The documented US4 production future-transfer measurement omission remains visible in T044/T033.

Constitution review: financial totals use safe integer cents and independent references; exporter/runtime compatibility is unaffected; no private exports were read; existing UI/worker structure and icons are reused; unrun browser/device checks remain pending; no new executable dependencies were added.

### US5 user verification (pending)

- T031 browser harness:
- T045 sidebar controls/hierarchy/session preference:
- T046 monthly/yearly activity references and future/empty states:
- T047 category navigation/details/regression behavior:
- T048 desktop and actual Pixel 8 full-history category/grouping timings:

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8  
**Results:**
- Unlocked production dataset
- Navigated to a high-trafficked expense category
- Observed:
  - Pill categorization is centered
  - Controls are readable and tappable
  - Toggling All Time removes all categorization and displays the all-time transaction total at the top. Selecting Year or Month hides the all-time transaction total.
  - Toggling Year shows totals for each year
  - Toggling Month adds breaks for each month displayed in MMM YYYY • $9,999.99 format
  - All group headings remain sticky when page scrolled
  - Running balance no longer visible
  - Expense amounts (positive and negative) have neutral color 
  - "Totals include all pages" text removed
  - Account badges have light compact background; retain large mobile tap targets
  - Confirmed changes in both dark and light mode
  - Clicked page 2; heading changed to "MMM YYYY • $9,999.99 (CONTINUED)"
- Switched back to account subledger. Searched for specific transaction in same high traffic category. 
- Observed:
  - Check number, Category, memo all appear same size and box size/padding
  - amount color remains unchanged 
  - mobile click target remains about the same
  - no clipping/overflow observed
  - running balance still appears on each row
  - merchant names and amounts remain unchanged. memos remain unboxed
- Clicked the link to navigate to the expense list. View flipped from bank register to expenses. "1 related transaction highlighted." message shown centered at the top. Expected transction was outlined.
- Observed:
  - Description, date, and amount match amount of original transaction
- Timings:
  - Unlock: 1.27s
  - Load large category (2,452 txns): 0.33s
  - Switch Month to Year (large category): 0.37s
  - Switch Year to Month: 0.34s
- At no point prompted for additional unlock

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop   
**Results:**
- Unlocked production dataset
- Navigated to a high-trafficked expense category
- Observed:
  - Pill categorization is right-aligned
  - Toggling All Time removes all categorization and displays the all-time transaction total at the top. Selecting Year or Month hides the all-time transaction total.
  - Toggling Year shows totals for each year
  - Toggling Month adds breaks for each month displayed in MMM YYYY • $9,999.99 format
  - Compared the displayed totals to the "Income and Expenses" report in Moneydance; matched perfectly
  - Compared sidebar balance to category total in Moneydance; matched perfectly
  - All group headings remain sticky when page scrolled
  - Running balance no longer visible
  - Expense amounts (positive and negative) have neutral color 
  - "Totals include all pages" text removed
  - Confirmed changes in both dark and light mode
  - Clicked page 2; heading changed to "MMM YYYY • $9,999.99 (CONTINUED)"
- Clicked transaction search box, then tabbed until pills received focus
- Focused on "All Time", clicked enter. View switched to All Time (same as if I had mouse clicked)
- Tabbed once so "Year" focused. Pressed enter. View switched to Year (same as if I had mouse clicked)
- Activated mobile emulator in Dev Tools. Repeated previous two steps, same result.
- Switched back to account subledger. Searched for specific transaction in same high traffic category. 
- Observed:
  - Check number, Category, memo all appear same size and box size/padding
  - amount color remains unchanged 
  - no clipping/overflow observed
  - running balance still appears on each row
  - merchant names and amounts remain unchanged. memos remain unboxed
- Clicked the link to navigate to the expense list. View flipped from bank register to expenses. "1 related transaction highlighted." message shown centered at the top. Expected transction was outlined.
- Observed:
  - Description, date, and amount match amount of original transaction
- Timings:
  - Unlock: 1.52s
  - Load large category (2,452 txns): 0.69s
  - Switch Month to Year (large category): 0.47s
  - Switch Year to Month: 0.48s
- At no point prompted for additional unlock


**Test:** http://127.0.0.1:8080/tests/browser/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop   
**Results:**

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
Synthetic search timings including debounce (ms): 102, 107, 115, 116, 118, 116, 107, 109, 116, 116, 104, 115, 118, 116, 117, 107, 110, 118, 116, 115. Real-data Pixel 8 timing remains a separate check.
PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry
PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection
PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal
PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle
PASS US5 1280px: sections, hierarchy, full totals, continuation, search, future-only, details, navigation, defaults, one fetch
PASS US5 360px: sections, hierarchy, full totals, continuation, search, future-only, details, navigation, defaults, one fetch
PASS US5 412px: sections, hierarchy, full totals, continuation, search, future-only, details, navigation, defaults, one fetch
PASS US4 1280px plaintext: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
PASS US4 360px plaintext: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
PASS US4 412px encrypted: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
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
```

**Test:** http://127.0.0.1:8080/tests/browser/categories.html  
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop   
**Results:**
- After reload, accounts is selected and shows All Accounts and Checking, without income/expense categories. The As Of footer remains visible. All Accounts still contains the category rows.
- Tabbed to expense icon and pressed enter. Expenses view activated.
- Observed expected categories: Living with expandable Dining, Future Only, Empty Income and Promoted Income. Hidden Parent is absent; its included child Promoted Income is accessible
- Entered search, then clicked category in sidebar. Search persisted.
- Tabbed to pill toggle. Activated All Time, Year, and Month through the keyboard.
  - Activated All Time. Accessibility settings confirned; role: button, name: "All Time".
  - Observed similar results for Year and MOnth.
- Moused over accounts sidebar icon. Observed tooltip: "Show accounts"
- Moused over categories sidebar icon. Observed tooltip: "Show income and expense categories."
- Activated mobile emulator in Dev Tools (412px width). Found both show-accounts and show-categories elements. Confirmed both bounding boxes 44px by 44px
- Reloaded page. Navigated to categories, selected Living. Month selected as initial category. Changed grouping to year then selected Dining. Year persisted as grouping. 
- Switched to checking: ordinary year dividers remain and the category grouping control disappears.
- Returned to Living: Year persists.
- Reloaded: Accounts and Month reset.
- Selected Living, changed grouping to "Year"
- Selected Checking, opened the category details for `Period opposite side`, then follow Living. Observed Categories selected, Living page 2, and `Period purchase 0` outlined; its source running balance is not displayed. "Year" persisted as grouping.
- Selected All Accounts, searched `Period purchase 0`, and used its Living account button. Observed the same grouped destination, cleared search and correct sidebar section.
- On Living page 2, scrolled and opened a category-details dialog. Closed with Escape. Observed the same grouping, page, scroll and invoking-button focus. Experience same in light and dark modes.
- Navigated to All Accounts. Observed year grouping, lack of overall total.
- Opened Network tab in Dev Tools. Tried to invoke another categories.json request or unlock request by performing the following:
  - Navigated to All Accounts
  - clicked category link to show modal
  - Navigated to Page 2
  - Showed future transactions
  - Followed navigation to checking account in modal
  - Clicked All Accounts
  - Searched Period Purchase 0
  - followed link to Living category
  - changed grouping to All Time and Year
  - None of above steps invoked another categories.json or unlock request

**Test:** http://127.0.0.1:8080/tests/browser/categories.html  
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8     
**Results:**
- On Living page 2, scrolled and opened a category-details dialog. Closed with close button. Observed the same grouping, page, scroll and invoking-button focus. Experience same in light and dark modes.


## US4 implementation — 2026-10-01

T021–T024 are implemented after the completed US3 gate. Search-result account buttons locate the exact account/entry identity; supported transfer paths locate all destination entries sharing the transaction ID. The lookup uses validated direct-register order, reveals required future rows, selects the first target page and preserves all related highlights across pagination. Ordinary selection/search/new navigation clears highlights; ordinary selection hides future rows again. Unavailable targets preserve the displayed register. Navigation and its follow-up page share the latest view intent, invalidate pending details and close overlays. No exporter, schema, financial amount, balance or dependency changes were needed.

Automated evidence (Codex, Windows, Node 20.9.0; synthetic data only):

- New navigation tests initially failed because locate operations did not exist; worker tests also demonstrated the missing navigation lane behavior before implementation.
- Selected unit/contract regression suite: **63/63 passed**, including balances, validation, register/search, details, worker lifecycle, server routes and encryption. As in US3, excluded `fixtures.test.mjs` and `decrypt-synthetic.test.mjs` because they read user-controlled `UI/data/test-snapshot.json`. No full `npm test` pass is claimed and no private export was read.
- A subsequent shuffled-export-order regression was added; the final focused navigation suite passed **7/7**, including plaintext/encrypted production worker navigation with one fetch and one unlock. App module syntax check passed after the final interaction changes.
- Final module syntax checks and `git diff --check -- UI scripts tests` passed. An ephemeral local server returned HTTP 200 with the expected MIME types for the navigation preview, modules, plaintext JSON and encrypted fixture. This verifies serving, not browser rendering.
- The 212-entry fixture has independent expected balances: Navigation Checking -$75.00; Transfer Savings $2,050.00 before its two $10.00 future rows, $2,070.00 afterward; Navigation Expense $5.00. Three related transfer rows span two pages and exclude identical-looking unrelated rows. Regeneration only writes the explicit synthetic fixture files.
- Browser harness scenarios cover 1280px/360px plaintext and 412px encrypted, both themes, focus/scroll, highlights, future rows, unavailable targets and stale intent. **Not executed:** computer-use inventory returned no apps or browsers. No visual, desktop emulation or actual-phone pass is claimed.

T025 browser execution and manual **T042–T044 remain pending**. Restart the local server, run `/tests/browser/`, and follow the new [US4 walkthrough](quickstart.md#us4-navigation-acceptance) using `/tests/browser/navigation.html` and its encrypted variant (public password `synthetic-password`). Record tester/date/browser/device, observed results, defects and retests below. Full-history navigation timings remain separate from synthetic checks. US5 has not started and remains blocked by the constitutional manual gate.

Constitution review: exact identities and unchanged financial data preserve fidelity; no exporter/runtime changes; no private records read or added to fixtures; existing worker/dialog/Handlebars architecture reused; unrun browser/device checks remain explicit; no new dependencies. Existing ignores cover tooling outputs and private data. `.specify/extensions.yml` registers no implementation hooks.

### US4 user verification (pending)

- T025 browser harness:
- T042 exact/transfer navigation:
- T043 unavailable/rapid/phone/encrypted behavior:
- T044 desktop and actual Pixel 8 full-history timings:

### Results

**Test:** http://127.0.0.1:8080/tests/browser/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop  
**Results:**

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
Synthetic search timings including debounce (ms): 102, 104, 114, 107, 111, 116, 116, 116, 118, 119, 117, 116, 116, 114, 104, 118, 115, 116, 115, 116. Real-data Pixel 8 timing remains a separate check.
PASS loading contracts: plaintext timestamps, empty/version/financial failure, invalid query, reload-only retry
PASS loading DOM: empty/error states, export footer, stale content removal, actual worker failure, cross-origin rejection
PASS lifecycle DOM: repeated persisted hide/show, account/search/paging, one fetch, fixed dates, final disposal
PASS unlock DOM: actual Jython fixture, wrong-password one-fetch retry, submit-time value, cleared password, balances, persisted lifecycle
PASS US4 1280px plaintext: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
PASS US4 360px plaintext: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
PASS US4 412px encrypted: exact/off-page, related/future, highlights, unavailable, latest intent, one fetch/unlock
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
```

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop  
**Results:**

- Clicked category link on the "Category needle" transaction on opening screen. Link provided to Navigation Checking. Clicked the link, was taken to the expected transaction in Navigation Checking. Amount and date matched the clicked transaction.
  - Re-ran test in dark mode and received same result
- Clicked Transfer Savings account, clicked category on "Savings Row 204". Modal showed Navigation Checking category, but link is not provided (?) with the message "Related entry unavailable in this export".
  - I assume this is some kind of incompatibility test, but I'd like clarity on this.
- Navigation is instantaneous.
  - I'm unable to get late actions to interrupt newer ones (delayed transaction-details responses do not disrupt navigation)
  - Navigation does not download the snapshot again or request another unlock

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop

- Application loaded with real encrypted dataset
- Application unlocked successfully
- Found transfer transaction, clicked category
- In modal, link provided for navigation. Clicking the link navigates to the expected account and outlines the expected transaction (amount and date match)

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8

- Application loaded with real encrypted dataset
- Application unlocked successfully
- Found transfer transaction, clicked category
- In modal, link provided for navigation. Clicking the link navigates to the expected account and outlines the expected transaction (amount and date match)
  - Repeated test in dark mode successfully

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop
**Test Script:** T042 Scenario 1 (quickstart.md)
**Result:**

- Found Exact needle transaction:
  - Date: 6/1/2025
  - Amount: $10
- Transfer Savings click navigated to the Transfer Savings account and outlined expected transaction (and ONLY expected transaction):
  - Date: 6/1/2025
  - Description: Exact Needle
  - Category: Navigation Checking
  - Amount: $10
  - Running Balance: $410
- Search cleared when navigation clicked, related transaction found on page 2 of 3
- Current account balance is $2050, and there are 2 future transactions, as expected

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop
**Test Script:** T042 Scenario 2-5 (quickstart.md)

- Opened Navigation Checking, Opened Mixed Transfer using Split button.
- Clicked first Transfer Savings split ($10)
- Three transactions outlined: one future and one 2025 (on pg 1 of 3), the other also a 2025 transaction on pg 2 of 3.
  - 207 transactions displayed (including future transactions)
  - Navigation focused on the second future transaction, which must have corresponded to the one I clicked (I cannot verify). Running balance is $2060 as expected.
  - The other future transaction has running balance of $2070 and not outlined, as expected.
  - Message displayed below "Transactions" heading: 3 related transactions outlined
- Shared transfer row outlined:
  - Date: 6/1/2025
  - Description: Shared transfer
  - Amount: $10
  - Running Balance: $1410
- Other Shared transfer row ($1420 running balance) not outlined
- Exact needle transaction on page 2 outlined:
  - Date: 6/1/2025
  - Description: Exact Needle
  - Amount: $10
  - Balance: $410
- Prev button pressed; page 1 loads with related transactions still outlined
- Selected Transfer savings normally
  - Future transactions collapsed
  - outlining removed from transactions
- Clicked Shared Transfer link ($1410 running balance) to return to Mixed transfer.
  - Row outlined as expected
- Typed a search, outline disappeared as expected
- Cleared search, clicked Navigation Checking
- Clicked Past transfer and followed transfer savings:
  - taken to page 2
  - future rows hidden
  - Savings row 30 & 31 outlined, row 31 focused first
- Navigated to All Accounts
- searched Category Needle, clicked Navigation Expense
  - Category needle outlined in Navigation Expense
  - search cleared
  - category register unchanged
- Clicked Navigation expense in sidebar, observed no navigation offered under transaction
- Navigated to Navigation Checking, opened modal for Category Example
  - Navigation Expense shown without offering a link

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8
**Test Script:** T042 Scenario 1 (quickstart.md)
**Result:**

- Found Exact needle transaction:
  - Date: 6/1/2025
  - Amount: $10
- Transfer Savings click navigated to the Transfer Savings account and outlined expected transaction (and ONLY expected transaction):
  - Date: 6/1/2025
  - Description: Exact Needle
  - Category: Navigation Checking
  - Amount: $10
  - Running Balance: $410
- Search cleared when navigation clicked, related transaction found on page 2 of 3
- Current account balance is $2050, and there are 2 future transactions, as expected

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8
**Test Script:** T042 Scenario 2-5 (quickstart.md)

**NOTES:**

- Results exactly the same as desktop, except the transaction count is not displayed in mobile.
- Controls are readable and easy to tap.
- The details dialog and sidebar close after navigation.
- The destination row is visible without horizontal page scrolling.

**Results:**

- Opened Navigation Checking, Opened Mixed Transfer using Split button.
- Clicked first Transfer Savings split ($10)
- Three transactions outlined: one future and one 2025 (on pg 1 of 3), the other also a 2025 transaction on pg 2 of 3.
  - Navigation focused on the second future transaction, which must have corresponded to the one I clicked (I cannot verify). Running balance is $2060 as expected.
  - The other future transaction has running balance of $2070 and not outlined, as expected.
  - Message displayed below "Transactions" heading: 3 related transactions outlined
- Shared transfer row outlined:
  - Date: 6/1/2025
  - Description: Shared transfer
  - Amount: $10
  - Running Balance: $1410
- Other Shared transfer row ($1420 running balance) not outlined
- Exact needle transaction on page 2 outlined:
  - Date: 6/1/2025
  - Description: Exact Needle
  - Amount: $10
  - Balance: $410
- Prev button pressed; page 1 loads with related transactions still outlined
- Selected Transfer savings normally
  - Future transactions collapsed
  - outlining removed from transactions
- Clicked Shared Transfer link ($1410 running balance) to return to Mixed transfer.
  - Row outlined as expected
- Typed a search, outline disappeared as expected
- Cleared search, clicked Navigation Checking
- Clicked Past transfer and followed transfer savings:
  - taken to page 2
  - future rows hidden
  - Savings row 30 & 31 outlined, row 31 focused first
- Navigated to All Accounts
- searched Category Needle, clicked Navigation Expense
  - Category needle outlined in Navigation Expense
  - search cleared
  - category register unchanged
- Clicked Navigation expense in sidebar, observed no navigation offered under transaction
- Navigated to Navigation Checking, opened modal for Category Example
  - Navigation Expense shown without offering a link

**Test:** http://127.0.0.1:8080/tests/browser/navigation.html
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop
**Test Script:** T043 Scenarios 1-5 (quickstart.md)

- Opened Unavailable Transfers in Navigation Checking. Observed Empty Reserve (-$10) displays message "Related entry unavailable in this export", Archived Reserve (-$10) displays message "Account unavailable in this export"; neither offer a navigation link.
- Closed modal makes the current register remains usable and unchanged
- Searched "shared transfer" under All Accounts. Clicked Transfer Savings link; navigation occurred _way_ faster than a human could have clicked the other link.
- Clicking either transaction navigated to two different but identical transactions (both have date 6/1/2025, description "Shared transfer" and amount $10)
- Rapidly clicked "Transfer Savings" link and Navigation Checking sidebar menu item; both events occurred in the order they were clicked.
- Set DevTools CPU slowdown to 20x. Searched "shared transfer" and clicked the Transfer Savings link. Immediately clicked Navigation Checking before the navigation to Transfer Savings completed. Navigation Checking loaded as expected (since it was the last link clicked)
- DevTools CPU slowdown remains at 20x. Clicked the category link on a transaction, immediately closed a resulting modal. Clicked a navigation option in the sidebar; page navigated to selected account as expected (no old details to reopened or replaced the destination).
- Opened encrypted test snapshot. Disabled CPU throttling, confirmed only one request to navigation.enc in the network tab.
- Ran search, selected accounts in sidebar, clicked navigation. No new requests to navigation.enc detected in the Network Devtools tab. No page relaods or second unlock prompt.
- Opened plaintext preview. Observed single request to navigation.json.
- Ran search, selected accounts in sidebar, clicked navigation. No new requests to navigation.json detected in the Network Devtools tab. No page relaods or second unlock prompt.

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Desktop
**Test Script:** T044 Scenarios (quickstart.md)

- Navigated to a year-old credit card payment. Clicked the category link to display the modal, clicked the account to navigate to the checking account. Navigation occurred in less than one second. Confirmed matching amount, date, and description. Transaction was on page 8 of the target account. Clicked the category on the target transaction, navigated back to the first transaction. Navigation occurred in less than one second.
- Performed search for transaction; located a transfer transaction over a year old. Clicked the account link below the description. Navigation to target transaction took less than one second. Confirmed matching date, description, and amount of target transaction. Target transaction on page 11 of the target account.
- The production dataset does not have transactions with a future counterpart; this test case is untestable.
- Verified no additional snapshot download or unlock.

**Test:** http://127.0.0.1:8080/
**Tester:** Mike  
**Date:** 2026-10-03  
**Browser:** Brave 1.96.61  
**Device:** Pixel 8  
**Test Script:** T044 Scenarios (quickstart.md)

- Navigated to a year-old credit card payment. Clicked the category link to display the modal, clicked the account to navigate to the checking account. Navigation occurred in less than one second. Confirmed matching amount, date, and description. Transaction was on page 4 of the target account. Clicked the category on the target transaction, navigated back to the first transaction. Navigation occurred in less than one second.
- Performed search for transaction; located a transfer transaction over a year old. Clicked the account link below the description. Navigation to target transaction took less than one second. Confirmed matching date, description, and amount of target transaction. Target transaction on page 8 of the target account.
- The production dataset does not have transactions with a future counterpart; this test case is untestable.
- Verified no additional snapshot download or unlock.

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

| Gate        | Status | Evidence required                                                                                                                                                                           |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T016        | Passed | Actual synthetic export validates and all nine reference comparisons pass; see user results above                                                                                           |
| T015 / T038 | Passed | Direct and installed-extension source comparisons, viewer inspection and unchanged source records/balances confirmed by Mike on 2026-09-24                                                  |
| T020 / T039 | Passed | Mike's 2026-09-30 Brave 1.96.59 desktop walkthrough, actual Pixel 8 representative cases and full harness ALL PASS; remaining phone value examples explicitly omitted with desktop evidence |
| T040        | Passed | Mike's 2026-09-30 desktop keyboard/accessibility, both-theme, immediate-close and desktop/phone dismissal/context/focus restoration results                                                 |
| T041        | Passed | Production real-dataset paycheck details open in less than one second on desktop and actual Pixel; no additional download or password prompt observed                                       |

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
