# ePay Customizations

Local Spec Kit preset, version 0.1.0. Its first customization adds manual acceptance tasks and sequential story gates. No Moneydance-specific behavior or data is included.

## Contents and enforcement

Three composed command additions cover `speckit.tasks`, `speckit.implement` and `speckit.analyze`. Two template additions cover tasks and constitution governance. A new `acceptance-template` provides evidence-record structure. The commands contain their own essential rules so they do not depend on an agent discovering this README.

Existing commands/templates are extended with `append`, preserving their normal workflow. The additions explicitly constrain generic optional-test/parallel-story guidance. Gate checks run before initial implementation and every story transition; they permit current-story fixes and later-story planning. Human reports count, automated-only passes do not, and justified omissions stay distinct from passing tests.

This is instruction-based enforcement, not a filesystem/CI security boundary. It cannot prove someone performed a manual test. Version 0.1.0 intentionally contains no gate-parser script or new runtime dependencies. Structural checks and behavioral smoke scenarios are in `tests/`.

## Compatibility

Target: Spec Kit **1.0.4 or newer**, with command/template `append` composition and Codex skill registration. This lower bound matches the originating project's recorded version; it is a target, not a claim that every later release is verified. Test your actual CLI in a disposable project before adoption. The authoring environment lacked the `specify` executable, so installation, generated Codex commands and actual agent adherence have not been verified here.

`preset.yml` uses JSON syntax, which is valid YAML, allowing dependency-free local structure checks. Entries, including commands, belong under `provides.templates` as in the official scaffold. No repository URL or open-source license is invented; this is a local private preset. Choose a license and add publishing metadata before distributing it.

## Try it without changing this project

1. Create a disposable Spec Kit project using your installed CLI, with Codex and skills enabled. Check the current `specify init --help` for your version's options.
2. Inside that disposable project, install the preset:

   ```powershell
   specify preset add --dev 'C:\Working\Sandbox\moneydance\Export Json\.workspace\presets\epay-customizations'
   specify preset list
   specify preset resolve tasks-template
   specify preset resolve acceptance-template
   ```

3. Inspect the effective tasks template and generated Codex tasks/implement/analyze skills. Both core instructions and the ePay additions must be present. Project-local overrides or higher-priority replacements can shadow this preset; inspect resolution rather than assuming the gate was installed.
4. Run the behavioral scenarios in [tests/smoke-test.md](tests/smoke-test.md). Record CLI version/integration, observed behavior and failures. Installing a preset is not proof the agent follows it.
5. Only after validation, run the same `preset add --dev` command from a project where you want to adopt it. Installation was NOT performed by creating this folder.

Commands are materialized by Spec Kit during installation/reconciliation. Editing this source folder alone does not establish that installed command files changed. Consult your CLI's update/reinstall behavior, preserve local work and verify generated files after each change; do not assume live linking or automatic rollback.

## Existing projects

The constitution template applies during constitution generation/amendment, not as permission to overwrite `.specify/memory/constitution.md`. Adopt the rule through the project's normal amendment procedure. This Moneydance project already has an equivalent manual-testing rule; retain it and its version/history. Avoid duplicate rules in its customized tasks template.

Do not regenerate existing tasks or acceptance records simply to install this preset. Preserve IDs, checkboxes, evidence and failures/retests; assess gaps against the policy. Installation/removal must not fabricate acceptance or erase historical results. Explicit user instructions and the adopted constitution remain authoritative.

## Local checks

From this folder, with Node 20 or newer:

```powershell
node --test tests/package.test.mjs
```

These verify the manifest's declared structure, paths, composition choices and evidence template. They do not replace the official CLI's manifest validation, install smoke test or behavioral tests.

## References

- [Official preset reference](https://github.github.io/spec-kit/reference/presets.html)
- [Official manifest scaffold](https://github.com/github/spec-kit/blob/main/presets/scaffold/preset.yml)

The originating constitution and workflow provided the policy; the preset is otherwise independent of that application. See [CHANGELOG.md](CHANGELOG.md) for revisions.
