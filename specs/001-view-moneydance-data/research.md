# Planning Research

All design choices below are resolved for planning. Runtime verification obligations are explicit acceptance gates, not claims of completed tests. Two research agents independently reviewed Moneydance semantics and browser behavior. No large exports were parsed.

## Source of financial truth

- **Decision**: Extend the exporter to produce versioned account-side register entries, signed integer cents, explicit current/recursive balances, source-generated running balances, and register ordinals. Source financial interpretation stays in Moneydance; browser adaptation handles presentation and search.
- **Rationale**: Legacy exports contain neither complete balance information nor reliable explicit register amounts. `getAllTxns()` returns abstract transaction nodes, so the variable name ptxn does not establish parent-only enumeration. Use per-account transaction retrieval and identify each source node and parent separately. Do not regenerate counterpart entries from already exported account-side entries.
- **Alternatives considered**: Reconstruct from legacy split floats (insufficient opening/order/sign evidence); export exactly the mock UI tree (couples source data to presentation); display no balances (violates confirmed requirements).
- **Evidence**: [TransactionSet](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TransactionSet.html), [SplitTxn](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/SplitTxn.html). Split own-account value differs from parent-currency value. The old script's conversion is not a trustworthy general contract.

## Balance signs, ordering, and effective date

- **Decision**: Use Account user-display sign policy consistently for amounts, starting/current/closing balances, and running balances. Investigate source TxnSet balance computation on a detached per-account set; export its validated ascending register ordinal and values. Never mutate the account book or claim an invented UUID tie-break matches Moneydance.
- **Rationale**: Account exposes user and recursive balances plus `balanceIsNegated`; TxnSet exposes `setHoldBalances`, `recalcBalances`, and `getBalanceAt`. User correction supersedes the export-day cutoff: export per-account dated own/recursive balance checkpoints including hidden effects and future activity. Select checkpoints at the user-local page-load date in the worker. Preserve transaction running balances and export instant independently.
- **Alternatives considered**: Browser summing visible rows (wrong after filtering); generic negative-sum split rules (sign/currency ambiguity); date-only sorting without tie evidence (unstable same-day balances).
- **Evidence**: [Account](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/Account.html), [TxnSet](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TxnSet.html), [TxnSortOrder](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TxnSortOrder.html).
- **Verification gate**: API docs are not pinned to Moneydance 2024.4. Before exporter implementation is accepted, compare source values, hidden contributions, and same-day order with that installation. If APIs differ, adapt within the source layer; do not relax the contract. A failure to establish order or reconcile values blocks acceptance/export success.

## Precision and compatibility

- **Decision**: Version 1 uses safe integer cents, recursive account metadata including excluded ancestors, and included-account entries only. Old unversioned files require re-export; leave them untouched. JSON schema plus semantic checks are required.
- **Rationale**: USD scope allows exact integer arithmetic; runtime range checks prevent silently rounded values. Excluded metadata allows active descendants to remain visible and counterpart references to stay resolvable.
- **Alternatives considered**: Float money; accepting legacy files with zero/guessed balances; silently hiding entire excluded subtrees.
- **Evidence**: [Number.isSafeInteger](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) and local exporter/schema inspection.

## UI integration and performance

- **Decision**: Retain vanilla JavaScript, Handlebars, existing HTML/CSS and 100-row pagination. Introduce pure .mjs normalization/query modules and a worker that fetches/parses/indexes and owns the snapshot. Main thread receives only navigation metadata and a page. Use immutable IDs, original ancestry intervals, one global sorted ID sequence, and bounded current-query caching.
- **Rationale**: Current recursive extraction mutates the global list and repeats sorting. Main-thread parsing and repeated cloning of roughly 52 MB would compete with interactions. Worker isolation improves responsiveness, but does not guarantee total timing or low peak memory; one worker retains one dataset for the page session; no replacement dataset is retained.
- **Alternatives considered**: Framework rewrite (unneeded UI churn); loading everything into both threads (extra memory); ancestor copies of all transactions (growth with depth); backend/search service (outside phase).
- **Evidence**: [Using web workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers); local UI/app.js review.

## Date rendering and UX correctness

- **Decision**: Format the UTC export instant with Intl.DateTimeFormat using locale defaults and timeZoneName: short; use textContent and validate explicit Z/offset. Do not split localized strings on spaces. Keep date-only financial dates separate. Surface visible errors, use page reload to retry failed initial loads, show mobile running balances, and remove All Accounts totals everywhere.
- **Rationale**: Timezone abbreviations and date ordering vary by locale; the user's sample function conveys intent but positional token extraction is fragile. Missing export timestamp is recoverable when required financial timelines are valid; effectiveDate comes from the device at page load.
- **Alternatives considered**: Browser date conversion of transaction integers; using device date to recalculate balances; hiding balance column on mobile unchanged.
- **Evidence**: [Intl.DateTimeFormat.formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts); UI/index.html currently hides running balances on mobile.

## Tooling and dependencies

- **Decision**: Source script remains Jython 2.7-compatible inside the user's Moneydance runtime. Do not run it as standalone Python. Use available Node 20.9.0 built-in tests for pure modules and a small development static server, with browser integration fixtures and real Pixel 8 trials. Keep a pinned tested Handlebars build; no production framework or server service.
- **Rationale**: Node is available; `python` is not on PATH. Moneydance injects the book context and Java classes. Jython 2.7 compatibility is an explicit user requirement. Record the runtime patch/build during preflight; all exporter and Moneydance probe code must use Python 2.7-compatible syntax and libraries available in Moneydance. No Python 3-only features or CPython-only native dependencies.
- **Alternatives considered**: Assume standalone Python execution; introduce a full bundler/framework; treat desktop browser emulation as proof of phone performance.
- **Validation tooling**: Introduce a development-only pinned JSON Schema validator compatible with draft 2020-12 for fixtures; production worker performs contract-specific structural/semantic checks. Dependency version/lock selection is implementation setup, not a source-data or product decision.

## Constitution and research limits

Constitution v1.1.0 now applies. Proposed dependencies require documented need, transitive-footprint review, and reliability/security evidence before adoption. Reconsider any design complexity that a simpler approach can replace without losing accepted behavior. No deadline or medium effort budget is approved. Source API probes, schema fixtures, and device timing are implementation verification, with no unresolved product clarification blocking design.
