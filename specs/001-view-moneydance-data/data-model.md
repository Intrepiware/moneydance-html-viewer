# Data Model: Real Moneydance Viewing

## Snapshot v1

See [example-export.json](contracts/example-export.json) for a small, synthetic example of this proposed contract, explained in [example-export.md](contracts/example-export.md). It illustrates the current timeline design; it is not output from the existing exporter or evidence of verified Moneydance behavior.

`schemaVersion: 1`, `exportDate` (required valid UTC ISO timestamp; missing, null, or malformed values reject the snapshot), `sourceVersion`, `balanceStartDate` (required YYYY-MM-DD coverage boundary), `accounts` (recursive root), and `entries` (flat array).

effectiveDate is derived view state: capture the device-local YYYY-MM-DD at page load and pass it to the worker. It is not a snapshot field. Missing, null, or malformed exportDate produces INVALID_SNAPSHOT and a visible export-date error; no financial data is rendered. A valid exportDate remains separate from the local page-load cutoff. Reload recalculates balances for the new local date; the cutoff stays fixed within a page session. Reject unversioned historical exports with an actionable re-export message: their missing balances cannot be inferred safely. Preserve historical samples unchanged.

## Account

Fields: `id`, `name`, `type` (source type string), `currency`, `inactive`, `included`, `children`, `balanceTimeline`, `openingBalanceCents`, `closingBalanceCents`.

All identifiers are nonempty unique strings. Traverse all ancestors, even inactive/investment ones. `included` is true only for active supported non-investment USD accounts/categories, false for root, investments, securities, and inactive accounts. An active unsupported non-investment currency/type is a validation error, not a silently hidden account. Excluded accounts retain metadata for ancestry and counterpart lookup; their monetary fields may be null. Included accounts require integer balances.

`balanceTimeline` contains `points` ordered by distinct YYYY-MM-DD, each with `date`, `ownBalanceCents`, and `sidebarBalanceCents`. To minimize export size, emit one baseline point dated `balanceStartDate` with source balances through that date, then only dates after it on which own or recursive balances change, including hidden descendants and all supplied future activity. Omit earlier checkpoints and the former before-first-date fields. The exporter sets balanceStartDate to the export instant's UTC calendar date minus one day, covering the earliest device-local date at export time without sourceTimeZone. Both balanceStartDate and a valid exportDate are required; neither replaces the device-local page-load cutoff. Each included account requires a baseline even when it has no entries. The worker selects the last point on or before page-load effectiveDate; reject a cutoff before balanceStartDate as INVALID_SNAPSHOT with a clear coverage error rather than extrapolating. Historical sidebar-date selection is out of scope. Full entries, opening/closing balances and per-entry running balances remain unchanged.

Source computation must retain recursive source display conventions, including any excluded descendant effects. Do not sum already-recursive child balances or treat security units as USD. Validate the timeline at multiple reference dates; unavailable date-specific source valuation is a financial validation blocker, never permission to extrapolate a frozen balance. Timelines represent only exported knowledge, not future price changes or transactions absent from the snapshot. Synthetic All Accounts has no total.

`openingBalanceCents` precedes the first exported entry; `closingBalanceCents` follows the last, including future activity. Entries span full history. The exporter validates these against the source; the browser validates the recurrence.

## Account Entry

Fields: `id` (source node UUID), `transactionId` (parent transaction UUID), `accountId`, `date` (YYYY-MM-DD), `registerOrder` (nonnegative integer, unique within account), `amountCents`, `runningBalanceCents`, `description`, `memo`, `checkNum`, `clearedStatus`, `tags`, `allocations`.

Identity is `(accountId, id)`, not description/date/amount or parent UUID alone. Transfer counterparts share transactionId but have distinct entry identities. Each source register node becomes one entry; preserve multiple legitimate nodes even when amounts match. Export only included accounts' entries, while retaining their counterparts to excluded accounts as allocation metadata. A source parent/split relationship must not be recursively expanded twice.

`amountCents` and running balances use the same source user-display sign convention for that account, including income categories. `registerOrder` represents authoritative ascending register order; dates must be nondecreasing in that order. Validate opening + successive amounts = successive running balances and closing. Display reverses this order within an account. Global display order is date descending, then accountId, then registerOrder descending, then id, ensuring stable ties without claiming a global economic order.

## Allocation

Fields: `accountId`, `name`, `memo`, optional `amountCents` (integer or null). Amount, when supplied, is explicitly in the entry account's USD/sign convention, not the counterpart security units. Category label is one allocation's name, `Split` for multiple allocations even when names repeat, or `Uncategorized` for none. Preserve all allocation memos for search; no modal in this phase.

## Validation

- Every money value and intermediate sum must be a safe integer within ±9,007,199,254,740,991 cents; reject overflow/nonfinite/fractional values. Use source integer minor units, never floating-point reconstruction.
- Reject duplicate IDs, account cycles, missing included monetary fields, unknown versions, invalid timeline/entry dates, dangling account/allocation references, duplicate register order, and broken recurrence.
- Verify each own timeline checkpoint from opening balance and ordered entries through that date. Recursive timeline checkpoints must reconcile at source at the baseline and each retained changing date, including dates driven only by hidden descendants. Worker lookup uses the user-local page-load date.
- Required exportDate must be a valid UTC ISO timestamp representing a real instant. Missing, null, wrong-type, or malformed values reject the candidate snapshot with INVALID_SNAPSHOT, as do required financial metadata errors.

## Derived View State

Keep a worker-owned immutable entry store, indexes of own-account entry IDs, a globally sorted ID list, ancestry traversal intervals, and normalized search strings per entry. Retain separate fields for text matching to avoid matches that span unrelated field boundaries. Cache only the current result ID set; do not duplicate all entries under every ancestor.

Visible account tree reparents included nodes to their nearest included ancestor (or synthetic All Accounts). Original ancestry remains in the worker for search and validation. Display balances come from exported sidebar values, not the pruned tree.

Loader states: idle → loading → ready/empty or error. Download the configured URL once per page session, then use the in-memory dataset for all queries and paging. Reloading the page creates fresh state and captures a new effectiveDate. No polling, in-page dataset replacement, dataset identity comparison, or previously-seen detection. Query results carry request IDs only; stale results never overwrite newer search/account choices. A failed initial load shows an error; reload is the retry mechanism.

Test mode is page-session source-selection state, not a snapshot field or dataset identity. Real and synthetic snapshots use the identical model and balanceStartDate coverage rules. Keep the synthetic fixture coverage suitable for its documented test dates; do not override the device-local effectiveDate to make a fixture load.
