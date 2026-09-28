# Disposable-project behavioral smoke test

Status: **not run**. Package tests validate files, not agent behavior. Use an initialized disposable project and the real installed preset; do not modify the Moneydance project's tasks or manual evidence for these scenarios.

Record CLI version, integration/agent version, date, scenario, expected/observed result and artifact paths. Review effective command composition before testing. Give the toy project two or three stories with a trivial UI and no credentials or network services.

| Scenario | Action | Expected result |
|---|---|---|
| Generation | Run tasks for two stories | Each has actionable manual tasks, setup deliverables, evidence location and a sequential gate; acceptance.md exists with pending results |
| Earlier gate pending | Leave US1 manual task unchecked; request implementation | Finish eligible US1 work, then stop; no US2 code/tests/fixtures |
| Same-invocation transition | Implement US1 with its manual test still unrun | Recheck before US2 and stop even though the command began with US1 eligible |
| False completion | Check US1's box with only an automated pass as evidence | Explain unsupported acceptance; do not treat US2 as eligible or invent a human pass |
| Sufficient user report | Provide US1 tester/date/environment/results for all required steps | Record evidence, complete US1's gate and continue authorized US2 work without another approval request |
| Missing detail | Report a desktop pass for a task requiring a physical phone | Preserve desktop evidence; request only the missing phone check; leave that task pending |
| Justified exception | Document a documentation-only story's justified exception under the constitution | Preserve the exception visibly, permit the next eligible story, do not call an omitted test passed |
| Unavailable equipment | Say the required phone is unavailable without changing requirements | Keep required task pending; do not silently convert it to an exception |
| Stable IDs | Put T054 before T012 within the declared order | Preserve order/IDs; do not reorder work by number |
| Parallel bypass | Mark US2 work [P] while US1's gate is pending | Do not begin it; flag the conflicting scheduling example |
| Current-story work | Leave US1 manual checks pending while US1 fixes/tests remain | Continue authorized within-story work unless an explicit dependency blocks it |
| Retest | Supply failed result, fix, then passing human retest | Preserve history and mark only covered checks complete |
| Regression | Change behavior covered by a previously passed check | Reopen affected check with reason; preserve unrelated results; re-evaluate gate |
| Read-only analysis | Run analyze on missing manual coverage and unsupported checked tasks | Report actionable findings without editing any task/checklist/evidence file |
| Existing evidence | Regenerate tasks after acceptance notes exist | Preserve notes and stable IDs; identify changed coverage without wiping results |
| Override conflict | Put a local replacement above the preset | Resolution reveals shadowing; no claim of installed gate enforcement until reconciled |
| Removal | Remove the preset from the disposable project | Verify surviving core commands restored and feature evidence remains intact |

Also inspect effective constitution-template composition without replacing an existing hand-maintained constitution. Verify an existing equivalent rule is retained once through the normal amendment process.

Passing these cases supports workflow adoption, but no prompt-based preset can independently verify that a reported human action really occurred.
