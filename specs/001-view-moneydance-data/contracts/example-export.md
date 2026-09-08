# Example Export

[example-export.json](example-export.json) illustrates the implemented v1 contract using fictional IDs and the requested budget scenario. All opening balances are zero. It is synthetic documentation, not a real Moneydance export. Source-runtime comparison evidence is recorded separately in [validation.md](../validation.md).

Checking contains Mortgage Budget, Groceries Budget, Electricity Budget, and Misc Spending Budget. On September 1, a $3,200 paycheck is allocated directly to those sub-accounts: $2,000, $800, $200, and $200 respectively.

## Activity and Balances

| Date        | Activity                | Mortgage Budget | Groceries Budget | Electricity Budget | Misc Spending Budget | Checking sidebar total |
| ----------- | ----------------------- | --------------: | ---------------: | -----------------: | -------------------: | ---------------------: |
| September 1 | Paycheck allocated      |          $2,000 |             $800 |               $200 |                 $200 |                 $3,200 |
| September 3 | $2,000 Mortgage Payment |              $0 |             $800 |               $200 |                 $200 |                 $1,200 |
| September 5 | $150 Groceries Expense  |              $0 |             $650 |               $200 |                 $200 |                 $1,050 |
| September 6 | $3 Candy Bar            |              $0 |             $650 |               $200 |                 $197 |                 $1,047 |
| September 6 | $2 Parking              |              $0 |             $650 |               $200 |                 $195 |                 $1,045 |

The two September 6 rows illustrate successive transaction running balances. The timeline contains one end-of-day checkpoint for that date, after both entries. In Misc Spending Budget, registerOrder places Candy Bar before Parking; their running balances are $197 and $195.

## How the Entries Represent This Scenario

- Checking is the aggregate parent. Its own balance remains zero; its sidebar balance sums the four budgets. The $3,200 is not also recorded as an additional Checking own-account deposit, which would double-count the money.
- One paycheck transaction links the Salary income entry to four budget-side entries. The Salary entry has four allocations and displays `Split`; each budget's entry has one Salary counterpart. They share transactionId and have separate account-entry IDs.
- Mortgage Payment, Groceries Expense, Candy Bar, and Parking each have a negative budget entry and a positive expense-category counterpart. The categories are Mortgage, Groceries, and Misc Exp; both small September 6 expenses use Misc Exp.
- Salary and expense categories are active and included, consistent with the current scope. Salary uses the proposed income display convention (positive income). These category rows are not additional cash and must not be summed into Checking or net worth.
- There are 13 account-side entries representing five transactions: one paycheck with five sides and four expenses with two sides each.
- A normal Checking register is empty because activity belongs to sub-accounts. Checking search includes those sub-accounts; All Accounts includes all 13 entries with no overall total.

## Dates and Export Metadata

The export timestamp is September 6 at 23:00 UTC. balanceStartDate is September 5 (the UTC export date minus one day). Each included account has one September 5 baseline and only later changes; earlier balance checkpoints are omitted, but all 13 entries remain. Checking therefore has only the $1,050 September 5 baseline and the $1,045 September 6 point. A simulated cutoff before September 5 fails visibly; the activity table above describes history, not retained timeline points. Its local rendering appears in the toolbar. effectiveDate is not exported: a page loaded on September 5 selects balances through September 5 ($1,050 for Checking), while a September 6 load selects $1,045. All supplied transactions remain in their registers, including those still future relative to page-load date.

Every money field is integer cents. Full-account running balances do not change with search, paging, or page-load date. The root has no monetary balance, sourceTimeZone is absent, and no generation ID is used.

This example uses the implemented compact balanceTimeline design. Hidden-account and error cases are omitted to keep it focused; tests/fixtures contains those cases. The maintained schema is schemas/snapshot-v1.schema.json. Run `node scripts/validate-snapshot.mjs specs/001-view-moneydance-data/contracts/example-export.json` from the repository root: it reports VALID with 10 accounts and 13 entries.

Future entries remain in the export but are initially hidden in the UI behind a yellow summary until revealed. Account selection resets disclosure. The export instant appears in the As of sidebar footer using the device timezone and the original Read-Only Mode styling. See [quickstart.md](../quickstart.md) for current viewer and validation commands.

Encryption, Azure upload, deployment, close hooks, investment presentation, net worth and transaction entry remain deferred.

Validation performed: JSON generation/parsing, account references, all opening-to-running-to-closing balance recurrences, and the final $1,045 Checking aggregate. This does not establish SDK behavior or real register ordering.
