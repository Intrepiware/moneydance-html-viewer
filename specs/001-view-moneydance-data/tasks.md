# Tasks: View Real Moneydance Data

**Input**: `specs/001-view-moneydance-data/` spec, plan, research, data model, contracts, and quickstart; constitution v1.1.0.  
**Organization**: Shared foundations followed by the four specification stories in priority order.  
**Format**: `- [ ] Tnnn [P?] [USn?] Description with file path`. Paths are repository-relative. `[P]` means independent work within the dependency conditions below, not permission to skip prerequisites.  
**Validation**: Targeted automated checks support the specification's acceptance scenarios. Real Moneydance and Pixel 8 checks remain required; unavailable runtime evidence must be recorded as blocked, never passed.

## Phase 1: Setup

- [X] T001 Document the minimal tooling and dependency decision in specs/001-view-moneydance-data/research.md, justifying any validator and its transitive dependencies with reliability/security/community evidence; initialize package.json and package-lock.json for Node's built-in test runner and only justified, pinned dependencies.
- [X] T002 [P] Implement the private local development server in scripts/serve-ui.mjs using the quickstart routes for UI/, an explicitly supplied snapshot, and tests/browser/; serve UI/data/test-snapshot.json independently of the real snapshot route, return HTTP 404 when either requested snapshot is missing, prevent path traversal and default to loopback binding.
- [X] T003 [P] Create synthetic edge-case snapshots in tests/fixtures/valid-snapshot-v1.json and tests/fixtures/invalid-balance-v1.json using specs/001-view-moneydance-data/contracts/example-export.json as the baseline; add separate fixtures for hidden ancestors, future dates, opening-only accounts, transfers, same-day order, and invalid references without copying private exports; supply a compatible synthetic UI/data/test-snapshot.json for explicit test mode with coverage suitable for documented test dates.

## Phase 2: Foundational (Blocks All Stories)

**Purpose**: Establish verified source semantics and a shared, validated in-memory snapshot before UI story work.

- [X] T004 Create scripts/moneydance-preflight.py as a read-only Jython 2.7 probe for Moneydance 2024.4, checking per-account register ordering, parent/split signs, income display signs, opening balances, and own/recursive balances across past and future dates; collect no private transaction text in reports.
- [X] T005 Run scripts/moneydance-preflight.py inside Moneydance against reference cases including inactive nonzero descendants and included cash sides of investment transfers; record API/version evidence and reconciliation outcomes in specs/001-view-moneydance-data/validation.md, explicitly leaving unresolved source behavior blocked.
- [X] T006 Use T005 evidence to compare source balance checkpoints with the simplest complete-history calculation in specs/001-view-moneydance-data/research.md; retain balanceTimeline only with a concrete fidelity/maintenance justification, and synchronize plan.md, data-model.md, contracts/interfaces.md, and contracts/example-export.json before implementation if the design changes, preserving every confirmed balance requirement; reconcile the T003 test fixtures, including UI/data/test-snapshot.json, whenever the contract changes here or later.
- [X] T007 Define schemas/snapshot-v1.schema.json and tests/contract/snapshot.test.mjs for the resolved contract, covering schema version, recursive metadata, included/excluded account rules, nullable excluded values, date-only dates, required valid UTC export timestamp (reject missing/null/wrong-type/malformed values), integer cents, entries and allocations; reject old unversioned exports without modifying UI/data/moneydance-export-schema.json.
- [X] T008 Implement exact safe-integer USD operations in UI/src/money.mjs and verify parsing, signs, overflow, and sums in tests/unit/money.test.mjs without floating-point balance arithmetic.
- [X] T009 Implement structural and financial validation plus hierarchy/index construction in UI/src/snapshot.mjs and scripts/validate-snapshot.mjs; cover cycles, dangling IDs, duplicate account entries, register order, running-balance recurrence and own checkpoint reconciliation, required baseline/coverage validation, compact-versus-full timeline equivalence on supported dates and unchanged full entries in tests/contract/snapshot.test.mjs, failing rather than substituting zeros or silently omitting records.
- [X] T010 Update export_json.py to emit the validated versioned contract from a stable read of Moneydance data using only Jython 2.7-compatible facilities, preserving full included history, original ancestry, excluded counterpart metadata, source signs/order/running balances and resolved compact dated balances (baseline at balanceStartDate = UTC export date minus one day, then later changes only; no older points or before-first-date fields); write a temporary sibling and replace the target only after success without mutating the book or adding a close hook.
- [X] T011 Validate a fresh Moneydance-produced snapshot with scripts/validate-snapshot.mjs and compare reference source balances/entries with exporter results; record sanitized results and failed-export preservation checks in specs/001-view-moneydance-data/validation.md, keeping private snapshots out of Git.
- [X] T012 Implement the one-load worker foundation in UI/src/snapshot-worker.mjs and UI/src/worker-client.mjs with UI/config.js same-origin snapshotUrl/testSnapshotUrl selected before fetching by exact test=true (otherwise real), cache:no-store, main-thread page-load local effectiveDate, ready/error/dispose messages, request IDs, and HTTP-404 LOAD_FAILED with reason NOT_FOUND for the US1 missing-file link; keep full records/indexes in worker memory and implement no generations, polling, in-page replacement, or dataset identity tracking.

**Checkpoint**: Source semantics and export fidelity have evidence; a validated snapshot can load once and expose metadata to story components. T005/T011 require the actual Moneydance runtime.

## Phase 3: US1 — Check Envelope and Account Balances (P1, MVP)

**Goal**: Quickly inspect accessible accounts and sub-accounts with correct USD sidebar balances in the existing UI.
**Independent test**: Load parent/child reference accounts, including a hidden nonzero child and an active descendant under a hidden ancestor. Compare source-agreed recursive totals at the local page-load date, including reloads on either side of a future transaction date.

- [X] T013 [P] [US1] Add balance/date-cutoff acceptance tests in tests/unit/balances.test.mjs for own versus recursive amounts, opening-only accounts, hidden contributions counted once, active descendants beneath excluded ancestors, and September 5/September 6 reload behavior, baseline-date lookup and rejection before balanceStartDate.
- [X] T014 [P] [US1] Add hierarchy and account-selection browser scenarios in tests/browser/balances.mjs with a tests/browser/index.html harness, checking hidden ancestors are not selectable and All Accounts has no total; cover test=true selecting only the synthetic URL, missing real export propagating LOAD_FAILED with reason NOT_FOUND through the actual worker/client and offering a preserving-parameters test-mode navigation link, and missing/invalid test data never falling back.
- [X] T015 [US1] Implement local-date balance selection and visible hierarchy projection in UI/src/snapshot.mjs, preserving original ancestry for later descendant queries and using source-consistent recursive amounts without treating security units as USD.
- [X] T016 [US1] Integrate worker-ready account metadata into UI/app.js and existing UI/index.html templates, preserving the layout and rendering sidebar/selected-account totals; hide excluded accounts while retaining accessible included descendants and omit net worth/All Accounts totals; show a Test data indicator for explicit test mode and implement the HTTP-404 missing-real-export error/link to reload with test=true, preserving other URL parameters.
- [X] T017 [US1] Verify the balance scenarios on the Pixel 8 and reference Moneydance data, including the synthetic Checking total of $1,045 after September 6, and record outcomes in specs/001-view-moneydance-data/validation.md.

**Implementation status (2026-09-07)**: T013–T017 complete, with T017 accepted on user-reported successful desktop/Pixel 8 tests and sidebar reconciliation with Moneydance. The automated browser harness itself has not been reported as run. See validation.md for evidence and timing limits.

**Checkpoint**: Balance browsing is usable without register or search completion.

## Phase 4: US2 — Review an Account's Full Register (P1)

**Goal**: Display full direct-account history with stable source running balances and both transfer sides in All Accounts.
**Independent test**: Open a reference account with opening balance, same-day entries, splits, transfers and future entries; page through it and switch All Accounts → child → All Accounts without losing rows or changing balances.

- [X] T018 [P] [US2] Add register ordering, account-only scope, All Accounts counterpart uniqueness, page clamping and running-balance invariance tests in tests/unit/register.test.mjs, including more than 100 entries and equal descriptions/amounts.
- [X] T019 [P] [US2] Add full-register browser scenarios in tests/browser/register.mjs for switching accounts, paging, future rows, supplied check numbers, single-allocation category versus Split, Uncategorized for no allocations, and running-balance visibility at Pixel 8 width.
- [X] T020 [US2] Implement unfiltered register queries in UI/src/query.mjs and wire page replies in UI/src/snapshot-worker.mjs, returning at most 100 rows with totalMatches and deterministic date/account/register-order/ID ordering while retaining each entry's source balance.
- [X] T021 [US2] Render register pages and navigation in UI/app.js and UI/index.html with signed USD values, date-only transaction dates, description, memo, supplied check number, account identity and category/Split/Uncategorized label; add the compact running-balance treatment in UI/styles.css without a split modal or major layout redesign.
- [X] T022 [US2] Compare full-register and transfer scenarios with Moneydance and verify the browser harness, recording source ordering and mobile row visibility evidence in specs/001-view-moneydance-data/validation.md.

**Implementation status (2026-09-07)**: T018–T022 complete. The user reports ALL PASS from the browser harness and successful remaining manual register, Moneydance comparison, and Pixel 8 checks. See validation.md for acceptance evidence.

**Checkpoint**: Full-history browsing works independently of search.

## Phase 5: US3 — Find the Last Infrequent Purchase (P2)

**Goal**: Search description, transaction memo, allocation memos and partial amounts across the selected account and included descendants, or All Accounts.
**Independent test**: Exercise matches in each allowed field, descendant and unrelated accounts, signed amounts and repeated allocations; clear search to restore direct-account scope and verify every result retains its originating balance.

- [ ] T023 [P] [US3] Add search semantics tests in tests/unit/search.test.mjs for case-insensitive whole-query substrings within individual fields, allocation-memo deduplication, partial amounts with optional dollar/comma formatting, unsigned either-sign matches, and minus restricting only the amount branch; exclude account/category/check/tags-only matches.
- [ ] T024 [P] [US3] Add browser search scenarios in tests/browser/search.mjs for descendant scope, All Accounts, clear-to-own-register behavior, explicit no results, paging and rapid account/query changes with stale responses.
- [ ] T025 [US3] Implement indexed search in UI/src/query.mjs using original ancestry and included-entry IDs without full descendant-record copies; preserve stable ordering and source running balances and yield during long work so newer requests can be processed.
- [ ] T026 [US3] Integrate the single search field, 100 ms debounce, page reset, request-ID stale-result rejection and no-results state in UI/app.js and UI/src/worker-client.mjs without changing sidebar balances.
- [ ] T027 [US3] Run the search acceptance set and an initial 20-query timing sample on the Pixel 8, recording end-to-end latency including debounce in specs/001-view-moneydance-data/validation.md against the provisional two-second target.

**Checkpoint**: Searching and clearing search satisfy the scoped history and memo requirements.

## Phase 6: US4 — Open a Trustworthy Snapshot (P2)

**Goal**: Distinguish valid, empty and failed loads and show the actual export instant in the toolbar's bottom-left corner.
**Independent test**: Load valid, empty, malformed, incomplete, unknown-version and unavailable snapshots; test timestamps across zones/DST and confirm local-date cutoff remains separate from the export timestamp.

- [ ] T028 [P] [US4] Add timestamp and date-only formatting tests in tests/unit/format.test.mjs covering UTC instants near midnight, daylight-saving transitions, rejection of invalid/null export timestamps and unchanged transaction calendar dates.
- [ ] T029 [P] [US4] Add loader/worker contract scenarios in tests/browser/loading.mjs covering one fetch despite searches/account changes, cross-origin rejection, load/version/validation/query/worker errors (including LOAD_FAILED reason NOT_FOUND for HTTP 404), valid empty data, missing/null/wrong-type/malformed exportDate rejecting otherwise valid data through the complete loader in real and test modes, stale query replies, and reload-only retry.
- [ ] T030 [US4] Implement UI/src/format.mjs using locale-aware Intl formatting with the timezone indicator for a validated export instant and no unavailable-label fallback; avoid splitting localized time strings and avoid timezone conversion of transaction date-only values.
- [ ] T031 [US4] Integrate explicit loading/ready/empty/error states and reload guidance in UI/app.js and UI/index.html, removing automatic mock fallback while preserving US1 explicit test selection and its missing-file navigation link; render the As of label using textContent in the toolbar bottom-left via UI/styles.css and pin the existing Handlebars version instead of @latest while preserving escaped templates.
- [ ] T032 [US4] Verify all documented error codes and worker-failure propagation in UI/src/snapshot-worker.mjs and UI/src/worker-client.mjs, with no stale content, invented zero balances, private-data logs or automatic retry downloads; run tests/browser/loading.mjs and record results in specs/001-view-moneydance-data/validation.md.

**Checkpoint**: The viewer communicates snapshot freshness and failures honestly.

## Phase 7: Polish and Cross-Cutting Validation

- [ ] T033 Run the unit, contract and browser suites plus valid/invalid CLI examples from specs/001-view-moneydance-data/quickstart.md; resolve failures in the implicated files and record actual commands/results in specs/001-view-moneydance-data/validation.md.
- [ ] T034 Measure five initial loads and at least 20 representative searches with the real large snapshot on the Pixel 8, recording timing boundaries, environment, counts and results in specs/001-view-moneydance-data/validation.md without private records; assess the under-ten-second loading target and provisional under-two-second search target, explicitly noting decryption is not implemented or validated in this phase.
- [ ] T035 Review the final dependency tree, memory ownership, responsive UI and read-only behavior against .specify/memory/constitution.md; simplify only where fidelity is preserved, fix demonstrated issues in the implicated files, and document dependency justification and any remaining acceptance blockers in specs/001-view-moneydance-data/validation.md.
- [ ] T036 Update specs/001-view-moneydance-data/quickstart.md and contracts/example-export.md to reflect verified commands and behavior, keeping real-export handling private and explicitly retaining encryption, Azure upload, deployment, close hooks, investment presentation, net worth and transaction entry as deferred work.

## Dependencies and Execution Order

- Setup: T001–T003; T002 and T003 can run alongside T001 in separate files.
- Foundation: T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012. Source evidence gates downstream financial design and acceptance. Do not mark unavailable Moneydance execution complete on the strength of synthetic checks.
- All stories require the foundation. Each story's two test tasks can be written together, then implementation proceeds in listed order and acceptance checks close the story. Confirm tests expose the missing behavior before implementing it.
- US1 and US2 have independently testable acceptance; use their listed order because their integration touches shared UI files. US3 depends on US2's query/paging implementation. US4 can be exercised with its own supplied snapshots after the foundation, but integrate it after US3 to avoid conflicting edits to shared UI/client files.
- Polish follows all four story checkpoints. Failures or unavailable real-device/source evidence remain explicit blockers to feature completion.

```text
Setup → Foundation → US1 (balance MVP) → US2 → US3 → US4 → Polish
                   └────────────────────────────→ US4 isolated checks
```

## Parallel Execution Examples

These are file-independent task pairs once their phase prerequisites are complete; they do not require parallel agents.

- US1: T013 (tests/unit/balances.test.mjs) and T014 (tests/browser/balances.mjs and harness).
- US2: T018 (tests/unit/register.test.mjs) and T019 (tests/browser/register.mjs).
- US3: T023 (tests/unit/search.test.mjs) and T024 (tests/browser/search.mjs).
- US4: T028 (tests/unit/format.test.mjs) and T029 (tests/browser/loading.mjs).
- Keep shared exporter, snapshot, worker, query, app, templates and validation-report edits sequential. Browser scenario modules use the harness established by T014; register all completed modules when running T033.

## Implementation Strategy

1. Complete setup and prove source semantics before committing to the financial representation. T006 is a bounded constitution check, not permission to discard confirmed behavior.
2. Deliver US1 as the first local balance-browsing MVP and validate it independently. This checkpoint is not a claim that the complete feature is finished.
3. Add US2 full registers, US3 search, then US4 freshness/error presentation, retaining working earlier scenarios at each checkpoint.
4. Finish real Moneydance and Pixel 8 acceptance with all four stories. Do not silently trim history or introduce cloud/encryption work to meet timing goals.
5. Keep export_json.py and scripts/moneydance-preflight.py executable in Moneydance's Jython 2.7 runtime throughout. Node tests do not establish Moneydance compatibility.
