# Synthetic cryptographic known answers

vectors.json contains public test passwords/derived keys and fixed randomness.
Never use these values for actual delivery. Plaintext is intentionally not a
financial snapshot: this isolates byte interoperability from financial validation.
Authenticated invalid-financial-data handling belongs to T026's loader tests.

Regenerate with `node tests/fixtures/encryption/generate.mjs`; generator uses
Node/OpenSSL PBKDF2 and GCM. Verify independently with runtime/encryption_test.py
under Moneydance Jython/JCA and unit/encryption-vectors.test.mjs under Web Crypto.
Precomposed/combining passwords intentionally derive distinct keys. Production
encryption and browser parser are later tasks; they must consume these vectors.
