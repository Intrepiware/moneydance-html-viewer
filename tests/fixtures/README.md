# Synthetic snapshots

Run `npm run fixtures` to regenerate these files from the documented example.
These are proposed v1 fixtures, not proof of Moneydance source semantics. Reconcile
them after the T006 source decision or any subsequent contract change.

- `valid-snapshot-v1.json`: requested paycheck/budget scenario, 13 account entries.
- `transfers-v1.json`: same reference; parent/split account sides remain distinct.
- `same-day-order-v1.json`: Candy Bar precedes Parking; Misc balances 19700 then 19500.
- `future-activity-v1.json`: September 6 expenses excluded from September 5 sidebar,
  included on September 6. Use an injected test cutoff in pure tests, not a UI override.
- `opening-only-v1.json`: independent account with 12345 cents and no entries.
- `hidden-ancestor-v1.json`: hidden parent with 500-cent own opening contribution
  and visible child with 250 cents; Checking gains exactly 750 cents at each point.
  Hidden source contribution is a reference expectation, not inferred from omitted rows.
- `invalid-balance-v1.json`: one broken running balance.
- `invalid-reference-v1.json`: dangling entry account reference.
- `invalid-export-date-*-v1.json`: otherwise valid records with missing, null,
  malformed, or wrong-type export timestamp. All must fail loading.

The test-mode copy is `UI/data/test-snapshot.json`. Its coverage begins 2026-09-05;
loads on later dates show all known activity, without inventing new transactions.
Financial contract validation will be implemented after the Moneydance preflight.
