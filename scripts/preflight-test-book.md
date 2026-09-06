# Additional preflight cases

Keep your existing Checking / Misc Spending Budget case exactly as it is. The
expanded `tests/fixtures/preflight-reference.example.json` retains it as Case 1.
The six additional cases use separate accounts so they do not change that result.
Use the same test Moneydance book. All amounts below are **dollars**; the JSON
uses integer cents. All dates are in **2026**.

## 1. Create these accounts and category

Enter starting balances using the account's opening/initial balance setting,
dated before September 1 if a date is required. Do **not** create opening-balance
transactions: the reference expects no register rows for those starting amounts.

| Full path from book root | Type | Initial balance | Final status |
|---|---|---:|---|
| Preflight Opening Only | Bank | $12.34 | Active |
| Preflight Checking | Bank | $100.00 | Active |
| Preflight Checking / Preflight Hidden | Bank sub-account | $50.00 | Inactive, after transactions are entered |
| Preflight Checking / Preflight Hidden / Preflight Active Child | Bank sub-account | $25.00 | Active |
| Preflight Income | Income category at category root | $0.00 | Active |
| Preflight Investment | Investment account, USD cash only | $0.00 | Active |

Use USD throughout. Do not add securities, prices, or purchases to the investment
account. Leave Preflight Opening Only without transactions. The hidden account
also has no direct transactions; its nonzero starting amount is intentional.

## 2. Enter just three new transactions

Enter each **once**, in Preflight Checking. Moneydance creates the counterpart;
do not manually enter another transaction in the receiving account/category.

| Date | Description (exact text) | Deposit | Payment | Category / transfer destination |
|---|---|---:|---:|---|
| September 2 | Reference Income | $40.00 | — | Preflight Income |
| September 7 | Reference Envelope Transfer | — | $10.00 | Preflight Checking / Preflight Hidden / Preflight Active Child |
| September 8 | Reference Investment Transfer | — | $20.00 | Preflight Investment |

Leave optional memo/split-description fields empty for these new transactions.
The September 7 and 8 transfers are future activity when run on September 6.
On later runs the fixed dated reference checks still exercise their cutoffs.

After entering these transactions, mark **Preflight Hidden only** inactive.
Keep its child active. If Moneydance also changes the child status, restore the
child to active. If the application does not permit that combination, report it
instead of changing the reference case to hide the limitation.

## 3. Check the expected results

Preflight Checking's direct register should contain exactly the three new rows,
with running balances **$140 → $130 → $110**. The active child should have one
$10 deposit and a $35 running balance. The investment's cash register should
have one $20 deposit. Preflight Income should show the $40 income contribution;
its display-sign convention is deliberately under test.

| Date cutoff | Checking own | Hidden own | Active child own | Checking including descendants |
|---|---:|---:|---:|---:|
| September 5 | $140 | $50 | $25 | $215 |
| September 7 | $130 | $50 | $35 | $215 |
| September 8 | $110 | $50 | $35 | $195 |

The envelope transfer changes where money sits but not the parent's combined
balance. The investment account is outside this hierarchy, so its transfer
reduces Checking's combined balance. These are independently calculated test
expectations, not assertions that every source API has already been verified.

## 4. Run the expanded reference

Copy the expanded example to `UI/data/preflight-reference.private.json` when the
setup is ready. If you customized Case 1's text or paths, preserve that case and
append the six new objects from the example's `cases` array instead.

Run `scripts/moneydance-preflight.py` and select that private reference. Return
the case summaries and failed comparisons. A successful run has **seven cases**.
The hidden and investment accounts are probed as source references even though
their presentation is excluded from the future viewer.

The existing Case 1 supplies the split and same-day-order checks. These additions
exercise both sides of the new transfers, opening-only balances, income signs,
and hidden hierarchy contributions. Nonempty split-description precedence and
historical security valuation are not established by these cases. T005 review
must still confirm actual account types/statuses and coverage; labels alone are
not proof. Do not change expected monetary values merely to make a failure pass.
