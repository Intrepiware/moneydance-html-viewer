The user constructed this list of out-of-scope items that he'd like to implement in a future speckit run. These should not be handled in 001-view-moneydance-data, unless specifically requested by the user.

## Part 1

1. When category is clicked, a breakdown should be displayed (preferably in a modal)

- All splits displayed with amounts, categories, and memos
- Full category name listed (e.g., Personal:Dining:Convenient)
- If category is another account (i.e., a transfer), clicking the category takes the user to the other account with the clicked transaction in focus.
- Must be mobile friendly

2. In search results, clicking the account beneath the description loads that account's transaction register and scrolls to the clicked transaction
3. Display transaction tags on the transaction row
4. Do not show income/expense categories by default. Add a sidebar navigation to view them. When a category is clicked, the category transactions display grouped by month with the sum of transactions displayed. User can toggle between annual and monthly grouping.
5. ![Transaction View on Desktop](<screenshots/Screenshot - Transaction View Desktop 02.png>) - Give category much more room on desktop. The description is given way more room than it needs.

## Part 2

1. Investment transactions (MVP):

- Separate sidebar navigation to view investment accounts
- Mode 1: Transaction View. Displays register transactions (i.e., transfers, purchases, sales, fees and interest)
- Mode 2: Positions View. Displays details on active positions and cash balance. Position data:
  - most recent trading price
  - shares owned
  - cost basis
  - cost/share
  - % change
  - unrealized gains
  - current value

2. Investment transactions (nice-to-have)

- Historical account balance graph
- Historical security price graph
- Download current security trading price

## Part 3

1. Net worth display

2. Reports:

- Tag summary
- Income and Expenses
  - By Month
  - By Year
  - Question: how do we choose which accounts to include/exclude?
- Net worth
  - Breakdown by cash, investments, credit cards, and loans

3. Safari iOS compatibility:

- hamburger menu visible on page load
- "As of" date visible at bottom of side menu
