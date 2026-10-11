# Implementation Plan: Transaction and Category Browsing

**Branch**: `features-ui-improvements-part-01` | **Date**: 2026-09-16 | **Spec**: [spec.md](spec.md)

**Input**: `specs/003-enhance-transaction-browsing/spec.md`. Spec Kit feature identifier: `003-enhance-transaction-browsing`; retain the existing Git branch.

## Summary

Extend the accepted viewer in increasing story complexity: desktop column width, tags, selected-entry allocation details, transaction navigation, then category browsing and period totals. Reuse the loaded snapshot, worker, query engine, Handlebars templates and browser controls. No router, framework, reload or repeated unlock is needed. Replace Font Awesome with Google Material Symbols Outlined assets as part of US1, using the exact mappings in the spec.

The exporter currently emits null allocation amounts. Populate the existing field from verified Moneydance parent/split semantics before accepting US3. Preserve snapshot version 1, balances, Jython 2.7, encrypted delivery and source immutability. Existing transaction/account identities support US4's requirement to reveal all legitimate counterpart rows.

## Technical Context

**Language/Version**: Browser JavaScript ES modules; Node >=20.9.0 tooling; Moneydance Jython 2.7 exporter.

**Primary Dependencies**: Existing Handlebars and browser Worker/DOM/dialog APIs; Google Material Symbols Outlined replaces Font Awesome. Use only required official SVG assets, self-hosted with license/provenance; no new executable packages or transitive dependencies.

**Storage**: One validated in-memory snapshot per page; existing encrypted blob delivery and plaintext synthetic test mode. No additional persistence.

**Testing**: Node unit/contract suites, real-worker browser harness, installed Moneydance synthetic source comparisons, desktop and Pixel 8 manual acceptance.

**Target Platform**: Existing desktop browsers and Pixel 8; preserve iOS behavior without expanding viewport-remediation scope.

**Project Type**: Static personal web viewer with Moneydance exporter/extension integration.

**Performance Goals**: Five representative details/navigation/grouping actions each under two seconds on desktop and Pixel 8; zero additional downloads or unlock prompts.

**Constraints**: Read-only USD; safe-integer cents; full history; fixed page-load effective date; unchanged source balances; no investments, reports, tag search or delivery redesign.

**Scale/Scope**: Reference workload approximately 74,211 entries, 450 accounts and 35,198 KB; measure the current full-history export at acceptance. Five equal-priority stories.

## Constitution Check

| Principle | Before research | After design |
|---|---|---|
| I Financial fidelity | Preserve identities and balances | Exact allocation sums and filtered period totals; source reference checks required |
| II Runtime compatibility | Retain Jython 2.7 | Narrow source change; actual Moneydance validation before accepting affected stories |
| III Privacy | Synthetic fixtures only | No new private logging or persistence; sanitized errors retained |
| IV Simplicity | Reuse UI and load-once lifecycle | No router, history, dataset replacement or speculative Investments framework |
| V Evidence | Separate design from acceptance | Node, browser, source and Pixel evidence explicitly separate |
| VI Dependencies | Prefer platform capabilities | No new packages; official Google icon assets replace Font Awesome, with provenance/license retained |

Both design gates pass with no exceptions. These are architectural checks, not claims that unimplemented behavior has passed. The constitution's earlier-feature deferrals are not permanent prohibitions; the active spec authorizes details and preserves accepted encrypted delivery.

## Project Structure

### Documentation (this feature)

```text
specs/003-enhance-transaction-browsing/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/viewer.md
  quickstart.md
  checklists/requirements.md
```

`tasks.md` is the next workflow output, not created during planning.

### Source Code (repository root)

```text
export_json.py                    # allocation amounts
UI/app.js                        # interaction state/rendering
UI/index.html                    # templates/dialog/sidebar controls
UI/styles.css                    # widths/tags/dialog/period headers
UI/src/snapshot.mjs              # validation and identity/path indexes
UI/src/query.mjs                 # row projection/details/locate/periods
UI/src/snapshot-worker.mjs       # commands
UI/src/worker-client.mjs         # response tracking
UI/data/moneydance-export-schema.json
scripts/                         # probes, validation, fixture/server tooling
tests/unit/
tests/contract/
tests/browser/
tests/fixtures/
tests/runtime/
```

**Structure Decision**: Extend existing modules. Financial selection/aggregation stays in the worker; interaction state stays in the app. Extract helpers only if implementation size warrants them.

## Delivery order and dependencies

1. US1: redistribute desktop description/category space and replace all Font Awesome icons/assets with the specified Google Material icons; check mappings, control accessibility, themes, sticky alignment and mobile layout. Include any necessary static-asset allowlist/MIME updates in the local server.
2. US2: carry existing tags through row DTOs and render escaped wrapping labels.
3. US3: review T054's standalone desktop/mobile [mockup](mockups/split-details.html) and record approval before implementing the dialog. Verify/populate allocation amounts and allocation-specific tags, validate sums, add on-demand details and native dialog with right-aligned amounts and a bottom total. Preserve legacy unknown tags/amounts. Complete installed Moneydance comparisons before accepting supported details. Mockups use synthetic data and remain separate from production UI.
4. US4: identity-based lookup/navigation, related-row highlights, future disclosure and stale-response protection. Transfer links are added to US3's dialog here.
5. US5: separate sidebar lists, session grouping preference and complete filtered period sums before pagination; integrate category destinations with US4.

Cross-cutting acceptance reruns financial/loading/search/lifecycle scenarios and measures devices. See [research](research.md), [model](data-model.md), [contracts](contracts/viewer.md), and [validation](quickstart.md).

## Complexity Tracking

No constitutional exceptions. Two small worker response lanes prevent details requests from accidentally discarding register responses.

