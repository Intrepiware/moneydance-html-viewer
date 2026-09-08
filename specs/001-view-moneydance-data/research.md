# Planning Research

All design choices below are resolved for planning. Runtime verification obligations are explicit acceptance gates, not claims of completed tests. Two research agents independently reviewed Moneydance semantics and browser behavior. No large exports were parsed.

## Source of financial truth

- **Decision**: Extend the exporter to produce versioned account-side register entries, signed integer cents, explicit current/recursive balances, source-generated running balances, and register ordinals. Source financial interpretation stays in Moneydance; browser adaptation handles presentation and search.
- **Rationale**: Legacy exports contain neither complete balance information nor reliable explicit register amounts. `getAllTxns()` returns abstract transaction nodes, so the variable name ptxn does not establish parent-only enumeration. Use per-account transaction retrieval and identify each source node and parent separately. Do not regenerate counterpart entries from already exported account-side entries.
- **Alternatives considered**: Reconstruct from legacy split floats (insufficient opening/order/sign evidence); export exactly the mock UI tree (couples source data to presentation); display no balances (violates confirmed requirements).
- **Evidence**: [TransactionSet](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TransactionSet.html), [SplitTxn](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/SplitTxn.html). Split own-account value differs from parent-currency value. The old script's conversion is not a trustworthy general contract.

## Balance signs, ordering, and effective date

- **Decision**: Use Account user-display sign policy consistently for amounts, starting/current/closing balances, and running balances. Investigate source TxnSet balance computation on a detached per-account set; export its validated ascending register ordinal and values. Never mutate the account book or claim an invented UUID tie-break matches Moneydance.
- **Rationale**: Account exposes user and recursive balances plus `balanceIsNegated`; TxnSet exposes `setHoldBalances`, `recalcBalances`, and `getBalanceAt`. User correction supersedes the export-day cutoff: export a baseline at balanceStartDate (UTC export date minus one day) and later own/recursive balance changes including hidden effects and future activity; omit older checkpoints while preserving full entries. The one-day boundary covers timezones behind UTC; cutoffs before coverage fail explicitly. Select checkpoints at the user-local page-load date in the worker. Preserve transaction running balances and export instant independently.
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
- **Rationale**: Timezone abbreviations and date ordering vary by locale; the user's sample function conveys intent but positional token extraction is fragile. The user decision in analyze.md supersedes timestamp recovery: missing, null, or malformed exportDate rejects the snapshot with a visible error, even with valid financial timelines. effectiveDate still comes from the device at page load.
- **Alternatives considered**: Browser date conversion of transaction integers; using device date to recalculate balances; hiding balance column on mobile unchanged.
- **Evidence**: [Intl.DateTimeFormat.formatToParts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/formatToParts); UI/index.html currently hides running balances on mobile.

## Tooling and dependencies

- **Decision**: Source script remains Jython 2.7-compatible inside the user's Moneydance runtime. Do not run it as standalone Python. Use available Node 20.9.0 built-in tests for pure modules and a small development static server, with browser integration fixtures and real Pixel 8 trials. Keep a pinned tested Handlebars build; no production framework or server service.
- **Rationale**: Node is available; `python` is not on PATH. Moneydance injects the book context and Java classes. Jython 2.7 compatibility is an explicit user requirement. Record the runtime patch/build during preflight; all exporter and Moneydance probe code must use Python 2.7-compatible syntax and libraries available in Moneydance. No Python 3-only features or CPython-only native dependencies.
- **Alternatives considered**: Assume standalone Python execution; introduce a full bundler/framework; treat desktop browser emulation as proof of phone performance.
- **Validation tooling (T001 decision)**: Use Node built-in test/http/fs modules and the planned contract-specific structural/semantic validator for both CLI and worker checks. Still deliver the maintained JSON Schema in T007 as the external contract. Do not add a separate general-purpose schema engine at setup: it would duplicate the mandatory semantic validator for this single contract. Schema-specific automation can be justified in T007 if concrete gaps require it. No new direct/transitive packages are adopted; package-lock.json records the dependency-free setup. Existing UI dependencies remain unchanged until their planned integration review.

## Constitution and research limits

Constitution v1.1.0 now applies. Proposed dependencies require documented need, transitive-footprint review, and reliability/security evidence before adoption. Reconsider any design complexity that a simpler approach can replace without losing accepted behavior. No deadline or medium effort budget is approved. Source API probes, schema fixtures, and device timing are implementation verification, with no unresolved product clarification blocking design.

## Explicit Synthetic Dataset Selection

The user added US1 acceptance scenarios for test=true and a missing-export link. Use a separate same-origin configured v1 synthetic file, selected before fetching. This is an explicit navigation choice, consistent with load-once and the prohibition on silent mock fallback; it requires no new dependency.

## T005 partial evidence: split descriptions

User-reported build 5253 / Jython 2.7.2 diagnostics and the register screenshot establish that the tested split with an empty account-side description displays its parent description. The probe now uses that fallback. Carry this behavior into exporter description normalization in T010; retain split/allocation memos independently for search. Nonempty split-versus-parent description precedence has not been established by this case and must be checked before generalizing. This evidence does not complete T005.

## T006 balance implementation decision

Retain the compact timeline contract. The successful seven-case preflight (155 comparisons, Jython 2.7.2/build 5253) supports source-side integer opening-plus-entry calculations and USD descendant aggregation. Browser-only reconstruction is insufficient because excluded accounts retain metadata but not their own entries; exporting those rows would enlarge scope and payload. Source calculations therefore fold all supported descendant effects into a baseline plus later changes, while the browser independently reconciles own balances from included history. No general historical valuation engine is added. Non-USD descendants affecting an included total must fail explicitly until trustworthy valuation is available. Registers/API values, not the observed desktop sidebar zeros for hidden accounts, are the reference for required hidden contributions. Nonempty split descriptions retain account-side text; empty ones fall back to parent text, as verified. No contract or fixture shape changes are needed.

Real-book refinement: financial validation is scoped to included accounts and their contribution-bearing descendants. Unrelated excluded investment/security subtrees retain metadata without quantity/balance reconciliation. Traversal still visits all descendants, so an active supported account beneath an excluded ancestor remains included. A security contributing to an included parent's total remains a valuation blocker; no USD amounts are fabricated.

## Phase 6 Handlebars pin

The existing browser bundle is pinned to 4.7.9 on jsDelivr instead of `@latest`.
The [official 4.7.9 release](https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.9)
lists security fixes and the project's [security policy](https://github.com/handlebars-lang/handlebars.js/security)
supports the 4.7 series. This preserves the established template engine; it adds no
npm packages or transitive installation footprint. The exact browser bundle was
fetched and its recursive/account and register templates tested with escaped
synthetic text. Full browser acceptance remains in T032. Remote fonts/icons and
the existing CDN delivery arrangement are otherwise unchanged by this pin.
