# US1 implementation and acceptance

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
