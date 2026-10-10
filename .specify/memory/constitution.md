<!--
Sync Impact Report
Version: 1.2.0 → 1.3.0 (tabular manual test cases and concise completion evidence)
Principles modified/added: none
Sections modified: Development and Review — Manual Testing Gate
Sections added: Development and Review — Manual Test Case Format
Sections removed: none
Deferred placeholders: none
Dependent templates and commands consume this constitution at runtime; no template changes.
Existing acceptance records remain valid; new or substantively revised manual cases use tables.
No manual/source/device checks were executed by this documentation update.
-->

# Moneydance Personal Viewer Constitution

## Core Principles

### I. Financial Fidelity

Displayed amounts and balances MUST preserve Moneydance's account relationships, signs,
opening balances, and transaction effects. Changes MUST NOT invent missing monetary values,
substitute zero for unknown balances, or silently omit required records. Legitimate transfer
counterparts MUST remain distinguishable from accidental duplicates.

Filtering, searching, and pagination MUST NOT change an entry's originating-account running
balance. Hiding an account MUST NOT discard its required financial contribution. Monetary
calculations MUST preserve USD cent precision and reject unsupported or unsafe values.
Reference comparisons MUST establish correctness; schema validity alone is insufficient.

### II. Moneydance Runtime Compatibility

The exporter MUST remain a Moneydance-compatible Python file runnable under **Jython 2.7**.
Exporter code and in-Moneydance probes MUST use compatible syntax and dependencies available
in that environment. Python 3-only features and CPython-only native dependencies MUST NOT
be required for exporter execution.

Exporter changes MUST be validated inside Moneydance with its provided account-book context.
Standalone tests MAY supplement this validation but MUST NOT be represented as proof of
Moneydance compatibility. Export and verification operations MUST NOT modify financial
records in the source book.

### III. Personal Use and Data Privacy

This project serves its owner's personal, read-only USD viewing needs. Marketing,
distribution, multiple-user support, and mobile transaction editing MUST NOT be introduced
without an explicit change of project scope.

Private exports, account details, and passwords MUST NOT be committed, published, or included
in routine logs. Documentation and shareable fixtures MUST use synthetic or sanitized data.
Future remote delivery and password persistence MUST have an explicit design and validation
before use with private data; a proposed storage technique is not evidence of its suitability.

### IV. Simple, Purposeful User Experience

Scope MUST remain as tight and limited as possible while satisfying confirmed requirements.
When multiple approaches satisfy those requirements, prefer the simplest maintainable option.
Additional features, abstractions, and operational machinery MUST be justified by a current
need rather than hypothetical future use. Simplicity MUST NOT silently remove required behavior.

The existing accepted UI MUST remain the starting point. Changes MUST serve a confirmed
need such as balance visibility, transaction readability, search, correctness, or measured
performance. Framework migrations, major redesigns, and abstractions for hypothetical future
features MUST have a concrete justification tied to those needs.

For the current load-once scope, the viewer MUST request its configured export once per page
load and use memory for account selection, searching, and paging. It MUST NOT introduce
polling, dataset history, or in-page replacement machinery without an explicit requirement.
Implementation choices such as workers or balance timelines are not constitutional mandates;
simpler approaches MAY replace them when they preserve the accepted behavior.

### V. Evidence-Based Validation

Tests and reviews MUST target financial correctness and actual user journeys rather than
merely mirror implementation. Relevant changes MUST cover account and sub-account totals,
running balances, transfers, hidden contributions, search, date boundaries, and failure
states. Full-history performance MUST be measured on the target Pixel 8 before claiming
phone acceptance; desktop emulation alone is insufficient.

Reports MUST distinguish specification checks, synthetic tests, source-runtime comparisons,
and device measurements. An unexecuted check MUST be reported as unverified, not passed.
Performance problems MUST NOT be resolved by silently dropping required history, balances,
or descendant search coverage. Reversible documentation changes require appropriate review,
not an invented obligation to run application tests.

### VI. Restrained, Trusted Dependencies

Direct dependencies and their transitive dependencies (subdependencies) MUST be used sparingly.
Each added dependency MUST have a documented justification explaining the need and why existing
platform capabilities or a simpler approach are insufficient. Review its transitive dependency
footprint as part of that justification; avoid unnecessary packages and dependency chains.

Dependencies MUST have a demonstrated reliability and security track record and be well
respected within their respective communities. Selection MUST be supported by evidence such
as established usage, maintenance history, and responsible handling of security issues;
popularity alone is insufficient. Apply this rule to development tooling as well as runtime
packages, and review material dependency changes before adopting them.

## Project Boundaries

- Account and sub-account balance review and description/memo/amount lookup are primary
  user outcomes. Preserve the accepted transaction density and navigation where possible.
- The current feature includes full history for active non-investment accounts and
  income/expense categories. Investment presentation, detailed split breakdown, encrypted
  remote delivery, password persistence, and deployment remain later-phase work as specified
  in the active feature. Their deferral is not permanent prohibition.
- The effective balance date is the user's local date captured at page load. Export time
  describes snapshot age and MUST NOT freeze the balance cutoff. Date-only transaction
  values MUST remain intact; only known exported activity may contribute.
- All Accounts currently has no overall balance or net-worth figure. Individual account
  totals and per-row originating-account running balances remain required.
- Numeric performance thresholds, matching details, and delivery contracts belong in the
  feature specification. The constitution MUST NOT be used to invent an effort budget or
  turn a provisional target into a claim of achieved performance.

## Development and Review

Specifications MUST express accepted user behavior, explicit scope boundaries, and measurable
success criteria. Plans MUST identify implementation choices, alternatives where material,
and verification dependencies. Changes to established requirements MUST be reconciled in
active artifacts before dependent implementation proceeds.

Each implementation review MUST check the six principles and applicable feature requirements.
Any proposed exception MUST state the reason, affected behavior, and validation consequences;
it MUST NOT silently weaken financial fidelity or runtime compatibility. Routine work already
within the user's authorized scope does not require a new approval ceremony.

Detailed design remains revisable. Keeping a document internally consistent does not justify
retaining unnecessary complexity. When actual evidence contradicts a design assumption,
record the finding and revise the approach while preserving confirmed requirements.

### Rule: Manual Testing Gate

1. **Mandatory Inclusion in tasks.md:** Every user story MUST include at least one explicit manual testing task under its execution tasks, or an explicit story-level exception with justification in `tasks.md`. Cover the main happy path, relevant failure paths and material edge cases, minimizing repetition. A flow may be omitted when setup is impractical; record the specific obstacle, uncovered behavior and alternative evidence (or remaining gap). Non-obvious but feasible setups MUST have detailed, reproducible instructions. Unavailable equipment or an unrun required test remains pending, not an implicit exception.
2. **Task Formatting:** Manual testing tasks MUST use `- [ ] [Manual Test] <description>`; task IDs and story labels may follow the tag. Include or link setup instructions and test cases following the Manual Test Case Format below.
3. **Completion Evidence:** Mark a manual task `[x]` only after a person executes its required steps and the expected results pass, or remaining steps have an explicit accepted omission under rule 1. Record tester, date, environment and completed test tables in the feature's acceptance record. A person's ✅ certifies every expected result in that row and is sufficient evidence without a prose restatement. Automated passes alone do not complete manual tasks. Failed or unrun steps remain unchecked unless their omission is explicitly accepted and documented; omitted steps MUST NOT be represented as passed.
4. **Sequential Blocking Gate:** Follow the user-story order in `tasks.md`. Implementation of the next story MUST NOT begin until all `[Manual Test]` tasks for every preceding story are complete (`[x]`). This includes the next story's implementation tests and fixtures. Documentation/planning for later stories and fixes/retests within the current story may continue. Justified omissions remain visible at the checkpoint and are not reported as passed tests.

### Rule: Manual Test Case Format

New manual test cases and substantive revisions to existing cases MUST use Markdown tables
with these columns, in this order: **Step**, **Action / Instruction**, **Expected Result**,
**Status**, **Notes**. This applies to manual walkthroughs in test plans, quickstarts and
acceptance records. Existing completed records remain valid without reformatting. Automated
test code and the task checkboxes in `tasks.md` retain their own formats.

Each case MUST have a stable identifier linked to its manual task, such as A1 for T045,
and each row MUST have a unique step identifier such as A1.1. Actions MUST be reproducible;
expected results MUST state all observations needed to pass the row. Split rows when actions
or expectations become difficult to scan or can usefully be checked independently. Include
setup, test data and the required device/environment before the relevant table or by a clear
link. Keep table text concise to reduce wrapping.

The following status meanings MUST appear in the plan:

- **⬜**: Not run. Initialize every new step with this visible placeholder.
- **✅**: A person performed the action and observed every stated expected result.
- **❌**: A person performed the action and observed an unexpected result.

Blank status cells in existing records MAY be read as not run. A blocked step MUST remain
⬜ with the obstacle recorded in Notes. An explicitly accepted omission MUST identify the
affected case or steps, who accepted it, the date, reason and remaining unverified behavior.
It MAY be recorded as a short exception beside the table; it MUST NOT receive a ✅.

Record tester, actual test date, browser/version, device and test URL/environment once per
run; repeat only when these change. Notes are required only for unexpected results, blockers,
retests or measurements explicitly requested in the case. A successful step MUST NOT require
duplicate narrative evidence or a separate prose result summary. When a measurement is
needed, name it in advance and provide its entry space, such as a request count in Notes.

Reviewers MUST assess completed rows against their written expectations and MUST NOT add
unstated conditions when evaluating a pass. A newly discovered requirement MUST become a
separate explicit case or a clearly identified revision requiring its own verification.
Retests MUST retain the original failure and record the later outcome and date.

Example structure (replace the example content when authoring an actual case):

| Step | Action / Instruction | Expected Result | Status | Notes |
| --- | --- | --- | :---: | --- |
| A1.1 | Reload the specified test page. | Accounts is selected. | ⬜ | |
| A1.2 | Activate Categories. | Categories becomes selected. | ⬜ | |

This format keeps actions and acceptance criteria together, makes remaining work visible,
and avoids requiring testers to rewrite successful observations.

## Governance

This is the first adopted constitution; the previous file was an unfilled template. Explicit
user instructions govern project intent. When the user changes a constitutional constraint,
record the amendment and reconcile affected active artifacts; do not treat stale text as a
reason to ignore the new instruction.

Amendments MUST describe the changed principles, rationale, and effects in a Sync Impact
Report. Use semantic versioning: MAJOR for incompatible removals or redefinitions, MINOR for
new principles or materially expanded guidance, and PATCH for non-semantic clarification.
Preserve the initial ratification date and update the last-amended date when changing content.

Planning and implementation reviews MUST read the current constitution and report material
conflicts. Template examples are not project rules. Constitution updates do not themselves
implement features or authorize deployment. Dependent documents MUST be reviewed when an
amendment affects them, without rewriting unrelated templates or source files as a side effect.

**Version**: 1.3.0 | **Ratified**: 2026-09-06 | **Last Amended**: 2026-10-10
