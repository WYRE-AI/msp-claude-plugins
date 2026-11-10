# [Vendor] plugin — governance and safety model

> Copy this file to `<vendor>/<vendor>/GOVERNANCE.md` and fill it in.
> Its audience is an MSP owner deciding what to let an AI agent do
> against a live production tenant. Write for that reader, not for a
> developer. Delete this blockquote.
>
> Describe what the vendor tools do, which grants an owner should confirm
> in the gateway access editor, and what an agent must not do on its own.
> Do not cite private gateway source files, line numbers, or internal
> enforcement behavior.

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
- The org's [Vendor] credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. **Do not promise a rotate action.** If the connection
  refreshes itself, say so and say the operator reconnects only when
  that refresh fails. Otherwise say rotation means re-submitting the
  connect form.
- Every call carries operator identity, so the gateway audit log answers
  "who asked for this" — the vendor's own log usually cannot. It records
  *who called what*, never with what arguments.
- Complete offboarding in the gateway console, and confirm the person
  no longer has access before you treat it as done.

## Tool permission groups

Group this plugin's tools into the four buckets the gateway access editor
presents, because those are the buckets an owner actually clicks:

| Group | What it can do | Example tools |
|---|---|---|
| **Read** | Cannot change vendor state. Safe for autonomous agents. | `[vendor]_list_*`, `[vendor]_get_*`, `[vendor]_search_*` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `[vendor]_create_*`, `[vendor]_update_*` |
| **Delete** | Removes data or revokes access. | `[vendor]_delete_*`, `[vendor]_offboard_*` |
| **Admin** | Org-level state, credential reads, or unbounded passthrough/query surfaces. | `[vendor]_raw_request`, `[vendor]_execute_tool` |

List the real tool names. If a group is empty for this vendor, say so —
"this plugin is read-only" is a strong, useful statement.

**The Delete row is the one to read twice.** Do not treat that label as
a separate control from the grant configured in the access editor. Keep
delete and admin tools out of unattended agents, and confirm the live
grant.

Do not write that delete or destructive tools "require per-call
approval" as though the gateway enforced it. Per-call approval is a
workflow you impose on your agents, and it is only as good as the agent
configuration that carries it.

If you are not sure which grant the access editor will require, say that
the reader must confirm the live grant. Do not describe how the gateway
classifies tools internally.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Confirm the live grant
  in the access editor.
- Admin tools: treat the grant as equivalent to full vendor
  administrator, because for a passthrough or dispatcher tool that is
  exactly what it is.

## What it cannot reach

State the boundary explicitly — this is the question buyers actually
ask:

- Only the [Vendor] tenants the connected credential can reach. The
  gateway controls who in your organisation may use that credential and
  which tools they may call, not which slice of the vendor's data comes
  back. Scope the credential at the vendor if you need a narrower
  boundary.
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
