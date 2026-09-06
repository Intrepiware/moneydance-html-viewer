# Schema alignment review

## Recommendation

Choose option 3: a dedicated import adapter in the UI application, with limited exporter improvements to supply missing source facts. Keep the export as a versioned Moneydance snapshot and derive a UI view model once after loading/decryption. Do not make the mock UI JSON the permanent export contract.

This is a repository-based architectural assessment, not a verified Moneydance API implementation. No large export files were read and no application code was changed.

## Confirmed Scope

Personal use only, with no marketing or distribution. Read-only USD viewing is sufficient. The user prioritizes transaction density, easier navigation, and Android transaction search. Multicurrency conversion and mobile transaction editing are out of scope. Source: intake.md, User Clarifications (2026-09-05).

## Observed differences

The user also requires quick visibility of account and sub-account balances and considers the existing UI good, with no major changes anticipated. Preserve the current layout and interaction approach as the starting point; scope changes to real-data integration and specific correctness or usability needs. A broad visual redesign is not a project objective. Account and sub-account balance visibility is required even though the precise balance definition and parent aggregation rules remain open. Source: intake.md, User Clarifications.

| Concern | Current exporter | UI expectation |
| --- | --- | --- |
| Root | Object containing accounts and transactions | Root account node with literal id root |
| Transactions | Separate top-level array with accountId | Transactions nested under account nodes |
| Date | Integer from getDateInt() | Hyphenated date string, split directly by renderer |
| Check number | checkNum | checkNumber |
| Categories | Array of splits with categoryId/categoryName | Single category display string |
| Amount | Values on splits only | Signed amount on each transaction |
| Balances | No account or transaction balance fields | Account balances and transaction running balances |
| Currency | Currency identifier on accounts | Formatter uses USD, matching confirmed scope |

The corrected export_json.py agrees with the supplied schema's field names and includes exportDate. Both use cleared_status on transactions and clearedStatus on splits; this is a mixed naming convention, not a script/schema mismatch. Neither source defines the balances expected by the UI. The schema's account tree is expanded to a fixed depth rather than modeled recursively.

The corrected exporter skips inactive accounts and their subtrees when building the account tree, but applies no corresponding filter in the transaction loop. Transactions or splits may therefore reference accounts absent from the tree. Define an explicit inclusion and reference-resolution policy rather than silently dropping unmatched transactions in the adapter.

## Why this choice

- Option 1 is viable, but distributing export interpretation across rendering, filtering, sorting, and balances would entangle presentation with the source format. A centralized adapter gives those concerns one boundary.
- Option 2 makes a mock presentation format drive the export contract. Its single category and simplified balances do not represent all the source details; preserve splits, identifiers, currency information, and relationships.
- Option 3 keeps the viewer reusable and the export independent of layout. It still needs small UI corrections and explicit exporter additions; transformation cannot manufacture missing financial facts.

## Proposed next work

1. Use the corrected export and supplied schema as the starting contract, add schemaVersion, retain the existing exportDate, and validate exports against the maintained schema. Document the existing status-field naming or standardize it in a versioned change. Model account children recursively. No legacy snake_case compatibility is needed merely because the initial review used the wrong script.
2. Verify transaction enumeration, parent/split identity, amount signs, and currency units against Moneydance registers. The variable name ptxn alone does not prove getAllTxns() yields only parent transactions. Export explicit signed register amounts and authoritative account balances with documented semantics. For running balances, provide reliable source values or enough opening-balance/history/order information to derive them; otherwise show unavailable rather than zero.
3. Build an adapter that indexes accounts by ID, associates transactions, converts date integers to date-only strings, maps check numbers, and derives category display text while retaining all split details. Define how inactive accounts, omitted subtrees, and unmatched account/category references are handled. Resolve transfers on both account sides without duplicating economic events in combined views. Separate income/expense categories from asset/liability balance totals. Preserve the actual root ID and make root detection explicit, or use a separate synthetic UI root.
4. Adjust the viewer for unavailable balances and split detail, retaining USD formatting for the supported scope. Prioritize readable transaction density, easy navigation, and Android search; define measurable acceptance criteria in the define stage. Multicurrency conversion is not required. Define own-account versus subtree balances so parent and child amounts are not counted twice.
5. Fix the existing global-list mutation: getAccountTransactions() calls extractAllTransactions(), which overwrites this.allTransactions with the selected subtree. Returning to All Accounts can consequently show only that subtree. Keep the global index separate from selection results.
6. Create small synthetic fixtures for ordinary debit/credit, multiple splits, transfer, opening balance, nested accounts, inactive or missing account references within the USD-only scope. Validate against known Moneydance register totals before integrating encryption and upload.

For large snapshots, index and sort once where practical. Current pagination limits rendered rows, but does not limit JSON download/parsing or the repeated recursive extraction and sorting. Profile representative snapshots before choosing a worker or changing delivery format.

## Boundaries

The current script writes a local JSON file. The inspected code does not implement a close hook, encryption, or Azure upload. Address those after the data contract is trustworthy, including the timing needed to access the book before it becomes unavailable. No external Moneydance API claims were verified in this assessment.

## Suggested assessment follow-up

Research is recorded in research.md. Next run `$speckit-assess-define slug=moneydance-schema-alignment` to define scope and success criteria using the clarified personal, read-only, USD-only requirements. Transaction/balance verification gaps remain recorded in research.md.

