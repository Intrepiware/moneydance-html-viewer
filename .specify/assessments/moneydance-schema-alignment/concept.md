# Concept: Reliable personal Moneydance viewing in the existing UI

- **Slug**: moneydance-schema-alignment
- **Created**: 2026-09-05
- **Recommended option**: B — Complete the existing viewer's real-data experience
- **Inputs**: problem.md; intake.md; research.md

The answered questions in problem.md are the current scope authority. They supersede earlier unresolved user-preference questions in intake.md and research.md, including search fields, account coverage, running balances, and performance expectations. Research's unverified financial semantics and performance measurements remain open.

## Options

### Option A — Prove the two personal journeys first

- **Sketch**: Use the existing UI with a manually supplied snapshot to demonstrate checking an envelope sub-account balance and locating a past purchase by description, memo, or amount. Limit the initial evidence to selected representative accounts and records, including their running balances. This is the smallest useful learning exercise, not a finished delivery of the full-history, all-active-account requirement.
- **Appetite**: **small (days), proposed and unconfirmed** — a time-box for learning, not an estimate that complete financial validation can be achieved in days. No user time budget has been supplied.
- **Trade-offs**: Tests the two valued journeys with minimal new scope and preserves the accepted UI. It sacrifices coverage and cannot establish full-volume performance or completion of the project goals. It is useful if confidence in real-data correctness is too low to commit to the broader option.
- **Rabbit holes**: Expanding a demonstration into a second throwaway viewer; polishing sample data while real balance discrepancies remain; treating selected-account success as proof of full-history correctness. [Basis: problem.md, answers 1, 3–5, and 17; research.md, Contract and display.]

### Option B — Complete the existing viewer's real-data experience

- **Sketch**: Keep the UI the user already likes and make it reliably display their actual USD records. The user can quickly inspect envelope and account balances, read the full history of included active accounts with a running balance on every row, and search descriptions, memos, and amounts across a selected account and its included descendants. Changes focus on making the export and viewer work together and supplying trustworthy financial information; this option does not require the export to mirror the mock UI's presentation format. A supplied snapshot is sufficient for this phase, while automated encrypted remote delivery remains later work.
- **Appetite**: **medium (weeks), proposed and unconfirmed** — a bounded budget category for completing the data/viewing experience, not a delivery estimate or approved commitment. Existing UI reuse supports this candidate scope, but financial correctness and approximately 52 MB exports prevent a defensible precise duration. If the unknowns exceed the eventual agreed budget, revisit the commitment rather than quietly dropping required balances or history.
- **Trade-offs**: Directly addresses both primary journeys and preserves existing UI investment. Full coverage exposes correctness and volume issues early. It requires more validation than field renaming and does not yet deliver automatic remote refresh or decryption. Targeted exporter and viewer changes may be necessary even though a major visual redesign is not expected.
- **Rabbit holes**: Recreating accounting behavior without reference values; ambiguous running balances in combined or filtered views; accidentally omitting active-account activity involving hidden accounts; broad UI redesign; turning performance work into an unlimited optimization project; pulling the later encryption/upload workflow into this scope. [Basis: problem.md, Goals, Confirmed Scope, answers 1–17; research.md, Data & Constraints.]

### Option C — Continue with the existing Moneydance tools

- **Sketch**: Keep the official mobile app and desktop Moneydance as the means of reviewing records, and leave the custom viewer unfinished. This is the do-nothing baseline, not a claim that another purchased product has been found to satisfy the user's needs.
- **Appetite**: **small (days) category; effectively no new build commitment**. There is no implementation estimate to make.
- **Trade-offs**: Avoids custom maintenance and unresolved export/viewer correctness work. It leaves the reported Android transaction-density, navigation, and search frustrations unresolved. Commercial demand is irrelevant to this personal decision.
- **Rabbit holes**: Spending substantial effort evaluating unrelated finance replacements or treating the official app's editing capabilities as necessary when the user explicitly does not need them. [Basis: problem.md, Cost of Inaction and Non-Goals; research.md, Market & Context.]

## Recommendation

Recommend **Option B — Complete the existing viewer's real-data experience**. The user has already accepted the UI on the Pixel 8; the remaining value is reliable access to their real balances and records. A limited demonstration would leave full history and account coverage unfinished, while doing nothing preserves the specific frustrations that motivated the project. This is a concept recommendation, not the next stage's go/no-go decision or an approved time commitment.

The recommended experience is bounded by the following confirmed outcomes, rather than a new visual design:

- **Coverage**: Full history for active non-investment accounts, including income/expense categories for now. Inactive accounts and their transaction lists stay hidden while their balance effects are retained.
- **Balance review**: Sidebar balances include subordinate accounts and exclude future-dated transactions. Selected-account registers include future-dated activity and only directly assigned transactions. Every transaction row has a running balance; a balance-free first release would not meet the clarified goal.
- **Lookup**: One search field considers description, memo, and amount. Search covers the selected account and included sub-accounts if performant, even though the ordinary selected-account register does not include descendant transactions.
- **Transaction interpretation**: Show a single category or "Split" for multiple categories. Transfers appear with the proper amount and sign in each affected included account, and both sides appear in All Accounts. Expected transfer counterparts must not be mistaken for accidental duplication.
- **Usability and speed**: Preserve the accepted UI and its readability on the Pixel 8. Search targets below two seconds provisionally. Initial loading must fit the eventual below-10-second loading-plus-decryption target; this phase cannot claim to verify that complete target while decryption is deferred.

These boundaries come from problem.md, answers 1–17. The earlier recommendation to perform adaptation on the viewer side remains compatible with Option B, but the detailed division of responsibilities belongs in later specification and planning, not this concept.

## Out of Scope (for the recommended option)

- Marketing, distribution, monetization, additional users, and commercial viability analysis.
- Mobile transaction entry, editing, or deletion.
- Multicurrency display and exchange-rate conversion.
- Investment accounts and investment transaction presentation in this phase. Treatment of their effects on included accounts must not silently corrupt those accounts' records or balances.
- Displaying inactive accounts or their own transaction lists; retaining their financial effects is still required.
- Detailed split breakdown and its requested modal; this is a later enhancement.
- Major UI redesign, new navigation concepts, or matching every official-app capability.
- Automated close-triggered export delivery, encryption/decryption, Azure upload/retrieval integration, password persistence, and deployment for this bounded data-alignment phase. This is a proposed phase boundary consistent with the current assessment focus and the user's deferral of decryption, not cancellation of the broader workflow. The later workflow retains desktop errors for export/encryption/upload failures and website errors for download/decryption failures.

## Assumptions to Validate

- **Appetite is unapproved**: The proposed medium budget is acceptable to the user. No calendar deadline, hours budget, or cost commitment has been inferred; the decide stage should expose this uncertainty.
- **Financial evidence can be obtained**: The user's Moneydance 2024.4 records can supply reference account totals, starting positions, and transaction running balances for the included account types. Research has not verified these values or installed-version behavior.
- **Running balances have an unambiguous meaning in every view**: A candidate interpretation is that each row retains its originating account's running balance, including in search and All Accounts, rather than accumulating only visible matches or mixing accounts. This is an assumption for specification to confirm, not a newly accepted user requirement. Same-day ordering and the as-of date for snapshot balances also require precise treatment there.
- **Hidden/deferred coverage can preserve visible correctness**: Inactive accounts, active descendants of inactive parents if present, and transfers involving deferred investment accounts can be handled without losing the included accounts' legitimate financial effects. The dataset's actual cases are unverified.
- **Full history is practical on the Pixel 8**: Representative data can meet the provisional search target and leave room within the eventual loading/decryption budget. File sizes are measured; device performance is not. If descendant search is too slow, discuss the tradeoff rather than silently narrowing coverage or dropping history.
- **Search semantics can be made precise without expanding scope**: The requested description/memo/amount matching is sufficient; exact amount matching conventions and whether split memos are included can be resolved in specification.
- **Limited UI changes suffice**: The accepted layout can expose required per-row running balances and account identity clearly on the phone, including combined search results. Visual acceptance of mock data alone has not demonstrated this.
- **The phase boundary is suitable**: A real-data viewing milestone is valuable before automated encrypted remote delivery. Later work still needs to validate the complete under-10-second experience and the chosen refresh/access behavior.

Sources for these uncertainties: problem.md, Success Metrics and answers 1–17; research.md, Data & Constraints and Gaps & Open Questions. No runtime verification, source modification, or large-export parsing was performed during shaping.

## Next Step

`$speckit-assess-decide slug=moneydance-schema-alignment`
