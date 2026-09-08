# Specification Analysis Report

Found 1 high and 4 medium issues. The compact timeline and explicit test mode are covered. No files were changed.

| ID  | Severity | Location                                                                                                                    | Finding and recommended correction                                                                                                                                                                                                                                        |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I1  | **High** | [data-model.md:7](<C:/Working/Sandbox/moneydance/Export Json/specs/001-view-moneydance-data/data-model.md:7>), T007, FR-016 | The model/schema wording permits only a UTC timestamp or null, but FR-016 requires missing/invalid timestamps to leave the financial data usable. Distinguish strict exporter output from tolerant viewer input, and test invalid timestamps through the complete loader. |
| I2  | Medium   | [tasks.md:36](<C:/Working/Sandbox/moneydance/Export Json/specs/001-view-moneydance-data/tasks.md:36>), T012, T029–T032      | US1 requires the missing-file link, but explicit verification of its `NOT_FOUND` worker signal occurs in US4. Assign implementation and verification of that signal to T012/T014 so US1’s checkpoint is independently complete.                                           |
| C1  | Medium   | [tasks.md:51](<C:/Working/Sandbox/moneydance/Export Json/specs/001-view-moneydance-data/tasks.md:51>), FR-007–008           | Register tasks omit explicit rendering/testing of supplied check numbers and the `Uncategorized` fallback. Add both to T019/T021.                                                                                                                                         |
| I3  | Medium   | [tasks.md:12](<C:/Working/Sandbox/moneydance/Export Json/specs/001-view-moneydance-data/tasks.md:12>), T006–T007            | Fixtures are completed before the financial contract may change, with no explicit fixture reconciliation afterward. Finalize them after T006/T007, or add that reconciliation to those tasks.                                                                             |
| C2  | Medium   | [.gitignore](<C:/Working/Sandbox/moneydance/Export Json/.gitignore>), T003                                                  | The ignore rule covers dated exports but not the new default private file, `UI/data/snapshot.json`. Add an explicit ignore rule while keeping the synthetic `test-snapshot.json` trackable. No private-data commit was observed.                                          |

**ID:** I1  
**Severity:** High  
**Location:** data-model.md:7, T007, FR-016  
**Finding and recommended correction:** The model/schema wording permits only a UTC timestamp or null, but FR-016 requires missing/invalid timestamps to leave the financial data usable. Distinguish strict exporter output from tolerant viewer input, and test invalid timestamps through the complete loader.
**Clarification:** The concern is **where validation happens**.

Suppose an otherwise valid export contains:

```json
"exportDate": "not-a-date"
```

FR-016 says the viewer should load the financial data and display **“As of: unavailable.”**

But T007 describes validating the snapshot against a contract that permits only a UTC timestamp or `null`. If that validation rejects the file first, the UI never gets the chance to show the unavailable label—it displays a loading error instead.

The intended distinction should be explicit:

- **Exporter:** produces a valid UTC timestamp.
- **Viewer:** tolerates a missing or malformed export timestamp, displays “As of: unavailable,” and still validates all required financial fields strictly.

This is a documentation ambiguity that could lead to the wrong implementation, rather than an existing code bug.
**Decision:** Display an error and fail to load the file in the unlikely event the export date is missing/mis-formatted.
**Rationale:** `exportDate` is very close to a non-optional datapoint, rather than a nice-to-have. It is considered by the UI when evaluating effectiveDate and the balanceTimeline. There may be a point where a valid date is required, so we might as well implement this now.

**ID:** I2  
**Severity:** Medium  
**Location:** tasks.md:36, T012, T029–T032  
**Finding and recommended correction:** US1 requires the missing-file link, but explicit verification of its NOT_FOUND worker signal occurs in US4. Assign implementation and verification of that signal to T012/T014 so US1’s checkpoint is independently complete.
**Decision:** Implement your recommendation.

**ID:** C1  
**Severity:** Medium  
**Location:** tasks.md:51, FR-007–008  
**Finding and recommended correction:** Register tasks omit explicit rendering/testing of supplied check numbers and the Uncategorized fallback. Add both to T019/T021.
**Decision:** Implement your recommendation.

**ID:** I3  
**Severity:** Medium  
**Location:** tasks.md:12, T006–T007  
**Finding and recommended correction:** Fixtures are completed before the financial contract may change, with no explicit fixture reconciliation afterward. Finalize them after T006/T007, or add that reconciliation to those tasks.
**Decision:** If "fixtures" refers to test fixtures, that's fine. Update the test fixtures if the contract changes later. We can't forsee everything.

**ID:** C2  
**Severity:** Medium  
**Location:** .gitignore, T003  
**Finding and recommended correction:** The ignore rule covers dated exports but not the new default private file, UI/data/snapshot.json. Add an explicit ignore rule while keeping the synthetic test-snapshot.json trackable. No private-data commit was observed.
**Decision:** Update .gitignore so that the new file is never committed to the repo.

## Decision Application Status

All five decisions have been applied to the active requirements, design documents, tasks, and .gitignore. The findings above are retained as the original review record; I1 is resolved by strict timestamp rejection, superseding the original recommendation for tolerant input. I2, C1, and I3 are reconciled in tasks; C2 is implemented as an explicit ignore rule. This is document reconciliation, not evidence of completed application implementation or runtime validation.
