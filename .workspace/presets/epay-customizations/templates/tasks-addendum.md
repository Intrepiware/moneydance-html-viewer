## Required manual acceptance protocol

Apply this protocol to EACH story section above; do not collect all manual work only at the end of the feature. Manual acceptance is required even where generic template guidance calls automated tests optional. Preserve explicit user scope and adopted constitutional constraints.

Example format (replace placeholders, do not copy these IDs into multiple stories):

```markdown
- [ ] [Manual Test] Tnnn [USn] Using [reproducible setup or guide], perform [actions]. Expect [observable outcomes for the story's changes, including relevant failures/edges]. Record tester/date/environment/results and defects/retests in acceptance.md under USn.

**Story checkpoint:** Later story implementation, including tests and fixtures, waits for this story and every preceding story's required manual tasks to pass. Planning and current-story fixes/retests may continue.
```

Only human-executed, reported passing checks may be checked off. Automated passes alone are insufficient. Use existing user reports without redundant reruns when they cover the requirements. Failed/unrun checks and unavailable required devices remain pending. Document any justified omission with its scope, obstacle and alternative evidence or remaining gap; omissions are not passes. Every story needs manual tasks or an explicit justified story exception.

Task IDs are stable identifiers, not sort keys. Use listed story order and explicit dependencies. `[P]` permits independent tasks only after their story is eligible. Preserve existing acceptance records when regenerating tasks; identify any affected checks requiring retest rather than resetting all evidence.
