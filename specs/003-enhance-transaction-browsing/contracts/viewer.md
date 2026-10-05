# Viewer Contracts

_Context: This document describes how the Moneydance JSON export, the browser's background data processing, and the visible app must work together for this feature. “Contracts” means the rules those parts agree to follow._

These are planned extensions to the current worker/client/UI interfaces; existing load, unlock, error and disposal contracts remain authoritative.

## Export and validation

_NOTE: This section regards the json export, which may need to be updated US 3: Inspect transaction categories and splits_

_Context: The Python exporter writes this data; the viewer validates it when loading. An “allocation” is one part of the selected transaction row's category/transfer breakdown. This section concerns the contents of the JSON file._

Snapshot schemaVersion remains 1. Existing allocation amountCents accepts safe integers or unavailable values. Newly exported supported USD allocations must carry source-verified signed amounts; complete nonempty allocations must sum exactly to their selected row. Preserve legacy absent/null values as unavailable, not zero. Update schema explanations, fixtures and validator together. Existing entry identities, financial balances and envelope format do not change.

## Worker commands

_Context: The “worker” is background JavaScript running inside the browser, not a server. It holds the already-loaded financial data. The visible UI asks it for rows, split details, or a transaction's location. These messages support tags (US2), details (US3), navigation (US4), and category grouping (US5)._

All commands use existing request IDs and validated primitive arguments. Main thread cannot request another snapshot for these operations.

| Command          | Input                                                                           | Response                                                                                |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| query (extended) | Existing account/search/page/disclosure plus all/month/year grouping for a category | Existing page/summary; tags on rows; month/year period segments and complete totals; all omits period aggregates |
| details (new)    | accountId, entryId                                                              | Selected-row amount, ordered allocation details, full paths, availability               |
| locate (new)     | Exact accountId/entryId OR destinationAccountId/transactionId                   | Destination page, includeFuture, focus entry and all related highlight IDs              |

_Context: The following rules cover requests that cannot be fulfilled. “Nonterminal” means the app can keep working; “terminal” means the existing failure/cleanup behavior applies._

Reject malformed modes/identities; do not resolve by description, date or amount. A missing/excluded target yields a nonterminal unavailable response with no financial payload. Preserve the current displayed register if lookup fails. Actual load/worker failures retain established terminal cleanup.

_Context: Background replies can arrive after the user has clicked something else. A request ID identifies which action a reply belongs to; separate “lanes” track register requests and details requests so they do not accidentally cancel one another._

The worker and client distinguish view (query/locate) and details lanes. Only the latest response in its lane applies. A locate result's subsequent page request must be tied to that same still-current navigation intent; an intervening selection/search/navigation prevents it from rendering or scrolling. Rapid dialog close/reopen cannot reopen stale details. Financial model stays worker-owned; no generation IDs.

_Context: Following a transfer means finding its other side in the destination account. Related rows share the original transaction's identity; matching-looking text or amounts do not establish that relationship._

Transfer lookup returns every destination entry with the source transactionId, regardless of identical-looking unrelated rows. Display order determines initial focus. Supported destination navigation remains available only when destination and exported rows exist.

## UI behavior

US1 category hover amendment: page rows include `categoryTitle`, derived from allocation destination ancestry excluding ROOT, with colon separators. `category` remains the short visible label. Zero/multiple allocations retain `Uncategorized`/`Split` titles. Render titles with normal HTML escaping; do not add paths to search fields or change truncation.

_Context: These are the visible results of clicking and browsing in the app. A “register” is the transaction list; a “modal” is the details dialog; “future disclosure” means showing or hiding future-dated rows. Category period totals are monthly/yearly transaction activity, not account balances._

- Category text activates a button, not a page link. A native modal has an accessible title, visible close, Escape handling, bounded mobile scrolling and restored trigger focus/scroll on dismissal. Unknown values say unavailable; absent memo is distinct from an invented memo.
- US3 delivers read-only detail inspection. US4 adds supported transfer actions and search-result account buttons.
- Modal presentation revision (2026-09-21): never render Memo or Tags labels. Share the register memo's muted color and 0.85rem size, and retain separate lines for memo text and tag pills.
- T054 review revision: align the selected entry amount to the right of its description without a Selected transaction label; omit the matches-selected-transaction footer message. Empty or missing memos/tags omit their labels and placeholders. Keep unknown versus empty tag distinctions in the model, without displaying an empty section. Missing monetary amounts and totals remain explicit.
- T054 amendment: each allocation displays full path, memo, allocation-specific tags and right-aligned signed amount. Keep a bottom total outside the scrolling list. Only a complete nonempty checked sum is labeled as the monetary total; missing amounts or an empty set produce an unavailable total. Allocation tags are an optional version-1 string array: missing/null legacy values mean unavailable; an empty array means no tags. Never substitute combined entry tags. All allocation text is escaped and wraps without truncation. Mockup geometry remains a proposal until review.
- Context navigation clears search, obtains target page, reveals needed future rows, closes modal/mobile sidebar, renders, then scrolls/highlights exact rows. No URL navigation, reload, download or password prompt.
- Tags use escaped text, wrap, show all values and no empty placeholder. No tag matching.
- Accounts/Categories switch uses icon buttons with accessible names, tooltips, selected state, keyboard operation and generous phone targets (at least 44 CSS pixels). Accounts excludes INCOME/EXPENSE; Categories includes those eligible types. Preserve projected hierarchy, active descendants under excluded ancestors and As Of footer.
- Switching list does not select a register. Selecting a category uses month grouping initially; All Time/Year/Month pill choice persists in page memory. Category running balances are hidden; Total Balance appears only in All Time, whose annual dividers omit rollups. Month/year headings are centered purple period labels with middot-separated activity totals. No future Investments or Reports control.
- Category totals visibly describe current scope: direct category activity without search; matching category/descendant activity during search; future included/excluded according to disclosure. Future summary remains available while future rows are hidden.
- Complete period total repeats on continued pages. Ordinary accounts and All Accounts retain existing register behavior and population; no overall balance is added.
- Desktop date is 90px with reduced horizontal padding; category is 180px; amount/balance remain 120px each. Description takes remaining space. Description/category use single-line ellipses with full hover text. Sticky header geometry matches rows; mobile sizing/wrapping is unchanged.

## Acceptance boundaries

_Context: This section describes the evidence needed to call the feature complete. Synthetic data means made-up test records with known expected results. Browser tests, checks inside Moneydance, and measurements on the actual phone prove different things._

Synthetic financial expectations must be independently calculated, not copied from query output. Exercise complete/partial amounts, source signs, repeated allocations, unavailable destinations, later-page/future/multiple targets, stale replies, refunds/zero periods, descendant search and continuation pages. Run existing encryption, failure, lifecycle and search checks. Measure five representative actions on desktop and actual Pixel 8 under two seconds each. Installation/source comparisons and device evidence remain separate from browser emulation.

## Icon assets (FR-017)

_Context: This section covers replacing Font Awesome with the requested Google Material icons. “Assets” are the icon image files served with the app; the exact icon-to-account mappings are in spec.md. This is a visual change, not an export-data change._

Use the spec's exact branding/account mappings consistently in sidebar and register account labels. Replace all Font Awesome template classes, dynamic icon markup and asset links. Utility controls use Material equivalents; decorative images are hidden from assistive technology and actionable buttons retain accessible names. Asset paths come from a trusted static mapping. Serve the required official SVGs locally, including through the development server's explicit asset routes. Preserve colors, touch areas, loading/error cues and theme toggle behavior. Icon selection is presentation-only and does not change the snapshot schema or account eligibility.
