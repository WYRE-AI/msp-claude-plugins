# [Vendor] plugin — governance and safety model

> Copy this file to `<vendor>/<vendor>/GOVERNANCE.md` and fill it in.
> Its audience is an MSP owner deciding what to let an AI agent do
> against a live production tenant. Write for that reader, not for a
> developer. Delete this blockquote.

Unofficial. Community-built plugin for the [Vendor] API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches [Vendor] through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

Consequences worth stating plainly:

- No API key, secret, or token is stored on the technician's machine, in
  this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who asked for this" — the vendor's own log usually cannot.
- Revoking a technician's gateway access revokes [Vendor] access with
  it, immediately.

## Tool permission tiers

Group this plugin's tools by blast radius. The gateway enforces these
tiers; the table tells the operator what each tier means here.

| Tier | What it can do | Example tools |
|---|---|---|
| **Read** | Cannot change vendor state. Safe for autonomous agents. | `[vendor]_list_*`, `[vendor]_get_*`, `[vendor]_search_*` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `[vendor]_create_*`, `[vendor]_update_*` |
| **Destructive** | Deletes data, revokes access, or changes billing. Requires explicit human approval per call. | `[vendor]_delete_*`, `[vendor]_offboard_*` |

List the real tool names. If a tier is empty for this vendor, say so —
"this plugin is read-only" is a strong, useful statement.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant these to scheduled or unattended agents.

## What it cannot reach

State the boundary explicitly — this is the question buyers actually
ask:

- Only the [Vendor] tenants mapped to the operator's gateway identity.
- No filesystem, no shell, no other vendor's data.
- [Any vendor-specific scope limit — e.g. read-only API key tier,
  per-site scoping, reseller vs. tenant credential.]

## Data handling

- Vendor responses pass through the gateway to the model context for the
  duration of the session. They are not persisted by this plugin.
- Note here any tool that returns PII, credentials, or payment data, so
  operators can decide whether to restrict it.

## Known sharp edges

Operational hazards specific to this vendor: writes that fan out to
customer-visible notifications, rate limits that degrade mid-task,
soft-delete semantics that look reversible but are not. Omit the section
if there genuinely are none.
