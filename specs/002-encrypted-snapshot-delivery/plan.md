# Implementation Plan: Encrypted Snapshot Delivery

**Branch**: `feature-moneydance-extension-and-encryption` (actual Git branch; setup-plan reports the feature-directory identifier separately)  
**Date**: 2026-09-08 | **Spec**: [spec.md](spec.md)  
**Input**: `specs/002-encrypted-snapshot-delivery/spec.md`  
**Status**: Design complete for task generation. Data model, contracts, quickstart and tasks are available. Installation, full-book shutdown bounds and end-to-end validation are implementation/release gates, not completed acceptance claims.

## Summary

Package the existing Jython exporter as a persistently installed Moneydance MXT extension with configuration, manual delivery and normal-exit delivery. Keep snapshot v1 financial semantics unchanged inside a compact authenticated AES envelope. Upload complete ciphertext to a single Azure block blob. Extend the existing worker to download once, accept password attempts, decrypt and run the existing snapshot validator before sending any financial view data. Preserve plaintext synthetic mode and the existing UI.

Runtime probes on build 5253 established closing/save/closed/exiting ordering and successful synthetic capture after postsave. The user accepts capture on an occasional book switch: no early exit detector is required. Capture once after the configured book's closing-associated save, keep detached values only, and publish on app:exiting. Ordinary saves do not capture; opening another book invalidates the candidate. Persistent installation, full-book deadlines and actual warning/menu behavior remain unverified. A failed gate requires a documented resolution before dependent implementation; it must not become an undocumented fallback.

## Technical Context

**Language/Version**: Jython 2.7 exporter/extension; Java platform facilities through Jython; existing browser ES modules and Node built-in test runner. Installed Moneydance bundled runtime inspected: Temurin Java 21.0.5; in-book Jython/build values must be reconfirmed (prior evidence 2.7.2/build 5253).
**Primary Dependencies**: Moneydance DevKit and extension loader; JCA AES-GCM/PBKDF2/SecureRandom; Java HttpClient; browser Web Crypto/Worker; Windows PowerShell/.NET DPAPI bridge for protected local configuration. Retain pinned Handlebars. No new npm/Python packages, Azure SDK or cryptography library proposed.
**Storage**: One book-scoped configuration and sanitized status record under the Windows user profile; DPAPI CurrentUser-protected secrets; one encrypted blob; worker-owned ciphertext/plaintext during unlock. No plaintext staging file or browser-managed financial/password persistence.
**Testing**: Existing tests; deterministic synthetic cross-runtime encryption vectors; local fake upload responses and failure injection; actual installed Moneydance lifecycle/install tests; desktop/Pixel/iOS autofill; synthetic Azure publication before private data.
**Target Platform**: Windows Moneydance, desktop and Pixel 8 browsers, iOS Safari password autofill.
**Project Type**: In-application extension plus existing static viewer, no new backend.
**Performance Goals**: Five full-history load/decrypt trials below ten seconds excluding human password entry; 20 searches below two seconds. Measure both extension-operation elapsed time and incremental Moneydance shutdown delay against 60 seconds, satisfying both current FR-005 and SC-008 wording without equating them.
**Constraints**: Persistent installation, read-only financial capture, genuine signing artifacts, AES integrity/confidentiality, one download, scoped authorization, secret lifetime 22–24 months if expiring, plain expiry status with a settings menu action. No independent writer, retry queue, net worth or investment UI.
**Scale/Scope**: One configured book/destination; recent file 36,041,836 bytes, 450 accounts, 74,211 entries. No history trimming or large-fixture copying into documentation.

## Constitution Check

Pre-research: no scope exception. Part 2 explicitly advances previously deferred delivery/password work. All six principles apply.

| Principle               | Design check / required evidence                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I Financial fidelity    | Reuse existing capture/build logic; validate source and viewer results against Part 1 references. Encryption never changes snapshot v1.                                                                        |
| II Jython compatibility | Export remains Python 2.7 inside Moneydance; no CPython dependency. Actual installed extension execution is required.                                                                                          |
| III Privacy             | DPAPI secrets; no plaintext publication/staging; no SAS in website/logs; signed package excludes keys/configuration.                                                                                           |
| IV Simplicity           | One producer/blob, single PUT, native crypto/HTTP, no framework migration or upload service.                                                                                                                   |
| V Evidence              | Installation/lifecycle gates precede delivery acceptance; actual phone, cloud and source results recorded separately from fixtures.                                                                            |
| VI Dependencies         | Platform facilities and existing engine only. DPAPI bridge replaces an additional native binding dependency. Official DevKit build tools are isolated development tooling, not a new production library chain. |

Post-research: no justified violation is needed. **G1/G2 remain acceptance obligations; G3 has an approved design with runtime verification pending.** Dependent release requires the relevant checks; implementing the testable pieces is authorized by the task sequence. No full end-to-end acceptance can be asserted from API documentation or standalone JVM reflection.

## Project Structure

### Documentation

Created: plan.md, research.md, data-model.md, contracts/interfaces.md, contracts/encrypted-snapshot.md, quickstart.md and tasks.md.

### Planned source touch-points

```text
export_json.py                    # preserve manual script entry; expose shared callable export
extension/
  meta_info.dict / script_info.dict
  snapshot_extension.py           # initializer, menus, lifecycle and status integration
  delivery.py                     # serialize, deadline, ordered pipeline, result
  encryption.py                   # platform crypto, envelope encoding
  configuration.py                # book identity, validation, protected secrets
  azure_upload.py                 # one ciphertext PUT, safe outcome handling
  protect-secrets.ps1              # narrow DPAPI pipe protocol
scripts/
  package-extension.ps1            # official DevKit workflow; no invented signing
  extension-preflight.py           # installed runtime/lifecycle/status capability probe
  extension-validation.md          # implementation run evidence/instructions
UI/
  app.js / index.html / styles.css # password form and unlock/error state
  config.js                       # encrypted real URL, existing plaintext test URL
  src/encrypted-snapshot.mjs       # parse/derive/decrypt, no financial rendering
  src/snapshot-worker.mjs          # load once and retry unlock
  src/worker-client.mjs            # distinguish retryable unlock errors
schemas/snapshot-v1.schema.json    # unchanged inner contract
 tests/                         # existing test layout, new crypto/extension/browser cases
```

Paths are intended deliverables, not claims that they already exist. Package the shared exporter without executing its file chooser or top-level main during extension import. The standalone script remains usable; validate both entry points after refactoring. Do not duplicate accounting logic in delivery.py.

## Gated Delivery Sequence

1. **G1 — Persistent installation/signing**: obtain official DevKit, build a synthetic extension using its prescribed keys/package process, install once, reopen three times, verify initialization/menu callbacks. Never fabricate certificate content or confuse runtime script loading with installation.
2. **G2 — Shutdown semantics/deadline**: observe actual application-exit, save and book-close ordering on a synthetic book, including canceled exit and duplicate events. Prove final saved state is available and a bounded completion callback exists without EDT deadlock. Capture local financial values only during a validated stable read; do not retain a closed book to work around a late callback. Record whether the 60-second operation and added-delay targets are feasible. Do not publish automatically on every save as a substitute.
   **Accepted trigger decision**: closing arms one capture for the configured book's postsave; consume that arm once, reset on opening and dispose of obsolete candidates. A book switch may incur capture cost but must not publish. Do not use thread identity or stack matching to infer exit. Synthetic capture succeeded in 187 ms; actual full-book capture, cooperative deadline enforcement, duplicate/canceled lifecycle handling and installed-MXT execution remain acceptance work. A timeout must not publish a stale candidate.
3. **G3 — Expiry warning and settings action (design approved)**: use plain status text directing the user to Extensions > Snapshot Settings. Register that menu action to open Azure configuration and renewal instructions. No clickable status text or internal component listeners are required. Verify warning timing, menu navigation, expired-secret behavior and coexistence with normal Moneydance progress in the installed extension.
4. Protected configuration and platform crypto vectors, including Unicode passwords and JVM-to-WebCrypto interoperability. Validate DPAPI helper and installation resource access. Require genuine secret storage before unattended delivery.
5. Manual pipeline and synthetic Azure upload. Prefer narrow 23-month blob SAS over a broad account key; actual account policy must allow it. No account key is embedded in the extension. Establish blob destination, HTTPS same-origin website path and cache bypass before real-data upload.
6. Implement and validate the normal-exit pipeline after the persistent/manual foundations; release requires G1/G2/G3 evidence. Join/serialize existing work; if a prior manual capture predates final state, it cannot count as the exit export. Never queue an older publication after a newer one. Persist bounded, sanitized status for next launch.
7. Viewer unlock state, fixed binary envelope, password-manager-compatible form, recoverable wrong-password attempts, plaintext test mode, prior lifecycle fix and all Part 1 regressions.
8. Actual source/cloud/device evidence and combined timing. No failure waived by fixture success.

## Key Design Decisions and Risks

- Use AES-256-GCM and PBKDF2-HMAC-SHA256 with a fixed envelope version; the fixed parameters and byte layout are defined in contracts/encrypted-snapshot.md. Native provider support must be tested in the installed JVM. Do not trade away authentication or KDF strength to meet time goals.
- Store desktop encryption password and SAS together under DPAPI CurrentUser; account/book identifier is nonsecret routing metadata. Secrets travel to the helper through pipes, never command-line arguments or generated command text. Do not start a visible helper window.
- Use one blob-scoped HTTPS service SAS with write permission, 23-calendar-month issuance lifetime, where the account policy permits. Non-expiring account keys have a broader privilege footprint; managed identity is not assumed on an ordinary desktop. If policy cannot satisfy lifetime, stop for a decision rather than shortening it.
- One completed ciphertext PUT publishes atomically to readers. HTTP 201 means acknowledged success. A connection lost after sending can have unknown outcome; show that explicitly and do not blindly retry an old payload. No explicit remote version history is required.
- Record expiry metadata, show the 30-day warning and renewal instructions. Date metadata alone is not proof of actual permission; validate SAS fields and perform synthetic authorized upload.
- Existing Cloudflare/Azure hosting is external state: verify snapshot route bypasses edge caching. fetch no-store alone is not proof of current edge content. Public static hosting receives only ciphertext, code and synthetic fixtures.
- Current spec still mentions both a 60-second operation and a 60-second additional delay. Preserve both measurements; Moneydance's existing five-minute backup is not charged to extension-only elapsed time.
- No source/global book references retained after work; freeze configuration per attempt and detach captured records. No ability to forcibly kill a Jython thread safely is assumed: deadline checks throughout capture/build and cancellable network calls must be demonstrated.
- Password-manager persistence is controlled by the user/manager. The app uses a visible stable password form and explicit Unlock submission; it reads the input on submission rather than assuming autofill emits input events.

## Requirement Coverage

FR-001/012 → G1 and official packaging; FR-002 → shared exporter/source references; FR-003/009/010 → protected configuration, lifetime and G3; FR-004–008/011 → serialized pipeline/G2/publication status; FR-013–017/019 → planned worker unlock/form/test-mode contracts; FR-018 and SC-001–008 → planned acceptance matrix. The approved warning/menu design replaces clickable status; installation and shutdown requirements remain unchanged.


## Post-design constitution review

All six principles remain satisfied by design: unchanged financial contract, Jython 2.7, protected secrets and synthetic evidence, no framework or periodic export, explicit actual-runtime/device checks, and native dependencies. Detailed wire/session contracts add no dataset version tracking. A 128 MiB safety ceiling fails visibly rather than trimming history and requires review if source growth exceeds it. No new principle exception. All production acceptance tasks remain unchecked.
