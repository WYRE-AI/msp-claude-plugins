# ThreatLocker plugin — governance and safety model

Unofficial. Community-built plugin for the ThreatLocker Portal API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches ThreatLocker through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No ThreatLocker API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled that org's auth key" — ThreatLocker's own log records only
  the partner API account.
- Revoking gateway access revokes ThreatLocker access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change ThreatLocker or endpoint state. Safe for autonomous agents. | `threatlocker_status`, `threatlocker_navigate`, `threatlocker_computers_list`, `threatlocker_computers_get`, `threatlocker_computers_get_checkins`, `threatlocker_computer_groups_list`, `threatlocker_computer_groups_dropdown`, `threatlocker_approvals_list`, `threatlocker_approvals_get`, `threatlocker_approvals_pending_count`, `threatlocker_approvals_get_permit_application`, `threatlocker_audit_search`, `threatlocker_audit_get`, `threatlocker_audit_file_history`, `threatlocker_organizations_list_children`, `threatlocker_organizations_for_move_computers` |
| **Write** | — | None. |
| **Destructive** | Discloses a live tenant credential. Requires explicit per-call human approval. | `threatlocker_organizations_get_auth_key` |

**Nothing in this plugin can change a ThreatLocker policy.** There is no
tool that approves an application, permits a hash, edits a policy, moves
a computer between groups, or changes an org's mode. Those actions exist
only in the ThreatLocker portal. This matters more than usual for a
default-deny product: a wrong allowlist change locks a customer out of
their line-of-business application, and an agent using this plugin
cannot make one.

`threatlocker_organizations_get_auth_key` sits in the destructive tier
despite being a plain read. It returns a live per-organization
credential — the value used to enrol agents into that tenant. Judged by
HTTP verb it is a `get`; judged by blast radius, one call hands the
model, the transcript, and anything downstream of them a working key to
a customer's ThreatLocker tenant, and the key keeps working until
someone rotates it. Treat every invocation as a credential checkout with
a named approver, exactly as you would a password-manager retrieval.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the auth-key
call.**

- Read tools: allow. Fleet audits, offline-agent triage, per-tenant
  approval-queue counts, and Action Log forensics are the intended
  autonomous use.
- Write tools: none exist. An agent asked to "just approve it" should
  hand the operator a reviewed recommendation and stop.
- `threatlocker_organizations_get_auth_key`: require a named human
  approver per invocation, and do not grant it to scheduled or
  unattended agents at all.

## What it cannot reach

- Only the ThreatLocker organizations beneath the partner org mapped to
  the operator's gateway identity. A child-scoped key sees one tenant; a
  partner key sees the whole tree.
- No filesystem, no shell, no other vendor's data.
- No policy, application, or approval-decision surface — read-only
  against the entities listed above.
- No live event stream. The Action Log is queried point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `threatlocker_organizations_get_auth_key` returns a **secret**. Never
  let it land in a ticket, a chat message, a commit, or an unencrypted
  note. If one is exposed, rotate it in the portal — a previously issued
  key keeps working until you do.
- The Action Log (`threatlocker_audit_*`) returns end-user PII by
  design: usernames, computer names, full file paths including user
  profile directories, and parent-process command context.
- `threatlocker_approvals_*` returns free-text user justifications, which
  routinely contain ticket numbers, client names, and occasionally
  credentials a user typed into the wrong box.

## Known sharp edges

- **Blocks are not detections.** ThreatLocker denies everything not
  explicitly permitted, so a wall of Block entries is normal operation,
  not evidence of an attack. An agent that reports block volume as a
  threat metric will generate false alarms every time a client installs
  new software.
- **Approval recommendations carry real consequences.** The queue is
  where an agent's analysis actually reaches a customer: a confident
  "approve" on an unsigned binary that a technician then rubber-stamps
  in the portal is how malware gets allowlisted. Require the reasoning,
  the hash, and the permit scope
  (`threatlocker_approvals_get_permit_application`) in every
  recommendation.
- **Permits land at group scope, not on one machine.** Approving for one
  requester applies the policy to every computer in that group. Agents
  routinely under-state this.
- **Partner keys fan out silently.** With `childOrganizations: true` a
  single call sweeps every client at once. Convenient for reporting, and
  the reason a careless query can pull the whole customer base into
  context.
- **POST-based list endpoints.** ThreatLocker's "list" calls are POSTs
  against `GetByParameters`. Do not infer safety from the HTTP verb
  anywhere in this API — use the tier table above.
