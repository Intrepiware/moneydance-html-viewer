# Feature Specification: View Real Moneydance Data

**Feature Branch**: No feature branch created; current branch is `master` (no branch hook registered).

**Created**: 2026-09-05

**Status**: Draft — quality reviewed; ready for planning

**Input**: Specify the bounded real-data viewing feature from `.specify/assessments/moneydance-schema-alignment/decision.md`, following the latest problem answers and Concept Option B.

## Clarifications

### Session 2026-09-05

- Q: When All Accounts is selected, should the UI display an overall balance? → A: No. Omit the overall balance and defer net worth; retain individual account and sub-account balances.
- Q: In search results and All Accounts, should each transaction's running balance remain the balance of its own account immediately after that transaction? → A: Yes. Every row retains its originating account's running balance, unchanged by searching or filtering.
- Q: Should numeric searches match part of an amount, or only the exact amount? → A: Partial matching: 50 matches both 50.00 and 150.25. Unsigned queries match either sign; an explicit minus sign restricts amount matches to negative amounts. Description and memo matching still applies.

- Q: Which date determines whether transactions are future? → A: Use the date the page loads in the user timezone. Previously future entries become current/past when that local date reaches them; exportDate remains the export instant.

- Q: Does the viewer need to track dataset generations or whether a dataset has been seen before? → A: No. Download the configured URL once per page load and use the in-memory data. No in-page replacement or dataset identity tracking; request IDs remain for overlapping queries.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Check envelope and account balances (Priority: P1)

As the sole user, I want to quickly inspect my checking envelope sub-accounts and their balances on my Pixel 8 using the existing familiar UI.

**Why this priority**: Knowing how much is assigned to a purpose is a primary reason for this project.

**Independent Test**: Supply reference records with a parent, active children, an inactive child with a nonzero contribution, and future-dated activity. Compare displayed sidebar totals with the agreed Moneydance reference at the user's local page-load date.

**Acceptance Scenarios**:

1. **Given** active non-investment accounts and income/expense categories, **When** the viewer loads, **Then** they are accessible in the account hierarchy, with USD balances and recognizable account names.
2. **Given** a parent with its own activity and subordinate balances, **When** its sidebar balance is shown, **Then** each contribution is counted once, including inactive descendant effects, and future-dated activity is excluded.
3. **Given** an inactive account, **When** browsing or searching, **Then** neither its account entry nor its own transaction rows appear; an included account's legitimate transfer counterpart and balance effects remain intact.
4. **Given** an active supported descendant beneath a hidden ancestor, **When** browsing, **Then** that descendant remains accessible without making the hidden ancestor selectable.

### User Story 2 - Review an account's full register (Priority: P1)

As the user, I want the selected account's full history, amounts, and running balances to agree with Moneydance, including future-dated entries in the register.

**Why this priority**: Correct amounts and balances make the viewer trustworthy; running balances are required on every row.

**Independent Test**: Review a reference account containing an opening balance, same-day transactions, splits, and transfers, without using search.

**Acceptance Scenarios**:

1. **Given** a selected parent account with children, **When** its unfiltered register is opened, **Then** only directly assigned transactions appear, newest first, across the full available history including future entries.
2. **Given** a transaction row, **When** it is displayed, **Then** its date, description, signed USD amount, memo when present, category label, and originating-account running balance are available, including on the Pixel 8.
3. **Given** one category allocation, **When** the row is shown, **Then** its category name appears; **Given** multiple allocations, **Then** the label is `Split` without a breakdown modal in this phase.
4. **Given** a transfer between included accounts, **When** either account is selected, **Then** its own correctly signed entry appears; **When** All Accounts is selected, **Then** both counterpart entries appear once each with their account identity.
5. **Given** the user switches from All Accounts to a child and back, **When** the combined list returns, **Then** it contains all included account entries rather than only the previous child's entries.

### User Story 3 - Find the last infrequent purchase (Priority: P2)

As the user, I want one search field for description, memo, and amount so I can find when I last bought something such as athletic shoes.

**Why this priority**: This addresses the user's reported missing Android search capability.

**Independent Test**: Search reference history with matches in a selected account, its descendants, unrelated accounts, transaction memos, split memos, and amounts.

**Acceptance Scenarios**:

1. **Given** a selected account, **When** a nonempty search is entered, **Then** matching directly assigned and included descendant entries appear newest first, without unrelated-account entries.
2. **Given** a match only in a memo, including an allocation memo, **When** the user searches that text, **Then** the associated account transaction appears once for that account entry.
3. **Given** a result whose earlier transactions are not matches, **When** the result is displayed, **Then** its running balance remains the originating-account balance, not a total of visible matches.
4. **Given** a descendant search, **When** the search is cleared, **Then** the normal selected-account-only register returns. Searching All Accounts covers all included entries.
5. **Given** no matches, **When** results are ready, **Then** an explicit no-results state appears without changing sidebar balances.

### User Story 4 - Open a trustworthy snapshot (Priority: P2)

As the user, I want a supplied snapshot to load with its date visible and errors to be clear, so missing data is not mistaken for a zero balance or empty history.

**Why this priority**: Real records and large history must be usable before remote delivery is introduced.

**Independent Test**: Open valid, empty, malformed, incomplete, and unavailable snapshots in the existing viewer.

**Acceptance Scenarios**:

1. **Given** a valid snapshot, **When** loading completes, **Then** its effective date and included records are available without modifying the source records.
2. **Given** malformed or insufficient financial data, **When** loading is attempted, **Then** a visible error identifies that records cannot be reliably displayed; the viewer does not invent balances or silently omit affected records.
3. **Given** a failed initial load, **When** failure is reported, **Then** a visible error appears and the user can retry by reloading the page; no prior-session data is restored.
4. **Given** a valid snapshot with no included records, **When** loading completes, **Then** an explicit empty state appears; this is distinguishable from a loading failure.
5. **Given** a valid export timestamp, **When** the toolbar is displayed, **Then** its bottom-left corner shows `As of:` followed by the export date and time in the user's device timezone and locale, with a timezone indicator appropriate to that instant.
6. **Given** an export timestamp near midnight or a daylight-saving transition, **When** viewed in another timezone, **Then** the label represents the same instant with the correct local date, time, and timezone indicator; date-only transaction dates stay unchanged; the balance cutoff is the local date captured on page load, which may differ between timezones.

### Edge Cases

- Active accounts beneath hidden inactive or investment ancestors remain reachable; hidden ancestors are not selectable.
- Transfers to excluded accounts retain the included side. Excluding investment presentation does not remove valid cash-account effects.
- Zero balances, negative balances, accounts with no transactions, and opening balances remain valid cases.
- Same-day ordering is stable and matches the source register for running-balance comparisons; paging and filtering do not change a row's balance.
- Repeated descriptions or equal amounts do not justify deduplication; legitimate transfer counterparts remain separate account entries.
- Missing optional memo or check number is acceptable; missing information needed to establish correct amounts or balances is an error.
- Multiple allocations with identical category names still receive `Split`; a missing category displays `Uncategorized` rather than a fabricated category.
- Reloading an old snapshot on a later local date includes previously future-dated entries that are now due. Only entries already present in that snapshot are considered; no newer source activity is invented. The export timestamp stays unchanged.
- Missing or invalid export timestamps produce `As of: unavailable`, never a fabricated current time or an invalid-date string. Any separate financial-data validation error remains visible.
- Income/expense categories do not turn the combined view into an implied net-worth calculation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The viewer MUST provide personal read-only USD access to a supplied Moneydance snapshot, preserving the existing UI's navigation and readability on the Pixel 8; targeted changes needed for these requirements are allowed.
- **FR-002**: The viewer MUST include all active non-investment accounts and active income/expense categories and their full available history, without a rolling history cutoff. Included descendants MUST remain accessible beneath excluded ancestors.
- **FR-003**: Inactive accounts and their own entries MUST be hidden everywhere. Their effects on included-account balances and included transfer counterparts MUST be preserved. Investment presentation MUST be excluded without losing included-account financial effects.
- **FR-004**: Sidebar balances MUST represent own-account plus subordinate-account contributions once each, including hidden inactive descendants, through the user-local page-load date, excluding later-dated transactions. Each contribution MUST use the same balance convention as its Moneydance reference.
- **FR-005**: A normal selected-account register MUST show only directly assigned entries, including future-dated entries, newest first. All Accounts MUST show all included account entries. Switching views MUST NOT lose entries.
- **FR-006**: Every transaction row MUST provide its originating account's running balance after that transaction, including in search and All Accounts. Starting balances and prior nonmatching transactions MUST be reflected. Same-day ordering MUST be deterministic and consistent with the source reference; changing page or filter MUST NOT recalculate balances from visible rows alone.
- **FR-007**: Rows MUST expose date, description, signed USD amount, running balance, category or `Split`, memo and check number when supplied. Combined and descendant results MUST identify the originating account. Required running balances MUST be accessible on the target phone, not solely in a desktop-only view.
- **FR-008**: One allocation MUST show its category, multiple allocations MUST show `Split`, and no supplied category MUST show `Uncategorized`. This phase MUST NOT require a split breakdown modal.
- **FR-009**: Transfers MUST appear once per legitimate included account entry with that account's amount and sign. All Accounts MUST retain both included sides; repeated legitimate transactions MUST NOT be merged merely because values or descriptions match.
- **FR-010**: One search field MUST consider description, transaction memo, allocation memos, and amount using the matching defaults in Assumptions. An entry matching multiple fields MUST appear only once for that account entry.
- **FR-011**: Search MUST cover the selected account and included descendants, or all included entries when All Accounts is selected. Clearing the query MUST restore the ordinary register scope. The performance condition does not authorize silent removal of descendant coverage or history; any reduction requires an explicit scope decision.
- **FR-012**: Results MUST be newest first, retain full-account running balances, and expose no-results and valid-empty states distinctly from failures. Search MUST NOT change sidebar balances.
- **FR-013**: The viewer MUST identify the export timestamp and use the user-local page-load date for balance cutoffs. Failed or invalid loads MUST produce a visible error without fabricated zero balances, silent data loss.
- **FR-014**: Supported amounts, account associations, dates, and balances MUST reconcile with reference Moneydance records at the same effective date. Missing required financial information MUST be reported as a failure rather than accepted as successful real-data viewing.
- **FR-015**: All Accounts MUST be a combined activity view without an overall balance or net-worth figure. Individual account and sub-account sidebar balances remain required.
- **FR-016**: The toolbar's bottom-left corner MUST display `As of:` followed by the loaded snapshot's export date and time, formatted in the user's device locale and timezone with a timezone indicator (abbreviation or UTC offset). It MUST show the export instant rather than load time and refer to the single snapshot loaded for this page session. Missing or invalid timestamps MUST display `As of: unavailable`. On mobile this label MUST be accessible in the toolbar when opened.

- **FR-017**: The viewer MUST request its configured snapshot URL once per page load and use the loaded data for account selection, search, and pagination without further snapshot downloads. It MUST NOT poll, replace datasets in-page, or track whether a dataset was previously seen. Reloading the page starts a fresh load and retries failures.

### Key Entities *(include if feature involves data)*

- **Snapshot**: A dated representation of Moneydance records with an export timestamp and sufficient information to establish supported balances and history.
- **Account**: A named financial account or income/expense category with status, account type, parent relationship, own activity, and balance contribution.
- **Account entry**: A transaction's effect on one account, including date, amount, description, memo, category allocations, and running balance.
- **Allocation**: A category or counterpart component with an amount and optional memo; several allocations may belong to one account entry.
- **Transfer**: Related effects on accounts; both included counterparts remain visible in combined activity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The user completes both primary journeys—finding an envelope balance and the latest matching infrequent purchase—on the Pixel 8 without desktop assistance and accepts the existing UI's retained readability. Record completion of both journeys; no invented row-count target applies.
- **SC-002**: For the agreed reference set covering ordinary debit/credit, opening balance, same-day entries, split, transfer, future activity, and hidden-account effects, 100% of checked dates, account assignments, signed amounts, sidebar totals, and running balances agree with Moneydance at the same effective date, to USD cent precision.
- **SC-003**: Reference full-history coverage contains zero unexplained missing or extra account entries, while retaining both legitimate transfer counterparts in All Accounts and excluding hidden-account entries.
- **SC-004**: For a recorded set of at least 20 representative description, memo, amount, descendant, and no-match queries over full representative history on the Pixel 8, each search displays usable results in under two seconds after query submission. This operationalizes the user's provisional target; failure triggers review, not automatic scope reduction.
- **SC-005**: In five recorded initial-load trials with representative full history on the Pixel 8, supplied-snapshot loading reaches usable records in under 10 seconds per trial under the recorded test conditions. The broader requirement remains loading PLUS decryption under 10 seconds; passing this phase alone does not prove that later target or allocate a decryption budget.
- **SC-006**: Every reference row retains the same running balance across paging, search, and combined views, and every tested invalid load gives an explicit failure rather than misleading successful data.
- **SC-007**: For reference export instants spanning a local-date boundary and a daylight-saving transition, the bottom-left toolbar label shows the correct local date, time, and timezone indicator in two tested device timezones. Missing/invalid timestamps show the unavailable label, and searching or paging never changes the displayed export time.

## Assumptions

### Documented Defaults for Review

- Latest answers in [problem.md](../../.specify/assessments/moneydance-schema-alignment/problem.md) take precedence over earlier assessment unknowns. [decision.md](../../.specify/assessments/moneydance-schema-alignment/decision.md) and Concept Option B define the phase boundary.
- The user confirmed that running balance means the originating account's balance after the entry in every view, not the sum of matching entries or a combined balance. Searching and filtering do not change it.
- The effective date is the calendar date captured when the page loads in the user device timezone, not an exported financial cutoff. Keep it fixed for that page session; reload captures a new date. Transactions dated on or before it count toward sidebar balances. Running balances and transaction date strings remain unchanged.
- The user-provided `exportDate` example establishes the source of the `As of` label. The user's timezone defaults to the device timezone; locale controls date/time presentation. The balance cutoff is independently captured from the user-local page-load date; formatting the export timestamp does not change that cutoff or date-only transaction dates. The supplied code illustrates desired behavior rather than mandating its parsing or rendering technique.
- Search trims surrounding whitespace and uses case-insensitive substring matching of the whole query against description and both transaction/allocation memos. Blank input clears search. Numeric queries match substrings of the USD amount written with two decimal places after removing currency symbols and grouping commas; an explicit minus sign restricts amount matches to negative amounts, while unsigned queries may match either sign. Description and memo matches remain independently eligible. Example: `115.40` matches `-115.40`; `-115.40` does not match `115.40`. Partial amount matching and sign behavior are user-confirmed; text normalization remains a documented default. No exact Moneydance search parity is claimed.
- An included account's transfer to an excluded account remains included. Excluded ancestor visibility must not hide supported active descendants. Financial relationships remain intact even when an ancestor is omitted from navigation.
- The user confirmed that All Accounts has no overall monetary total or net-worth figure in this phase. This does not remove any requested individual account or sub-account balance or per-row running balance.
- Performance trials use the Pixel 8 in its normal browser and orientation with the user's full representative history (existing exports are approximately 52 MB). Record browser, snapshot size/date, network conditions, and cache state. Load timing starts when opening the supplied snapshot and ends when balances and transaction rows are usable; search timing starts with the completed query and ends with rendered results. Numerical trial counts are validation defaults, not additional user requirements.

### Dependencies and Unresolved Verification

- The current exported data lacks explicit balances and transaction-level amounts required by the viewer. Successful implementation depends on obtaining sufficient trustworthy source information; how to do that belongs in planning.
- Reference values from the user's reported Moneydance 2024.4 are required. Parent/split semantics, signs, opening balances, same-day order, inactive contributions, and category display conventions remain unverified; old indexed documentation is not runtime proof.
- Full-volume mobile performance has not been measured. The provisional search goal and eventual combined loading/decryption goal remain risks to verify.
- Active descendants of excluded parents and transfers involving investments may or may not occur in the user's file; representative cases must cover the behavior even if absent from one snapshot.
- Constitution v1.1.0 governs financial fidelity, Jython 2.7 compatibility, privacy, simplicity, validation, and dependency restraint. No effort budget is approved; dependency selection must include the required justification and reliability/security evidence.

### Phase Boundaries

Marketing, distribution, multiple users, transaction entry/editing/deletion, multicurrency conversion, investment presentation, major UI redesign, and detailed split breakdown are excluded. Automated close-triggered delivery, encryption/decryption, remote storage integration, password persistence, and deployment are later work. This phase uses supplied data and does not publish financial records. Later workflow intent remains desktop export/encryption/upload errors and website download/decryption errors, with remembered-password behavior subject to later design review. No cookie-based password design is approved here.

### Required Exporter Compatibility

The user requires export_json.py to remain a Moneydance-compatible Python file running under **Jython 2.7**. Exporter changes must preserve execution inside Moneydance with its provided context. This is a mandatory compatibility constraint, not a proposed technology choice. Acceptance requires running the exporter in that environment; standalone Python 3 validation is insufficient.
