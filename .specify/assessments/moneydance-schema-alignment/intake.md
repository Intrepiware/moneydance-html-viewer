# Idea Intake: Moneydance schema alignment

- **Slug**: moneydance-schema-alignment
- **Created**: 2026-09-05
- **Source**: User-provided text and repository pointers: export_json.py, UI/data/moneydance-export-schema.json, UI/data.json, UI/app.js
- **Type**: improvement

## Idea (as captured)

> essentially my idea is that I will build a MoneyDance extension that when MoneyDance is closed, it will export data to a JSON file, encrypt it and upload it to Azure Blob storage. Then I will have a HTML UI that I built render it in a website.

> One is that I modify the UI so that it matches the shape of the JSON that's exported. The second is that I modify the Python script so that it exports data in the shape that the UI is expecting. The third is that I have the UI application modify the exported data to transform it into the shape that the UI is expecting.

The user requests a review and recommended course of action, using the compact schema and exporter rather than reading the extremely large export examples.

## Restated

Connect an existing Moneydance JSON exporter to an existing HTML viewer whose sample data uses a different structure. This supports a proposed mobile replacement that displays encrypted snapshots uploaded to Azure Blob storage when Moneydance closes.

## Origin & Context

- **Raised by**: The project user.
- **Trigger**: Dissatisfaction with the Moneydance mobile app and discovery that an agent-built UI consumes a different schema from the existing exporter.
- **Existing components**: Python export script; HTML/CSS/JavaScript viewer; mock UI data; compact export schema; large historical exports.
- **Source correction**: The user supplied the correct export_json.py after the initial review. Its field names and exportDate now agree with the supplied schema; the earlier script/schema discrepancy is resolved.
- **Assessment scope**: Compare data contracts and recommend alignment; extension lifecycle, encryption, and upload remain broader workflow context.
- **Review findings and recommendation**: Recorded separately in recommendation.md at the user's explicit request.

## User Clarifications (2026-09-05)

- **Pain points**: The official app uses screen space poorly, shows only a handful of transactions, and feels clunky. The user reports no search capability in the Android app they use; this is user experience evidence, not an independently verified claim about every version.
- **Audience**: Solely the user. This is a personal project that will never be marketed or distributed; market demand and commercial viability are out of scope.
- **Interaction**: Read-only viewing is sufficient. Mobile transaction entry/editing is explicitly unnecessary.
- **Currency**: US dollars only. Multicurrency display and exchange-rate conversion are out of scope.
- **Desired outcomes**: More transactions visible at once, easier navigation, and transaction search on Android. Exact density and responsiveness targets remain to be defined.
- **Additional goal**: Quickly see account and sub-account balances.
- **Existing UI preference**: The user considers the agent-created UI pretty good and does not anticipate major changes. Preserve it as the starting point, with targeted changes where necessary; this is a preference, not proof that real-data integration is complete.
## First-Glance Unknowns

- [NEEDS CLARIFICATION: Should inactive accounts and their historical transactions be included, and how should references to accounts omitted from the tree be handled?]
- [NEEDS CLARIFICATION: Which account types, investment features, and history range must the first mobile version support?]
- [NEEDS CLARIFICATION: What balance definition and per-transaction running balance behavior are required?]
- [NEEDS CLARIFICATION: How should split transactions and transfers appear in account registers and the combined view?]
- [NEEDS CLARIFICATION: What shutdown lifecycle, encryption/key handling, and authenticated snapshot retrieval behavior will the broader workflow require?]

