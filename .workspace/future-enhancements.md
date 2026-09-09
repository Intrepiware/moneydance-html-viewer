The user constructed this list of out-of-scope items that he'd like to implement in a future speckit run. These should not be handled in 001-view-moneydance-data, unless specifically requested by the user.

1. In search results, clicking the account beneath the description loads that account's transaction register and scrolls to the clicked transaction
2. Searches should also search splits' memos
3. For transfer transactions, clicking the category takes the user to the other account with the clicked transaction in focus.
4. Do not show income/expense categories by default. Add a sidebar navigation to view them. When a category is clicked, the category transations display grouped by month with the sum of transactions displayed. User can toggle between annual and monthly grouping.
5. Investment transactions (MVP):

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

6. Investment transactions (nice-to-have)

- Historical account balance graph
- Historical security price graph
- Download current security trading price
