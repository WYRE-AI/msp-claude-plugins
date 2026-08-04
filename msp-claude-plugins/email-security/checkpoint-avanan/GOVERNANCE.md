# Checkpoint Harmony Email (Avanan) plugin — governance and safety model

Unofficial. Community-built plugin for the Checkpoint Harmony Email &
Collaboration API. Not affiliated with, endorsed by, or sponsored by
the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Harmony Email through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Checkpoint client ID, access key, or bearer token is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
  Harmony Email tokens expire hourly; the gateway handles the refresh.
- Every call carries operator identity, so the gateway audit log answers
  "who released that message" — Harmony Email's own log records only the
  API application, and the `releasedBy` field on a quarantine entry will
  show the shared integration account for every release.
- Revoking gateway access revokes Harmony Email access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Harmony Email state or mail flow. Safe for autonomous agents. | `avanan_quarantine_list`, `avanan_quarantine_get`, `avanan_quarantine_search`, `avanan_quarantine_stats`, `avanan_threats_list`, `avanan_threats_get`, `avanan_threats_iocs`, `avanan_threats_timeline`, `avanan_threats_search`, `avanan_threats_stats`, `avanan_incidents_list`, `avanan_incidents_get`, `avanan_incidents_list_notes`, `avanan_incidents_timeline`, `avanan_incidents_stats`, `avanan_policies_list`, `avanan_policies_get`, `avanan_allow_list_get`, `avanan_block_list_get` |
| **Write** | Creates or annotates case records. Does not touch mail or detection behaviour. | `avanan_incidents_create`, `avanan_incidents_update`, `avanan_incidents_add_note`, `avanan_incidents_add_evidence`, `avanan_threats_mark_false_positive` |
| **Destructive** | Delivers, destroys, or blocks customer mail, or changes what the tenant scans for. Requires explicit per-call human approval. | `avanan_quarantine_release`, `avanan_quarantine_delete`, `avanan_policies_enable`, `avanan_policies_disable`, `avanan_policies_update`, `avanan_allow_list_add`, `avanan_allow_list_remove`, `avanan_block_list_add`, `avanan_block_list_remove` |

Three of those classifications are worth defending, because the API
calls them ordinary updates:

**`avanan_quarantine_release` is destructive.** Releasing is not
un-quarantining a record — it delivers a message the security stack
already judged malicious into a real person's inbox, and there is no
un-deliver. When the quarantine reason is `MALWARE` or `BEC`, an
erroneous release is the exact outcome the product exists to prevent.
The `addToAllowList: true` parameter makes it worse: a single release
call can also write a permanent tenant-wide detection bypass for that
sender, so an operator approving "release this one email" may be
approving a standing policy change they never saw.

**`avanan_quarantine_delete` is destructive.** The quarantine copy is
the only copy — the message never reached the mailbox. Deleting it
destroys the evidence for any later investigation, and the skill's own
error table confirms an expired or deleted entry cannot be recovered.

**Every policy and list mutation is destructive.** `avanan_policies_*`
and the allow/block list tools look like configuration edits, but their
blast radius is the tenant's entire mail flow:

- Disabling an anti-phishing or anti-malware policy silently removes a
  detection layer for every user until someone notices.
- Enabling a policy, or updating its action to `QUARANTINE` or `BLOCK`,
  can bury a customer's legitimate inbound mail within minutes. This is
  a mail-flow outage, not a settings change.
- `avanan_allow_list_add` creates a standing bypass of every detection
  engine for a sender or domain — the first thing an attacker wants.
- `avanan_block_list_add` on the wrong domain silently drops a
  customer's supplier, invoice, or payroll mail with no bounce visible
  to the recipient.
- The `_remove` calls are equally sharp in reverse: removing a block
  entry re-admits a sender someone deliberately excluded.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-tenant quarantine triage, threat sweeps, and
  reporting are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents. In particular, do
  not give an unattended agent a standing "release false positives"
  policy — false-positive judgement is exactly the judgement being
  delegated.

## What it cannot reach

- Only the Harmony Email tenants mapped to the operator's gateway
  identity.
- No filesystem, no shell, no other vendor's data.
- No mailbox. Harmony Email quarantine holds mail before delivery;
  nothing in this plugin can reach into Microsoft 365 or Google
  Workspace to retrieve a message that was already delivered.
- No live event stream. Every tool is point-in-time.
- Regional scope. A tenant provisioned in the EU or AP region is served
  by a different API gateway; credentials for one region return
  authentication errors against another, so a misconfigured connection
  fails closed rather than reading the wrong tenant.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **Quarantine tools return message content and correspondent PII.**
  `avanan_quarantine_list` and `avanan_quarantine_get` include
  `subject`, `sender`, `senderDisplayName`, the full `recipients` list,
  `attachmentNames`, and `bodyPreview` — the first 200 characters of the
  email body. For a DLP-quarantined outbound message, that preview is
  by definition the sensitive content the DLP rule matched.
- `avanan_threats_get` and `avanan_threats_iocs` return sender IP
  addresses, recipient lists, and attachment hashes.
- `avanan_incidents_*` records name affected users
  (`affectedUsers`) and carry analyst notes, which routinely contain
  account names and investigation detail.

Restrict quarantine and incident reads if your agents run unattended, or
scope them to the tenants that specific operator supports.

## Known sharp edges

- **Release and delete are capped at 100 entities per call.** An agent
  splitting a 500-message action into batches is performing five
  separate irreversible operations; a failure partway through leaves the
  tenant in a mixed state with no transaction to roll back.
- **Queries silently truncate.** The date range maxes at 90 days and any
  single query returns at most 10,000 results. "Show me every threat
  this year" returns a confident partial answer with no error. Do not
  let an agent draw all-clear conclusions from an unbounded query.
- **Quarantine expiry is a hard deletion.** Entries auto-delete after
  the retention period (default 30 days) and cannot be recovered. The
  documented way to extend retention — release and re-quarantine —
  means briefly delivering the message.
- **Status transitions are validated server-side.** Moving an incident
  to `RESOLVED` without a `remediationSummary`, or to `FALSE_POSITIVE`
  without a justification, returns a 400 that reads like a malformed
  request rather than a missing field.
- **A wrong region looks like a bad credential.** Pointing at the US
  gateway for an EU-provisioned tenant returns 401, which invites an
  agent to "fix" working credentials.
- **Marking a threat a false positive is a security decision.**
  `avanan_threats_mark_false_positive` sits in the write tier because it
  changes no mail flow directly, but it feeds detection tuning. Treat a
  pattern of agent-driven false-positive marking as a signal to review,
  not as bookkeeping.
