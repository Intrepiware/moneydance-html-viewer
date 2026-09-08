# Idea Research: Moneydance schema alignment

- **Slug**: moneydance-schema-alignment
- **Created**: 2026-09-05
- **Evidence confidence (overall)**: medium
- **Scope**: Evidence for connecting the existing exporter and viewer; no implementation design or go/no-go decision.

## Users & Demand

- The user reports dissatisfaction with the mobile app and wants a website displaying Moneydance snapshots. The user explicitly limits the project to personal use with no marketing or distribution; wider market demand is not an evaluation criterion. — [source: intake.md, Idea and Origin & Context] (confidence: high; cited)
- Existing exporter and viewer code demonstrate work already invested, but do not establish successful real-data mobile use. — [source: ../../../export_json.py; ../../../UI/app.js] (confidence: high; cited)
- The user identifies poor transaction density, clunky interaction, and absent search in their Android app as the specific pain points. Desired outcomes are denser transaction viewing, easier navigation, and search; numerical acceptance targets remain open. — [source: intake.md, User Clarifications (2026-09-05)] (confidence: high for stated experience and requirements; cited)

## Prior Art

- The user considers the existing agent-created UI good and expects no major changes. Quickly seeing account and sub-account balances is now an explicit goal. This supports preserving the existing presentation as a starting point, but does not verify balance correctness or performance with real data. — [source: intake.md, User Clarifications (2026-09-05), Additional goal and Existing UI preference] (confidence: high for user goal and preference; cited)

- The repository already contains two independently shaped data contracts: the exporter produces accounts plus a separate transaction array; the mock viewer consumes a root account with nested transactions. The corrected script's property names and exportDate agree with the compact schema. — [source: ../../../export_json.py; ../../../UI/data/moneydance-export-schema.json; ../../../UI/data.json; ../../../UI/app.js] (confidence: high; cited by static inspection, not runtime validation)
- The vendor's indexed mobile guide describes remote account/category/recent-transaction syncing and transaction editing, with 365 days of transactions. This establishes an existing alternative, but the guide was modified in 2022 and current installed-app behavior was not verified. — [source: S5] (confidence: medium; cited, search-index excerpt)
- The vendor API exposes separate account balance variants and separate parent/split transaction concepts. The available source evidence therefore does not support treating the mock format as a complete description of Moneydance's data model. — [source: S1–S4; ../../../UI/data.json] (confidence: medium; cited inference)

## Market & Context

- This assessment concerns a personal workflow. Marketing, distribution, pricing, and broader market demand are explicitly out of scope. — [source: intake.md] (confidence: high about stated scope; cited)
- The proposed website is a snapshot reader, while the documented companion app also permits editing. The user has confirmed that read-only access is sufficient and mobile transaction entry/editing is unnecessary. — [source: intake.md, User Clarifications (2026-09-05); ../../../UI/index.html, Read-Only Mode; S5] (confidence: medium; cited inference)
- A workflow triggered only at desktop close may leave the website stale while Moneydance stays open. No acceptable freshness interval or observed desktop-close frequency is available. — [source: intake.md] (confidence: medium; cited inference)

## Data & Constraints

### Contract and display

- The export has integer dates, checkNum, and multiple splits; the viewer calls date.split("-"), reads checkNumber, and renders one category string. This is a structural and representational mismatch, not just capitalization. — [source: ../../../export_json.py:54; ../../../UI/app.js:329; ../../../UI/index.html:175] (confidence: high; cited)
- The export supplies no explicit transaction-level amount, account balance, opening balance, or transaction running balance. The UI reads transaction amounts and running balances and returns zero for a leaf account without a balance. A successful schema conversion alone cannot establish the correctness of these missing values. — [source: ../../../export_json.py:24; ../../../export_json.py:62; ../../../UI/app.js:40; ../../../UI/index.html:184] (confidence: high; cited inference)
- The schema validates account structure only through its expanded nesting levels; the deepest children array has no item constraints. This does not prohibit deeper trees, but leaves deeper nodes unvalidated. It also has no schemaVersion field or date-format constraint on exportDate. — [source: ../../../UI/data/moneydance-export-schema.json] (confidence: high; cited)

### Moneydance semantics: provisional external evidence

- Indexed ParentTxn documentation describes getDateInt() as YYYYMMDD. This supports date-only interpretation, rather than treating the integer as an epoch timestamp. — [source: S1] (confidence: medium; cited, indexed documentation not checked against installed version)
- Indexed TransactionSet documentation calls getAllTxns() a set of all transactions and says adding a parent also adds its splits. This supports concern that iteration may include both sides; it does not prove the exact iteration contents in the user's installed version. The exporter does not explicitly distinguish parent from split objects. — [source: S2; ../../../export_json.py:42] (confidence: medium; cited inference)
- Indexed SplitTxn documentation distinguishes getValue(), affecting the split's account, from getParentValue(), expressed in the parent's currency. The script formats stxn.getValue() with the currency of ptxn.getAccount(). This is a potential currency/unit mismatch when the accounts differ, not a runtime-confirmed bug for this dataset. Multicurrency conversion is outside the clarified USD-only scope. Sign and parent-versus-split behavior still need verification for supported accounts; investment/security units remain relevant only if those accounts are included. — [source: S3; ../../../export_json.py:44; ../../../export_json.py:57] (confidence: medium; cited inference)
- Indexed Account documentation exposes starting, current, cleared, and recursive balances. Recursive balance documentation includes subaccounts and currency conversion. Consequently, the choice of balance and whether it already includes children matter; simply summing displayed balances is not a verified replacement. — [source: S4; ../../../UI/app.js:40] (confidence: medium; cited inference)
- The exporter exports account currency identifiers, while the UI formats all values as USD. USD formatting agrees with the clarified requirement; missing exchange rates are not a scope gap. Investment valuation remains a separate account-scope question. — [source: ../../../export_json.py; ../../../UI/app.js:16; ../../../UI/data/moneydance-export-schema.json] (confidence: high; cited)

### References and UI state

- Account-tree traversal excludes inactive children and does not descend into their subtrees. Transaction traversal has no corresponding inactive-account filter. Unmatched account/category references are therefore possible; their actual frequency is unknown because large exports were not parsed. — [source: ../../../export_json.py:32; ../../../export_json.py:42] (confidence: high about code; cited inference about possible data)
- getAccountTransactions() invokes extractAllTransactions(), which assigns its result to this.allTransactions. A selected subtree can replace the global list subsequently used for the root view. This is independent of the JSON naming differences. — [source: ../../../UI/app.js:200; ../../../UI/app.js:215; ../../../UI/app.js:285] (confidence: high; cited static control-flow finding)

### Volume and workflow boundaries

File metadata collected with PowerShell Get-ChildItem; contents of these large files were not read:

| File under UI/data | Bytes |
| --- | ---: |
| moneydance-export-20260816-124917.json | 51,915,054 |
| moneydance-export-20260816-164640.json | 51,664,359 |
| moneydance-export-20260905-124538.json | 52,008,058 |

- These files are approximately 51.7–52.0 MB in decimal units. The UI fetches and parses the complete JSON before rendering; its 100-row pagination only limits displayed rows. Mobile memory, parsing latency, transfer size after compression/encryption, and acceptable startup time have not been measured. — [source: local file metadata above; ../../../UI/app.js:1; ../../../UI/app.js:56; ../../../UI/app.js:324] (confidence: high; cited)
- Transaction extraction sorts the growing accumulator during recursive traversal and repeats extraction for account selections. Performance impact at real export size is unknown. — [source: ../../../UI/app.js:200] (confidence: high about code; cited)
- The inspected exporter writes a local file and contains no close event hook, encryption, or upload. The viewer fetches local data.json and contains no snapshot decryption. — [source: ../../../export_json.py; ../../../UI/app.js:1] (confidence: high; cited)

## Evidence Against the Idea

- An existing vendor app provides an alternative, but editing capability and broader market demand are not objections to this explicitly personal, read-only project. The remaining tradeoff is the user's maintenance effort versus the desired improvements in transaction density, navigation, and Android search. That effort has not been measured. — [source: S5; intake.md, User Clarifications (2026-09-05)] (confidence: medium; cited inference)
- Existing UI/export compatibility is insufficient to prove correct USD balances or transfers. The repository exposes missing source facts and parent/split ambiguity, increasing the amount of work beyond field mapping. — [source: Data & Constraints citations above] (confidence: high for missing fields; medium for API implications; cited)
- Approximately 52 MB snapshots and close-triggered freshness may undermine mobile usefulness; actual user impact is unmeasured. — [source: local metadata; intake.md] (confidence: medium; cited inference)
- These findings challenge scope and assumptions; they do not establish that the idea should be rejected.

## Gaps & Open Questions

- [NEEDS CLARIFICATION: Installed Moneydance version/build and the runtime behavior of getAllTxns(), including parent/split identities and duplicate economic events.]
- [NEEDS CLARIFICATION: Known register examples for an ordinary debit, credit, multiple splits, transfer, with expected USD signs and totals.]
- [NEEDS CLARIFICATION: Required balance meaning: current, cleared, full-history, own-account, subtree, or net worth; treatment of opening balances and same-day transaction ordering.]
- [NEEDS CLARIFICATION: Required account types, investment support, inactive accounts, and history range.]
- [NEEDS CLARIFICATION: Target visible transaction count, search fields and account/history coverage, navigation expectations, maximum snapshot age, target Android screen size, and acceptable load/search time.]
- [NEEDS CLARIFICATION: Shutdown timing while the account book remains available, upload failure behavior, key handling, and authenticated retrieval; not verified in this focused review.]
- No Moneydance runtime execution, full export validation, transaction counts, or mobile performance measurement was performed. External API evidence below is indexed documentation, with old crawl dates on API pages; installed-version applicability remains unverified.

## Sources

Local sources: intake.md and the repository paths cited above. File sizes were measured on 2026-09-05. The earlier recommendation.md was reviewed as context, not used as independent proof.

External discovery used web search only. No direct page opens, redirects, or linked-page crawls were performed. The research skill requires validated connection peers and confirmation for unrecognized hosts; the web tool exposes no peer-validation mechanism. Direct fetches were therefore skipped. Indexed excerpts are provisional evidence, not fetched-page verification. All URLs below are sanitized, without credentials or query parameters.

- **S1**: https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/ParentTxn.html — host: infinitekind.com; policy: auto-refused direct fetch (peer validation unavailable; host unrecognized); search-index excerpt only.
- **S2**: https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/TransactionSet.html — host: infinitekind.com; policy: auto-refused direct fetch (peer validation unavailable; host unrecognized); search-index excerpt only.
- **S3**: https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/SplitTxn.html — host: infinitekind.com; policy: auto-refused direct fetch (peer validation unavailable; host unrecognized); search-index excerpt only.
- **S4**: https://infinitekind.com/dev/apidoc/com/infinitekind/moneydance/model/Account.html — host: infinitekind.com; policy: auto-refused direct fetch (peer validation unavailable; host unrecognized); search-index excerpt only.
- **S5**: https://infinitekind.freshdesk.com/support/solutions/articles/80000615294-using-the-mobile-app — host: infinitekind.freshdesk.com; policy: auto-refused direct fetch (peer validation unavailable; host unrecognized); search-index excerpt only; guide modified 2022-04-06.

## Next Stage

`$speckit-assess-define slug=moneydance-schema-alignment`

