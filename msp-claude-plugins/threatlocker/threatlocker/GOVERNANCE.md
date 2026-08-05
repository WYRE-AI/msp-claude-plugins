# ThreatLocker plugin — governance and safety model

Unofficial. Community-built plugin for the ThreatLocker Portal API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches ThreatLocker through
the WYRE Conduit gateway, which brokers authentication centrally and
scopes every call to the tenant the operator is authorised for.

- **Check the endpoint before trusting the rest of this document.** This
  plugin's `.mcp.json` still points at `https://mcp.wyre.ai/v1/threatlocker/mcp`
  — the older `wyre-technology/mcp-gateway` system, not the Conduit
  deployment at `conduit.wyre.ai` that every claim below is derived
  from. The two share ancestry and have drifted. Reconciling the
  endpoint is tracked as follow-up work; see `wyre-gateway/GOVERNANCE.md`,
  *Which system this describes*.
- No ThreatLocker API key is stored on the technician's machine, in this
  repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician.
  ThreatLocker is not an OAuth vendor there, so rotation means
  re-submitting the connect form; nothing tracks credential age for you.
- Every call carries operator identity, so Conduit's audit log answers
  "who pulled that org's auth key" — ThreatLocker's own log records only
  the partner API account. It records *who called what*, never with what
  arguments.
- Removing a technician's Conduit org membership stops their ThreatLocker
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit derives every tool's tier from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`), which `src/access/tool-classification.ts:4`
declares the single source of truth. The convention is `isAdmin → admin`
(outranks), `isWrite → write`, neither → `read`
(`tool-classification.ts:33-38`).

**ThreatLocker's block in that table contains exactly one tool.** Of the
seventeen tools this plugin documents, sixteen have no entry at all, so
no tier is invented for them below.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change ThreatLocker or endpoint state. Safe for autonomous agents. | `read` | `threatlocker_approvals_get_permit_application` |
| **Write** | *Empty for this vendor.* | `write` | *None.* Nothing in this plugin mutates ThreatLocker state. |
| **Delete** | *Empty for this vendor.* | `write` — **not a tier of its own** | *None.* |
| **Admin** | Nothing is deliberately classified `admin` — but everything below arrives there by fail-closed coercion. | `admin` | *No explicit entries.* See the next section. |
| **Not classified** | Documented and server-registered, but absent from `VENDOR_TOOL_CONFIG`. **Requires `admin` today.** | `admin` (coerced) | `threatlocker_status`, `threatlocker_navigate`, `threatlocker_computers_list`, `threatlocker_computers_get`, `threatlocker_computers_get_checkins`, `threatlocker_computer_groups_list`, `threatlocker_computer_groups_dropdown`, `threatlocker_approvals_list`, `threatlocker_approvals_get`, `threatlocker_approvals_pending_count`, `threatlocker_audit_search`, `threatlocker_audit_get`, `threatlocker_audit_file_history`, `threatlocker_organizations_list_children`, `threatlocker_organizations_for_move_computers`, `threatlocker_organizations_get_auth_key` |

### What "not classified" costs you

Conduit fails closed. The enforcement gate coerces an unclassified tool
to the *highest* tier rather than to deny:

```ts
const requiredTier: PermissionTier = classified ?? 'admin'; // UNCLASSIFIED -> ADMIN
```
— `src/access/access-enforcement.ts:63`.

The `tools/list` filter mirrors the same decision
(`src/proxy/list-visibility.ts:44`), so those sixteen tools are not
merely un-callable below `admin` — they are invisible.

The practical consequence is that **a read-only agent cannot use this
plugin at all.** Granting `read` reaches exactly one tool. Every fleet
audit, offline-agent triage, approval-queue count, and Action Log query
this document describes as "the intended autonomous use" requires tier
`admin` today — which on any vendor means everything else on that vendor
too. There is no safe middle setting until ThreatLocker is classified.

Classifying it would be a privilege *reduction*, not an addition: it
would move the read tools down from `admin` to `read`.

`threatlocker_navigate` is a separate case. Discovery tools
(`*_navigate` / `*_back`) are refused for every caller — owners and
personal connections included — by Conduit's discovery-tool suppression
gate (`src/proxy/tool-call-enforcement.ts:125-130`), regardless of tier.

### `threatlocker_organizations_get_auth_key` — a GET that returns a live credential

This tool returns a live per-organization credential: the value used to
enrol agents into that tenant. Judged by HTTP verb it is a `get`; judged
by blast radius, one call hands the model, the transcript, and anything
downstream of them a working key to a customer's ThreatLocker tenant,
and the key keeps working until someone rotates it. Treat every
invocation as a credential checkout, exactly as you would a
password-manager retrieval.

It requires tier `admin` today, which is the right outcome — but **it is
the right outcome by accident.** It gets there through the fail-closed
coercion above, not through a deliberate `isAdmin` flag. Two things
follow:

- The moment somebody classifies ThreatLocker, this tool's tier is
  whatever they write down. Conduit's own name-inference helper would
  argue for `read`: it tokenises the name and matches `get`, a
  `READ_TOKENS` entry, while neither `auth` nor `key` appears in
  `ADMIN_TOKENS` (`src/access/tool-naming.ts`). Anyone classifying this
  vendor must override that heuristic on purpose. This is the sentence
  to quote in that review.
- Until then, nobody below `admin` can call it — and nobody below
  `admin` can call the fifteen benign reads beside it either.

Whoever holds `admin` on ThreatLocker holds this tool. Conduit will not
ask them to confirm, and there is no way to admit the read tools while
excluding this one at the tier level. If you need that separation today,
it has to be a granular per-tool grant whose `customTools` list omits
`threatlocker_organizations_get_auth_key`.

### There is no per-call approval step

Conduit compares tiers. It has no approval mechanism, no per-call
confirmation, and no elicitation anywhere in the request path — see
`wyre-gateway/GOVERNANCE.md`, *The tier model*. An earlier revision of
this document said the auth-key call "requires explicit per-call human
approval"; nothing enforced that sentence, and it has been removed rather
than softened. Per-call approval is a workflow you impose on your agents,
and it is only as good as the agent configuration that carries it.

### Nothing here can change a ThreatLocker policy

There is no tool that approves an application, permits a hash, edits a
policy, moves a computer between groups, or changes an org's mode. Those
actions exist only in the ThreatLocker portal. This matters more than
usual for a default-deny product: a wrong allowlist change locks a
customer out of their line-of-business application, and an agent using
this plugin cannot make one. The Write and Delete groups are empty and
would stay empty even after classification.

## Recommended agent policy

The safe default is **read autonomously, never self-approve the auth-key
call.** Note that "read autonomously" is currently blocked by the
classification gap above.

- Read tools: allow, once classification makes that grant reach them.
  Fleet audits, offline-agent triage, per-tenant approval-queue counts,
  and Action Log forensics are the intended autonomous use.
- Write tools: none exist. An agent asked to "just approve it" should
  hand the operator a reviewed recommendation and stop.
- `threatlocker_organizations_get_auth_key`: require a named human
  approver per invocation, and do not grant it to scheduled or unattended
  agents at all. Conduit cannot enforce that separation for you, so it
  has to live in the agent's own configuration or in a granular grant.
- Admin tools: treat any `admin` grant on ThreatLocker as equivalent to
  full partner administrator, because today it is the only grant that
  reaches anything — and it reaches the auth key.

## What it cannot reach

- Only the ThreatLocker organizations the connected credential can
  reach. Conduit controls *who in your organisation may use that
  credential and which tools they may call*, not which slice of the data
  comes back. A child-scoped key sees one tenant; a partner key sees the
  whole tree. Scope the credential at ThreatLocker if you need a
  narrower boundary.
- No filesystem, no shell, no other vendor's data.
- No policy, application, or approval-decision surface — read-only
  against the entities listed above.
- No live event stream. The Action Log is queried point-in-time.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
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
  anywhere in this API — use the table above.
