# Validation Guide: Transaction and Category Browsing

This is the planned acceptance procedure, not a report of completed implementation. Feature-specific fixtures/harness checks must be added during implementation. Use synthetic source records and shareable fixtures; keep private exports/credentials out of commits and routine logs.

## Baseline and automated checks

### US5 category acceptance

Visual polish checks (desktop and mobile, both themes): pills are centered on mobile only (right-aligned beside Transactions on desktop). Scope text only displays “Matches in category + descendants” during category search; otherwise it is hidden. Scope and navigation messages are centered. In bank and category ledgers, category/account badges match check-number badges in font size, visible height, padding, corner radius and background; mobile buttons retain 44px tap targets. Compare a row with both a check number and category badge, including a long category name, and check for clipping/overflow. Merchant names and amounts remain larger; memos remain unboxed. Category amounts are neutral-colored with original signs preserved; bank-ledger amount colors remain unchanged.

Design experiment (2026-10-04): use the All Time / Year / Month pill buttons. Check centered purple headings such as `Jan 2025 · $100.00`. Month and Year hide Total Balance; All Time shows Living's $322 Total Balance and sticky annual headings with no activity amounts. All three modes hide category running balances on desktop/mobile; bank ledgers remain unchanged. Check each pill by keyboard and at mobile widths in both themes. Source balance references below remain data checks, not category running-balance display expectations.

Restart `npm run serve`, then open **http://127.0.0.1:8080/tests/browser/categories.html**. This preview loads only `tests/fixtures/category-periods-v1.json` through `/tests/browser/categories.json`; no configuration changes or private exports are needed. Use your existing ngrok origin with the same path on Pixel 8. Reload the preview to reset the Accounts list and Month preference.

Run **http://127.0.0.1:8080/tests/browser/** for automated regression checks. Expect three `PASS US5` lines at 1280, 360 and 412px and eventual `ALL PASS`. The US4 harness now expects category counterpart links because US5 enables them. Browser execution is pending until a browser-enabled environment runs this harness.

The category fixture has 115 entries, of which 113 are not future-dated. Its accounts start with $100 opening balances. Those opening balances are deliberately excluded from activity totals. Living contains 105 January purchases of $1 and one January refund of -$5: January activity is $100, across two pages. Its February +$20 and -$20 net to zero. Dining is a child category and contributes only during a search of Living. Checking has one -$1 counterpart; it must never be added to Living's activity sum.

| Selection and filter | December 2024 | January 2025 | February 2025 | January 2099 (when revealed) | 2025 annual activity |
| --- | ---: | ---: | ---: | ---: | ---: |
| Living, no search | $7.00 | $100.00 | $0.00 | $3.00 | $100.00 |
| Living, search `Period` (includes Dining) | $7.00 | $125.00 | -$10.00 | $3.00 | $115.00 |
| Dining, no search | No period | $25.00 | -$10.00 | No period | $15.00 |

Source balance references at the current effective date: Living own running balance **$207**, Living sidebar balance including Dining **$322**, Dining **$115**, Checking **$99**, Future Only **$100**, Empty Income **$100**, Promoted Income **$130**. All Accounts has no overall balance. The All Accounts population remains **113** with future hidden, **115** revealed. These are synthetic reference values, not Moneydance source evidence.

#### T045 — Lists, hierarchy and grouping preference

1. Reload. Accounts is selected and shows All Accounts and Checking, without income/expense categories. The As Of footer remains visible. All Accounts still contains the category rows.
2. Use the icon-only Categories button beneath the sidebar title. Expect Living with expandable Dining, Future Only, Empty Income and Promoted Income. Hidden Parent is absent; its included child Promoted Income is accessible. Switching lists alone must leave the register, search, page and balances unchanged.
3. Use Tab and Enter/Space to operate both switch buttons. Confirm their accessible names, tooltips and selected state. On Pixel 8, confirm readable, tappable controls. In desktop responsive mode at 412px, inspect `#show-accounts` and `#show-categories`: each bounding box must be at least 44 CSS pixels wide and high.
4. Select Living: Month is the initial grouping. Choose Year, then select Dining: Year persists. Switch to Checking: ordinary year dividers remain and the category grouping control disappears. Return to Living: Year persists. Reload: Accounts and Month reset.

#### T046 — Complete activity totals and empty/future states

1. Select Living with no search, Month grouping and future hidden. Expect 109 transactions over two pages. Page 1 starts with February ($0), followed by January ($100). Page 2 repeats January's **$100** with `(continued)`, then December 2024 ($7). All 106 January entries contribute even when only part of that month is on the page.
2. Choose Year: 2025 activity is $100 on both pages, with a continued header on page 2; 2024 is $7. Compare with the monthly reference above. Running balances and the $322 sidebar balance do not become activity totals.
3. Search `Period` in Living: results include Dining, with 111 disclosed entries. Check both Month and Year against the matching reference row. The scope label must say matching category/descendant activity. Clear search: direct totals return.
4. Reveal future transactions: Living has 110 direct rows and a $3 January 2099 period (or $3 annual 2099 period). With `Period` search it has 112 rows. Scope text says future included. Ordinary account/category selection hides future activity again.
5. Search `not-present`: no matching rows and no period headers or invented totals. Clear search and select Empty Income: same explicit empty state.
6. Select Future Only. With future hidden there are no rows/periods, but the reveal bar offers one $9 transaction. Activate it: a $9 period and its row appear. Its $100 sidebar balance still uses the effective date, not future activity.

#### T047 — Navigation, details and regression checks

1. Select Checking, open the category details for `Period opposite side`, then follow Living. Expect Categories selected, Living page 2, and `Period purchase 0` outlined; its source running balance is $108 but is not displayed. Preserve the current All Time/Year/Month preference. Only that legitimate counterpart is targeted.
2. Select All Accounts (switch to Accounts first if needed), search `Period purchase 0`, and use its Living account button. Expect the same grouped destination, cleared search and correct sidebar section.
3. On Living page 2, scroll and open a category-details dialog. Close with Escape or the close button. Expect the same grouping, page, scroll and invoking-button focus. Check both themes; repeat representative controls on Pixel 8, with readable period totals, accessible dialog close and no horizontal page overflow.
4. Compare Checking and All Accounts with the population/balance references above. They retain ordinary year dividers, without category totals or an All Accounts overall balance. Repeat navigation/grouping with Network open: only the initial `/tests/browser/categories.json` request should occur.
5. On the production encrypted viewer, unlock once and repeat representative category selection, grouping and navigation. No new snapshot request, page reload or password prompt should occur. Keep private descriptions and amounts out of the acceptance record.

#### T048 — Full-history performance

On desktop and actual Pixel 8, load your current full-history encrypted export and unlock once. Time opening a large category and switching Month to Year (also check switching back). Measure activation to the completed visible register; each action must take under two seconds. Record tester, date, browser/device, dataset counts/size when available, timings and no-additional-fetch/unlock observations in `acceptance.md`. Synthetic preview timings cannot complete this task.

T045–T048 remain manual gates. Record actual observations and defects/retests before checking them off; Phase 8 follows their completion.

### US4 navigation acceptance

US5 update: category destinations now open grouped category registers. The older read-only Category Example expectation below is superseded: when its related category entry exists, the details path is a navigation button. Use T047 above to verify the new behavior.

Restart `npm run serve` after these changes. Open **http://127.0.0.1:8080/tests/browser/navigation.html** for the plaintext synthetic preview, or **http://127.0.0.1:8080/tests/browser/navigation.html?encrypted=true** for the encrypted preview. The encrypted password is **synthetic-password**. Both use the same dedicated 212-entry fixture; neither reads your demo export nor changes `UI/config.js`. On Pixel 8, use your existing ngrok origin with the same preview path. Browser control was unavailable during implementation; these visual checks remain pending.

Run **http://127.0.0.1:8080/tests/browser/** for T025's full browser harness. Expect three `PASS US4` lines (1280px plaintext, 360px plaintext, 412px encrypted), followed by the other story/regression checks and `ALL PASS`. Record the result separately from your manual walkthrough. The generated navigation fixtures are already included; to regenerate just these synthetic files, run `node scripts/build-navigation-fixture.mjs` (fresh encryption salt/IV, same public password/data).

#### T042 — Exact and transfer destinations

Use both themes on desktop and repeat representative navigation on your phone. Blue outlines identify related rows; the initially focused row has a thicker outline. Future rows retain their yellow background.

1. In **All Accounts**, search **Exact needle**. Click the **Transfer Savings** account label beneath the result. Expect cleared search, Transfer Savings **page 2 of 3**, and Exact needle scrolled into view, focused and outlined. Amount is **$10.00**, running balance **$410.00**. Only this row is outlined. There are **205** disclosed rows and a future summary for **2 transactions / $20.00**. The current account balance remains **$2,050.00**.
2. Select **Navigation Checking**, open **Mixed transfer** using its **Split** button, then activate any **Transfer Savings** allocation. Expect the dialog and mobile sidebar closed, cleared search, **page 1 of 3**, **207** disclosed rows and all three legitimate counterparts identified. The first focused target is the **second** future row, **Future counterpart**, with running balance **$2,060.00**. The similar first future row has **$2,070.00** and must not be outlined. Both future rows retain future styling.
3. On that first page, find the two **Shared transfer** rows. Only the one with running balance **$1,410.00** is outlined; the unrelated look-alike with **$1,420.00** is not. Choose **Next**: **Exact needle / $410.00** remains outlined on page 2. Choose **Prev**: the two related outlines on page 1 remain. This transfer has exactly three related entries across the pages.
4. Select Transfer Savings normally in the sidebar. Expect outlines cleared and future rows hidden again. Follow Mixed transfer again, then start a search: old outlines clear. Clear the search before selecting Navigation Checking. Open **Past transfer** and follow Transfer Savings: expect **page 2**, future rows hidden, and exactly **Savings row 31 / $320.00** and **Savings row 30 / $310.00** outlined, with row 31 focused first. This also checks that a new navigation replaces prior highlights.
5. In All Accounts, search **Category needle** and activate **Navigation Expense**. Expect its exact row highlighted, with search cleared. Category register presentation remains unchanged in US4. In Navigation Checking, **Category example** details show a readable category path without a transfer action.

#### T043 — Unavailable, rapid actions, phone and encrypted session

1. In Navigation Checking, open **Unavailable transfers**. **Empty Reserve** says its related entry is unavailable; **Archived Reserve** says the account is unavailable. Neither path is a navigation button. Both known allocation amounts remain **-$10.00**, totaling **-$20.00**. Close: the current register remains usable and unchanged.
2. In All Accounts, search **Shared transfer**. Rapidly activate the two Transfer Savings result buttons, if both remain visible long enough. The last activated row must be the only exact target outlined. Also follow a transfer and promptly select Navigation Checking: the older destination must not replace that selection. A desktop CPU slowdown in DevTools can make this easier to observe; restore it afterward. Do not manufacture a pass if the intermediate state is too brief to trigger: record that observation; deterministic delayed-response permutations are covered by automated tests.
3. Open details and immediately close them, then activate another navigation control. Expect no old details to reopen or replace the destination. The browser harness also exercises navigation with a details request pending and superseded locate/page replies.
4. Repeat the Exact needle and Mixed transfer flows on Pixel 8. Expect readable controls, reachable 44px touch targets, closed overlays after navigation and the requested row visible without horizontal page scrolling.
5. Open the encrypted preview and unlock with **synthetic-password**. With DevTools Network open, filter for **navigation.enc**; there should be only the initial request. Repeat search, exact navigation, transfer navigation and paging. Expect no page reload, additional snapshot request or second unlock prompt. The plaintext preview similarly requests **navigation.json** once. Switching preview modes deliberately reloads a new session; do not count that as an in-session action.

#### T044 — Full-history performance

On the production viewer with your current full-history export, unlock once on desktop and actual Pixel 8. Time (a) following a search-result account label whose transaction lies on a later register page, and (b) following a transfer with a future counterpart. Measure from activation until the highlighted destination is visible; each must take **under two seconds**. Verify no additional snapshot download or unlock. Record device/browser/date, both timings, current dataset size/counts if available, and any defects in `acceptance.md`; keep private descriptions/identities out of the report. If the real export has no future-transfer example, record that gap rather than treating the synthetic case as full-history evidence.

T042–T044 require user-run evidence before US5 begins. Record tester/date/environment, observed results and any defect/retest notes in the US4 section of `acceptance.md`.

### US3 implementation acceptance

Restart `npm run serve`, then open **http://127.0.0.1:8080/tests/browser/details.html**. This uses only the dedicated synthetic fixture and does not change `UI/config.js` or your demo export. Open **http://127.0.0.1:8080/tests/browser/** for the full browser harness, now including US3.

- **T038 source:** follow [US3 source checks](../../scripts/us3-source-checks.md), including actual Moneydance, installed extension, validation and comparison. Keep this evidence distinct from the synthetic viewer cases below.
- **T039 values/empty states:** in Details Checking, search `Payroll` and click/tap Split. Expect seven splits and $2,000 at the top and bottom; empty tags have no label. Search `Repeated`: two separate Dining allocations total -$30; markup-like memo is literal, long tag wraps, and the second split has no memo/tag placeholders. Search `Legacy`: one unavailable amount, an excluded -$42 amount, and Total unavailable. Search `Uncategorized`: explicit empty state and unavailable total. Search `Refund`: +$25 total. Close each and open another to verify recovery. Select Rainy Day Savings: one -$1,000 allocation with only its Rainy tag. This fixture is an independent viewer example, not a copy of the source recipe.
- **T040 interaction/layout:** use both themes on desktop and phone (360/412 CSS pixels). Clear search, select Details Checking, go to page 2 and scroll before opening Payroll. Amounts line up on the right; full text remains readable. Close button and Escape return to the same account/search/page/scroll and category button focus. Search `Many`, open Split and scroll inside the dialog: all 12 splits are reachable while heading/close/total remain visible. Tab stays inside the native dialog; test its accessible name and close control. Open then immediately close a row: a late response must not reopen it. Transfer links are covered by US4 above; grouping waits for US5.
- **T041 performance:** use the existing full-history timing procedure below on desktop and actual Pixel 8. Time many-split details opening; expect under two seconds. Network must show no additional snapshot fetch, and encrypted sessions must not ask for another password. Record browser/device/date/timing; synthetic browser checks alone do not satisfy this task.

T038–T041 passed based on Mike's recorded source, desktop and Pixel results in `acceptance.md` on 2026-09-24/30. These steps remain available for regression checks.

For T054 design review, open [mockups/split-details.html](mockups/split-details.html) directly in a browser and follow the [review steps](mockups/README.md). No viewer server or export is required. This is a synthetic desktop/mobile design proposal, not the implemented US3 dialog. Record approval or revisions before dialog implementation.

From repository root with Node >=20.9.0:

```powershell
npm test
npm run serve
```

Open http://127.0.0.1:8080/tests/browser/ and http://127.0.0.1:8080/?test=true. The existing test dataset and harness are baseline checks; new feature assertions are required before they prove this feature. Normal mode uses the existing configured encrypted snapshot and unlock flow.

The harness balance checks load `/tests/browser/baseline.json`, served from the canonical `tests/fixtures/valid-snapshot-v1.json`. Their expected Checking balance is $1,045.00. The interactive `?test=true` viewer continues using its configured demo file; changing that file must not change harness expectations. After a server-route update, stop the server with Ctrl+C, restart `npm run serve`, and reload `/tests/browser/`; tests start automatically. Do not replace your demo data to resolve a harness fixture mismatch.

## Source validation prerequisite for US3

US3 implementation is blocked until the US2 manual tasks T036 and T037 below pass.

Extend the existing Moneydance synthetic probe/reference procedure in [moneydance-preflight.md](../../scripts/moneydance-preflight.md). Independently record expected selected-row allocations for:

1. Single expense and refund, including category-side sign conventions.
2. Parent with multiple and repeated allocations to the same category.
3. The $5,000 repair funded by $4,000 Home Savings and $1,000 Rainy Day Savings; Rainy Day's -$1,000 entry shows only its own -$1,000 allocation.
4. Transfers with multiple legitimate entries in the destination account.
5. Known unsupported/excluded destination: visible known details, unavailable navigation/amount where appropriate.

Run updated exporter inside Moneydance/Jython 2.7. Compare amounts, memos, paths and exact sums with source; confirm book unchanged and existing balances/deadline behavior. Then validate synthetic output:

```powershell
node scripts/validate-snapshot.mjs UI/data/snapshot.synthetic.json
node scripts/compare-preflight.mjs UI/data/snapshot.synthetic.json UI/data/preflight-reference.private.json
```

The reference file must match the current synthetic book. Existing comparison scripts alone do not prove new allocation semantics until their assertions are extended. For installed-extension regression use existing rebuild/sign/install instructions in [extension-validation.md](../../scripts/extension-validation.md); no new signing identity or delivery protocol is needed.

## Story acceptance

| Story | Actions and expected result                                                                                                                                                                                                                                                                                                                                            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| US1   | At 1280/1440px inspect long descriptions/categories and scroll; date 90px, category 180px, amount/balance 120px each, remaining width assigned to description; single-line ellipses with full hover text and aligned headers. At 360/412px no page overflow or obscured money.                                                                                         |
| US2   | Zero, one and many long/markup-like tags in registers/search; all literal and readable, empty case has no placeholder.                                                                                                                                                                                                                                                 |
| US3   | Open all source-reference cases; inspect repeats, full paths, memos, unavailable values and selected-row sums. Keyboard/Escape/phone close restores account/search/page/scroll/focus.                                                                                                                                                                                  |
| US4   | Follow off-page search rows and transfers with look-alike unrelated rows, future targets and repeated counterpart rows. Correct targets highlighted; first scrolled into view; later pages retain related highlights. Search clears, sidebar/modal closes, no new unlock/download/reload. Unavailable destinations never guess. Rapid changes show latest intent only. |
| US5   | Default Accounts omits categories; icon switch changes only sidebar. Category selection groups direct rows monthly; annual choice persists across category selections. Test refunds, zero-net periods, year boundaries, >100-row periods, descendant search and future disclosure against independent cent totals. Empty results have no fabricated periods.           |

Rerun existing financial, hidden-hierarchy, search, encryption, test-mode, failure and persisted-page lifecycle harness checks. All Accounts population and source balances must remain unchanged. Confirm only one snapshot fetch in browser network tools throughout details/navigation/grouping; test after encrypted unlock as well as plaintext test mode.

## Real-device performance and evidence

With the current full-history dataset on desktop and Pixel 8, measure five representative actions: open a many-allocation detail, navigate to an off-page search row, follow a future transfer target, open a large category, and change month/year grouping. Each must finish within two seconds after activation; no additional snapshot fetch or unlock.

Record browser/version, date, dataset bytes/accounts/entries, all five timings per device, harness results, source comparison evidence and any explicit gaps. Previously accepted iOS limitations remain recorded; this feature does not claim to resolve them. Do not mark unrun source/device checks passed.

## Icon replacement acceptance (US1 addition)

Check top-left branding and All Accounts (`checkbook`), BANK (`account_balance`), CREDIT_CARD (`credit_card`), EXPENSE (`sell`), INCOME (`paid`), LOAN (`payment_arrow_down`) and ASSET (`money_bag`). Check account labels in search as well as the sidebar. Check LIABILITY/fallback icons and all utility controls, including dynamic theme changes. At 1280/1440 and 360/412 widths in both themes, verify alignment, readable money and unchanged touch targets. Confirm controls retain accessible names, decorative icons are not redundantly announced, official local assets load through the server, and network requests/source references no longer depend on Font Awesome.

## Transaction tags — US2 manual acceptance

### T053 — Source correction for split-stored tags

Use the updated repository-root `export_json.py` directly in Moneybot. No extension rebuild is needed to test that script. An already-installed extension still contains its packaged exporter; it receives this correction only after a later rebuild/reinstall.

1. In the real Account Book, rerun the direct export with the password blank. Privately inspect the previously reported transaction's parent-account entry: its `tags` array should now contain the tag shown under `0.tags` in Moneydance Raw Details. Confirm its amount and running balance are unchanged. No full export needs to be shared with the assistant.
2. Export again with a password, load the newly exported file into the viewer and unlock it. Locate the same transaction: expect the same tag text and unchanged money. Reload the viewer to load the fresh export; it intentionally does not replace an already-loaded snapshot in place.
3. In the controlled synthetic book, create or reuse a two-split transaction, using the split editor to place `Example.Travel` on one split and `Example.Meals` on the other. Check Raw Details to ensure the tags are stored on the separate split records. Keep the parent untagged. Export: the parent-account row must have both tags; each category/split row must have only its own tag. Use categories included in the export so both rows can be inspected.
4. Assign the same tag to both splits and export again: the parent should contain it once. Where the book already has a parent-level tag, confirm it is retained. Verify export itself changes no Moneydance records or balances; only your deliberate synthetic setup edits should change the test book.

Record T053 results, date and Moneydance version in `acceptance.md`. Existing UI tests T036/T037 do not need repeating in full; this test covers source-tag location and fresh export verification.

### Setup (no data or configuration edits)

1. Stop any older local server with Ctrl+C and restart `npm run serve` from the repository root. The updated server provides a dedicated tag fixture route.
2. Open http://127.0.0.1:8080/tests/browser/tags.html. It loads the real viewer with synthetic data and selects **Tag Test Checking**. No password is needed. This page does not use or overwrite `UI/data/test-snapshot.json` or change `UI/config.js`.
3. Expect **105 transactions**, an account balance of **$95.00**, and **two pages**. Every transaction is dated June 1, 2025 and has amount **-$1.00**. Rows start from a $200.00 opening balance and decrease by $1.00 each; the first displayed row is the newest. **Empty Savings** has no transactions and a $50.00 balance. These are independently defined fixture values, not totals copied from the UI.
4. For automated checks, open http://127.0.0.1:8080/tests/browser/. The harness starts automatically and should finish with `ALL PASS`, including four new `PASS US2` lines. Record this separately from the manual tasks.

### T036 — Tags, literal text and layout

At desktop widths 1280px and 1440px, inspect these named rows in both themes. Repeat the layout check at 360px and 412px using responsive mode, and on your Pixel 8 via the same ngrok origin with `/tests/browser/tags.html` appended. On mobile, each running balance is beneath the amount.

| Row description | Expected tags                                                                                                     | Expected running balance |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | -----------------------: |
| No tags         | No Tags label, blank badge or tag container                                                                       |                   $95.00 |
| One tag         | `tagonly-orchid`; also retains check number `#007` and memo `memo-103`                                            |                   $96.00 |
| Many tags       | Home, Travel, Work, Reimbursable, Family, Annual, Shared, Review, Paid, Archived — all ten, in that order         |                   $97.00 |
| Long tag        | One tag beginning `LongTag` followed by repeated `abcdefghij`; its entire text wraps without ellipses or clipping |                   $98.00 |
| Markup tag      | Three literal tags: `<img src=x onerror="window.tagExecuted=true">`, `Quotes " & < >`, and `{{notATemplate}}`     |                   $99.00 |

Expect tags on a separate line labeled **Tags:**, distinguishable from description, memo and check number. Long/multiple tags may increase row height but must not overlap money or cause horizontal page scrolling. The Markup tag row must show literal text, with no image or interpreted HTML. Short descriptions, category ellipses and full category hover titles retain US1 behavior.

### T037 — Search, paging and account changes

1. Search **Markup tag**: expect one result with the same three literal tags, amount -$1.00 and running balance $99.00.
2. Replace the query with **memo-103**: expect One tag with `tagonly-orchid`, amount -$1.00 and running balance $96.00. This checks memo matching as well as description matching.
3. Search **tagonly-orchid**: expect zero results. Tags are displayed but are not searchable.
4. Clear search: expect the original rows and tags to return. Click **Next** and scroll to the **Later page** row: expect `later-page-tag`, amount -$1.00 and running balance $199.00. No tags should leak onto neighboring filler rows.
5. Select **Empty Savings**: expect no rows or leftover tags. Select **All Accounts**: expect the tagged rows again. Return to **Tag Test Checking** and confirm tags remain correct.

Record T036 and T037 pass/fail, tester, date, browser/version, widths/device and any failures in `acceptance.md`. Leave failed or unrun checks unchecked. Close the preview when finished; no settings need restoring. US3 cannot start until both manual tasks pass.
