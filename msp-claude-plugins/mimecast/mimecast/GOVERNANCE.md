# Mimecast plugin — governance and safety model

Unofficial. Community-built plugin for the Mimecast API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Mimecast through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Mimecast client ID or client secret is stored on the technician's
  machine, in this repo, or in the model's context. The gateway performs
  the OAuth 2.0 client-credentials exchange and refreshes the token.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who released that message" — Mimecast's own audit log records the API
  application, and the release then appears under the same actor for
  every technician.
- Revoking gateway access revokes Mimecast access with it, immediately.

## Tool permission tiers

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `mimecast` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When
> `mimecast` appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and
> change nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change mail flow or Mimecast state. Safe for autonomous agents. | `mimecast_find_message`, `mimecast_get_message_info`, `mimecast_get_queue_status`, `mimecast_get_threat_incidents`, `mimecast_get_ttp_logs`, `mimecast_get_audit_events`, `mimecast_navigate`, `mimecast_status` |
| **Write** | Stops one message reaching one recipient. Reversible, and visible to the customer as a delayed email. | `mimecast_hold_message` |
| **Destructive** | Delivers mail the platform decided not to deliver. | `mimecast_release_message` |

`mimecast_release_message` is destructive despite doing nothing that
looks like a deletion. A message is in the hold queue because a policy
or a Targeted Threat Protection verdict objected to it. Releasing it
overrides that verdict and puts the message — attachment, links, and all
— into a named user's inbox. Once delivered it cannot be recalled
through this plugin. The blast radius is a customer's endpoint, which is
the same reason `huntress_incidents_bulk_approve` sits in the
destructive tier: the tier follows what happens on the customer's side,
not the HTTP verb.

`mimecast_hold_message` is the mirror image and belongs one tier lower.
It has a customer-visible cost — legitimate business mail stops moving —
but release undoes it, and the reach is a single message.

Conduit does not enforce any of that as an approval requirement. It
compares tiers — it has no approval step, no per-call confirmation, and
no interactive prompt. Per-call approval is a workflow you impose on your
agents, and it is only as good as the agent configuration that carries
it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Message tracing, queue health checks, and TTP
  reporting are the intended autonomous use.
- Write tools: agent drafts the exact `mimecast_hold_message` call,
  human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant `mimecast_release_message` to scheduled or unattended
  agents. "Release everything held for this user" is a request that
  should always terminate at a human.

## What it cannot reach

- Only the Mimecast tenants mapped to the operator's gateway identity,
  in the region that identity is configured for.
- No filesystem, no shell, no other vendor's data.
- No mailbox-side actions. Mimecast sits in front of the tenant; it
  cannot remove a message that has already been delivered, and message
  recall depends on the customer's Mimecast subscription rather than on
  this plugin.
- No policy configuration. Nothing here creates, edits, or deletes a
  Mimecast policy — policy changes stay in the Administration Console.
- No archive or e-discovery surface. The audit log records
  administrative actions, not historical message content.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `mimecast_find_message` and `mimecast_get_message_info` return the
  substance of a customer's email: subject lines, both parties'
  addresses, sender IP, spam score, attachment filenames, the full
  delivery route, and header sets including `Authentication-Results`.
- `mimecast_get_ttp_logs` returns every URL a named user clicked,
  together with the message that carried it. This is a
  browsing-history-shaped dataset about identified employees; in several
  jurisdictions it attracts employee-monitoring obligations independent
  of its security purpose.
- `mimecast_get_audit_events` returns administrator identities, source
  IP addresses, and login outcomes.
- `mimecast_get_queue_status` returns in-flight sender/recipient pairs
  and subject lines.
- Restrict TTP and audit tools if your agents run unattended.

## Known sharp edges

- **Release is one-way; hold is not.** Design any approval flow around
  that asymmetry — holding first and releasing after review is always
  the safer ordering.
- **The wrong region succeeds and returns nothing.** A tenant configured
  for the wrong regional endpoint answers HTTP 200 with an empty `data`
  array. An agent reads that as "no threats found." Confirm the region
  before trusting a negative result.
- **HTTP 200 can carry an error.** Mimecast returns failures inside
  `meta.status` and a `fail[]` block while the transport says success.
  A tool wrapper that checks only the HTTP code will report a failed
  release as done.
- **Tracking data expires at 30 days.** Absence of a message from
  `mimecast_find_message` is not evidence the message never existed.
- **Threat remediation may need the console.** Incidents from
  `mimecast_get_threat_incidents` can sit at `remediationStatus:
  pending` awaiting manual approval in the Administration Console. This
  plugin cannot approve them, so an agent reporting "remediation
  underway" may be describing something that has not started.
- **Skills document one tool name the server does not expose.** The
  skills reference `mimecast_get_queue`; the shipped MCP server exposes
  `mimecast_get_queue_status`. Tier the real name.
