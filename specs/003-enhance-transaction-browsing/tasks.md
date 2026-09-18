# Tasks: Transaction and Category Browsing

**Input**: [spec.md](spec.md), [plan.md](plan.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/viewer.md](contracts/viewer.md), [quickstart.md](quickstart.md).
**Date**: 2026-09-17. All five stories are P1, ordered by increasing complexity. Icon replacement belongs to US1. No tasks below have been executed by task generation.

**Tests**: Include meaningful financial, browser and source checks required by the specification's acceptance scenarios and SC-001–008. Add behavioral tests before their corresponding implementation; establish expected failures without requiring unrelated baseline tests to fail. Manual/source/device evidence remains separate from automated results.

**Format**: `- [ ] Tnnn [P?] [USn?] Description with paths`. Paths are repository-relative; new files are explicitly named. `[P]` identifies independent work within a phase after its prerequisites, not permission to edit the same file concurrently.

## Phase 1: Setup

**Purpose**: Establish the existing application's baseline without reinitializing it or installing packages.

- [ ] T001 Run `npm test` and the existing `/tests/browser/` harness using `npm run serve`; create `specs/003-enhance-transaction-browsing/acceptance.md` recording baseline results, current source/device evidence as pending, and existing accepted limitations. Preserve any user edits in `UI/index.html` and other working files.

## Phase 2: Foundational verification support

**Purpose**: Shared acceptance wiring only. Exporter and worker changes are story-specific and must not block the simple visual stories.

- [ ] T002 Add a synthetic-only feature harness entry point in new `tests/browser/browsing.mjs` and wire it into `tests/browser/index.html`; establish shared fixture loading/cleanup using existing harness conventions, with no production behavior changes or new dependencies.

**Checkpoint**: Baseline and harness are ready. No new application architecture is needed before US1.

## Phase 3: US1 — Desktop readability and Material icons (P1, MVP)

**Goal**: Wider readable desktop category text and complete icon replacement.
**Independent test**: At 1280/1440px, category width is at least 25% of combined category/description space and sticky headers align. At 360/412px, money remains visible with no page overflow. All required icons and controls work in both themes without Font Awesome requests.

- [ ] T003 [P] [US1] Add US1 browser assertions in `tests/browser/browsing.mjs` for desktop proportions/sticky alignment, mobile overflow, icon mappings, accessible controls and absence of Font Awesome requests; use synthetic rows only.
- [ ] T004 [P] [US1] Vendor only required official Material Symbols Outlined SVGs under new `UI/assets/icons/`, with upstream revision/provenance and license in `UI/assets/icons/README.md` and `UI/assets/icons/LICENSE`; include checkbook, account_balance, credit_card, sell, paid, payment_arrow_down, money_bag, planned liability/fallback and utility symbols. Verify exact requested glyphs; do not silently substitute them.
- [ ] T005 [US1] Serve the explicit icon asset directory and SVG MIME type in `scripts/serve-ui.mjs`, preserving traversal/private-file protections; add positive and forbidden-path checks in `tests/unit/server.test.mjs` after T004.
- [ ] T006 [US1] Replace all static/dynamic Font Awesome markup and links in `UI/index.html` and `UI/app.js`; apply exact spec mappings to branding, All Accounts, sidebar and search-result account labels, plus semantic utility icons and planned liability/fallback defaults. Retain accessible button names and hide decorative icons from assistive technology.
- [ ] T007 [US1] Adjust category/description proportions and local SVG styling in `UI/styles.css`, preserving current colors, themes, touch targets, amount/balance visibility and sticky alignment; remove obsolete Font Awesome styling and run US1 checks.
- [ ] T008 [US1] Perform the US1 width/theme/control walkthrough from `specs/003-enhance-transaction-browsing/quickstart.md` and record results in `specs/003-enhance-transaction-browsing/acceptance.md`, including icon network checks and any unverified device checks.

**Checkpoint**: US1 can be accepted independently; exporter, details and grouping are not required.

## Phase 4: US2 — Transaction tags (P1)

**Goal**: Show every exported tag as readable literal text in registers and search.
**Independent test**: Zero, one, many, long and markup-like tags render correctly without empty placeholders or obscured money; tag-only text does not become searchable.

- [ ] T009 [US2] Add tag projection and unchanged-matching expectations to `tests/unit/register.test.mjs` and `tests/unit/search.test.mjs`, and escaped/wrapping/empty-tag browser cases to `tests/browser/browsing.mjs`.
- [ ] T010 [US2] Add existing entry tags to page row projections in `UI/src/query.mjs` without changing search fields, source entry data or balances.
- [ ] T011 [US2] Render escaped tags in `UI/index.html` and style wrapping labels in `UI/styles.css`; verify registers/search at desktop and 360/412px and record results in `specs/003-enhance-transaction-browsing/acceptance.md`.

**Checkpoint**: US2 is usable with the existing export; it does not depend on allocation changes.

## Phase 5: US3 — Selected-entry allocation details (P1)

**Goal**: Inspect complete source-consistent selected-row details without leaving the register. Transfer links are deferred to US4.
**Independent test**: Compare source-referenced single/repeated/multiple/transfer allocations, paths and memos. Rainy Day's -$1,000 entry shows only its -$1,000 portion of the $5,000 repair. Closing preserves context/focus.

- [ ] T012 [P] [US3] Extend `scripts/moneydance-preflight.py`, `scripts/moneydance-preflight.md` and `tests/fixtures/preflight-reference.example.json` with independently recorded selected-row allocation expectations: parent/split sides, negated income/expense signs, refunds, repeated destinations, $4,000/$1,000 repair funding and excluded counterparts. Keep probes Jython 2.7/read-only and reference output synthetic.
- [ ] T013 [P] [US3] Add new `tests/unit/details.test.mjs`, extend `tests/contract/snapshot.test.mjs`, and add new `tests/fixtures/browsing-allocations-v1.json` covering exact complete sums, unsafe/mismatched sums, empty allocations, legacy/partial null amounts, repeated/full-path details and missing memos; expected values must be independently calculated.
- [ ] T014 [US3] Populate allocation amounts in `export_json.py`: parent rows use each split's parent amount times owning display sign; split rows use their own value times owning sign for the parent allocation. Preserve repeats, selected-row memo semantics, balances, deadlines and source stability; keep unsupported amounts unavailable and snapshot version 1. Extend `tests/runtime/export_deadline_test.py` with relevant allocation capture/regression cases without claiming standalone tests prove Moneydance compatibility.
- [ ] T015 [US3] Extend allocation comparisons in `scripts/compare-preflight.mjs`; run the changed exporter/probe in actual Moneydance with the synthetic book and validate/compare output. Rebuild using `scripts/package-extension.ps1` and verify the installed extension's exported allocations using `scripts/build-extension.md`. Record method availability, signed sums, unchanged source/balances and deadline/delivery regression evidence in `specs/003-enhance-transaction-browsing/acceptance.md`; leave pending if user-run checks are unavailable.
- [ ] T016 [US3] Enforce checked complete nonempty allocation sums in `UI/src/snapshot.mjs`, retaining legacy null/absent support and rejecting unsafe financial values; update descriptions in `UI/data/moneydance-export-schema.json` and synthetic fixtures generated by `scripts/build-fixtures.mjs` as needed without inventing unavailable amounts or changing schemaVersion.
- [ ] T017 [US3] Add composite entry lookup and ancestry-derived paths in `UI/src/snapshot.mjs`, then selected-entry details projection in `UI/src/query.mjs`; preserve allocation order/repeats, omit root book name, distinguish unavailable amounts/destinations and uncategorized state, and never copy unrelated sibling allocations.
- [ ] T018 [US3] Add validated details messages and independent view/details request tracking in `UI/src/snapshot-worker.mjs` and `UI/src/worker-client.mjs`; cover pending-page versus details requests, latest-only replies, close invalidation and nonterminal unavailable responses in `tests/unit/worker.test.mjs`. Retain one loaded model, sanitized errors and existing terminal cleanup.
- [ ] T019 [US3] Add category activation and native details dialog in `UI/index.html`, `UI/app.js` and `UI/styles.css`; escape content, show full paths/amounts/memos and explicit unavailable values, provide bounded scrolling/accessible close/Escape, and restore account/search/page/grouping/scroll/focus without a reload.
- [ ] T020 [US3] Complete details lifecycle/browser coverage in `tests/browser/browsing.mjs`, using an explicitly allowed synthetic fixture route in `scripts/serve-ui.mjs` if required; run desktop/phone dismissal and long-content checks and record results in `specs/003-enhance-transaction-browsing/acceptance.md`.

**Checkpoint**: US3 requires T015's installed-source evidence as well as viewer checks. UI development can proceed with known synthetic fixtures while that evidence is pending, but US3 cannot be reported source-validated until it exists.

## Phase 6: US4 — Navigate to related register entries (P1)

**Goal**: Follow search-result account labels and transfer destinations within the existing unlocked session.
**Independent test**: Correct off-page/future/multiple counterpart targets appear; unrelated look-alikes never match. No reload, snapshot fetch or password prompt; rapid actions cannot show stale destinations.

- [ ] T021 [US4] Add new `tests/unit/navigation.test.mjs` and navigation cases in `tests/browser/browsing.mjs` covering exact identity, same-looking unrelated rows, repeated destination rows across pages, mixed past/future targets, missing/excluded destinations and rapid intent changes.
- [ ] T022 [US4] Build account/transaction-to-entry-index lookup in `UI/src/snapshot.mjs`; implement exact and transfer locate operations in `UI/src/query.mjs`, using unfiltered direct-register display order, all legitimate related IDs, first target page and required future disclosure without adding export fields.
- [ ] T023 [US4] Integrate locate messages into the view lane in `UI/src/snapshot-worker.mjs` and `UI/src/worker-client.mjs`; tie follow-up page replies to still-current navigation intent and add invalid/stale/worker-failure cases in `tests/unit/worker.test.mjs`, preserving the current register on unavailable targets.
- [ ] T024 [US4] Wire search-result account buttons and supported non-category transfer actions in `UI/index.html` and `UI/app.js`; clear search, close modal/mobile sidebar, select destination/page, reveal future targets, scroll/focus and highlight related rows using `UI/styles.css`. Preserve highlights across pagination; clear them on ordinary selection/search/new navigation, and restore ordinary selection's future-hiding behavior.
- [ ] T025 [US4] Run navigation acceptance in encrypted and plaintext test modes through `tests/browser/browsing.mjs`, including pending-dialog replies and one-fetch/no-reunlock assertions; record desktop/mobile walkthrough results in `specs/003-enhance-transaction-browsing/acceptance.md`.

**Checkpoint**: US4 completes transfer navigation previously deferred from US3. Category destinations still use existing register presentation until US5 adds grouping.

## Phase 7: US5 — Category navigation and period activity (P1)

**Goal**: Separate sidebar categories and display complete monthly/yearly activity totals.
**Independent test**: Direct category browsing and descendant search produce independently calculated totals across pages, refunds, year boundaries, zero-net periods and future visibility changes; ordinary accounts/All Accounts remain unchanged.

- [ ] T026 [P] [US5] Add new `tests/unit/categories.test.mjs` and new `tests/fixtures/category-periods-v1.json` with independent monthly/yearly expected sums, >100-row periods, direct versus descendant scope, refunds/zero-net periods, year boundaries, future disclosure and overflow; confirm opening balances and opposite-side account entries are not added.
- [ ] T027 [P] [US5] Add category interaction scenarios in `tests/browser/browsing.mjs` for list-only switching, hierarchy/ancestor promotion, As Of footer, grouping preference, continuation headers, empty state, filtered-scope labels and navigation into categories; wire the synthetic fixture through `scripts/serve-ui.mjs` when needed.
- [ ] T028 [US5] Extend `UI/src/query.mjs` and query messaging in `UI/src/snapshot-worker.mjs` with validated category month/year grouping; aggregate complete matching disclosed sets using checked cents before pagination, retain current same-day ordering, and return full period totals/continuation metadata without counting headers as entries.
- [ ] T029 [US5] Project eligible Accounts/Categories lists in `UI/app.js` using existing hierarchy metadata; add icon-only named/tooled/keyboard-operable switch controls and >=44px touch targets in `UI/index.html` and `UI/styles.css`. Default to Accounts, preserve footer/ancestor promotion, and leave register selection unchanged when switching lists. Add no Investments/Reports placeholder.
- [ ] T030 [US5] Render category month/year controls, scoped activity labels, complete/continued period headers and explicit empty states in `UI/index.html`, `UI/app.js` and `UI/styles.css`; retain grouping across category selection only for the page session, preserve running/sidebar balances and future summary/reset behavior, and use the correct sidebar section/grouping when US4 navigates to a category.
- [ ] T031 [US5] Run category unit/browser scenarios and manually compare totals against independent references; verify unchanged All Accounts population, no overall balance, ordinary-register behavior and modal grouping/scroll restoration; record evidence in `specs/003-enhance-transaction-browsing/acceptance.md`.

**Checkpoint**: All five stories are implemented and individually verifiable, subject to source/device evidence remaining open.

## Phase 8: Cross-cutting acceptance and documentation

- [ ] T032 Run `npm test` and the complete `/tests/browser/` harness, including existing balances, hidden hierarchy, search, unlock, test-mode, failure and persisted-page lifecycle scenarios; record outcomes in `specs/003-enhance-transaction-browsing/acceptance.md` and fix regressions in their owning modules before acceptance.
- [ ] T033 Measure the five actions specified by `specs/003-enhance-transaction-browsing/quickstart.md` on desktop and actual Pixel 8 with current full history: many-split details, off-page navigation, future transfer, large category, month/year toggle. Record all timings, browser/date/data size and one-fetch/no-reunlock evidence in `specs/003-enhance-transaction-browsing/acceptance.md`; each action must be under two seconds. Optimize only demonstrated failures without dropping data; record unrun checks as pending.
- [ ] T034 Reconcile actual commands, icon provenance, source comparison instructions and acceptance gaps in `specs/003-enhance-transaction-browsing/quickstart.md`, `specs/003-enhance-transaction-browsing/acceptance.md` and `scripts/moneydance-preflight.md`; review all six constitutional principles and mark only evidenced tasks complete in `specs/003-enhance-transaction-browsing/tasks.md`. Preserve existing accepted iOS limitations without claiming remediation.

## Dependencies and execution order

```text
Phase 1 -> Phase 2 -> US1 -> US2 -> US3 -> US4 -> US5 -> Phase 8
                                  source evidence ^
```

The chain is the requested delivery order, not a claim that tags technically require icon changes. US1 and US2 have no financial-source dependency. US3 owns the export and details primitives; US4 depends on those identities/details and adds links; US5 integrates category presentation with US4. Shared UI/query files make sequential story implementation the default.

Within US3, T012 and T013 can proceed independently; T014 follows their reference/test definition. T015 follows T014 and requires actual Moneydance evidence. T016–T020 can proceed on independently known synthetic values while T015 is pending, but cannot substitute for it. T017 follows validation design in T016; T018 and T019 follow details projection. Within US1, T003 and T004 can proceed together; serving/replacement depend on assets. Within US5, T026 and T027 precede implementation.

## Parallel examples per story

- **US1**: T003 browser expectations and T004 official asset collection touch different files; integrate both before T005–T008.
- **US2**: Keep tasks sequential: projection and rendering share the same row contract and are small; no forced parallel split.
- **US3**: T012 source probe/reference work and T013 viewer financial-contract tests are independent. A pending user-run T015 does not prevent synthetic viewer development, but remains an acceptance gate.
- **US4**: Keep implementation sequential through T021–T025; locate results, worker ordering and UI focus are closely coupled.
- **US5**: T026 aggregate fixtures/unit tests and T027 browser interactions can be authored independently before T028–T031.

These examples identify optional work scheduling, not a requirement to launch agents. Never run two edits to the same file concurrently.

## Requirement coverage

| Requirements | Primary tasks |
|---|---|
| FR-001–002, FR-006, FR-015 / SC-001 | T012–T020; grouping restoration T031 |
| FR-003–005 / SC-002 | T021–T025 |
| FR-007 / SC-003 | T009–T011 |
| FR-008–011 / SC-004 | T026–T031 |
| FR-012, FR-017 / SC-005, SC-008 | T003–T008 |
| FR-013–014 / SC-007 | Story regression checks plus T032 |
| FR-016 / scope and dependency limits | Story boundaries plus T034 |
| SC-006 / actual-device performance | T033 |

## Implementation strategy

Deliver Phase 3 (US1: width and icons) as the first independently useful increment after the lightweight setup. Add tags, then details with source verification, then navigation, then categories. At each checkpoint run that story's focused checks and preserve preceding behavior. Do not expand into reports, investments, tag search, routing/history, new scheduling or iOS remediation. Task generation itself neither changes application code nor establishes acceptance.
