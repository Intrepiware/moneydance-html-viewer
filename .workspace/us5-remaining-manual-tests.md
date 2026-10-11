# Remaining US5 manual tests

Based on the acceptance review of 2026-10-04. This script covers only the remaining T045–T048 checks, not already accepted testing. Record actual results, not just the expected values below. Do not mark a task complete if a step fails or cannot be observed.

## Setup and recording

1. From the project directory, run `npm run serve` (restart an existing server if necessary).
2. On desktop, open `http://127.0.0.1:8080/tests/browser/categories.html` for sections A–C. This is synthetic data; do not substitute your production viewer.
3. On actual Pixel 8, use your existing accessible server/ngrok origin followed by `/tests/browser/categories.html` for section A's touch check. Desktop mobile emulation does not replace this check.
4. Record tester, actual test date, browser/version, device, URL, each step's result and any failure/retest. Earlier entries dated October 3 predate the October 4 amendment; use the actual date for these new results.
5. Copy completed results into `specs/003-enhance-transaction-browsing/acceptance.md`. Keep private descriptions, amounts, passwords and network response bodies out of that record.

## A. T045 — Sidebar controls and unchanged register

Status: ⬜ = not run, ✅ = all expected results observed, ❌ = unexpected result. Add Notes only for failures or blocked steps (leave blocked steps ⬜). A ✅ is sufficient evidence; no written restatement is needed. Record tester/date/browser/device once for the run.

### A1. Accessible names and selected state (desktop)

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A1.1 | Reload the synthetic preview. In DevTools Elements/Accessibility, inspect sidebar buttons `#show-accounts` and `#show-categories` (not the grouping pills). | Both have role **button**, with accessible names **Accounts** and **Categories**, respectively. | ⬜ | |
| A1.2 | Inspect their initial pressed states and visible styling. | Accounts: `aria-pressed="true"`, visually selected. Categories: `aria-pressed="false"`, not visually selected. | ⬜ | |
| A1.3 | Click Categories and inspect both buttons. | Categories becomes pressed and visually selected; Accounts becomes unpressed and not selected. | ⬜ | |
| A1.4 | Click Accounts and inspect both buttons. | Accounts becomes pressed and visually selected; Categories becomes unpressed and not selected. | ⬜ | |

### A2. Mouse and keyboard list switching (desktop)

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A2.1 | Reload. In All Accounts, search `Period`, wait for results, then go to page 2. | All Accounts is showing page 2 of the search results, with no overall Total Balance. | ⬜ | |
| A2.2 | Observe the title, search text, count, page and first visible row. Click Categories, then Accounts. **Do not select a list item.** Compare after each click. | Only the sidebar list and selected icon change. Title, search, count, page and first visible row stay identical; no overall Total Balance appears. | ⬜ | |
| A2.3 | Use Tab/Shift+Tab to focus Categories; press Enter. Focus Accounts; press Space. Compare after each activation. | Both controls work. Only the sidebar list/selected icon change; register title, search, count, page, first visible row and absence of overall balance remain unchanged. | ⬜ | |
| A2.4 | Clear search, select Checking and observe its register/balance. Click Categories, then Accounts without selecting a list item. | Checking's register and displayed balance stay unchanged after each switch. | ⬜ | |

### A3. Touch list switching (actual Pixel 8)

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A3.1 | On actual Pixel 8, open/reload the synthetic preview. Search `Period` in All Accounts, then go to page 2. | All Accounts shows page 2 of the results, with no overall Total Balance. | ⬜ | |
| A3.2 | Observe title, search, count, page and first visible row. Open the sidebar; tap Categories, then Accounts without selecting a list item. Reopen the sidebar if necessary, then close it to compare. | Selected icon follows each tap. Register title, search, count, page and first visible row remain unchanged; no overall Total Balance appears. | ⬜ | |
| A3.3 | Clear search, select Checking and observe its balance. Repeat Categories/Accounts icon-only switching, then close the sidebar. | Checking's register and balance remain unchanged. | ⬜ | |

## B. T046 — Independent totals, search and future/empty states

Use the desktop synthetic preview. Counts refer to the complete matching set, not the current page. Category running balances remain intentionally hidden. Use ⬜ / ✅ / ❌ as in section A; a pass requires no explanatory notes.

### B1. Direct monthly totals and continuation

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B1.1 | Reload; select Categories → Living, clear search, select Month. Leave future hidden. | 109 transactions over two pages. Page 1: Feb 2025 **$0.00**, Jan 2025 **$100.00**. | ⬜ |  |
| B1.2 | Go to page 2. | January repeats **$100.00** with a continued marker, followed by Dec 2024 **$7.00**. | ⬜ |  |
| B1.3 | Inspect Living's sidebar balance and scope message. | Sidebar **$322.00**; no scope message. | ⬜ |  |

Independent reference: January = 105 × $1 minus a $5 refund = $100; February = $20 minus $20 = $0. These activity totals exclude the $100 opening balance and Checking's -$1 counterpart. January's total covers all 106 entries, not just one page.

### B2. Annual totals across the year boundary

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B2.1 | Select Year; go to page 1 if necessary. | 2025 activity **$100.00**. | ⬜ |  |
| B2.2 | Go to page 2. | 2025 repeats **$100.00** with continued marker; 2024 **$7.00**. | ⬜ |  |
| B2.3 | Check count and sidebar balance. | 109 transactions; Living sidebar **$322.00**. | ⬜ |  |

### B3. Descendant search and clearing search

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B3.1 | In Living, search `Period`; wait for results. | 111 transactions; centered **Matches in category + descendants**. | ⬜ |  |
| B3.2 | Select Month; inspect both pages. | Feb 2025 **-$10.00**, Jan 2025 **$125.00** (same total on continuation), Dec 2024 **$7.00**. | ⬜ |  |
| B3.3 | Select Year; inspect both pages. | 2025 **$115.00** (same total on continuation); 2024 **$7.00**. | ⬜ |  |
| B3.4 | Clear search. | 109 transactions; 2025 **$100.00**, 2024 **$7.00**; scope message disappears. | ⬜ |  |
| B3.5 | Select Month. | February **$0.00**, January **$100.00**. | ⬜ |  |

### B4. Future disclosure and reset

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B4.1 | With Living, empty search and Month active, click the future reveal bar. | 110 transactions; Jan 2099 **$3.00**; historical totals unchanged; direct scope message stays hidden. | ⬜ |  |
| B4.2 | Select Year. | 2099 **$3.00**; historical annual totals unchanged. | ⬜ |  |
| B4.3 | Search `Period`. | 112 transactions; 2099 **$3.00**, 2025 **$115.00**, 2024 **$7.00**; **Matches in category + descendants**. | ⬜ |  |
| B4.4 | Select Month; inspect the pages. | Jan 2099 **$3.00**, Feb 2025 **-$10.00**, Jan 2025 **$125.00**, Dec 2024 **$7.00**. | ⬜ |  |
| B4.5 | Clear search; select Dining, then Living. | 109 transactions; no 2099 heading; future reveal bar available again. | ⬜ |  |

No “Future included” scope sentence is expected. That older quickstart wording is obsolete; use counts, headings and the reveal control.

### B5. No results and empty category

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B5.1 | In Living, search `not-present`. | Zero matching transactions; explicit no-results state; no period headings or invented totals. | ⬜ |  |
| B5.2 | Clear search; select Empty Income. | Explicit empty state; no period headings or totals. | ⬜ |  |

### B6. Future-only category

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| B6.1 | Select Future Only with search empty. | No rows or period headings; reveal bar offers one **$9** transaction. | ⬜ |  |
| B6.2 | Activate the reveal bar; check Month and Year. | One transaction; **$9.00** total for the corresponding period in each mode. | ⬜ |  |
| B6.3 | Inspect Future Only's sidebar balance. | Still **$100.00**; future disclosure does not change the effective-date balance. | ⬜ |  |

## C. T047 — Remaining reference comparisons

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| C.1 | Reload synthetic preview; select Checking, search empty and future hidden. | Total Balance **$99.00**; one `Period opposite side` transaction, **-$1.00**; ordinary year dividers without category rollups. | ⬜ |  |
| C.2 | Select All Accounts. | 113 transactions; ordinary year dividers; no overall Total Balance. | ⬜ |  |
| C.3 | Click the future reveal bar. | 115 transactions; still no overall Total Balance. | ⬜ |  |
| C.4 | Select Checking, then All Accounts. | Future disclosure resets; 113 transactions. | ⬜ |  |

Already recorded navigation and desktop/Pixel dialog-restoration checks need not be repeated.

## D. T048 — Production snapshot fetch

Use the production encrypted viewer, not the synthetic preview. Existing timings already pass. Here, record baseline/final request counts in the supplied Notes cells; other passing steps need no notes. Never copy private response contents, passwords or URL tokens.

### D1. Desktop

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| D1.1 | Open production viewer (local setup: `http://127.0.0.1:8080/`). Open DevTools Network, enable recording, clear log; reload once. | Initial encrypted snapshot request is captured. | ⬜ |  |
| D1.2 | Filter by actual snapshot filename (currently `snapshot.enc`), with All request types. Wait for loading; unlock once; count requests. | Viewer unlocks; baseline snapshot request count is available. Keep recording. | ⬜ | Baseline count: __ |
| D1.3 | Open the large category previously timed (2,452 entries in recorded dataset); select Month → Year → Month, waiting for each update. Do not reload. | Each register update completes; no page reload or new password prompt. | ⬜ |  |
| D1.4 | Compare filtered snapshot request count with baseline, including cached requests. | Zero additional snapshot requests; final count equals baseline. | ⬜ | Final count: __ |

### D2. Actual Pixel 8 — accepted omission

Mike accepted the risk of omitting the Pixel 8 remote Network request-count check on 2026-10-10. Earlier production Pixel 8 tests already recorded category/grouping timings under two seconds and no additional unlock prompt. They do not prove that the phone made no additional snapshot request. No USB debugging or remote DevTools steps are required for this acceptance run.

## Recording results

Copy the completed tables into `acceptance.md`, with tester, actual date, browser/version, device and test URL once per run. A ✅ certifies every expected result in that row; do not rewrite it as prose. Explain ❌ results or blocked ⬜ steps in Notes. Record D1's baseline and final request counts. D2 is an accepted omission, not a pass. Do not pre-mark unrun steps.

## What this does not complete

T031 is already complete. Phase 8 tasks T032–T034 remain separate: the full `npm test` run, consolidated performance evidence, and documentation/constitution reconciliation. T033 retains the previously documented unavailable production future-transfer timing; do not fabricate a transaction or claim the synthetic fixture establishes production performance. Completing this script supplies the remaining US5 manual evidence for review; it does not automatically check off Phase 8.
