# Encrypted snapshot envelope v1

Project-specific framing over standard primitives, not a new cryptographic algorithm.

| Byte offset | Length | Value |
| --- | --- | --- |
| 0 | 8 | ASCII MDSNAP01 |
| 8 | 1 | Version 0x01 |
| 9 | 16 | Fresh random salt |
| 25 | 12 | Fresh random GCM IV |
| 37 | Remaining minus 16 | Ciphertext |
| End minus 16 | 16 | Authentication tag |

Version 1 fixes PBKDF2-HMAC-SHA256, 600,000 iterations, 256-bit derived key,
AES-256-GCM and a 128-bit tag. The entire 37-byte header is authenticated additional
data. No parameter negotiation, compression, base64 or JSON wrapper. Plaintext is
UTF-8 compact snapshot-v1 JSON. Minimum framing length is 53 bytes; financial JSON
validation still rejects an authenticated empty payload. Reject unknown magic or
version before derivation. Authenticate before decoding or parsing financial data.

Password is exact Unicode text encoded as UTF-8, without normalization or trimming.
Reject unpaired surrogates; setup rejects empty/all-whitespace passwords while
preserving spaces in otherwise valid passwords. Use native JCA and Web Crypto.
Bundled JCA PBKDF2 password interpretation must match Web Crypto raw UTF-8 input in
executed vectors, not merely be assumed from PBEKeySpec. Fresh SecureRandom salt
and IV per publication; deterministic randomness belongs only in synthetic tests.

Initial implementation safety ceiling: 128 MiB plaintext, maximum envelope
134,217,781 bytes. Reject oversized exports visibly without truncating history;
abort a counted streamed download above the ceiling even if Content-Length is
missing or false. This design ceiling exceeds the current 36 MB source, is not a
claim of Pixel capacity, and must be reconsidered explicitly if actual growth
exceeds it. Limit concurrent unlock operations to one. No attacker-selected KDF
iteration count or allocations from untrusted length fields.

Required vectors: ASCII, accented, precomposed versus combining (distinct), emoji,
leading/trailing spaces, long passwords; reject lone surrogates. Test wrong password,
every header/body/tag mutation, truncation, appended bytes, unsupported version,
oversize download and authenticated invalid JSON/financial schema. Verify actual
bundled Jython/JCA encryption against browser Web Crypto decryption and fixed
known-answer outputs. Never weaken the KDF to pass timing without revising design.

References: [Web Crypto specification](https://www.w3.org/TR/WebCryptoAPI/) and
the native crypto sources in ../research.md. These support the primitives; this
exact envelope and its runtime compatibility require implementation tests.
