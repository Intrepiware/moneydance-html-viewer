# Interface contracts

## Moneydance extension

Persistent packaged Jython initializer registers **Publish Snapshot** and
**Snapshot Settings** through registerFeature. Settings opens Azure configuration,
masked secret inputs and renewal instructions. Warn on startup, settings access
and delivery attempts at the 30-day boundary and after expiry. Plain status text:
`Upload credentials expire soon — Extensions > Snapshot Settings` (expired variant
when appropriate). No internal status-component interception, polling to overwrite
Moneydance progress, or clickable status requirement. Menu access remains available.

Shared exporter exposes stable capture and build functions without invoking main
on library load. Preserve the existing standalone script's chooser/status behavior.
Pass cooperative deadline checks through capture/build rather than duplicate the
accounting logic. The production extension does not require the probe's manual arm.

## Secret helper

Windows PowerShell/.NET DPAPI CurrentUser, launched hidden. One JSON request on
stdin: `{operation: protect|unprotect, dataBase64: ...}`. Protect input is UTF-8
JSON secret-bundle bytes; unprotect input is DPAPI bytes. Successful stdout contains
only `{status: OK, dataBase64: ...}`; failure contains a fixed safe code and exits
nonzero. Never echo input, exceptions or secrets to stderr; timeout and malformed
output fail closed. No secrets in arguments, environment variables or temporary
files. Persist protected bytes atomically and apply user-restricted ACLs. Base64
is pipe transport encoding, not encryption. Verify recovery after process restart.

## Azure publication

Single HTTPS PUT to configured blob with blob-scoped service SAS (write only),
`x-ms-blob-type: BlockBlob`, a supported explicit service version, fixed byte length,
`Content-Type: application/octet-stream`, `Cache-Control: no-store`. Body is exactly
the envelope in encrypted-snapshot.md. Reject redirects; do not log query strings.
HTTP 201 is acknowledged success. Pre-transmission failures do not modify the blob;
lost responses after sending have unknown outcome. Do not delete first, upload
plaintext, queue old retries or claim uncertain preservation. Validate service
version against official Put Blob documentation during implementation.

Reader URL is same-origin HTTPS in production and contains no upload authorization.
Existing localhost HTTP development is permitted where Web Crypto is available.
Cloudflare bypass and origin no-store must be verified after replacement. Test
dataset is a separate plaintext resource chosen only by exact `test=true`.

## Worker/client protocol additions

Retain increasing requestId and all existing query fields/results. No generation ID.
`load` adds explicit mode (`encrypted` or `test`) selected by client configuration
and exact query parameter, never sniffed from payload. Download once per worker.
Encrypted load parses the header, retains bytes and replies `locked` with requestId.
`unlock` carries requestId and password; allow only one unlock at a time. Disable
the form while working. Reply `unlockError` with fixed `AUTHENTICATION_FAILED` on
authentication failure; keep worker and bytes alive. A wrong password and tampered
ciphertext share that message. Never echo the password. `ready` preserves existing
metadata/accounts/count response after decryption and validation. Terminal `error`
retains existing disposal behavior. Query is rejected until ready. Disposal during
unlock prevents late results from rendering; request IDs suppress stale responses.

No plaintext fallback in encrypted mode. Unsupported/truncated envelope is terminal;
authenticated but invalid JSON/snapshot is terminal. A missing real file retains
the explicit test link. Financial metadata and data never appear before ready.

## Password UI

Stable visible form, labeled password input with stable name/id and
`autocomplete="current-password"`, explicit Unlock submit. Read value at submit
time so autofill need not emit input events. Do not auto-submit, prevent paste or
implement password-manager-specific APIs. Actual Keeper, LastPass and iOS Safari
normal autofill workflows are acceptance checks. Preserve all Part 1 styling and
register/search behavior after unlock.
