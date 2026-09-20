# Validation Guide: Transaction and Category Browsing

This is the planned acceptance procedure, not a report of completed implementation. Feature-specific fixtures/harness checks must be added during implementation. Use synthetic source records and shareable fixtures; keep private exports/credentials out of commits and routine logs.

## Baseline and automated checks

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

| Row description | Expected tags | Expected running balance |
|---|---|---:|
| No tags | No Tags label, blank badge or tag container | $95.00 |
| One tag | `tagonly-orchid`; also retains check number `#007` and memo `memo-103` | $96.00 |
| Many tags | Home, Travel, Work, Reimbursable, Family, Annual, Shared, Review, Paid, Archived — all ten, in that order | $97.00 |
| Long tag | One tag beginning `LongTag` followed by repeated `abcdefghij`; its entire text wraps without ellipses or clipping | $98.00 |
| Markup tag | Three literal tags: `<img src=x onerror="window.tagExecuted=true">`, `Quotes " & < >`, and `{{notATemplate}}` | $99.00 |

Expect tags on a separate line labeled **Tags:**, distinguishable from description, memo and check number. Long/multiple tags may increase row height but must not overlap money or cause horizontal page scrolling. The Markup tag row must show literal text, with no image or interpreted HTML. Short descriptions, category ellipses and full category hover titles retain US1 behavior.

### T037 — Search, paging and account changes

1. Search **Markup tag**: expect one result with the same three literal tags, amount -$1.00 and running balance $99.00.
2. Replace the query with **memo-103**: expect One tag with `tagonly-orchid`, amount -$1.00 and running balance $96.00. This checks memo matching as well as description matching.
3. Search **tagonly-orchid**: expect zero results. Tags are displayed but are not searchable.
4. Clear search: expect the original rows and tags to return. Click **Next** and scroll to the **Later page** row: expect `later-page-tag`, amount -$1.00 and running balance $199.00. No tags should leak onto neighboring filler rows.
5. Select **Empty Savings**: expect no rows or leftover tags. Select **All Accounts**: expect the tagged rows again. Return to **Tag Test Checking** and confirm tags remain correct.

Record T036 and T037 pass/fail, tester, date, browser/version, widths/device and any failures in `acceptance.md`. Leave failed or unrun checks unchecked. Close the preview when finished; no settings need restoring. US3 cannot start until both manual tasks pass.
