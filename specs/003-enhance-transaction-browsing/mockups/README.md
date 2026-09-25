# US3 split-details design review — T054

Status: **approved by the user** (recorded before resuming implementation on 2026-09-20). Open [split-details.html](split-details.html) directly in a browser; no server, installation, export or network access is needed. All examples are invented. The page compares desktop and mobile; at narrow browser widths it shows mobile only.

## Review steps

1. Inspect the default example in both themes. Full paths, memos and tags wrap; repeated Dining Out splits remain separate. Amounts align at the right, and the bottom total is **-$246.80**.
2. Choose phone widths 360, 390 and 412. Scroll inside the popup: long text stays readable, amounts remain visible, and the header/close control/total remain outside the scrolling body.
3. Select **Transfer accounts**: $4,000 + $1,000 = **$5,000**. Click an account to see the proposed US4 action described above the previews. These controls only illustrate US4; US3 will render plain account names. A destination-side Rainy Day entry will show only its own -$1,000 allocation in the implemented feature.
4. Select **Unavailable amount & excluded account**. Expect one unavailable amount, a known **-$42.00** for the excluded destination, and **Total unavailable**. Empty or missing memos/tags have no label or placeholder. The selected transaction amount is context, not a substitute for the unknown allocation sum.
5. Select **Uncategorized**: explicit empty state and unavailable allocation total. Select **Many splits**: 12 separate -$10.00 allocations and a **-$120.00** total, with a scrolling body.
6. Try close/reopen. Escape works with focus inside a preview. Production native-dialog focus trapping, trigger restoration, races and real transfer navigation are later implementation tests, not claims made by this comparison page.
7. Select **Paycheck · $2,000 net**. The user's bogus CSV supplies seven splits in source order: $2,690 salary less $250 federal tax, $150 Medicare, $30 dental, $80 medical, $5 vision and $175 Social Security. Expect **$2,000.00** beside Employer LLC Payroll and at the bottom. First-column split descriptions serve as memos; no tags were supplied. Everyday:Checking and the date remain illustrative because the CSV does not supply them.

## Proposed layout

Review revision (2026-09-21): omit Memo and Tags labels entirely, including populated fields. Memo text uses the register's muted color and 0.85rem font size. Keep the memo and tag pills on separate lines.

- Desktop: centered dialog, maximum width 680px; dedicated 118px amount column.
- Mobile: inset sheet near the bottom, 100px amount column, 44px close target. Full text wraps in the remaining column; no ellipses in details.
- Fixed header and footer within the bounded popup; only allocation content scrolls. Negative amounts use the app's red treatment and tabular digits.
- Each allocation owns its path, memo, tags and signed amount. Do not copy the parent row's combined tags onto each split.
- The selected entry amount sits to the right of its description with no Selected transaction label. The footer omits the matches-selected-transaction message. Empty/missing memo and tag fields render nothing, including no labels or placeholders.
- US4: eligible transfer account names become underlined-on-hover actions with an arrow. Categories stay plain text; excluded destinations explain unavailability and retain known amounts.

## Evidence and approval

Created 2026-09-20. Inline JavaScript syntax and `git diff --check` passed. Browser visual review was not run: the available browser-control inventory contained no browsers. No production UI/exporter changes are part of T054. Record requested revisions or approval here (or in acceptance.md) before marking T054 complete and implementing the dialog.

Approval: Approved.
