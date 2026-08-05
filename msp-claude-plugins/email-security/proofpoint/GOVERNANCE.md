# Proofpoint plugin — governance and safety model

Unofficial. Community-built plugin for the Proofpoint APIs (TAP SIEM,
Quarantine, People, Forensics/TRAP, URL Defense). Not affiliated with,
endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Proofpoint through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Proofpoint service principal or service secret is stored on the
  technician's machine, in this repo, or in the model's context. The
  secret is displayed once at creation and cannot be re-read from the
  dashboard, which makes central custody the only sane arrangement.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ordered that search-and-destroy" — Proofpoint's `initiatedBy`
  field records the service principal, which is shared.
- Revoking gateway access revokes Proofpoint access with it,
  immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires tier
> `admin` today.** Conduit derives a tool's tier from `VENDOR_TOOL_CONFIG`
> (`src/proxy/result-cache.ts`) and fails closed:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `proofpoint` has no entry there,
> so the grouping below carries no enforcement meaning at present — read
> tools included. A `read` or `write` grant on this vendor admits nothing; an
> `admin` grant admits everything, including the search-and-destroy surface.
> The grouping becomes what Conduit actually enforces once the vendor is
> classified, and classifying it is a privilege *reduction*, not an
> expansion. For the live list of unclassified vendors see
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has not
> classified* — it is stated once there because it moves.
>
> *Editor's note: when `proofpoint` gains a `VENDOR_TOOL_CONFIG` entry,
> delete this blockquote and nothing else. No other part of this document
> depends on it.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Proofpoint state, mail flow, or mailboxes. Safe for autonomous agents. | `proofpoint_tap_get_all_events`, `proofpoint_tap_get_messages_blocked`, `proofpoint_tap_get_messages_delivered`, `proofpoint_tap_get_clicks_permitted`, `proofpoint_tap_get_clicks_blocked`, `proofpoint_tap_get_top_clickers`, `proofpoint_quarantine_search`, `proofpoint_quarantine_list`, `proofpoint_quarantine_get`, `proofpoint_quarantine_preview`, `proofpoint_people_get_vap`, `proofpoint_people_get_top_clickers`, `proofpoint_people_get_user_risk`, `proofpoint_people_get_attack_index`, `proofpoint_people_list_vip`, `proofpoint_forensics_get_report`, `proofpoint_forensics_get_evidence`, `proofpoint_forensics_get_operation`, `proofpoint_forensics_list_operations`, `proofpoint_forensics_message_trace`, `proofpoint_forensics_auto_pull_status`, `proofpoint_forensics_get_sandbox_report`, `proofpoint_threat_get_campaign`, `proofpoint_threat_search_campaigns`, `proofpoint_threat_get_indicators`, `proofpoint_threat_search_indicators`, `proofpoint_threat_get_family`, `proofpoint_threat_get_actor`, `proofpoint_threat_get_landscape`, `proofpoint_url_decode`, `proofpoint_url_analyze`, `proofpoint_url_get_clicks`, `proofpoint_url_get_verdict`, `proofpoint_url_batch_decode` |
| **Write** | Changes a protection setting for one user. Reversible. | `proofpoint_people_set_vip` |
| **Destructive** | Delivers or destroys customer mail, including mail already sitting in mailboxes. | `proofpoint_quarantine_release`, `proofpoint_quarantine_bulk_release`, `proofpoint_quarantine_delete`, `proofpoint_quarantine_bulk_delete`, `proofpoint_forensics_search_destroy` ⚠️ |

> ⚠️ **`proofpoint_forensics_search_destroy` is not a tool the deployed
> server exposes.** The search-and-destroy capability described below is real
> and is served by `proofpoint_forensics_pull_messages`; the name in this
> table is wrong. Do not use it in an allowlist or an agent configuration —
> an allowlist entry for a tool that does not exist blocks nothing and grants
> nothing, and the capability it was meant to gate is reachable under its
> real name. The risk analysis that follows is about the capability and
> stands as written. Correcting tool names across this repo is tracked
> separately (issue #178) and is deliberately out of scope for this
> document's current revision.

The classifications that a reviewer might argue with:

**`proofpoint_forensics_search_destroy` is the single highest-blast-radius
tool in this plugin, and it is not a delete-by-ID call.** (Read it as the
capability, under the real name flagged above.) It takes search
criteria — sender, subject, message ID — and applies an action to every
matching message across every mailbox in the tenant. A criterion that is
one field too broad ("subject contains Invoice") reaches into hundreds of
inboxes and removes legitimate business mail. With `action=hard-delete`
that removal is permanent and not recoverable from Deleted Items. The
operation is also asynchronous: `matchCount` is only visible after it has
started, so the agent learns the true scope after the damage, not before.
Never grant this to an unattended agent, and require the approver to see
the literal criteria and the chosen action, not a summary of them.

**Releasing is destructive even though the API treats it as a state
change.** `proofpoint_quarantine_release` delivers a message Proofpoint
already classified as malware, phishing, or impostor into a person's
inbox. There is no un-deliver. `proofpoint_quarantine_bulk_release`
multiplies that across an arbitrary ID list in one call, which is exactly
the shape of mistake an agent makes when it collects IDs from a search it
misfiltered.

**`proofpoint_quarantine_delete` destroys the only copy.** A quarantined
message was never delivered, so the quarantine store is the sole
artifact. Deleting it forecloses any later forensic question about the
campaign.

**`proofpoint_forensics_get_evidence` stays in the read tier, but read
the caveat.** It changes no vendor state, so by blast radius it is read.
What it returns is live malware: the `sample` evidence type is the
original malicious file and `pcap` is the traffic capture from
detonation. Retrieving one does not execute it, but it does pull a
weaponized binary into the session and onto whatever the operator does
with it next. Treat it as read-tier for approval purposes and handle the
output like the malware it is.

**Conduit does not enforce per-call approval.** It compares tiers — there is
no approval step, no per-call confirmation, and no interactive prompt
anywhere in its enforcement path. Nothing sits between an agent and a bulk
release or a search-and-destroy once the tier is granted. Where this document
asks for a named human approver, that is a policy you impose on your agents,
and it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. TAP polling, VAP reporting, quarantine triage, and
  campaign correlation are the intended autonomous uses.
- Write tools: agent drafts the exact call, human approves, then it
  runs.
- Destructive tools: require a named human approver per invocation, and
  for `proofpoint_forensics_search_destroy` require the approver to
  review the exact criteria and action string. Do not grant these to
  scheduled or unattended agents.

## What it cannot reach

- Only the Proofpoint organizations mapped to the operator's gateway
  identity. Proofpoint service credentials are scoped to a single
  organization — each MSP client requires its own set — so there is no
  cross-client credential that could leak one customer's mail into
  another's session.
- No filesystem, no shell, no other vendor's data.
- Mailbox reach is limited to what TRAP is integrated with. If the
  Microsoft 365 or Google Workspace connector is not configured,
  `proofpoint_forensics_search_destroy` fails rather than silently
  doing nothing — but it also means an operator may believe remediation
  is available when it is not.
- Licensing gates several surfaces. People, Threat Response, and URL
  Defense APIs return 403 when the tenant's licence does not include
  them; that is a licensing boundary, not a permissions bug.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **`proofpoint_quarantine_preview` returns the content of a customer's
  email.** That is its purpose — an analyst previews before releasing —
  but it means a technician's session can contain the full body of a
  message the recipient has never seen. Restrict it if agents run
  unattended.
- **`proofpoint_quarantine_search` / `_list` / `_get` return
  correspondent PII**: sender, recipient list, subject, and reply-to for
  every matching message.
- **`proofpoint_people_*` returns employee records and behavioural
  data**: name, department, job title, VIP flag, and the individual's
  click history on malicious links. `proofpoint_people_get_top_clickers`
  is, in effect, a ranked list of which named employees fall for
  attacks. Handle it as employee-performance data; in some
  jurisdictions it is subject to works-council or data-protection
  constraints.
- **`proofpoint_forensics_get_evidence` returns live malware samples and
  packet captures.** See the tier note above.
- `proofpoint_url_get_clicks` attributes clicks to named recipients with
  IP address and user agent.

## Known sharp edges

- **TAP's 24-hour ceiling produces false all-clears.** The SIEM API
  cannot look back further than 24 hours. Asked "were we hit by this
  campaign last month", it returns an empty result set — which reads
  like "no threats found" rather than "no data available". An agent that
  reports all-clear from a TAP query outside the window is wrong, not
  reassuring. Historical questions belong to `proofpoint-forensics` or
  `proofpoint-threat-intel`.
- **A 204 is normal.** No content means no events in the window, not a
  failure. Agents that retry on 204 burn the rate limit.
- **Soft-delete is not always what happens.** If a mailbox is on legal
  hold, deletion is blocked; the operation completes with a non-zero
  `failedCount` rather than an error. An agent that checks only
  `status=completed` will report a remediation that partially did not
  happen.
- **Hard-delete requires elevated permissions and fails loudly.** A 403
  on hard-delete tempts an agent to retry with `soft-delete` and treat
  the result as equivalent. It is not: the message remains recoverable
  by the user from Deleted Items.
- **Rate limits are per-API, not per-plugin.** TAP and URL Defense allow
  1000 requests/hour; People, Quarantine, and Forensics allow 500. A
  polling loop tuned for TAP will exhaust the quarantine budget at twice
  the expected rate.
- **Campaign correlation lags.** `proofpoint_threat_get_campaign` can
  404 for a genuinely valid campaign ID that has not been correlated
  yet. Absence of a campaign is not evidence the threat is isolated.
