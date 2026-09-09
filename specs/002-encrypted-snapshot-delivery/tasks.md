# Tasks: Encrypted Snapshot Delivery

Input: spec.md, plan.md, research.md, data-model.md, contracts/ and quickstart.md.
Tests are required by FR-018 and SC-001–008. Phases 1/2 local implementation is recorded below; prior probe
evidence does not complete production implementation tasks. Paths are repo-relative.

## Phase 1: Setup

- [X] T001 Verify official DevKit packaging/signing instructions and record exact runtime/tool versions and genuine key-generation commands in scripts/extension-validation.md; do not fabricate signing artifacts.
- [X] T002 Establish extension/ packaging layout, resource import paths and private artifact exclusions in .gitignore; keep keys, configuration and private exports out of packages and source control.

## Phase 2: Foundational

Goal: establish shared source and wire contracts before user-story integration.

- [X] T003 Extend export_json.py with shared callable capture/build entry points and cooperative monotonic deadline checks in source loops and transformation; preserve standalone chooser and library-only behavior without duplicating financial logic.
- [X] T004 Verify stable capture, source immutability, timeout/cancellation and unchanged standalone output in tests/runtime/export_deadline_test.py and scripts/extension-validation.md using actual Jython plus controlled source references.
- [X] T005 Create synthetic fixed envelope/Unicode known-answer vectors and native JVM-to-WebCrypto verification in tests/fixtures/encryption/ and tests/runtime/encryption_test.py, including invalid header, tampering and oversize cases per contracts/encrypted-snapshot.md.

Checkpoint: source contract and vectors available; native compatibility must pass as crypto implementations arrive. No private cloud delivery yet.

## Phase 3: US1 — Install and configure once (P1; first milestone)

Independent test: install once, restart three times and retain masked working settings.

- [X] T006 [P] [US1] Implement hidden stdin/stdout DPAPI CurrentUser helper with bounded execution and sanitized failures in extension/protect-secrets.ps1 per contracts/interfaces.md.
- [X] T007 [P] [US1] Create persistent Jython initializer, safe unload and registered Publish Snapshot/Snapshot Settings actions in extension/snapshot_extension.py and extension/meta_info.dict / extension/script_info.dict using the verified DevKit layout.
- [X] T008 [US1] Implement atomic user-restricted protected configuration, stable book identity, HTTPS/SAS validation, frozen attempt settings and issuance/expiry rules in extension/configuration.py; depend on T006.
- [X] T009 [US1] Integrate masked settings UI and renewal instructions into extension/snapshot_extension.py; provide actionable invalid-settings errors without exposing secrets.
- [X] T010 [US1] Implement scripts/package-extension.ps1 using T001's official tools, include shared exporter/resources, exclude secrets, verify genuine package output and record the exact reproducible command in quickstart.md.
- [X] T011 [US1] Verify DPAPI recovery/error paths, private-file permissions, invalid config and three installed restart cycles in tests/runtime/configuration_test.py and scripts/extension-validation.md; distinguish real runtime evidence from mocks.

## Phase 4: US2 — Publish on demand (P1)

Independent test: publish synthetic data from the menu, decrypt with a test utility
and compare source references without requiring the finished viewer UI.

- [X] T012 [P] [US2] Implement native JCA envelope encryption in extension/encryption.py and pass T005 vectors, exact password encoding, fresh salt/IV, authentication and 128 MiB ceiling checks.
- [X] T013 [P] [US2] Implement one HTTPS BlockBlob PUT with explicit supported service version, fixed length, no redirects, no-store and cancellable deadlines in extension/azure_upload.py; distinguish 201, rejected requests and ambiguous response loss.
- [X] T014 [US2] Implement serialized capture/validate/encrypt/upload pipeline and sanitized persisted outcomes in extension/delivery.py; enforce one 60-second budget, no plaintext staging and no overlapping or blind older retries.
- [X] T015 [US2] Wire manual publication, progress and plain expiry warning directing to Snapshot Settings in extension/snapshot_extension.py; ordinary save callbacks must not export.
- [X] T016 [US2] Add a synthetic-only decrypt/validate utility and failure-injection coverage in tests/runtime/delivery_test.py and tests/tools/decrypt-synthetic.mjs; record its runnable commands in quickstart.md. Cover stage failures, busy requests, response loss and previous-publication readability.
- [X] T017 [US2] Record controlled Azure policy/lifetime checks, blob-scoped write SAS issuance, actual manual synthetic upload, financial comparison and warning boundaries/menu navigation in scripts/extension-validation.md; do not mark unknown issuance as verified.

## Phase 5: US3 — Publish on normal exit (P1)

Independent test: final synthetic edit survives exit, encrypted publication and reopen.

- [ ] T018 [US3] Add deterministic close/save/duplicate/open/canceled-exit and ongoing-manual-attempt scenarios in tests/runtime/lifecycle_delivery_test.py; exercise duplicate closing before capture, after capture and during publication, plus waiting before capture against the shutdown deadline. Verify ordinary saves never capture, switches never publish and other books never reach the destination.
- [ ] T019 [US3] Implement configured-book close arm and one postsave capture in extension/snapshot_extension.py; detach source values and preserve the arm/candidate on duplicate closing within an active cycle. Opening, confirmed cancellation or unload ends the cycle and invalidates its candidate; only a subsequent new cycle rearms capture. Verify the actual cancellation-detection mechanism rather than invent a callback. Publish only at app:exiting without stack/thread heuristics.
- [ ] T020 [US3] Integrate shutdown serialization, canceled queued EDT work, safe unknown outcomes and next-launch status in extension/delivery.py. Start the 60-second shutdown deadline at the first configured-book closing notification, including waiting for earlier manual work before capture; retain each operation's capture-start 60-second budget and enforce whichever deadline expires first. Never reset deadlines on duplicates/exit or substitute a stale manual snapshot.
- [ ] T021 [US3] Verify installed synthetic final-edit equivalence, window-X/menu exit, offline/duplicate/overlap/switch behavior and any available canceled-exit path in scripts/extension-validation.md. Perform three normal close/reopen cycles after one installation, making a distinct synthetic edit before each close; retrieve/decrypt each publication and verify that edit and expected financial values, persistent settings and next-launch result. Record simulations separately and gate full-data acceptance on source correctness and bounded completion.

## Phase 6: US4 — Unlock existing viewer (P1)

Independent test: fixed encrypted synthetic fixture unlocks on desktop/Pixel while
plaintext test mode and Part 1 behavior remain intact, even without live Azure.

- [ ] T022 [US4] Implement strict envelope parsing and Web Crypto decryption in UI/src/encrypted-snapshot.mjs; pass T005 vectors against actual JVM output and reject invalid sizes/version/password encoding before costly work.
- [ ] T023 [US4] Extend UI/src/snapshot-worker.mjs for explicit encrypted/test modes, counted single download, locked/unlockError/ready states, authentication-before-validation, serialized retries and disposal during unlock; preserve effectiveDate and existing query contract.
- [ ] T024 [US4] Extend UI/src/worker-client.mjs with unlock requests and nonterminal authentication errors, stale-response protection and final disposal while retaining request IDs and one-fetch behavior.
- [ ] T025 [US4] Add stable password-manager-compatible form, submit-time input reading, safe loading/error states and clearing after success in UI/index.html, UI/app.js and UI/styles.css; configure encrypted real URL in UI/config.js and preserve exact plaintext test=true.
- [ ] T026 [US4] Expand tests/browser/ and tests/unit/worker.test.mjs for wrong-password one-fetch retry, tampering/truncation/version/financial errors, missing-file test link, stale unlock, BFCache/disposal and full Part 1 regression; publish runnable harness instructions in quickstart.md.
- [ ] T027 [US4] Record Keeper, LastPass and iOS Safari normal autofill plus desktop/Pixel synthetic unlock results in scripts/extension-validation.md; do not substitute manual typing or browser emulation for device acceptance.

## Phase 7: Cross-cutting acceptance

- [ ] T028 Verify real-book final saved values privately, five full-history Pixel load/decrypt/render trials below ten seconds, twenty searches below two seconds, and full-book operation/incremental shutdown times within 60 seconds in scripts/extension-validation.md; include cache/network/browser/size metadata and memory observations.
- [ ] T029 Verify origin no-store/Cloudflare bypass and actual replaced-ciphertext freshness; inspect package, website assets and logs for secret/plaintext exposure, and document scoped provisioning/renewal/recovery in scripts/extension-validation.md and quickstart.md.
- [ ] T030 Run npm test and updated browser/runtime suites, reconcile evidence with all FR/SC criteria and update specs/002-encrypted-snapshot-delivery/checklists/requirements.md; keep failed or unrun acceptance checks explicitly open.

## Dependencies and parallel opportunities

Setup → foundation → US1 → US2 → US3. US4 depends on the envelope/vectors from
foundation and can be developed against a fixture independently of US2/US3;
end-to-end acceptance requires all stories. Final acceptance depends on US1–US4.
Within each story follow listed order except marked independent work: US1 T006
and T007; US2 T012 and T013. US3 lifecycle tests precede integration. US4 is ordered
parser → worker → client → form → harness → device; no additional within-story
parallelism is claimed. Avoid simultaneous edits to snapshot_extension.py.

## Implementation strategy and gates

First milestone is US1: a genuine installed extension with protected settings.
Then validate manual synthetic delivery, add exit integration, and finish viewer
unlock. Do not enable real-data publication merely because mocked tests pass.
G1 is T010/T011, G2 is T018–T021 plus real timing T028, and approved G3 warning/menu
behavior is T015/T017. Azure authorization policy and actual Unicode interoperability
are explicit checks, not research claims. Failed runtime feasibility requires a
recorded design correction before dependent release. No nightly task, service,
new framework, periodic export or investment presentation is added.

## Coverage

FR-001/012: T001/T007/T010/T011; FR-002: T003/T004/T016/T021/T028;
FR-003/009: T006/T008/T009/T011/T017; FR-004/007/008: T005/T012–T017;
FR-005/006/011: T014/T018–T021/T028; FR-010: T015/T017;
FR-013–017/019: T022–T027/T029; FR-018: T011/T017/T021/T027–T030.
SC-001: T011/T021; SC-002/003: T016/T017/T021/T028;
SC-004/007: T026/T027; SC-005: T028; SC-006: T011/T017/T029;
SC-008: T020/T021/T028.


## Phase 1/2 execution evidence

T001/T002: packaging research and allowlist layout documented in extension/README.md and scripts/extension-validation.md; secrets/package outputs excluded. No DevKit, keys or package generated. T003: shared exporter gains cooperative deadlines and canceled queued EDT capture while preserving default manual behavior. T005: six synthetic OpenSSL/JCA/Web Crypto known answers and malformed-input contract tests pass. T004 completed 2026-09-09: user reported DEADLINE_SOURCE_PASS (18 entries, stable/outputEqual/timeoutRejected true); standalone synthetic export validated and all reference comparisons passed after user-confirmed probe additions were reconciled in the private reference. Local evidence: 40 Node tests, 5 deadline tests, 1 JCA test covering all six vectors and 9 probe regression tests pass. No Phase 3+ production code implemented.


## Phase 3 execution evidence

Follow-up: manual rebuild/reinstallation instructions are in scripts/build-extension.md.
Settings now derive expiry from a pasted SAS token/URL when parseable and set
issuance to current UTC on SAS edits (editable for older tokens). Invalid expiry
leaves the existing expiry unchanged; reopening preserves saved dates. Two targeted
Jython tests passed, including real Swing document events. Updated installed UI
verification remains pending rebuild/reinstallation; original T011 evidence below
is unchanged.

T006-T010 implemented 2026-09-09: settings-only persistent initializer/resources, masked settings UI, native DPAPI helper, protected atomic configuration and official KeyAdmin packaging. Five native Jython configuration tests passed; initial and repeat genuine signing succeeded. See scripts/extension-validation.md for package hash and evidence. T011 completed by user confirmation: installation accepted after the signature warning; menus, saved settings, separate invalid-URL/blank-password rejection and canceled edits verified. At least three restart cycles using File > Quit/window X preserved installation and settings; installation also survived book switching. This verifies persistence, not trusted signature validation or publication. Publish Snapshot explicitly reports not enabled; no automatic publication or Phase 4+ work is active.

## Phase 4 execution evidence

T012–T016 implemented 2026-09-09. Build 2 enables manual capture/build, native
encryption and serialized single-PUT publication with progress, credential warnings
and sanitized status. Automatic exit publication remains disabled. Two encryption
tests (including six production known-answer vectors), seven delivery tests and
two targeted settings/resource tests pass under bundled Jython; all 41 Node tests
pass. Actual Java HTTP loopback and JVM-to-WebCrypto financial fixture checks pass.
These are synthetic/local results, not actual source-book/Azure acceptance.

The signed MXT and evidence are recorded in scripts/extension-validation.md.
T017 completed by user verification: installed synthetic Azure publication (one timed at
1.56 seconds), decryption/password rejection, passing financial comparisons, new
transaction propagation, offline/bad-SAS failure and recovery, password-change
decryption, and utility output-file guard. User also confirmed the permitted 23-month
SAS and installed warning boundaries from 32 days before expiry through 366 days
after expiry. On build 3, user confirmed red warning text at 2028-08-03 and
2028-08-11, expired wording on the latter, and the expected error when attempting
publication with expired credentials. Phase 4 is complete; Phase 5 is not started.
Follow scripts/phase4-publish.md; detailed results are in
scripts/extension-validation.md.
