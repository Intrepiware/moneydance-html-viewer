# US3 source verification — T012, T015, T016, T038

Use a **synthetic book**, not your real book. These instructions create source test records intentionally; the exporter and probe must leave them unchanged. Source validation is still pending. Standalone Jython tests do not prove these Moneydance APIs/signs.

## Set up the controlled examples

Create these root-level USD accounts/categories with opening balance zero. Keep them separate from existing tests:

| Name | Type |
|---|---|
| US3 Checking | Bank |
| US3 Home Savings | Bank |
| US3 Rainy Day | Bank |
| US3 Archived | Bank; mark inactive after entering its transfer |
| US3 Dining | Expense category |
| US3 Repairs | Expense category |
| US3 Salary | Income category |

Enter the following in the indicated bank register. For multi-split transactions, enter the split descriptions listed as memos below. For the single-category refund, salary and archived transfer, keep the transaction description as the corresponding split text; do not enter a separate shortened memo. Parent memo and parent tags stay blank. Set only the specified split tags; preserve split order. This distinction corrects the original ambiguous instructions, based on the user's build-5253 source results on 2026-09-24.

| Register / date / transaction description | Ordered splits in the selected bank's sign convention |
|---|---|
| US3 Checking / 2026-09-01 / US3 Repeated | US3 Dining **-$20**, memo Lunch, tag Lunch; US3 Dining **-$10**, memo Coffee, tag Coffee |
| US3 Checking / 2026-09-02 / US3 Refund | US3 Dining **+$5**, source split text US3 Refund, no tags |
| US3 Checking / 2026-09-03 / US3 Salary | US3 Salary **+$2,000**, source split text US3 Salary, no tags |
| US3 Home Savings / 2026-09-04 / US3 Repair | US3 Repairs **-$5,000**, memo Repair, tag Repair; US3 Rainy Day **+$1,000**, memo Rainy contribution, tag Rainy. Selected Home Savings row nets **-$4,000**. |
| US3 Checking / 2026-09-05 / US3 Excluded | US3 Archived **-$42**, source split text US3 Excluded, no tags; then mark US3 Archived inactive |

Independently confirm in Moneydance: Checking ends at **$1,933**, Home Savings **-$4,000**, Rainy Day **-$1,000**, Dining activity **$25**, Salary activity **$2,000**, Repairs activity **$5,000**, Archived **$42**. The Rainy Day row has only its own -$1,000 parent allocation; it must not show the separate -$5,000 repair split. Category display signs must match the source; investigate discrepancies instead of changing expectations to match exporter output.

## Prepare the reference and run

Failed allocation checks now identify row selection (expected date/description and match counts), selected amount, split count, individual split destination/amount/memo/tags, total, or source stability. Failed value comparisons print expected/actual synthetic values; destination UUIDs and arbitrary exception messages are omitted. Run against the controlled synthetic book and review output before sharing. Keep expected values unchanged while investigating failures.

1. Copy the `allocationCases` array from `tests/fixtures/preflight-reference.example.json` into a local reference with this structure: `{"scope":"allocations","cases":[],"allocationCases":[...]}`. Save as `.workspace/private/us3-reference.private.json`. The nine supplied cases cover parent/split, expense/income signs, refund, repeated category, repair funding, excluded destination and tag isolation. These expectations are calculated from the recipe, not exported values.
2. Review every reference against the displayed source rows and split editor. The reference uses split descriptions (Lunch, US3 Refund, US3 Salary, Rainy contribution) to select split-side rows. If your Moneydance build displays a different description, record that observation and update only the selector to the independently observed description. Do not change expected amounts/tags to manufacture a pass. Do not duplicate the selector within an account/date.
3. Save the book. Avoid editing/syncing during the test. Run `scripts/moneydance-preflight.py` through Moneybot and select this reference. Expect all **nine Allocation case** checks to pass, plus `PREFLIGHT_REFERENCE_CHECKS_PASS`. A failure can mean an unavailable method, wrong setup, sign/memo/tag mismatch or source change; report the ordinal without sharing private data.
4. Run the updated `export_json.py` against the same synthetic book. Leave the password blank for a plaintext export saved as `.workspace/private/us3-source.json`. The dialog states that blank means plaintext. Record any export error code. Confirm source rows, amounts, balances, split tags and memos remain unchanged.
5. From repository root run:

   ```powershell
   node scripts/validate-snapshot.mjs .workspace/private/us3-source.json
   node scripts/compare-preflight.mjs .workspace/private/us3-source.json .workspace/private/us3-reference.private.json
   ```

   Expect `VALID`, nine allocation passes and `REFERENCE_COMPARISONS_PASS`. This runs the new sum validation (T016) against the actual export captured for T015. Record results, not the financial file.
6. Follow [build-extension.md](build-extension.md) to rebuild, reinstall and restart Moneydance. Export the same synthetic book with the installed extension. Validate and compare its decrypted synthetic output using the same commands/reference; use the existing [synthetic decrypt tool](../tests/tools/decrypt-synthetic.mjs) if needed. Check delivery/deadline behavior under the existing extension validation procedure. Do not mark T015 done after only direct-script testing.
7. In the viewer load the synthetic export. Inspect all selected bank/category rows. Excluded Archived keeps its **-$42** allocation but offers no navigation. Verify split-specific tags, full paths, unchanged balances and no sibling allocations. Repeat with an encrypted direct export to check the same dialog after unlock.

Record tester/date, Moneydance build, direct and installed-extension results separately in `specs/003-enhance-transaction-browsing/acceptance.md`. Source tests, browser tests and Pixel 8 timings have separate gates. US4 must wait for all US3 manual tasks.
