# Run the source preflight (T005)

## Feature 003 acceptance status

The allocation workflow is documented in [us3-source-checks.md](us3-source-checks.md).
Mike's 2026-09-24 results in
[feature 003 acceptance](../specs/003-enhance-transaction-browsing/acceptance.md)
complete T015/T016/T038: all nine allocation source probes passed in Moneydance build 5253
with Jython 2.7.2; the direct synthetic export validated (116 accounts, 11 entries) and
passed all nine reference comparisons. The rebuilt/installed extension's export also
passed all nine comparisons, and unchanged source records/balances were confirmed.
These are user-run source results, not new executions during Phase 8.

Use `node scripts/validate-snapshot.mjs <synthetic-export>` and
`node scripts/compare-preflight.mjs <synthetic-export> <matching-reference>` for captured
synthetic exports. Run the probe itself inside Moneydance as described below. Keep private
references ignored and use the reference matching that test book; do not regenerate source
expectations from exporter output. The earlier balance-preflight status below remains a
separate historical record and is not expanded by the allocation-only comparisons.

## Original balance preflight procedure

For feature 003 US3, use the separate [allocation source-check recipe](us3-source-checks.md). The probe now supports ordered per-allocation amount, memo and tag comparisons in `allocationCases`; `scope: "allocations"` runs that focused reference without claiming the older balance coverage passed again.

Case 1 has passed all 31 comparisons in Jython 2.7.2 on Moneydance build 5253. The additional cases remain unverified.
Do not run it with standalone Python. It does not create accounts or transactions.

First follow [the additional test-book recipe](preflight-test-book.md): six new account/category objects and three transactions, preserving your existing Case 1. The expanded example contains seven reference cases.

1. Open a controlled test/copy book in Moneydance 2024.4. Record the exact build
   from About Moneydance. Avoid editing/syncing while the probe runs.
2. Copy `tests/fixtures/preflight-reference.example.json` to
   `UI/data/preflight-reference.private.json` (ignored). Enter independently
   checked values from that book. The example is a format illustration, not a
   guarantee of the descriptions or SDK signs in your actual book.
3. Each case names its account by a path from the root, excludes the root name,
   and lists the **entire** register in ascending source order, including future
   rows. Amounts are signed USD cents. Same-day row order must come from the
   displayed source register, not this probe's output. Date references are
   YYYYMMDD integers with own and recursive balances independently established
   from the controlled scenario. Include at least two dates per account.
4. Cover debit/credit, opening-only, same-day order, splits, both transfer sides,
   future activity, nonzero hidden contributions, an active descendant beneath a
   hidden parent, income signs, and an included cash transfer involving an excluded
   investment account. Assign `covers` labels only to cases that actually exercise
   them. A case label is not automatic proof of coverage.
5. Run `scripts/moneydance-preflight.py` using the same Moneydance script facility
   used for `export_json.py`. Select the private reference JSON in its file dialog.
6. Return the sanitized console summary and Moneydance build for T005 review.
   Do not share the private reference JSON. Failures need local investigation;
   do not alter expected values just to make the probe pass.

The probe reads source getters, copies transaction references into a newly created
TxnSet, and calculates only that detached set's balances. Candidate ordering and
USD recursive calculations are deliberately compared to independent references.
Non-USD descendants require source valuation investigation, not summing security
units. The before/after fingerprint is a limited change detector, not proof of a
transactionally stable export. T006/T010 must resolve stable-read strategy.

Candidate APIs: [Account](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/Account.html),
[TxnSet](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TxnSet.html),
[TransactionSet](https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TransactionSet.html).
These current docs are not proof of Moneydance 2024.4 behavior.

When a case fails, return the labeled PASS/FAIL output from the current probe. Reference row numbers refer to ascending register order; reference-date numbers refer to the order in the JSON dates array. Failed reference-row checks now print expected/actual values, and description mismatches include account-side and parent descriptions. Use this diagnostic with the controlled synthetic test book; review the output before sharing. Keep the existing test book and expectations unchanged until the failing checks are understood.
