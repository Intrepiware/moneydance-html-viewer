## ePay manual acceptance policy — implementation gate

Apply this policy BEFORE the first story-specific implementation action and AGAIN before EVERY story transition within the same invocation. It constrains generic core directions to execute all tasks or parallelize independent stories. Follow explicit user instructions and the adopted constitution; surface conflicts rather than silently relaxing either.

### Determine eligible work

- Read the current tasks, story order, dependencies, constitution and linked acceptance evidence. Use story section order and explicit dependencies, not numerical task-ID sorting or story priority alone. Do not reorder stories to evade a gate.
- For each proposed story, inspect ALL preceding stories. Each needs manual tasks or an explicit justified exception. Every required preceding `[Manual Test]` task must be checked and supported by a human-reported passing result. A missing manual section or a checked box without sufficient evidence does not establish readiness.
- `[P]` never bypasses a story gate. Do not start blocked story code, implementation tests, fixtures, migrations or delegated implementation work. Documentation/planning for later stories and authorized fixes/retests within eligible stories may continue.
- Pending manual tests in the CURRENT story do not prohibit finishing its remaining authorized implementation tasks, unless an explicit within-story dependency says otherwise. After those tasks, stop at its manual gate; do not claim the story or entire feature is complete.

### Reconcile evidence

- Mark a manual task complete only after a person executes the steps and reports the expected results passing. Accept user-reported results in chat or acceptance.md; do not require the agent to repeat them or demand raw logs when the report is sufficient.
- Record tester, test date, environment, observed versus expected results and material defects/retests. Do not infer missing device measurements from desktop emulation or automated tests. Ask only for material missing information, clearly naming the affected task and gap; reuse supplied context instead of requesting repeated confirmations.
- Automated checks, successful builds and code review supplement human acceptance but cannot replace it. Keep source/runtime, browser, installation and actual-device evidence distinct where the task requires them. One check may establish multiple requirements when its actual behavior supports that conclusion; explain the reuse.
- Preserve failure history and make successful retests/current status clear. If later code changes invalidate a prior result, reopen only affected checks, state why and re-evaluate subsequent story readiness. Do not automatically invalidate unrelated evidence.
- A justified omission must identify the omitted behavior, concrete obstacle and alternative evidence or remaining gap. Unavailable equipment and unfinished tests remain pending. Never mark an omitted test as passed. Do not introduce new approval ceremonies beyond user instructions and the constitution.

### At a blocking gate

Complete authorized work that does not depend on the missing result. Give exact, ready-to-run manual steps (or links), list the specific unchecked tasks and explain which next story they block. Preserve useful progress. Leave pending checkboxes unchecked. Do not treat elapsed time, silence, an automated pass or this command's invocation as human acceptance.

If evidence already establishes the gate passed, reconcile tasks/acceptance.md and continue authorized work without asking for approval again. Do not edit reviewer-owned requirements checklists as a substitute for acceptance. Report partial implementation and remaining acceptance accurately.
