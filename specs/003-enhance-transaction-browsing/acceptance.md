# US1 implementation and acceptance

## T001 harness failure and fixture isolation fix

The user ran the harness and reported: the real worker/client selection checks passed, then `FAIL: Checking source recursive total`. The balance harness loaded the editable `UI/data/test-snapshot.json` while asserting the canonical synthetic fixture's $1,045.00 Checking total. The local demo file differs from that fixture, as already recorded below.

Fixed `tests/browser/balances.mjs` to use `/tests/browser/baseline.json`, an explicit server route to `tests/fixtures/valid-snapshot-v1.json`, including its no-fallback scenarios. The user's demo data is preserved. Server regression coverage verifies the baseline route stays independent when demo data changes, while direct fixture-directory access remains blocked.

Validation: four server/balance unit tests passed; browser-module syntax check passed. The user subsequently reran the full browser harness and reported ALL PASS, resolving the reported failure. T001 and T007 are now complete.

## Latest browser acceptance result — user-reported ALL PASS

The supplied output confirms successful worker/client selection and no-fallback checks; real app balances ($1,045 Checking), hidden hierarchy, register paging/future dates/escaping, search and stale replies, loading/error contracts, persisted lifecycle, and encrypted unlock with the Jython fixture. All US1 checks passed at 1280px, 1440px, 360px and 412px, covering both themes, columns, money visibility, icons and controls. The harness finished with `ALL PASS`.

The 20 synthetic search timings, including debounce, ranged from 103 to 118 ms. These are synthetic browser timings, not full-history Pixel 8 performance evidence. Browser/version and run date were not supplied with this report. This evidence is user-executed, not an agent browser run.

This result supersedes earlier pending browser-harness statements below. Together with the recorded manual checks, it completes the requested US1 work. It does not claim a fresh full `npm test` pass or complete the separate Moneybot/installed-extension checks M003–M005. No application changes or further test runs were needed to reconcile this report.

Date: 2026-09-19. Scope explicitly limited to User Story 1 and Material icons
after the prior implementation was rolled back. The working tree began clean.

## Changes

- Desktop date is 90px with 15px horizontal padding; category is 180px;
  amount/balance remain 120px each. Description receives all remaining space.
  Description/category use single-line ellipses and full text on hover. This
  user-requested revision replaces the earlier proportional/wrapping layout
  and applies only above 768px.
- All Font Awesome markup and its stylesheet dependency are replaced with the
  specified Google Material Symbols, including utilities and theme changes.
  Decorative symbols are hidden from assistive technology; icon buttons have names.
- Account-label icons use existing `App.nodes` metadata. No query, worker,
  financial validation, exporter, extension, fixture or schema changes.
- Sixteen official SVGs are served locally, with pinned provenance and Apache
  license in `UI/assets/icons/`. No packages added. Existing ignore rules cover
  applicable dependencies, private data and build outputs; no additional tooling
  or ignore changes were needed.

## Evidence

- Baseline `npm test`: 48/48 pass.
- New SVG route test failed with 404 before implementation, then passed after it.
- Initial US1 `npm test`: **48/48 pass**, including the added SVG MIME/HEAD and forbidden
  path assertions in the existing server test. Existing TLS listener warnings
  occurred before and after the change; no test failures.
- Desktop layout revision: `npm test` reports **47/48 pass**. The existing
  `synthetic budget fixture preserves the requested financial scenario` test
  fails because the already-modified `UI/data/test-snapshot.json` differs from
  the canonical fixture. That pre-existing local data change was preserved.
  Browser assertions now check fixed widths, description priority, ellipses and
  full hover text; visual execution remains pending.
- Fresh `npm run serve -- --port 0`: all 16 official SVGs returned HTTP 200,
  `image/svg+xml`, and byte-for-byte matching content. UI and harness routes also
  returned HTTP 200. This is an HTTP check, not a rendered-browser check.
- App/browser-harness syntax checks and `git diff --check` pass.
- Browser automation returned `apps: [], browsers: []`. Baseline browser execution
  and final visual walkthrough are **pending**, not passed.
- `tests/browser/browsing.mjs` adds US1 assertions at 1280/1440/360/412px in both
  themes: fixed column widths/single-line truncation, scrolled header alignment, money visibility,
  no page overflow, exact icon mappings, names, theme/sidebar/pagination/search
  controls, and no Font Awesome requests. Frames are disposed after each scenario.

Run `npm run serve` and open `/tests/browser/` to execute the complete harness.
Restart any older server process so the new icon route is active. For a visual
walkthrough, use `/?test=true`, both themes and the four widths above. Actual
Pixel 8 appearance/touch validation remains pending. Existing accepted iOS
limitations are unchanged. Source-runtime validation is not needed for this
presentation-only change; US2–US5 are outside this implementation scope.

## Governance

Financial fidelity/runtime/privacy: financial code and source data unchanged;
synthetic tests only. Simplicity: reuse accepted markup, controls and metadata.
Evidence: unrun visual/device checks explicitly pending. Dependencies: official
local SVG assets only, no packages or new external runtime requests.

`.specify/extensions.yml` contains `hooks: {}`; no pre/post hooks to dispatch.
Task markers record only evidenced completion; visual acceptance remains open.

## Count formatting and direct Moneybot amendment (2026-09-19)

Implemented comma-grouped summary counts in both ready and page-render paths without alignment changes. Browser harness now covers 0, 999, 1,000, 2,963 and 1,234,567 and unchanged alignment; browser execution and manual T050 remain pending.

Standalone exporter now prompts for an optional masked password and clearly states that blank saves plaintext JSON. Cancel saves nothing; nonempty input uses the existing encrypted envelope. Extension entry guard and extension modules remain unchanged. No extension was rebuilt or installed.

Automated evidence using bundled Moneydance Java/Jython (synthetic data, not actual source-runtime acceptance):

- `tests/runtime/encryption_test.py`: 6 passed, including independent vectors for both encryption helpers, ciphertext round-trip, plaintext save, failure preservation, and mocked modal blank/cancel/whitespace cases on the Swing EDT.
- `tests/runtime/export_deadline_test.py`: 5 passed.
- `tests/runtime/delivery_test.py`: 7 passed, including the real builder/encryption pipeline and prior-ciphertext preservation.
- `node --test tests/unit/encryption-vectors.test.mjs tests/unit/encrypted-viewer.test.mjs`: 9 passed.

Actual Moneybot dialogs/source comparison, visual count acceptance and rebuilt installed-extension behavior remain unverified. M003–M005 in feature 002 and T050 in feature 003 remain unchecked. No later browsing story was implemented. No full-suite pass is claimed; the pre-existing edited test-snapshot fixture mismatch remains outside this change.

## Full category hover paths (2026-09-19)

Page rows now carry a full colon-separated category title from existing destination ancestry, excluding ROOT. Visible category labels, truncation, Split/Uncategorized behavior and search fields remain unchanged. Applies to direct register and search rows. No exporter or later-story functionality changed.

`node --test tests/unit/register.test.mjs tests/unit/search.test.mjs tests/unit/worker.test.mjs`: 19 passed. Browser harness includes escaped hierarchical title/short-label assertions; browser execution and the updated T035 manual hover check remain pending.

## US 1 Manual testing result

Confirmed specified dimensions of date, category, amount, and balance. Remaining width given to description. Elipses truncation used when category or description is too long to display. No noticeable difference viewing the app on a Pixel 8 via ngrok. In Pixel 8, amounts appear unobscured and the page contains no horizontal scrolling.

Verified following icons:

- top-left: checkbook
- all accounts: checkbook
- bank: account_balance
- credit card: credit_card
- expense: sell
- income: paid
- asset: money_bag
- loan: payment_arrow_down

Additional notes:

- labels appear correct in search
- light/dark mode icon is correct
- navigated to search using the ctrl+f shortcut
- confirmed the search clear icon appears when text entered, and clears the input when clicked
- confirmed icons are correct in both light and dark mode
- I don't use liabilities, but the icon you chose is fine
- touch targets are unchanged
- no network traffic related to font-awesome in the browser developer toolbar
- confirmed the title text of nested categories contains the full heirarchy separated by colons
- split categories are unchanged
- confirmed sticky headers remain aligned
- accessibility names are present for certain elements on the page, and appear fine to my untrained eye.
- confirmed transaction counts appear with thousands separators
- tested fallback by artificially inserting an account with an "Unknown" type. confirmed icon appeared as material account_balance in both light and dark mode.
- opened and closed the sidebar using keyboard in desktop
- tested sidebar navigation by opening and closing using the hamburger menu and x icon. Also hid sidebar by clicking shaded area behind the sidebar.
- confirmed the theme toggle element contains aria-hidden="true"
- confirmed theme toggle parent button has accessibility name "Toggle Light/Dark Mode"
- confirmed accessibility names of hamburger button ("Open navigation"), sidebar close button ("Close navigation"), clear search button ("Clear search")
- account button does not have an accessibility name (?) but the icon has aria-hidden="true"

## Review of user-reported manual results

The user reports performing the instructed walkthrough. These results supersede the earlier pending status for T035: column sizing, truncation, category hierarchy titles, sticky alignment and actual Pixel 8 layout/touch behavior passed. Testing included desktop browser developer tools and Pixel 8 via ngrok; exact test date, browser versions and viewport sizes were not supplied separately.

T008 is complete. The additional notes confirm UNKNOWN fallback uses account_balance in both themes, sidebar keyboard/touch opening and closing, overlay dismissal, utility accessible names and hidden decorative icons. Earlier evidence covers All Accounts/LOAN and other listed icons, search, themes, touch targets and absence of Font Awesome requests. The unused LIABILITY check remains an explicit user-accepted omission, not an executed pass.

The account-icon question is resolved by the user's observation of aria-hidden="true": the decorative icon should not have an accessible name. Source inspection confirms its parent account header is an existing clickable div, without button semantics or keyboard focus support. This is a separate account-navigation accessibility limitation, not a failed decorative-icon check; no claim of comprehensive accessibility acceptance is made and no application change is included in this review.

T050 is complete based on the user's confirmation that transaction counts display thousands separators. T035 remains complete. All three US1 manual tasks now pass and the manual gate is satisfied. Browser harness execution and the separate Moneybot/installed-extension checks M003–M005 remain unreported. No application tests were rerun for this documentation review, and no later story implementation began. Earlier pending statements above are historical and superseded by this review for the manual checks only.
