# [Feature] — implementation and acceptance

Use one section per story in tasks.md order. Preserve user notes and prior evidence. Replace placeholders only with known facts; leave unexecuted checks pending. Keep sensitive data out of shared records.

## Current status

| Story | Implementation | Manual acceptance | Next-story gate |
|---|---|---|---|
| USn — [title] | Not started / partial / complete | Pending / failed / passed / justified exception | Blocked / satisfied, with reason |

## USn — [title]

### Manual results

| Task | Status | Tester | Test date | Environment | Setup and actions | Expected / observed | Evidence or report |
|---|---|---|---|---|---|---|---|
| Tnnn | Pending | — | — | — | [Guide and case] | [Expected; observed pending] | [Link or user-report reference] |

### Defects and retests

Record the failed task/case, defect, correction, retest result and date. Identify which earlier result is superseded. Never overwrite the original failure as though it did not happen.

### Justified omissions

None unless explicitly recorded. For each omission, identify story/task, omitted behavior, concrete obstacle, alternative evidence or remaining gap, and any decision required by the constitution. Do not label omitted or unavailable tests as passed.

### Supporting automated evidence

Record commands/results separately from manual execution. Distinguish source/runtime, build/install, browser and actual-device measurements when applicable. Reuse a result across tasks only when its scope supports both.

### Gate decision

Pending until all required manual checks for this and every preceding story pass, or a justified story exception satisfies the applicable governance. Record the next eligible story and any blocking task IDs. Evidence added by the user can satisfy the gate without another approval request.
