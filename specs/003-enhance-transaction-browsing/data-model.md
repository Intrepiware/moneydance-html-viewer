# Data Model: Transaction and Category Browsing

## Exported snapshot (version 1 retained)

Existing accounts, entries, balances, timelines, dates and identities retain their contracts. Entries already contain tags, accountId, id, transactionId and allocations. No new required export field.

| Allocation field | Rule |
|---|---|
| accountId | Existing source counterpart account identity |
| name | Existing fallback label; full path derives from hierarchy |
| memo | Existing selected-allocation memo; absent text remains absent |
| tags | Planned optional allocation-specific string array; empty means known no tags; absent/null legacy field means unavailable, never copy the entry's combined tags |
| amountCents | Safe integer in selected row's USD/sign convention, or null/unavailable |

For a parent row, use each split's parent amount times owning account sign. For a split row, use its own value times owning sign for its parent allocation. Preserve repeated allocations and array order. Validate exact sum equals entry.amountCents when the nonempty allocation set is complete. Empty allocations mean uncategorized, not an invented zero allocation. Missing/null legacy values remain unavailable; partial sums must not be labeled complete. Unsafe amounts/sums fail financial validation. Source validation must establish supported USD completeness.

An excluded or unavailable destination does not by itself make an allocation amount unavailable. Export the amount whenever it can be established reliably in the selected row's USD units and sign convention. Determine navigation availability separately; a known amount remains displayable even when its destination cannot be opened.

No new counterpart ID is required: navigation intentionally finds all destination entries sharing the parent transaction.

## Worker indexes

Retain accountsById, ancestry and existing entry arrays. Add lookup maps to entry indices, not duplicate financial objects:

- Composite accountId/entryId -> exact entry.
- Composite accountId/transactionId -> all related entries.
- Account ancestry -> full display path excluding the root book name.

Build once on validated load. Excluded retained metadata may supply paths but never enables navigation without included destination entries. Pruned unsupported accounts use available fallback metadata; never fabricate hierarchy.

## Row and details projections

Row DTO retains existing fields and adds tags as an array of strings. Rendering escapes every tag and allocation/path/memo value.

Source-tag correction (2026-09-20): parent rows collect distinct tags from the parent and its child splits; split rows collect parent plus selected-split tags only. Preserve sorted output and do not import sibling-only tags into a split row. Snapshot version 1 and the tags array contract are unchanged.

Details DTO contains selected account/entry identity, selected amount and ordered allocations with path, memo, nullable amount, amount availability and destination availability. Unavailable destination has a reason suitable for display, not a guessed row. Only transfer allocations to supported non-category account destinations offer transfer navigation; category details remain readable. Full source objects never enter errors or routine logs.

T054 amendment: the details DTO also carries each allocation's tags and tag availability. Expose a checked footer total only for complete nonempty allocations; otherwise it is unavailable. T012/T015 must establish source tag mapping: parent-row allocations use the corresponding split's own tags; split-row allocations use the selected split's tags, never sibling tags or a combined parent-row union. Parent-level tags remain entry context. This optional version-1 field requires exporter/schema/validator/fixture updates during US3; T054 only documents the design.

## Navigation target/result

Exact target: accountId + entryId. Transfer target: destinationAccountId + transactionId.

Result: destination account, first target's page, whether future rows must be revealed, all matching entry IDs and first focus ID. Resolve with the same unfiltered direct-register order used for rendering. Related IDs remain highlighted on later pages until another navigation/ordinary selection/search changes context. Pagination alone preserves them. A mixed past/future set reveals future rows if needed to expose all matches.

## Category periods

Grouping is month or year; key is date substring YYYY-MM or YYYY. Eligible entries are direct category rows without search, existing descendant search matches with search. Apply disclosure before totals. Sum each entry once using checked integer cents; no opening balance or added account-side counterpart.

Period metadata: key, label (month includes year), totalCents, matching entry count and continued-from-previous-page flag. Each page segment repeats the complete matching period total. Headers do not count toward the existing transaction page size. Empty results have no periods. Source running balances/sidebar balances remain untouched.

## Viewing state

- sidebarSection: accounts initially, or categories; changing alone does not change register.
- selected account, search, page, includeFuture: existing state.
- categoryGrouping: month initially; retained across category selection for page session.
- navigation highlight IDs/focus ID: transient.
- details selection, trigger and saved scroll: transient; closing preserves register context.
- effectiveDate: existing fixed page-load local date, unchanged.

Ordinary account selection clears navigation focus and hides future transactions as before. Context navigation clears search, chooses appropriate sidebar section, closes details/sidebar and locates target in the same unlocked snapshot. Category destinations use category grouping once US5 is implemented; ordinary accounts retain current grouping.

Two request lanes (view and details) use monotonically increasing request IDs. Query/locate replace the latest view request; details replace latest details request. Selection/navigation/search invalidates details. Close invalidates details without cancelling an unrelated page reply. No generation ID, dataset history, URL state or persistent preference.
