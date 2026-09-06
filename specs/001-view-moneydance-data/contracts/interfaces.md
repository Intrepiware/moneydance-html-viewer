# Interface Contracts

A small synthetic [example export](example-export.json) and its [walkthrough](example-export.md) illustrate the planned external contract.

## Exporter → Viewer

The external supplied-data contract is Snapshot v1 as defined in [data-model.md](../data-model.md). JSON encoded UTF-8; integer cents; date-only financial dates; UTC export instant separate from the derived user-local page-load effectiveDate; per-account dated balance timelines support recalculation. No HTTP API or cloud service is introduced.

The exporter performs a stable read of the open account book, validates source references and balances, writes a temporary sibling file, and replaces the target only on success. A failed export must leave the last valid file intact and report a clear error. No shutdown hook in this phase.

Version policy: exact supported major version 1; reject unknown versions and unversioned input with `UNSUPPORTED_VERSION` and a re-export instruction. No silent mock-data fallback. The historical compact schema documents the old export only; implementation creates a separate maintained v1 schema and fixtures rather than pretending old samples conform.

Production selection: a small `UI/config.js` defines a same-origin `snapshotUrl`, defaulting to `./data/snapshot.json`. The supplied snapshot is provisioned manually for this phase. Reject cross-origin URLs; no picker, upload service, or publishing flow is added. Synthetic fixtures are used for shared demonstrations; personal snapshots remain untracked.

## Main Thread → Data Worker

- `load { requestId, url, effectiveDate }`: one load per worker/page session. effectiveDate is captured from the device-local page-load date. Fetch the configured URL once, parse, validate and index in the worker, then query only memory. Page reload is the only reload/retry path; no in-page replacement, polling, or dataset identity tracking.
- `query { requestId, accountId: string|null, text, page, pageSize }`: null denotes All Accounts; page is positive integer; pageSize 100. Empty trimmed text selects direct entries; nonempty text selects descendants; All Accounts selects all included entries in either case.
- `dispose`: terminate worker and release snapshot resources.

## Worker → Main Thread

- `ready { requestId, metadata, accounts, totalCount }`: compact visible tree plus exportDate/effectiveDate; no full entry array crosses the boundary.
- `page { requestId, totalMatches, page, pageSize, rows }`: at most 100 DTO rows with account identity, ISO date, description, memo, check number, category label, amountCents and runningBalanceCents. Out-of-range pages clamp to last valid page, empty results report page 1.
- `error { requestId, code, message }`: user-safe message with no financial content dump. Codes: `LOAD_FAILED`, `UNSUPPORTED_VERSION`, `INVALID_SNAPSHOT`, `INVALID_QUERY`, `WORKER_FAILED`.

UI ignores responses for obsolete request IDs. Chunk long searches so newer queries can supersede work; use a short 100 ms debounce counted within measured search latency. An obsolete page must never flash as current results.

## Rendering and Search

Main thread renders current page using existing Handlebars templates with default escaping. Use textContent for timestamp and errors. Pin the tested Handlebars dependency rather than `@latest`; no framework migration.

Search case-folds and trims the whole query. OR matching across description, transaction memo, each allocation memo, and normalized amount. Do not match category, account name, tags, or check number as extra search fields. Amount matching strips optional `$` and grouping commas only for a valid numeric fragment; canonical target has two decimals and no grouping. Unsigned queries match either sign; negative fragments require negative amount for the amount branch only. Text branches remain independent. Never use eval or treat user query as a regular expression.

The bottom-left sidebar footer shows `As of:` plus `Intl.DateTimeFormat(undefined, {year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',timeZoneName:'short'}).format(exportInstant)`. Use the device timezone, do not split localized text on spaces. Invalid timestamps show `As of: unavailable`. Date-only entries are rendered from their components, not converted across timezones.

All Accounts hides all overall monetary summary elements while keeping counts. Selected-account summary uses the same source timeline recursive value selected for page-load effectiveDate as its sidebar. Mobile rows expose their own running balance through a compact secondary line if the existing desktop balance column remains hidden. Full memo and account identity must be accessible without introducing the deferred split modal.

Dataset identity is not tracked: the viewer never checks whether it has seen these records before. schemaVersion describes file structure compatibility only, not a dataset revision; retain structural validation. Each page load requests the configured URL with cache bypass (fetch cache: no-store), without application-managed ETags, hashes, or revision comparisons.

## Moneydance Runtime Compatibility

export_json.py and any in-Moneydance preflight script must run under **Jython 2.7** using Moneydance's provided context and Java classes. Preserve Python 2.7-compatible syntax, encoding/file handling, and dependencies; do not require Python 3 or CPython-only native packages. Validate actual execution inside Moneydance before accepting exporter changes.
