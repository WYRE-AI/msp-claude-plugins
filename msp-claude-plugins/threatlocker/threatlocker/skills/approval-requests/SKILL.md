---
name: "ThreatLocker Approval Requests"
description: >
  ThreatLocker application approval request triage: pulling the pending queue, grouping
  requests by application and hash, signed-publisher and path heuristics, and
  approve/deny recommendations with audit-friendly reasoning.
when_to_use: >-
  When triaging pending application approvals, evaluating signer/path heuristics,
  classifying high-confidence vs needs-review requests, or producing an approval queue
  summary. Use when: threatlocker approval, threatlocker pending approval, threatlocker
  approve application, threatlocker deny application, threatlocker request triage,
  threatlocker application request, approve threatlocker, permit application
  threatlocker, or threatlocker queue.
---

# ThreatLocker Approval Requests

Approval requests are how ThreatLocker users ask for an application
that's currently being blocked to be permitted. Each request carries
rich context — file path, hash, signer, the user who asked, the
computer it ran on, and a free-text justification. Triaging this queue
well is the difference between a productive ThreatLocker deployment
and a frustrated client.

## Anti-triggers

- **A malware detection.** ThreatLocker is default-deny allowlisting, not
  EDR — it blocks everything unlisted and has no verdict on whether a
  binary is malicious. A request in this queue means "policy said no",
  not "something was detected". Convictions and confirmed threats are
  `sentinelone-alerts` or `huntress-incidents`.
- **What the binary actually did on the endpoint.** The request record
  carries only the metadata the user submitted; execution history,
  process chain, and prior blocks are `threatlocker-audit-log`.
- **Which endpoints an approval would cover.** Permits land at group
  scope, so the blast radius question is `threatlocker-computer-groups`.

## API Tools

### List Approval Requests

```
threatlocker_approvals_list
```

POST-based `GetByParameters` — see `api-patterns`. Useful filters via
`searchText`: file name, application name, requester user, computer
name. Each request typically includes:

- `requestId`, `applicationName`, `fileName`, `filePath`, `fileHash`
- `signer` (Authenticode publisher), `signerVerified` boolean
- `requesterUser`, `computerName`, `computerId`, `organizationName`
- `justification` (free-text from the user), `dateRequested`
- `status` — `Pending`, `Approved`, or `Denied`

### Get Approval Request

```
threatlocker_approvals_get
```

Full detail for one request — includes additional context like the
specific policy that blocked it and any prior history of the same hash.

### Pending Count

```
threatlocker_approvals_pending_count
```

Cheap call — returns the size of the pending queue. Use this as the
opening move every shift to know whether you have 3 requests or 300.

### Get Permit Application Detail

```
threatlocker_approvals_get_permit_application
```

Returns the application that *would be permitted* if the request is
approved — including which group(s) the approval would scope to and
what other endpoints would be affected. Always check this before
approving anything that looks like it could have a wider blast radius
than expected.

## Common Workflows

### Daily Queue Triage

1. `threatlocker_approvals_pending_count` — sets expectations.
2. `threatlocker_approvals_list` with `status: "Pending"`,
   `orderBy: "dateRequested"`, `isAscending: true` (oldest first).
3. Group results by `fileHash` — many requests are duplicates of the
   same binary asked for from multiple endpoints. Decide once, apply
   broadly.
4. Within each hash, classify (see heuristics below).
5. For approves, call `threatlocker_approvals_get_permit_application`
   to confirm scope. Then approve.
6. For denies, capture a reason that the requesting user can act on.

### Signed-Publisher Heuristics

Signals that increase confidence to **approve**:

- `signerVerified: true` AND `signer` is a known vendor (Microsoft,
  Adobe, JetBrains, Mozilla, Google, etc.).
- `filePath` is in a vendor-installed location (`C:\Program Files\...`).
- The same hash has been previously approved for other endpoints.
- The requester user matches the computer's primary user.
- Justification includes a specific business reason ("Need Wireshark
  for ticket INC-5123").

Signals that warrant **needs-review** or **deny**:

- Unsigned or signer-unverified binary.
- Path is in `%TEMP%`, `%APPDATA%`, `Downloads`, or `C:\Users\Public`.
- File name mimics a system binary (`svchost`, `lsass`, `runtime`)
  but path is unusual.
- Justification is empty, generic ("need this"), or copy-pasted across
  many requests.
- Hash has been denied previously, especially with a security reason.

Hard escalation triggers — surface to a senior analyst:

- Known LOLBin (`certutil`, `mshta`, `bitsadmin`) requested from a
  user-writable path.
- RAT/remote-tool installer (`AnyDesk`, `ConnectWise Control`,
  `ScreenConnect`) requested by an end user rather than IT.
- Phishing dropper indicators — Office macros, ISO-mounted shortcuts,
  HTA files.

### Bulk Approve Pattern

When a single hash appears across many requests:

1. Pick one representative request and review fully.
2. Approve via the application — the resulting policy will cover all
   endpoints in the chosen group.
3. The other pending requests for the same hash typically resolve
   automatically once the application is permitted at group scope.
4. Re-pull pending after a minute and confirm the duplicates cleared.

## Edge Cases

- **Vendor binaries with broken signatures** — Newer versions of some
  legitimate apps occasionally ship with signature timing issues.
  Verify the hash with VirusTotal or the vendor before approving an
  unsigned binary that *should* be signed.
- **Self-signed installers** — Common in line-of-business apps.
  Approve on hash, not signer.
- **Stale requests** — A request older than 30 days where the user has
  since left the org should usually be denied with a "stale request"
  reason.
- **Status transitions** — A request in `Approved`/`Denied` is
  terminal; do not attempt to re-process it. Filter to `Pending` only.

## Best Practices

- Always document a one-line reason on every decision — the audit log
  is your defense if a policy change ever needs review.
- Approve at the application level (hash + signer), not file path —
  paths drift, hashes don't.
- Re-check the queue immediately after a bulk approve to confirm
  duplicate requests resolved.
- For unfamiliar binaries, check the audit log (`audit-log` skill) to
  see what the binary actually did before deciding.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) — Auth and pagination
- [audit-log](../audit-log/SKILL.md) — Behavior of binaries before
  approval decisions
- [computers](../computers/SKILL.md) — Endpoint context for requests
- [computer-groups](../computer-groups/SKILL.md) — Policy scope of
  the resulting permit
