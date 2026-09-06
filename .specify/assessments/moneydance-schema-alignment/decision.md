# Decision: Complete the existing Moneydance viewer's real-data experience

- **Slug**: moneydance-schema-alignment
- **Decided**: 2026-09-05
- **Verdict**: go
- **Artifacts reviewed**: intake.md; research.md; problem.md; concept.md; project constitution template

## Scorecard

| Criterion | Rating | Justification |
| --- | --- | --- |
| Problem validity | strong | The sole intended user identifies two concrete journeys—checking envelope sub-account balances and finding past purchases—and has clarified the desired behavior in problem.md, answers 1–17. |
| Evidence strength | adequate | Direct user requirements, existing exporter/viewer code findings, and measured export sizes establish a real integration gap. Research's provisional API evidence and absent runtime validation limit confidence in implementation, not the existence of the problem. |
| Value vs. inaction | strong | Completing the already accepted UI addresses the user's reported Android navigation and search pain; doing nothing leaves those needs unmet. Market demand and mobile editing are irrelevant to the confirmed personal scope. See problem.md, Goals and Cost of Inaction. |
| Feasibility / appetite | adequate | Concept Option B reuses existing components and bounds work to real-data viewing. Its medium appetite is only a proposal: actual time/cost fit is unknown, with no approved deadline or effort budget. This supports specification, not a delivery commitment. |
| Strategic fit | strong | The option directly matches the personal, read-only, USD-only goals and preference to preserve the UI. The constitution is an unfilled template, so no ratified constitutional principles or compliance claim are inferred. |
| Risk posture | adequate | Missing financial values, transfer/hidden-account behavior, full-history performance, and later security work are identified. Reference comparisons, device measurements, and deferred remote delivery are credible controls for proceeding to specification, but none is claimed to have passed. See research.md and concept.md, Assumptions to Validate. |

## Verdict & Rationale

**Go: the idea is worth specifying using Concept Option B.** Problem validity is strong, evidence is adequate, and a bounded recommended concept exists. The evidence is sufficient for a personal project because it comes from the actual intended user and concrete repository findings; no commercial validation is needed. The remaining uncertainties can be made explicit in the specification and subsequent validation without repeating assessment of the already settled user goals.

This decision permits the handoff to specification. It does not certify correct financial calculations, promise that full-history performance targets are achievable, approve a weeks-long budget, or declare the remote workflow ready. If reference balances cannot be reconciled or performance cannot meet the agreed scope, revisit feasibility rather than silently dropping running balances, history, or descendant search. The unconfirmed appetite must remain visible when planning creates an actual effort commitment.

The latest answers in problem.md govern user requirements. Earlier unanswered preference questions in intake.md and research.md are historical; concept.md already recognizes that precedence. Technical uncertainties in research.md remain valid. In particular, the requirement to show both transfer sides in All Accounts supersedes any generic concern about displaying an economic event twice: legitimate counterparts are intentional, accidental duplicate records are not.

## If go — Handoff to `$speckit-specify`

- **Problem**: The user needs quick, reliable access to envelope/account balances and past transactions on a Pixel 8, overcoming the reported density, navigation, and search limitations of their official Android app.
- **Chosen approach**: Concept Option B — complete the existing viewer's real-data experience, preserving its accepted presentation and allowing targeted exporter/viewer corrections. The earlier UI-adaptation recommendation is a candidate approach; this handoff does not prescribe architecture or a data model.

### In Scope

- Personal, read-only USD viewing on the Pixel 8 using the existing UI as the starting point.
- Full history of active non-investment accounts, including active income/expense categories in the sidebar for now.
- Hidden inactive accounts and their own transaction lists, while retaining their financial effects on included balances.
- Sidebar account totals that include subordinate accounts and exclude future-dated transactions.
- A normal selected-account transaction list containing directly assigned transactions only, including future-dated activity; a running balance on every transaction row.
- One search field considering description, memo, and amount across the selected account and included descendants if performant. This broader search scope does not change the ordinary register scope.
- A single category label or "Split" for multiple categories.
- Transfers shown with the appropriate sign and amount in each affected included account; both sides shown in All Accounts.
- Correctness and usability with the user's actual records, including reference comparisons and representative full-volume performance evidence.

### Out of Scope for This Phase

- Marketing, distribution, additional users, and commercial viability work.
- Transaction entry/editing/deletion, multicurrency conversion, investment account/transaction presentation, and detailed split breakdown/modal.
- Major UI redesign or broad replacement of all official-app capabilities.
- Automated close-triggered delivery, encryption/decryption, Azure upload/retrieval integration, password persistence, and deployment, following Concept Option B's bounded phase. This preserves the larger workflow for subsequent work rather than removing it from the project.

The later workflow intent remains: display the snapshot available in blob storage, refresh through export/encryption/upload at Moneydance close, report those failures on the desktop, and report download/decryption failures in the website. Remembered-password behavior is a future requirement; cookie storage is not an approved security design.

### Success Metrics

- The user can quickly check an envelope sub-account balance and locate the most recent infrequent purchase by description, memo, or amount, preserving the accepted Pixel 8 readability and navigation.
- Supported account amounts and running balances agree with Moneydance reference records at a defined effective date; legitimate transfer counterparts remain present without accidental duplicates or unexplained omissions.
- Search is as fast as possible with a **provisional target below two seconds**, measured on representative full history on the Pixel 8.
- Initial loading plus eventual decryption targets **below 10 seconds**. Measure this phase's loading performance without claiming the complete encrypted workflow target has been verified; decryption remains future work.
- No invented row-count threshold or major redesign requirement. Exact measurement conditions can be defined during specification.

### Carried-Forward Open Questions

1. **Running-balance interpretation**: Confirm the originating-account balance meaning in filtered/search and All Accounts views, same-day ordering, and the effective date used for sidebar totals. Running balances themselves are mandatory, not optional.
2. **Reference correctness**: Obtain expected balances and transaction cases from the user's reported Moneydance 2024.4; verify parent/split enumeration, signs, and opening balances. Indexed API excerpts have not established installed-version correctness.
3. **Hidden/deferred relationships**: Resolve active descendants beneath inactive parents and included-account transfers involving inactive or deferred investment accounts without losing valid effects on included records.
4. **Search precision**: Specify amount matching conventions and whether memo matching includes split memos. Treat descendant search as the intended conditional scope; discuss any performance-driven reduction explicitly.
5. **Performance conditions**: Establish representative data, device/browser/network conditions, and timing boundaries. Full-volume timings and decryption cost remain unmeasured.
6. **Effort boundary**: The proposed medium appetite is not an estimate or accepted budget. Make actual effort implications explicit during planning and revisit scope if necessary.

These are carried into specification/planning, not reasons to reopen the settled problem. They must not be silently converted into assumed user approvals or claims of completed verification.

### Suggested Next Invocation

```text
$speckit-specify Use the handoff in .specify/assessments/moneydance-schema-alignment/decision.md to specify the bounded real-data viewing feature. Follow problem.md's latest answers and concept.md Option B, preserving all confirmed balance, search, history, and phase boundaries. Carry unresolved details forward explicitly.
```
