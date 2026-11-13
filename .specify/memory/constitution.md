<!--
Sync Impact Report
Version: 1.5.0 → 1.5.1
Section clarified: Development and Review — Rule: Acceptance Criteria
Reason: Correct the wording to express the owner's intended separation of functional
requirements from story acceptance criteria. Require concrete, verifiable outcomes without filler.
Optional non-functional and regression-prevention sections remain unchanged.
Dependent artifacts reviewed: The spec template already separates functional requirements
from story acceptance criteria. No template change is needed for this clarification.
The existing 005-moneydance-rest-cli spec combines these sections under the prior wording.
Its alignment is deferred because the owner requested no changes to that document.
No runtime tests were executed for this documentation clarification.
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

The local automation extension MAY modify the open Moneydance book through authenticated
requests from the owner's tools. This is an explicit exception to the read-only project scope.
Authorized writes MAY apply directly without a separate preview or commit step.
The extension MUST enforce write permission and the intended book identity.
It MUST preserve financial fidelity and report save failures or uncertain outcomes accurately.
This exception does not authorize writes by the exporter, viewer, or read-only verification tools.

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

### Rule: Clear Document Writing

All documents, including specifications, plans, and task lists, MUST be clear, crisp, and easy
for people to understand. Use short, direct sentences and active verbs. Target a twelfth-grade
reading level. Keep explanations brief, but choose clarity over brevity when the two conflict.
Each sentence MUST express one idea or instruction. Author-created shorthand MUST be defined
unless its meaning is obvious.

### Rule: Acceptance Criteria

Specifications MUST use the heading **Acceptance Criteria** instead of **Acceptance Scenarios**.
Acceptance Criteria MUST describe observable conditions that show a user story is complete.

The first section MUST be a bulleted list of concrete behavior introduced or changed by the
story. Do not add a subheading for this list.

Each criterion MUST state a specific outcome that a reviewer can verify. Exclude background,
rationale, implementation advice, summaries, and general statements of intent.

Keep functional requirements in their own section. Acceptance criteria MUST apply those
requirements to the story rather than repeat them verbatim. Reference requirement identifiers
when useful.

Avoid criteria that restate the story or duplicate another criterion. Include only criteria
that add a distinct acceptance condition. Follow the Clear Document Writing rule.

Include a non-functional section only when the source requirements contain non-functional
requirements. It MUST use the bold heading **Non-Functional Requirements**. Its requirements
MUST appear as a bulleted list and follow the Clear Document Writing rule. Authors MUST NOT
invent requirements to populate this section. Omit the section when no non-functional
requirements apply.

Include a regression-prevention section only when the source requirements identify existing
behavior that the ticket must preserve. It MUST use the bold heading **What Must Not Change**.
Its items MUST appear as a bulleted list and follow the Clear Document Writing rule. Each item
MUST state unambiguously that an existing feature must continue to behave in a specified way.
For example: "The Payment Page MUST continue to send an e-receipt to the payer after completing
a payment." Authors MUST NOT invent items to populate this section. Omit the section when no
specific existing behavior needs protection.

### Rule: Manual Testing Gate

1. **Mandatory Inclusion in tasks.md:** Every user story MUST include at least one explicit
   manual testing task under its execution tasks. Otherwise, `tasks.md` MUST state and justify
   a story-level exception. Cover the main happy path, relevant failure paths, and material
   edge cases without needless repetition. A flow MAY be omitted when setup is impractical.
   Record the obstacle, uncovered behavior, and alternative evidence or remaining gap.
   Non-obvious but feasible setups MUST have detailed, reproducible instructions. Unavailable
   equipment or an unrun required test remains pending. It is not an implicit exception.
2. **Task Formatting:** Manual testing tasks MUST use
   `- [ ] [Manual Test] <description>`. Task IDs and story labels MAY follow the tag. Include
   or link setup instructions and test cases that follow the Manual Test Case Format below.
3. **Completion Evidence:** Mark a manual task `[x]` only after a person completes a passing
   run of every required test case. An explicitly accepted omission MAY satisfy this rule when
   it follows rule 1. Record the tester, date, environment, and completed checklists in the
   feature's acceptance record. Automated passes alone do not complete manual tasks. Failed,
   blocked, or unrun cases remain incomplete. Omitted steps MUST NOT be represented as passed.
4. **Sequential Blocking Gate:** Follow the user-story order in `tasks.md`. Implementation of
   the next story MUST NOT begin until all `[Manual Test]` tasks for every preceding story are
   complete (`[x]`). This includes the next story's implementation tests and fixtures.
   Documentation and planning for later stories MAY continue. Fixes and retests within the
   current story MAY also continue. Justified omissions remain visible at the checkpoint and
   MUST NOT be reported as passed tests.

### Rule: Manual Test Case Format

New manual test cases and substantive revisions to existing cases MUST use sequential Markdown
checklists. This rule applies to manual walkthroughs in test plans, quickstarts, and acceptance
records. Existing completed records remain valid without reformatting. Automated test code and
the task checkboxes in `tasks.md` retain their own formats.

Each case MUST have a stable identifier linked to its manual task, such as A1 for T045. Its
heading MUST combine that identifier with a descriptive name. Each step MUST have a unique,
ordered identifier such as A1.1. Every step MUST contain one reproducible action and its
expected result. Split a step when its actions or expected results are difficult to scan or
can be checked independently.

Each run MUST record the tester, actual test date, browser and version, device, and test URL or
environment. Include the required setup and test data before the checklist or link to them.
Retests MUST be separate runs beneath the same test case. They MUST preserve each earlier run,
including its failure or blocker.

Steps MUST run in listed order. Use `[x]` only when a person performed the step and observed
every expected result. Leave all other steps unchecked. A failure or blocker is terminal for
that run. Stop execution immediately. In a failed or blocked run, the first unchecked step is
the terminal step. All later unchecked steps were not run.

Every run MUST end with exactly one of these results:

- `**Result:** NOT RUN`
- `**Result:** PASS`
- `**Result:** FAIL at <step ID> — <observed problem>`
- `**Result:** BLOCKED at <step ID> — <obstacle>`

A run is `PASS` only when every step is checked. A successful step MUST NOT require duplicate
narrative evidence. A failure result MUST describe the unexpected observation. A blocked
result MUST describe the obstacle. When a measurement is required, name it in the expected
result and provide a clear place to record it.

An explicitly accepted omission MUST identify the affected case or steps, who accepted it,
the date, the reason, and the remaining unverified behavior. It MUST NOT be checked or reported
as passed.

Reviewers MUST assess checked steps against their written expected results. They MUST NOT add
unstated pass conditions. A newly discovered requirement MUST become a separate test case or a
clearly identified revision that requires its own verification.

Example structure (replace the example content when authoring an actual case):

```markdown
## A1 — Switch Account Views

### Run 1

**Tester:**  
**Date:**  
**Browser:**  
**Device:**  
**Environment:**

- [ ] A1.1 — Reload the specified test page.

  **Expected:** Accounts is selected.

- [ ] A1.2 — Activate Categories.

  **Expected:** Categories becomes selected.

**Result:** NOT RUN
```

This format keeps actions and expected results together. It makes the stopping point and
remaining unrun work visible without a wide table.

Measurement example:

```markdown
## P1 — Measure Export Requests During Page Load

### Run 1

**Tester:**  
**Date:**  
**Browser:**  
**Device:**  
**Environment:**

- [ ] P1.1 — Clear the browser's network log, then reload the viewer.

  **Expected:** The viewer makes exactly one request for the configured export file.
  **Measured:** \_\_\_ requests

- [ ] P1.2 — Wait 30 seconds without interacting with the page.

  **Expected:** The viewer makes no additional requests for the export file.
  **Measured:** \_\_\_ additional requests

**Result:** NOT RUN
```

The expected result MUST name the measurement and its unit. The measured field MUST record the
observed value before the step can be checked.

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

**Version**: 1.5.1 | **Ratified**: 2026-09-06 | **Last Amended**: 2026-11-12
