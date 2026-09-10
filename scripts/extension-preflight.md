# Moneydance Extension Compatibility Probe

This is a temporary, read-only Jython 2.7 runtime extension for investigating
shutdown timing and public status-bar capabilities. It does not export, encrypt,
upload, save the book, generate signing material or establish persistent installation.
Version 3 optionally builds an export in memory when explicitly armed; it never
writes that export to disk or logs its financial contents.
Restarting Moneydance requires loading this probe again; that limitation belongs
only to this diagnostic, not the planned production extension.

## First run: synthetic test book

1. Open the synthetic Moneydance book used for the earlier preflight tests.
2. In Moneydance's Developer Console, run
   `scripts/extension-preflight.py`. Accept its runtime-extension installation
   prompt if shown. Expect `PROBE_READY` and five Compatibility Probe actions
   under Extensions. If these do not appear, stop and report what happened.
3. Choose **Compatibility Probe: Start logging**. Select a new filename, such as
   `UI/data/extension-probe-exit-01.log`. Existing files are refused so earlier
   results cannot be overwritten. Expect `PROBE_LOGGING`.
4. Add one ordinary fictional transaction to the synthetic book and finish editing
   the row. Choose **Compatibility Probe: Record book and UI capabilities**.
   This records counts after the edit; do not run a separate manual save now.
5. Choose **Compatibility Probe: Arm one 2-second exit hold**. Expect
   `PROBE_HOLD_ARMED`.
6. Exit Moneydance normally. Let its usual backup finish. The probe deliberately
   pauses one application-exiting callback for two seconds; it does not add any
   network work. Do not force-kill Moneydance to speed up the test.
7. Open the selected log in your editor and share its contents. Also report whether
   shutdown finished normally, whether the menu actions appeared, and whether
   anything unexpected happened. The file survives exit, so console output is not
   required. Do not share a general Moneydance console dump with private data.

The log contains event timestamps/order, EDT flags, book availability/readability,
transaction/root-child counts and public class/method signatures. It contains no
account names, transaction text, amounts, book paths, credentials or raw exception
messages. Each line is flushed to disk. The tiny synchronous logging overhead and
the deliberately armed two-second hold are part of this diagnostic.

## What the results establish

- Relative order of presave/postsave, backup, closing/closed and app-exiting events
  that actually reach this temporary runtime extension.
- Whether the source book remains readable at those events, and whether its
  transaction count agrees with the recorded post-edit checkpoint.
- Whether `EXIT_HOLD_BEGIN` and `EXIT_HOLD_END` both appear before exit/unload.
  Missing completion is evidence to investigate, not an automatic pass.
- Public status-related methods and existing status-component classes in the
  current UI. The probe does not attach click listeners or alter the status bar.

Counts are not a full financial snapshot comparison. A two-second callback pause
does not prove that a sixty-second export/upload is safe, cancellable or accepted
by all exit paths. The runtime extension may receive events differently from an
installed MXT. Final-state fidelity, actual clickable status behavior and persistent
package installation therefore remain separate gates even if this run succeeds.

After reviewing the first log, we can choose the next narrow test. Likely follow-ups
are a run without an armed delay, a canceled-exit run if Moneydance offers a cancel
path, and an installed MXT run once the official signing/package workflow is ready.
Do not manufacture an exit-cancel dialog or change backup settings for this probe.

## Stop or repeat

Use **Compatibility Probe: Stop logging** to disarm the hold and stop recording.
Unloading the temporary extension also stops it and releases its controller
reference. Use a new log filename for each run. The probe keeps no book reference
between callbacks. On a new Moneydance session, load the script again if requested.

## Local probe checks (already run)

From PowerShell, using the existing installed runtime:

```powershell
& 'C:/Program Files/Moneydance/jre/bin/java.exe' '-Dpython.cachedir.skip=true' -cp 'C:/Program Files/Moneydance/lib/*' org.python.util.jython -B 'tests/runtime/extension_probe_test.py'
```

Seven tests pass under actual Jython: lifecycle/teardown, sanitized failures,
one-shot hold, actual GUI class signature inspection, exporter library loading,
close/arm gating, and detached candidate survival through exit. Source objects
are fake. These tests do not open a book or prove Moneydance event order.

## Next run: version 3 UI inspection and synthetic close capture

1. Open the **synthetic test book**, not the real financial book. Load the updated
   probe in a fresh Moneydance session so an older probe does not also receive events.
2. Choose **Start logging**, using a new file such as
   `.workspace/data/extension-probe-exit-03.log`. Version 3 fixes the reproduced
   Jython parameter-class `getName()` failure; expect GUI_API/UI_SCAN_COMPLETE.
3. Add one fictional transaction and finish editing its row. Choose **Record book
   and UI capabilities** to record the new transaction count.
4. Choose **Arm synthetic close capture once**, then immediately exit Moneydance
   normally. Do not arm the old two-second hold for this run.
5. Share the log and report whether shutdown completed normally or appeared stuck.
   Expected evidence is CLOSE_CAPTURE_OK followed by EXIT_CANDIDATE with
   `unchanged: true`. A failure or timeout is useful evidence too.

Ordinary postsave notifications do not capture. This diagnostic requires both
explicit arming and a preceding closing event, then consumes the arm once. It
reuses the exporter's stable double capture and balance checks, serializes the
snapshot on the EDT, and retains only JSON bytes plus an internal digest. The
digest and financial data are not logged; counts, sizes and timing are.

An off-EDT callback waits at most five seconds for capture. If the EDT is blocked,
the queued capture is canceled. An already running capture cannot safely be
interrupted, so five seconds is a wait limit, not a hard limit on EDT execution;
late results are discarded. This is why this run is synthetic-only. Source capture
and serialization placement/performance remain production design work.

Explicit arming is a diagnostic control, not the proposed production UX. This
does **not** prove that book close/switch and application exit can be distinguished
before capture. Nor does unchanged JSON prove agreement with persisted disk data.
Full final-edit equivalence, canceled exit, installed-MXT behavior and actual
bounded upload remain open checks. No cloud publication occurs in this probe.

References: the [official Python extension guide](https://test.infinitekind.com/developer-python)
documents the Developer Console `moneydance_extension` discovery convention and
callbacks; the [official event guide](https://test.infinitekind.com/developer)
lists lifecycle event names. Actual runtime observations take precedence over
assuming a callback's ordering from its name.

## Next run: version 4 close-versus-exit comparison (no capture)

Version 4 fixes the same reproduced Jython Class.getName collision on MainFrame
that prevented component traversal. It also records LIFECYCLE_CALL_PATH at closing,
postsave and app-exiting: vendor class/method names only, with no arguments, source
paths, thread names, record text or exception messages. These call paths are
diagnostic evidence, not a supported exit flag and not an export trigger.

Please use the synthetic book. **Do not arm capture or the two-second hold** in
either run; no new transactions are required.

1. In a fresh session, load the updated script, start logging to a new
   `extension-probe-close-04.log`, then use Moneydance's normal **Close** action
   to close the book while keeping the application open, if that action exists.
   Report the exact menu/action used and whether the application stayed open.
   If there is no close-without-exit action, report that instead of manufacturing
   a cancel path or changing settings. A normal switch to another synthetic book
   is also useful if that is the available workflow; identify it as a switch.
2. Reopen the synthetic book. If the probe menu is still present, stop logging
   and start a new `extension-probe-exit-04.log`. Otherwise reload the probe first.
   Exit the application normally, and report the action used (for example menu
   Exit versus window X). Share both logs.

The successful GUI scan should report UI_SCAN_COMPLETE and any matching status
components. The lifecycle comparison may reveal a vendor API worth investigating,
but different call stacks alone do not establish a maintainable production hook.
Nine local Jython tests cover the updated diagnostics, including actual MainFrame
class naming and call-path sanitization. Actual component traversal in Moneydance
and early exit discrimination still require runtime evidence.
