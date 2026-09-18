# Validation Guide: Transaction and Category Browsing

This is the planned acceptance procedure, not a report of completed implementation. Feature-specific fixtures/harness checks must be added during implementation. Use synthetic source records and shareable fixtures; keep private exports/credentials out of commits and routine logs.

## Baseline and automated checks

From repository root with Node >=20.9.0:

```powershell
npm test
npm run serve
```

Open http://127.0.0.1:8080/tests/browser/ and http://127.0.0.1:8080/?test=true. The existing test dataset and harness are baseline checks; new feature assertions are required before they prove this feature. Normal mode uses the existing configured encrypted snapshot and unlock flow.

## Source validation prerequisite for US3

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

| Story | Actions and expected result |
|---|---|
| US1 | At 1280/1440px inspect long descriptions/categories and scroll; category >=25% of combined space, aligned headers. At 360/412px no page overflow or obscured money. |
| US2 | Zero, one and many long/markup-like tags in registers/search; all literal and readable, empty case has no placeholder. |
| US3 | Open all source-reference cases; inspect repeats, full paths, memos, unavailable values and selected-row sums. Keyboard/Escape/phone close restores account/search/page/scroll/focus. |
| US4 | Follow off-page search rows and transfers with look-alike unrelated rows, future targets and repeated counterpart rows. Correct targets highlighted; first scrolled into view; later pages retain related highlights. Search clears, sidebar/modal closes, no new unlock/download/reload. Unavailable destinations never guess. Rapid changes show latest intent only. |
| US5 | Default Accounts omits categories; icon switch changes only sidebar. Category selection groups direct rows monthly; annual choice persists across category selections. Test refunds, zero-net periods, year boundaries, >100-row periods, descendant search and future disclosure against independent cent totals. Empty results have no fabricated periods. |

Rerun existing financial, hidden-hierarchy, search, encryption, test-mode, failure and persisted-page lifecycle harness checks. All Accounts population and source balances must remain unchanged. Confirm only one snapshot fetch in browser network tools throughout details/navigation/grouping; test after encrypted unlock as well as plaintext test mode.

## Real-device performance and evidence

With the current full-history dataset on desktop and Pixel 8, measure five representative actions: open a many-allocation detail, navigate to an off-page search row, follow a future transfer target, open a large category, and change month/year grouping. Each must finish within two seconds after activation; no additional snapshot fetch or unlock.

Record browser/version, date, dataset bytes/accounts/entries, all five timings per device, harness results, source comparison evidence and any explicit gaps. Previously accepted iOS limitations remain recorded; this feature does not claim to resolve them. Do not mark unrun source/device checks passed.

## Icon replacement acceptance (US1 addition)

Check top-left branding and All Accounts (`checkbook`), BANK (`account_balance`), CREDIT_CARD (`credit_card`), EXPENSE (`sell`), INCOME (`paid`), LOAN (`payment_arrow_down`) and ASSET (`money_bag`). Check account labels in search as well as the sidebar. Check LIABILITY/fallback icons and all utility controls, including dynamic theme changes. At 1280/1440 and 360/412 widths in both themes, verify alignment, readable money and unchanged touch targets. Confirm controls retain accessible names, decorative icons are not redundantly announced, official local assets load through the server, and network requests/source references no longer depend on Font Awesome.
