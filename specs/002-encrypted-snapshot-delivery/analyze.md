## Specification Analysis Report

**Found two high-priority ambiguities and two smaller gaps.** No direct constitution violations or completely uncovered requirements were found. No files changed.

| ID  | Category        | Severity   | Location                                   | Finding and recommended correction                                                                                                                                                                                                                                                      |
| --- | --------------- | ---------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Ambiguity       | **HIGH**   | `data-model.md:50–55`; T020                | Shutdown may wait for an existing manual attempt, but its budget starts with capture. Waiting before capture could therefore extend shutdown beyond 60 seconds. Define the shutdown deadline from the first closing callback, including time spent waiting for earlier work.            |
| A2  | Ambiguity       | **HIGH**   | `data-model.md:36–40`; T019                | Duplicate notifications must do nothing, but a “later close” resets the candidate. The contract doesn’t distinguish a duplicate closing event from a genuinely new close cycle. Define idempotent transitions and test duplicate `closing` notifications both before and after capture. |
| I1  | Inconsistency   | **MEDIUM** | `spec.md:63`; `contracts/interfaces.md:59` | The acceptance scenario allows password retry for damaged data generally, while the contract makes truncated/unsupported envelopes terminal. Narrow the scenario: authentication failures permit retry; structurally invalid envelopes require reload.                                  |
| C1  | Coverage detail | **MEDIUM** | `spec.md:117`; T011/T021                   | SC-001 requires three close/reopen cycles **each producing a current publication**. T011 verifies three installation restarts, while T021 doesn’t specify three publishing cycles. Explicitly add those three end-to-end cycles to T021.                                                |

The deadline correction should preserve both limits: total operation duration and added shutdown delay.

## Coverage summary

All requirements have associated tasks; association does not mean the tests have passed.

| Requirement            | Has tasks?          | Task IDs                    |
| ---------------------- | ------------------- | --------------------------- |
| FR-001, FR-012         | Yes                 | T001, T007, T010–T011       |
| FR-002                 | Yes                 | T003–T004, T016, T021, T028 |
| FR-003, FR-009         | Yes                 | T006, T008–T009, T011, T017 |
| FR-004, FR-007, FR-008 | Yes                 | T005, T012–T017             |
| FR-005, FR-006, FR-011 | Yes                 | T014, T018–T021, T028       |
| FR-010                 | Yes                 | T015, T017                  |
| FR-013–FR-017, FR-019  | Yes                 | T022–T027, T029             |
| FR-018                 | Yes                 | T011, T017, T021, T027–T030 |
| SC-001                 | Yes, detail missing | T011, T021                  |
| SC-002–SC-003          | Yes                 | T016–T017, T021, T028       |
| SC-004, SC-007         | Yes                 | T026–T027                   |
| SC-005                 | Yes                 | T028                        |
| SC-006                 | Yes                 | T011, T017, T029            |
| SC-008                 | Yes                 | T020–T021, T028             |

**Metrics:** 27 requirements/criteria; 30 tasks; 100% task association; 2 ambiguities; 0 duplication findings; 0 critical issues. No unmapped tasks.

**Recommendation:** resolve A1 and A2 before implementing shutdown delivery. The installation/settings milestone can proceed independently.

Would you like me to suggest concrete edits for these four findings?

This review remained read-only because the [Speckit analysis skill](<C:/Working/Sandbox/moneydance/Export Json/.agents/skills/speckit-analyze/SKILL.md>) explicitly requires: “Do not modify any files.”
