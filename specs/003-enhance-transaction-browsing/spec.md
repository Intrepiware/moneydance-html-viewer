# Feature Specification: Transaction and Category Browsing

**Feature Branch**: No branch created; no branch hook is registered.

**Created**: 2026-09-11

**Status**: Draft — specification quality reviewed

**Input**: Items 1–5 of Part 1 in [.workspace/future-enhancements.md](../../.workspace/future-enhancements.md), including the referenced desktop layout screenshot. Builds on accepted features 001 and 002.

## Clarifications

### Session 2026-09-11

- Q: Should a selected parent category include its subcategories in grouped transactions and totals? → A: No. Without search, include only transactions assigned directly to the selected category. Search retains existing descendant scope.

- Q: Should split details show the whole original transaction or only the selected register entry’s allocations? → A: Only the selected entry’s allocations, totaling its signed amount. A -$1,000 Rainy Day Savings entry shows its $1,000 transfer allocation, not the separate $4,000 Home Savings withdrawal.

## User Scenarios & Testing *(mandatory)*

All five stories have equal business priority (P1). Their order reflects estimated increasing implementation difficulty, not relative value. Planning must still respect dependencies; transfer navigation from split details is completed with US4.

### User Story 1 - Read desktop category labels (Priority: P1)

As the user, I want category text to have enough space on desktop instead of being squeezed beside a mostly empty description column.

**Why this priority**: The supplied screenshot shows excessive description space and category labels wrapping into narrow fragments.

**Independent Test**: Compare the current and updated desktop layout using the same synthetic rows and viewport, including a long description and multiword category.

**Acceptance Scenarios**:

1. **Given** a desktop register, **When** rendered, **Then** the category column receives at least one quarter of the combined description/category space, without clipping date, amount or balance columns.
2. **Given** long description and category content, **When** viewed on desktop, **Then** text remains readable through wrapping or the existing details affordance, and table headers align with their columns while scrolling.
3. **Given** a mobile viewport, **When** the same data is displayed, **Then** the desktop redistribution does not reduce existing amount/balance visibility or cause page-wide horizontal overflow.

### User Story 2 - Read transaction tags (Priority: P1)

As the user, I want to see a transaction's tags on its row without opening another view.

**Why this priority**: Tags add useful context while scanning history.

**Independent Test**: Display transactions with zero, one and several long tags on desktop and phone.

**Acceptance Scenarios**:

1. **Given** a tagged transaction, **When** its row appears in a register or search result, **Then** all its exported tags are readable and distinguishable from the description, memo and check number.
2. **Given** no tags, **When** the row appears, **Then** no empty tag placeholder is shown.
3. **Given** long tags or text resembling markup, **When** displayed, **Then** tags remain literal readable text, wrap as needed and do not obscure amounts or require page-wide horizontal scrolling on mobile.

### User Story 3 - Inspect transaction categories and splits (Priority: P1)

As the viewer user, I want to open a transaction's category details and understand every split without leaving the register.

**Why this priority**: A short category label or “Split” conceals the allocation details needed to understand a transaction.

**Independent Test**: Open a synthetic split transaction on desktop and phone, inspect all allocations, and close the details without losing the register position.

**Acceptance Scenarios**:

1. **Given** a transaction with multiple allocations, **When** its category label is activated, **Then** a dismissible details view shows only that selected register entry’s allocations, whose signed amounts total the selected entry’s amount, along with full category/account paths and memos, including repeated allocations to the same category.
2. **Given** a nested category, **When** details are opened, **Then** the complete path is readable, such as Personal:Dining:Convenient; leaf names alone do not obscure its identity.
3. **Given** a single-category or uncategorized transaction, **When** details are opened, **Then** the single allocation or an explicit uncategorized state is shown without invented amounts or categories.
4. **Given** long paths, memos or many splits on a phone, **When** details are read and dismissed, **Then** all content is reachable, the close control remains accessible, and the prior account, search, page and scroll position are preserved.

### User Story 4 - Follow a transaction to its register (Priority: P1)

As the user, I want to follow an account label in search results or a transfer allocation to the relevant register and find the exact transaction immediately.

**Why this priority**: Manually reopening an account and searching again interrupts reconciliation and review.

**Independent Test**: Follow a search result whose row is on a later page, and a transfer with similar-looking transactions, and verify the exact destination entry.

**Acceptance Scenarios**:

1. **Given** a search result with an account label beneath its description, **When** the label is activated, **Then** that account's unfiltered register opens, the correct page is selected, and the clicked entry is scrolled into view and visibly identified.
2. **Given** a transfer allocation in the details view, **When** its destination is activated, **Then** the supported destination account’s register opens at the corresponding destination-side entry, identified using the transaction relationship, even when another row has the same date, description or amount. Navigation stays in the current unlocked session without reloading the page or prompting for the unlock password again.
3. **Given** a destination entry hidden by the current search, paging or future-transaction disclosure, **When** navigation occurs, **Then** search is cleared, the necessary page/disclosure is selected, and the requested row becomes visible. Its future styling remains intact.
4. **Given** several legitimate destination entries for one transaction and account, **When** a transfer link is followed, **Then** all related entries are visibly identified and the first in the destination's display order is brought into view; none is arbitrarily discarded.
5. **Given** navigation on mobile, **When** the destination opens, **Then** any details overlay and sidebar close so the focused register row can be seen. Rapid successive navigation must not display an earlier destination's result.

6. **Given** a transfer allocation whose destination account is excluded or whose corresponding entries are unavailable, **When** its details are displayed, **Then** the destination has an explicit unavailable indication and does not offer navigation to a guessed row.

### User Story 5 - Browse categories by month or year (Priority: P1)

As the user, I want ordinary account navigation to omit income/expense categories and a separate sidebar navigation to review those categories with period totals.

**Why this priority**: Separating spending/income categories from accounts simplifies navigation and makes category history useful for review.

**Independent Test**: Open the default account navigation, switch to Categories, select a category spanning multiple years, and compare monthly and annual transaction totals with known source values.

**Acceptance Scenarios**:

1. **Given** a fresh viewer session, **When** account navigation appears, **Then** income/expense categories are absent from the Accounts list and are accessible through an icon-only Accounts/Categories switch beneath the sidebar title. Accounts is initially selected; each option has an accessible name, a descriptive tooltip and a visible selected state.
2. **Given** Categories navigation, **When** it is opened, **Then** included income and expense categories retain recognizable hierarchy and can be selected; switching navigation does not change financial eligibility or silently exclude existing rows from All Accounts search.
3. **Given** a selected category, **When** its register opens, **Then** transactions are grouped by calendar month, with year included in each period label and an exact signed transaction sum for each period.
4. **Given** monthly grouping, **When** the user switches to annual grouping, **Then** the same eligible transactions are grouped by calendar year and annual sums equal the corresponding monthly sums. Switching back restores monthly grouping without modifying amounts.
5. **Given** a period spanning more than one page, **When** any page of that period is viewed, **Then** its displayed total represents the entire matching period, not just rows on the current page. Continued period headers retain the same total.
6. **Given** a category search or future-transaction disclosure change, **When** results update, **Then** period totals use the complete matching set under that search and disclosure state, and that scope is evident to the user. Clearing search restores the unfiltered category totals.
7. **Given** a category with no matching transactions, **When** selected or filtered, **Then** a clear empty state is shown without fabricated activity periods.

### Additional visual requirement - Google Material icons

Added 2026-09-17. Replace Font Awesome throughout the viewer with Google Material icons, including existing utility controls. This is a small visual addition to US1; the five story IDs and their order remain unchanged.

| Location/account type | Required icon |
|---|---|
| Top-left branding and All Accounts | `checkbook` |
| Checking/Savings (BANK) | `account_balance` |
| Credit cards | `credit_card` |
| Expenses | `sell` |
| Income | `paid` |
| Loan | `payment_arrow_down` |
| Assets | `money_bag` |

**Acceptance scenarios**:

1. **Given** branding, All Accounts and each listed account/category type, **When** displayed, **Then** the exact mapped Google Material icon appears consistently wherever that type is represented.
2. **Given** existing utility controls or an account type without an explicit mapping, **When** displayed, **Then** an appropriate Google Material icon replaces Font Awesome without changing control behavior, accessible names or touch targets.
3. **Given** desktop/mobile and light/dark themes, **When** icons render, **Then** they remain legible and aligned without clipping or reducing transaction readability; no Font Awesome assets are loaded.

### Edge Cases

- Several categories share a leaf name: display their full ancestry in details.
- A transfer has equal-and-opposite rows, repeated allocations or more than one counterpart: preserve source relationships and every legitimate entry; do not identify by amount/date/description alone.
- Referenced accounts are inactive, excluded, unsupported or lack exported rows: show known allocation details, but clearly explain unavailable navigation.
- Split details are scoped to the selected register entry, not the whole parent transaction. For a -$1,000 Rainy Day Savings withdrawal funding part of a $5,000 repair, show only that entry’s -$1,000 allocation; omit the separate -$4,000 Home Savings withdrawal.
- A source amount or memo is absent: do not invent a value or turn an unavailable amount into zero. Required supported allocation amounts must be verified against source; unavailable unsupported counterpart amounts are explicitly labeled.
- A future target becomes visible through navigation: preserve the fixed page-load date and existing reset-to-hidden behavior on subsequent ordinary account selection.
- A category period crosses a year boundary, spans pages, contains refunds or nets to zero: labels, signed sums and grouping remain correct.
- Search includes descendants under existing search rules: count each matching category-register entry once; do not add account-side counterparts or opening balances to period activity totals.
- Details opened over a scrolled register: keyboard dismissal and return focus must not lose the user's place; mobile close controls cannot be offscreen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Activating a transaction category MUST open a mobile-friendly, dismissible breakdown (a modal is the preferred presentation) with only the selected register entry’s allocations, source-consistent signed amounts, complete paths and memos. Signed allocation amounts MUST total the selected entry’s amount when all amounts are available; other source-account portions of the original transaction MUST NOT be included.
- **FR-002**: Breakdown content MUST distinguish uncategorized entries, absent memos and unavailable amounts without fabricating data. Repeated splits MUST remain distinct.
- **FR-003**: Supported transfer destinations in the breakdown MUST navigate to the corresponding destination register entries. Excluded/unavailable destinations MUST be identified without misleading navigation.
- **FR-004**: Clicking the account label beneath a search-result description MUST open that account's register at the selected entry. Identity MUST be independent of display text and monetary coincidence.
- **FR-005**: Context navigation MUST clear conflicting search, select the destination page, reveal a future target if needed and visibly identify the destination entry or related entries. Both search-result account links and transfer links MUST navigate within the current unlocked session without a full page reload or another unlock prompt. Stale navigation results MUST NOT replace the latest requested destination.
- **FR-006**: Closing details without navigation MUST preserve account, search, grouping, pagination and scroll context and return keyboard focus to the activating control. Details MUST support keyboard dismissal and usable phone touch controls.
- **FR-007**: Rows MUST show all exported tags as literal text in ordinary registers and search results. Empty tags MUST NOT produce placeholders. This feature does not add tag search or tag reports.
- **FR-008**: Default Accounts navigation MUST omit income/expense categories and provide an icon-only Accounts/Categories switch beneath the sidebar title. Each option MUST have an accessible name, a descriptive tooltip, keyboard operation, a visible selected state and a mobile-friendly touch target. Switching options changes only the sidebar list until an account/category is selected. Category hierarchy, existing included/excluded eligibility and the As Of footer MUST be preserved.
- **FR-009**: Selecting a category MUST display only transactions assigned directly to that category when no search is active, grouped monthly by default, with a user control to switch to annual grouping. Monthly labels MUST distinguish the year; periods and their rows follow newest-first ordering with existing same-day order preserved.
- **FR-010**: Each period MUST show an exact signed USD sum of all matching category-register entries under the current search and future-disclosure state, independent of pagination. Opening balances and duplicate account-side representations MUST NOT be added. These activity sums MUST NOT replace source running balances or account sidebar balances.
- **FR-011**: Empty category results MUST have an explicit empty state. Period labels and totals MUST remain associated with their rows, including continued periods on another page.
- **FR-012**: Desktop category text MUST receive at least 25% of the combined description/category width; amount, balance and date remain readable and sticky headers remain aligned. Existing mobile transaction density MUST be preserved except where added tag content requires wrapping.
- **FR-013**: All features MUST operate on the already loaded, validated snapshot without additional downloads, page reloads or repeated unlock prompts for navigation, details, grouping or tags. Encrypted unlock, plaintext test mode, fixed effective date and export-time footer MUST retain their accepted behavior.
- **FR-014**: Financial signs, full included history, source running balances, hidden-account contributions and existing search matching MUST remain unchanged. Category separation MUST NOT silently alter the existing All Accounts result population or introduce an All Accounts balance.
- **FR-015**: Any source export changes found necessary during planning MUST preserve Moneydance/Jython 2.7 compatibility and read-only source behavior. No new financial records may be synthesized to compensate for missing source relationships.
- **FR-016**: Scope MUST remain limited to Part 1 items 1–5 of the enhancement list plus the user-requested Google Material icon replacement. Investments, positions, price downloads, net worth, reports, historical charts and additional Safari/iOS viewport remediation are excluded, as are transaction editing, new delivery scheduling and tag filtering.
- **FR-017**: The viewer MUST replace Font Awesome throughout with Google Material icons using the exact mapping in the additional visual requirement. Remaining control/account icons MUST use suitable icons from the same family. Preserve accessible control names, decorative-icon semantics, existing colors and usable layout/touch targets; remove the Font Awesome asset dependency.

### Key Entities

- **Register entry**: A source account-side transaction with its own identity, parent transaction relationship, date, amount, running balance, tags and allocation details.
- **Allocation**: One split's destination, full category/account ancestry, memo and source-consistent amount; may identify a supported transfer destination.
- **Navigation target**: A destination account and exact entry or related-entry set to reveal, independent of current filters and pages.
- **Category period**: A calendar month or year and the complete matching category-entry activity sum, not an account balance.
- **Viewing context**: Selected account/category, navigation section, search, grouping, page and future disclosure for the current loaded snapshot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In source-referenced synthetic cases covering single, multiple, repeated and transfer allocations, all expected selected-entry split paths, amounts and memos are displayed with no omitted or invented allocations. Where amounts are available, their signed sum equals the selected row’s amount; unrelated source-account portions are absent.
- **SC-002**: Every tested search-result and supported transfer link reveals the correct destination entries, including off-page and future targets; unavailable targets never focus an unrelated row. In an already unlocked session, these actions cause zero page reloads, zero additional snapshot downloads and zero unlock prompts.
- **SC-003**: All tags in the test cases are readable on desktop and at 360px and 412px phone widths, without horizontal page overflow or obscured amounts.
- **SC-004**: All monthly and annual totals exactly match independently calculated signed activity totals, including refunds, zero-net periods, search, future disclosure and page-spanning periods; annual totals equal the relevant monthly totals for the same set.
- **SC-005**: At 1280px and 1440px desktop widths, category content receives at least 25% of combined description/category width; date/amount/balance and sticky headers remain readable and aligned.
- **SC-006**: On desktop and Pixel 8 with the current full-history dataset, five representative details/navigation/grouping actions each complete within two seconds after activation, without another snapshot download. Measure and report actual device results; earlier accepted performance exceptions do not establish this feature's performance.
- **SC-007**: Existing financial, encrypted unlock, test-mode and search acceptance scenarios continue to pass, subject only to the explicitly changed category navigation/grouping and previously recorded accepted limitations.
- **SC-008**: All seven specified icon mappings and remaining utility controls render correctly in light/dark themes at the existing desktop and phone test widths, with no Font Awesome asset requests and no loss of control accessibility or functionality.

## Assumptions

- Confirmed sidebar design: icon-only Accounts and Categories options in a compact switch. Its layout should accommodate a third Investments option in a later feature. No Investments option, placeholder, investment data or routing is included now; this is a layout consideration, not a requirement for a general navigation framework.

- “Items 1–5 only” means the five numbered items in Part 1, supplemented by the icon replacement requested on 2026-09-17; Parts 2 and 3 remain out of scope. The private screenshot guides column proportions only; its financial content is not copied into fixtures or this spec.
- Category breakdown is read-only. A modal is preferred, as requested, but the detailed interaction design belongs in planning.
- Confirmed category scope: category registers retain the existing direct-account scope when not searching; searches retain existing descendant scope. Totals are labeled as matching activity when filtered. No new parent rollup or aggregate income/expense report is introduced.
- Monthly is the initial grouping. The user's grouping choice lasts within the page session across category selection, resets to monthly on reload, and does not change ordinary account register grouping.
- All Accounts retains its existing history/search population. Hiding categories from default navigation is not a new financial exclusion rule.
- Context navigation clears search and reveals the exact target rather than preserving a filter that hides it. Ordinary selection later restores existing future-hiding behavior. No separate back-stack or persistent navigation history is required.
- Unknown or unsupported allocation values remain explicitly unavailable. Planning must verify that exported relationships and amounts support complete details for included USD transactions; this spec does not presume the current snapshot carries every necessary source detail.
- Desktop width allocation of 25% is a reviewable default for “much more room,” not a request for a general redesign.
- Established personal/read-only/USD boundaries, encryption and credential protections remain in force. No new framework, dependency or exporter schema design is selected here.
