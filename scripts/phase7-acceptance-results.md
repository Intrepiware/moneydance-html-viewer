# Phase 7: final acceptance

Local review and test results are in extension-validation.md. No rebuild is needed.
Keep financial details and secrets private; report timings, counts and outcomes only.

## 1. Pixel 8 encrypted performance

Use your real full-history snapshot and normal deployed URL. Record browser/version,
network route, encrypted file bytes, accounts/entries, and whether other assets are
cached. Do five fresh page loads (reload, not back/forward restoration).
For each trial measure two intervals and add them:

**Results**

- Brave 1.94.121, Chromium 152.0.7977.83
- route: https://money.mikedevlin.site (behind Cloudflare Access, only permits my and wife's gmail accounts)
- encrypted file bytes: ~36,000KB
- 74,211 transactions, ~500 accounts
- cached? not sure

### 1a. Test Case: Unlock

- Reload to Unlock becoming enabled (download and initialization).
- Clicking Unlock with the correct password to usable balances AND transaction rows.

Exclude only the time between those intervals spent entering the password. Each sum
must be under ten seconds. Then perform twenty representative searches, timing from
completion of input to visible results, including debounce; each must be under two
seconds. Report all five load totals and either twenty search times or confirmation
that all twenty met the limit. Note crashes, memory warnings or missing history.

**Results**

- Refresh until loading animation disappears: 2.21 sec
- Password submit to usable balances/transaction rows: 1.09 sec
- searches (stop typing to search appears), in seconds. NOTE: one search is above 2 seconds; it's not worth it to investigate this, it's fast enough.
  - 0.65
  - 0.98
  - 1.52
  - 1.33
  - 2.73
  - 1.41
  - 1.36
  - 1.42
  - 1.50
  - 1.50
- No crashes, memory warnings, or missing history

## 2. Real-book delivery and source checks

Time a normal real-book exit and verify success on reopening. Before another sync,
read the sanitized status:

```powershell
Get-Content "$env:USERPROFILE/.moneydance-snapshot-delivery/last-delivery.json"
```

Report elapsedMs, shutdownElapsedMs and observed total shutdown time. If total exit
is under sixty seconds, extension-added delay is necessarily below that bound. If
longer, compare with normal Moneydance saving/backup time rather than assuming the
extension caused it. Operation and added shutdown delay must each be within sixty
seconds. The accepted non-reproducible offline delay does not waive this normal
full-book timing check. Do not repeat the unavailable cancel test.

Your previous new-transaction/real-balance comparisons already count as evidence.
Confirm the final saved edit and relevant account/subaccount and running balances
match after this normal exit. No need to add artificial transactions to real data.
Confirm an ordinary save while the app stays open does not update the remote blob.
Book-switch isolation has deterministic coverage; report an installed check only
if performed, otherwise retain its evidence limitation for final disposition.

**Results:**

- Contents of last-delivery.json:

```
{"completedAt": "2026-09-10T18:41:45Z", "code": "PUBLISHED", "stage": "upload", "shutdownElapsedMs": 24176, "outcome": "success", "elapsedMs": 22990}
```

- Shutdown times with Snapshot extension UNINSTALLED (confirmed Azure Blob filedate remained unchanged). NOTE: I'm unsure why the times vary so wildly. Moneydance performs a dropbox backup on exit, perhaps there's unpredictable latency there?:
  - 1:03
  - 0:34
  - 0:47
  - 0:52
  - 0:44
- Shutdown times with Snapshot INSTALLED (confirmed Azure Blob filedate changed):
  - 1:01
  - 0:45
  - 0:33
  - 0:33
  - 0:39

## 3. Cache policy and freshness

In Azure Storage Explorer, inspect the encrypted blob's Cache-Control property:
it should be no-store. The publisher sets x-ms-blob-cache-control on each PUT.
[Azure Put Blob documentation](https://learn.microsoft.com/en-us/rest/api/storageservices/put-blob).

**Result:** confirmed no-store

In Cloudflare, verify a Cache Rule matching the encrypted object's exact host/path
uses Bypass cache, with no conflicting rule that forces caching. Do not bypass the
entire site's static assets unnecessarily.
[Cloudflare Cache Rules settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/).

**Result:** See screenshots

Using desktop Network tools on the normal viewer URL, inspect the encrypted file
response before and after a normal publication. Record Cache-Control, CF-Cache-Status,
Age (if present), ETag and Last-Modified. Expect no-store and no cached HIT/STALE;
DYNAMIC or BYPASS may be appropriate. A single MISS is not proof of bypass. Check
multiple ordinary reloads, without query cache-busters or the DevTools Disable cache
option. Confirm the replaced object and latest As of/data appear. Your earlier
replacement test established functional freshness, but not the configured policy.
[Cloudflare cache responses](https://developers.cloudflare.com/cache/concepts/cache-responses/).

**Result:** See HAR

Reader URL must remain same-origin HTTPS and contain no upload SAS. Publish only
UI code/assets, plaintext synthetic test data, and the encrypted real snapshot.
Do not upload the entire UI/data folder: it may contain ignored private JSON.
Inspect the actual deployed files for obsolete plaintext exports and remove those
through your normal deployment process if found. Review local logs privately for
accidental debug dumps; do not paste them. The local review cannot attest to deployed
assets or historical logs it has not inspected.

**Result:** Confirmed data directory contains only snapshot.enc and test-snapshot.json

## 4. Recovery and renewal

Keep the write-only, blob-scoped SAS in Moneydance Snapshot Settings, never in the
website. Use the approved credential lifetime; issue a replacement through Azure,
update settings, verify expiry, publish and confirm the replacement. A copied old SAS
needs its actual issue date entered; pasting defaults issue date to now.
A lost encryption password cannot decrypt an existing object; set a new password
and publish a fresh snapshot from Moneydance. A failed or unknown upload must be
checked remotely before a fresh manual retry; do not replay old snapshots. If the
local transport cannot drain, verify the remote result and restart Moneydance.
See build-extension.md for build/key handling and phase4-publish.md for synthetic
failure checks. No recovery service or broad account credential is required.

**Note:** Not sure if this is general advice or a test case. I feel like we covered all these cases in previous phases though.

## Report

- Pixel browser/network/size/counts/cache state:
- Five combined load times:
- Twenty searches below two seconds: yes/no (details if not)
- Crashes/memory warnings:
- Real-book operation/shutdown times and source comparison:
- Ordinary-save check / optional book-switch evidence:
- Azure Cache-Control / Cloudflare rule and response headers:
- Replacement visible without cache-busting:
- Deployed assets and private log review:

The current browser harness already passed by user report in Phase 6. Re-run it if
new viewer changes are made or a regression appears. LastPass/Safari and the iOS
Chrome zoom gap remain accepted exceptions, not new testing requirements.
