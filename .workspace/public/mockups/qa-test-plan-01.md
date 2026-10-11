# [INV-012] Verify Admin Can Send an Email Invoice to an Existing Customer

- **Module:** Invoicing & Billing
- **Priority:** High
- **Type:** Functional
- **Author:** QA Team
- **Last Updated:** 2026-10-10

---

### Description
Ensure an Admin user can generate and send an invoice via email from the billing dashboard, updating the invoice status to "Sent".

### Prerequisites & Setup
- Logged in as an Admin user.
- Environment: Staging (`https://staging.app.example.com`).
- At least one active customer account exists in the database.

### Test Data
- Customer Email: `qa-test-customer@example.com`
- Line Item: "Monthly Subscription"
- Amount: `$99.00`

---

### Test Steps & Expected Results

| Step | Action / Instruction                                              | Expected Result                                             | Pass / Fail | Notes                      |
| :--- | :---------------------------------------------------------------- | :---------------------------------------------------------- | :---------: | -------------------------- |
| 1    | Navigate to `Billing` > `Invoices`.                               | Invoice list page renders completely.                       |     ✅      |                            |
| 2    | Click the `+ Create Invoice` button.                              | "New Invoice" form drawer opens.                            |     ✅      |                            |
| 3    | Select `qa-test-customer@example.com` from the customer dropdown. | Customer details populate automatically.                    |     ✅      |                            |
| 4    | Add line item "Monthly Subscription" with amount `$99.00`.        | Subtotal and total calculate correctly to `$99.00`.         |     ❌      | Crash clicked "add" button |
| 5    | Click `Send Invoice`.                                             | Success notification appears; status changes to `Sent`.     |             |                            |
| 6    | Check test mailbox inbox for `qa-test-customer@example.com`.      | Invoice email arrives with correct PDF attachment attached. |             |                            |

---

### Post-Conditions & Cleanup
- Void or delete created test invoice `INV-012` to avoid skewing reporting metrics.

### Notes / Comments
- Related Jira ticket: `PROD-1420`.
- Verify Mailtrap or SendGrid logs if email delivery delays occur.