# Research: Transaction and Category Browsing

**Date**: 2026-09-16. Code inspection and design evidence only; implementation/source/device acceptance remains pending.

## Selected-entry allocation amounts

**Decision**: Populate existing snapshot-v1 allocation amounts. For parent rows, each allocation uses the other split's `getParentAmount()` times the selected account display sign. For split rows, the one parent allocation uses the selected split's `getValue()` times the selected account sign. Never include sibling source-account portions.

**Rationale**: Current `export_json.py` emits null for every allocation. Arbitrary split values cannot be reconstructed from the row total. The [Moneydance developer guide](https://test.infinitekind.com/developer) distinguishes parent amounts from oppositely signed `getAmount()`; parent value sums split parent amounts. Existing capture retains account references and selected-side memos.

**Verification dependency**: Confirm methods and signs in installed Moneydance/Jython, including income/expense sign negation, repeats and transfers. Preserve deadline, stability and balance checks. Documentation is not runtime proof. Unsupported monetary contributions remain null; supported USD amounts must not silently pass acceptance as unavailable.

**Alternatives considered**: Equal shares, repeated parent totals and whole-parent details on every split are incorrect. No version bump is needed for a field already allowing integer/null. Legacy null amounts remain readable as unavailable but do not satisfy complete supported-details acceptance.

## Navigation identity

**Decision**: Exact search target uses account ID plus entry ID. Transfer target uses destination account ID plus parent transaction ID and retains every legitimate matching row.

**Rationale**: These identifiers already exist. US4 explicitly requires highlighting all related destination entries, scrolling to the first in destination display order. An allocation counterpart ID could select one split, but is unnecessary for this confirmed behavior.

**Alternatives considered**: Text/date/amount matching is ambiguous; selecting just one match violates US4. Browser links/router/history add complexity without a requested URL or back-stack feature.

## Details and asynchronous replies

**Decision**: Native modal dialog, bounded scroll body, close control, Escape and focus restoration. Fetch details from the existing worker on demand. Separate view and details request tracking; navigation invalidates pending details, dialog close invalidates its responses.

**Rationale**: Row DTOs currently omit tags/details. Copying full breakdowns for every page is unnecessary. The client's single current-request slot would let details requests invalidate pending page replies. Two lanes solve this without generation IDs. Native dialog supplies modal focus/inert behavior; restore the trigger and scroll explicitly. See [MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) and [showModal](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal).

**Alternatives considered**: A modal package adds dependencies; a custom focus trap duplicates native behavior.

## Category projection and totals

**Decision**: Project the eligible hierarchy into Accounts and Categories. Preserve ancestor promotion and eligibility. Group the complete matching entries after future-disclosure filtering, before pagination. Return complete totals with each displayed period segment.

**Rationale**: Existing direct-account browsing/descendant search is retained. Date-only strings provide calendar month/year keys without timezone conversion. Tags remain display-only. Period sums are activity, not balances.

**Alternatives considered**: Page-only totals are incomplete; unfiltered descendant rollups violate clarification; removing categories from All Accounts changes established behavior. Cache only bounded current-query results and measure actual data.

## Scope and dependencies

**Decision**: Keep the existing framework, encrypted delivery and load-once lifecycle. No packages. Grouping preference lasts for the page session; sidebar switch changes only its list until selection.

**Rationale**: Minimum changes satisfy the five stories. Desktop width/tags can precede source-dependent work. Layout can accommodate a future third option without implementing one.

**Alternatives considered**: Persistent preferences, React Router, general navigation frameworks and new scheduling have no present requirement.

## Icon replacement (2026-09-17)

**Decision**: Use Google's current Material Symbols Outlined family for the requested named icons. Vendor only the required official SVG assets and their license/provenance, served locally; replace every Font Awesome use including dynamically rendered theme and account icons. Retain current colors and dimensions unless alignment requires adjustment. Use a static trusted asset mapping, not source-provided HTML. No icon package or transitive dependency is needed.

**Rationale**: This is an explicit user-requested asset replacement. Google maintains the official [Material icon repository](https://github.com/google/material-design-icons); its [Material Symbols guide](https://developers.google.com/fonts/docs/material_symbols) documents the current family and asset options. Small self-hosted SVGs avoid shipping an entire font or adding third-party runtime requests. Record the selected upstream revision and license during implementation. Verify all requested glyphs against official assets before acceptance; do not silently substitute named mappings.

**Alternatives considered**: Keeping Font Awesome violates the request. A whole icon font/package adds unused assets. A remote font stylesheet is unnecessary for a small fixed set.

**Unspecified mappings**: Use `receipt_long` for LIABILITY and `account_balance` as the ordinary-account fallback. Use semantic Material equivalents for utility controls (menu, close, search, light/dark mode, chevrons, empty state). The spec's seven explicit mappings take precedence everywhere, including search-result account icons. These defaults do not add financial types or behavior.
