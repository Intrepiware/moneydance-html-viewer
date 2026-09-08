# Problem Definition: Efficient personal Moneydance access on Android

- **Slug**: moneydance-schema-alignment
- **Created**: 2026-09-05
- **Inputs used**: intake.md; research.md; user clarifications recorded on 2026-09-05; user answers preserved below

## Problem Statement

When reviewing personal finances on an Android phone, the user can see only a handful of transactions at once, finds navigation clunky, and reports no way to search in the official app they use, making transaction review and lookup cumbersome. The user has begun work toward an alternative, but reliable access to their actual Moneydance records has not yet been established, so the desired improvement remains unavailable. [Sources: intake.md, User Clarifications; research.md, Users & Demand and Contract and display.]

## Affected Users & Stakeholders

- **User**: The project owner, reviewing their own USD financial records on a Google Pixel 8; uses checking sub-accounts for envelope accounting and wants to check their balances and find past infrequent purchases. Mobile entry and editing are unnecessary. [Sources: intake.md, User Clarifications; answers 1 and 3 below.]
- **Stakeholder**: The same person owns the scope and decides whether the usability benefit warrants ongoing personal effort. There is no intended customer base, marketing, or distribution. [Sources: intake.md, User Clarifications; research.md, Market & Context.]

## Goals

- Review more transactions at once on the user's phone while retaining readability. [Source: intake.md, User Clarifications.]
- Locate past purchases using description, memo, or amount across the full included history of the selected account and its included sub-accounts, subject to acceptable performance. [Sources: answers 2–4 below.]
- Move between the financial records of interest with less friction than the current experience. [Source: intake.md, User Clarifications.]
- Quickly see account and envelope sub-account balances. Account balances include subordinate accounts, while a selected account's transaction list contains only transactions assigned directly to it. Sidebar balances exclude future-dated transactions and retain inactive-descendant balance effects; the selected account transaction view includes future-dated activity. A running balance is required on every transaction row. [Sources: answers 3–5, 12, and 17 below.]
- Trust that displayed USD amounts, dates, account associations, and any included balances accurately represent the relevant Moneydance records, without unexplained omissions or duplication. [Source: research.md, Contract and display, Moneydance semantics, and References and UI state.]
- Review the full history of included active accounts on the Pixel 8 with acceptable waiting time. The user sets a target below 10 seconds including eventual decryption; this applies to initial loading plus eventual decryption. Search should be as fast as possible, with a provisional target below two seconds. [Sources: answers 1, 4, and 8 below.]

### Confirmed Scope and Preferences

- Preserve the existing UI as the starting point: the user reports that it displays well on the Pixel 8 and anticipates no major changes. [Source: answer 1.]
- Include full history for active accounts, with investment accounts and transactions deferred. Hide inactive accounts and their transactions while preserving their effect on balances. Include active income and expense categories in the sidebar for now. [Source: answer 4; follow-ups 12–13.]
- The user's requested lookup interaction is one textbox matching description, memo, and amount. Search should include the selected account and its included sub-accounts if performant; the normal unfiltered transaction list remains limited to the selected account. [Source: answer 2.]
- Transfers appear in each affected account with the appropriate amount and sign; both sides appear in All Accounts. These expected counterpart entries are not accidental duplicates. [Source: answer 14.]
- For the first iteration, show the transaction category when there is one and "Split" when there are multiple. Opening the breakdown is a later enhancement. [Source: answer 6.]
- Broader workflow intent remains viewing the data available in blob storage, refreshed by export, encryption, and upload at Moneydance close, with export/encryption/upload failures reported on the desktop and download/decryption failures reported in the website. Decryption and remembered-password behavior are future-phase work; password storage is a proposed implementation detail to review then. [Sources: answers 8–10.]

## Non-Goals

- Marketing, distribution, monetization, or serving other users.
- Entering, editing, or deleting transactions from the phone.
- Multicurrency viewing or exchange-rate conversion.
- Matching every capability of the official mobile app; success concerns the user's stated reading and lookup needs.
- Investment accounts and transactions in the first phase.
- Displaying inactive accounts or their transaction lists; their balance effects must still be retained.
- Detailed split breakdown in the first iteration; it is requested as a later enhancement.
- Decryption and password persistence in this phase.

These boundaries come from intake.md and answers 4, 6, 8, and 10 below. Full history is required; investment coverage is deferred. Active income/expense categories are included for now. Future-phase exclusions do not remove the broader remote-access intent.

## Success Metrics

These measures operationalize the stated goals. The user accepts the existing UI on the Pixel 8 as the starting point and has specified a below-10-second waiting-time target including eventual decryption. This target applies to initial loading plus decryption; below two seconds is the provisional per-search target from answer 15. No numerical density target is required.

| Outcome             | Measure and success signal                                                                                                                                                                                          | Baseline                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Transaction density | Preserve readable transaction viewing on the Pixel 8 using the accepted existing UI; no major redesign or fixed row-count target is required.                                                                       | User says the existing UI displays well; exact visible count is unmeasured.                                                                                        |
| Transaction lookup  | Find the most recent infrequent purchase using description, memo, or amount across full included history of the selected account and included sub-accounts, targeting below two seconds provisionally.              | User reports no search in the official Android app; lookup time is unmeasured.                                                                                     |
| Navigation          | Check an envelope sub-account balance and find a prior purchase with little friction, preserving the existing UI as the starting point.                                                                             | These two journeys are confirmed; their timings are unmeasured.                                                                                                    |
| Balance visibility  | Quickly identify account and sub-account balances, including subordinate accounts in sidebar totals; selected-account transactions exclude subordinate-account transactions, and every transaction row displays a running balance.                                        | Existing UI is accepted visually; sidebar future-date exclusion and inactive-descendant contributions are confirmed; per-transaction running balances are required; correctness remains to be verified. |
| Record fidelity     | Compare supported records and balances against the user's Moneydance 2024.4 at the same effective date, retaining inactive-account balance effects without displaying inactive accounts or their transaction lists. | Exports come from the user's main file; expected reference values and verified comparisons remain outstanding.                                                     |
| Responsiveness      | Initial load plus eventual decryption below 10 seconds; searches as fast as possible, provisionally below two seconds.                                                                                              | Exports measure approximately 52 MB; Pixel 8 timings are unmeasured.                                                                                               |

The answers establish the Pixel 8 as the target device, full included history as the lookup coverage, and two representative journeys: checking an envelope sub-account balance and finding the most recent infrequent purchase. Use description/memo/amount lookup for that second journey. For responsiveness, evaluate initial loading against the below-10-second target and search against the provisional below-two-second target; include decryption in the eventual end-to-end measurement, although it is outside this phase. Preserve the existing UI's accepted readability rather than requiring a redesign to meet an invented row count.

Sources: intake.md, User Clarifications; research.md, Data & Constraints; answers 1–17 below. Reference comparisons should use the user's reported Moneydance 2024.4 and records from their main file. Expected reference amounts and balances remain verification work; the user's description of that release as "latest" is not independently verified. Agreement on selected cases establishes evidence for those cases, not proof of all possible financial behavior.

## Cost of Inaction

The user continues using the current Android experience for mobile review, retaining the reported low information density, navigation friction, and lack of search. Their existing project components do not yet establish a trustworthy alternative for their real records. [Sources: intake.md; research.md, Users & Demand and Contract and display.]

There is no evidenced revenue loss, external customer impact, or commercial deadline. The cost is personal inconvenience and unfulfilled benefit from work already started; time lost has not been measured. Continuing without a replacement also avoids its future maintenance effort. [Sources: intake.md, User Clarifications; research.md, Evidence Against the Idea.]

## Open Questions

Original questions and user answers are preserved verbatim in items 1–10 for context; their original NEEDS CLARIFICATION labels do not mean every part remains unanswered. Follow-ups 11–16 have now been answered. Item 17 confirms that every transaction row requires a running balance. All listed follow-ups have answers; no unanswered clarification currently blocks shaping. Device, primary journeys, full history, investment deferral, initial split labeling, and future-phase password behavior have been recorded above. Reference financial values remain verification work.

1. [NEEDS CLARIFICATION: Which Android device, orientation, and text size should define the baseline, and what visible transaction count would be useful while remaining readable?]  
   **Answer:** I use a Google Pixel 8. The current UI displays well and probably does not require major changes.

2. [NEEDS CLARIFICATION: What information does the user typically remember when looking for a transaction, and should lookup cover one account, all included accounts, and what history period?]  
   **Answer:** To keep it simple, let's emulate Moneydance's built-in search, which is a single textbox that searches description, memo and amount.

3. [NEEDS CLARIFICATION: Which account-review journeys are most common, and what improvement in effort or completion time would make navigation satisfactory?]  
   **Answer:** Two main use cases: 1) I use a form of envelope accounting, where every dollar in my checking account is assigned to a purpose-specific sub-account. I often want the balance on a sub-account 2) I'd like to quickly search for when I last purchased an infrequent item (like athletic shoes).

4. [NEEDS CLARIFICATION: Which account types, investment information, inactive accounts, and history range are required?]  
   **Answer:** Display all active accounts. Inactive accounts affect the balance, but they (and their transactions) should be hidden. Investment transactions/accounts are a future phase of the project. I'd like the full history.

5. [NEEDS CLARIFICATION: Account and sub-account balances are required; which balance definition should be shown, should parent-account totals include subordinate accounts, and are per-transaction balances also needed?]  
   **Answer:** For consistency with Moneydance, the balance in the left toolbar should include the sum of all sub-accounts. However, the Transaction List should only include the transactions actually assigned to that account (i.e., ignore sub-accounts)

6. [NEEDS CLARIFICATION: How should split transactions and transfers be understood when reviewing an individual account versus multiple accounts together?]  
   **Answer:** For first iteration, just put Transaction category (if there's only one), and "Split" if there are multiple. In a fast-follow, I'd like the "Split" text to open a modal with the actual breakdown.

7. [NEEDS CLARIFICATION: Which known Moneydance examples and installed version will establish trustworthy reference amounts, dates, opening balances, and ordering for ordinary transactions, splits, and transfers?]  
   **Answer:** I use Moneydance 2024.4, which is the latest version. The large data exports were generated from my main Moneydance file.

8. [NEEDS CLARIFICATION: What initial loading and lookup delays are acceptable on the user's phone with the required history?]  
   **Answer:** Let's keep it < 10s, including decrypting the file (which is not in this phase)

9. [NEEDS CLARIFICATION: How current must remotely viewed records be, and what behavior is acceptable when a refresh fails or newer records are unavailable?]  
   **Answer:** The UI will display whatever data is in blob storage. On Moneydance close: export data, encrypt it, and push it to blob storage. Show an error message if any of those steps fail.

10. [NEEDS CLARIFICATION: What access and unlocking experience is acceptable for keeping these personal financial records private on the phone?]  
    **Answer:** This will be a future phase. The UI will store the last working password as a cookie. If the cookie isn't present or fails to decrypt the file, the UI displays a modal asking for the password.

### Follow-up Questions

11. **Search scope:** Should description/memo/amount search cover only the selected account, or all included active accounts? The "last purchased athletic shoes" use case may span multiple accounts.
    **Answer:** If performant, search the selected account and all sub-accounts.

12. **Balance meaning:** Should balances include future-dated transactions? Are per-transaction running balances required? Should inactive descendants contribute to the displayed parent balance? Your answers suggest yes to the last point, but please confirm.
    **Answer:** 1) Moneydance does not consider future balances in the sidebar, but does in the transaction view when an account is selected. 2) Yes, although in practice, I only make an account inactive when its balance is $0.

13. **Account coverage:** I interpret "all active accounts" as all active non-investment accounts for this phase. Should income and expense categories also appear in the account sidebar?
    **Answer:** For now, yes. We may improve navigation/usability later.

14. **Transfers:** Should a transfer appear in each affected account's register with that account's amount and sign? In the existing "All Accounts" view, should both sides appear, or should each transfer be represented once?
    **Answer:** 1) Yes. 2) Both sides should appear.

15. **Performance:** Is the below-10-second target for initial loading, including eventual decryption? What response time is acceptable for each search once the data is loaded? Applying 10 seconds to searches would permit a sluggish experience.
    **Answer:** 1) Yes, loading + decryption. 2) As fast as possible, but sub-2 second?

16. **Failure messages:** Should export/encryption/upload failures appear on the desktop, while download/decryption failures appear in the website? This seems consistent with your workflow, but is not yet explicit.
    **Answer:** Yes, the process should be exactly as you described it.

Password storage will be reviewed in the future security phase. Expected Moneydance balances and transaction examples are still needed for verification; they are not additional user-facing scope questions. The underlying technical uncertainties remain in research.md.

### Final Clarification (Resolved)

17. **Per-transaction running balances:** Are running balances required on each transaction row? Answer 12 describes future-date behavior and confirms inactive-account contributions, but does not clearly answer this separate part of the question.
    **Answer:** Yes, required on each transaction row.

Interpretation for shaping: search may include descendant-account transactions even though the normal selected-account register does not. The requested descendant search is conditional on performance; if it cannot meet the provisional below-two-second target, the tradeoff remains to be discussed rather than silently narrowing search. Sidebar totals exclude future-dated transactions, while the selected-account transaction view includes them. These are the user's desired behaviors, not newly verified claims about the Moneydance API.

