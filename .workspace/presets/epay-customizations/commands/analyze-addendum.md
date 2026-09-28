## ePay manual acceptance policy — read-only analysis

Include these checks in the normal cross-artifact analysis. Keep analysis read-only; recommend corrections without checking boxes or rewriting evidence.

- **Coverage:** Every story has `[Manual Test]` tasks or an explicit justified exception. Main happy path, relevant failures and material edge cases are covered; setup/action/expected-result/evidence location are actionable. Flag vague "test the feature" instructions and impractical setup without a documented gap.
- **Order:** Story order and dependencies explicitly gate later implementation (including tests/fixtures) on all preceding required manual passes. Flag `[P]` examples, task dependencies or command guidance that bypass this rule. Do not flag a stable inserted ID solely because numbering is out of order.
- **Evidence:** Checked manual tasks have human-reported results with tester/date/environment and sufficient expected/observed detail. Separate automated, source-runtime, installed-product and device evidence. Flag automated-only completion and material differences between the tested behavior and current requirements.
- **Exceptions:** Distinguish a documented justified omission from a pass; verify obstacle, uncovered scope, alternative evidence or remaining gap. Equipment being unavailable does not alone justify silently completing a required test.
- **Consistency:** Reconcile the meaning of the constitution, spec, plan, tasks, quickstart and acceptance record. Historical failures superseded by identified successful retests are not current failures. Pending future manual checks are normal during planning, not defects by themselves.

Report missing coverage/setup as HIGH; report a violated mandatory story gate or fabricated/unsupported pass as CRITICAL when it conflicts with adopted governance. Cite the relevant artifact and affected task/story. Do not claim that textual consistency proves actual execution. Do not require a populated acceptance record before tests are scheduled to run.
