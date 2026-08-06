# [Vendor] plugin — governance and safety model

> Copy this file to `<vendor>/<vendor>/GOVERNANCE.md` and fill it in.
> Its audience is an MSP owner deciding what to let an AI agent do
> against a live production tenant. Write for that reader, not for a
> developer. Delete this blockquote.
>
> Every claim in a governance document must be checkable against
> Conduit's source (`wyre-technology/conduit`), which is what serves
> `conduit.wyre.ai` — the endpoint every plugin's `.mcp.json` points at.
> Do **not** verify against `wyre-technology/mcp-gateway`: that is a
> separate repository serving `mcp.wyre.ai`, and the two have drifted.
> `wyre-gateway/GOVERNANCE.md` substantiates every claim below,
> including the places where it does not hold.

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
- The org's [Vendor] credential is stored once at Conduit, so replacing it
  is one edit rather than a change on every technician's machine.
  **Do not promise a rotate action — Conduit has none for any vendor.**
  Pick the line that matches [Vendor]'s auth type in
  `src/credentials/vendor-config.ts`: if the entry has an `oauthConfig`,
  say Conduit refreshes the token itself as it nears expiry and asks you
  to reconnect only when that refresh fails; if it does not, say rotation
  means re-submitting the connect form, which overwrites the stored
  credential in place, and that nothing tracks its age or prompts you.
  38 of the 98 vendors are OAuth; the other 60 are key-based.
- Every call carries operator identity, so Conduit's audit log answers
  "who asked for this" — the vendor's own log usually cannot. It records
  *who called what*, never with what arguments.
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated in
  your identity provider is refused on their very next request. A user
  only removed from the org keeps an already-issued access token for up
  to an hour, but it reaches only a personal [Vendor] connection made
  with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Group this plugin's tools into the four buckets Conduit's access editor
presents, because those are the buckets an owner actually clicks:

| Group | What it can do | Enforcement tier | Example tools |
|---|---|---|---|
| **Read** | Cannot change vendor state. Safe for autonomous agents. | `read` | `[vendor]_list_*`, `[vendor]_get_*`, `[vendor]_search_*` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `write` | `[vendor]_create_*`, `[vendor]_update_*` |
| **Delete** | Removes data or revokes access. | `write` — **not** a tier of its own | `[vendor]_delete_*`, `[vendor]_offboard_*` |
| **Admin** | Org-level state, credential reads, or unbounded passthrough/query surfaces. | `admin` | `[vendor]_raw_request`, `[vendor]_execute_tool` |

List the real tool names. If a group is empty for this vendor, say so —
"this plugin is read-only" is a strong, useful statement.

**The Delete row is the one to read twice.** Conduit's enforcement tiers
are only `read`, `write`, and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27`. "Delete" is a presentation group in
the access editor, and a delete-group tool compiles to and enforces at
tier `write` (`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`).
So **granting a technician `write` for this vendor also grants every
delete tool listed above.** There is no setting that separates them; the
only way to admit some write tools but not the delete ones is a granular
per-tool grant, which compiles to an explicit `customTools` allowlist.

Do not write that delete or destructive tools "require per-call
approval" as though Conduit enforced it. Conduit compares tiers. It has
no approval step, no per-call confirmation, and no interactive prompt.
Per-call approval is a workflow you impose on your agents, and it is
only as good as the agent configuration that carries it.

**If this vendor is not classified in Conduit, say so here.** Conduit
derives every tool's tier from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`), and it is fail-closed: an unclassified
tool falls back to requiring `admin` —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). Nearly half the marketplace's
vendor plugins have no entry in that table, and for those, **every tool
in the table above requires tier `admin`** regardless of which group it
sits in — read tools included. The current list is in
`wyre-gateway/GOVERNANCE.md`, *Vendors Conduit has not classified*.
Check it before writing this section.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Delete tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents. Remember that Conduit
  cannot enforce this separation for you — a `write` grant already
  admits them — so it has to live in the agent's own configuration.
- Admin tools: treat the grant as equivalent to full vendor
  administrator, because for a passthrough or dispatcher tool that is
  exactly what it is.

## What it cannot reach

State the boundary explicitly — this is the question buyers actually
ask:

- Only the [Vendor] tenants the connected credential can reach. Conduit
  controls *who in your organisation may use that credential and which
  tools they may call*, not which slice of the vendor's data comes back.
  Scope the credential at the vendor if you need a narrower boundary.
- No filesystem, no shell, no other vendor's data.
- [Any vendor-specific scope limit — e.g. read-only API key tier,
  per-site scoping, reseller vs. tenant credential.]

## Data handling

- Vendor responses pass through Conduit to the model context for the
  duration of the session. They are not persisted by this plugin.
- Note here any tool that returns PII, credentials, or payment data, so
  operators can decide whether to restrict it.

## Known sharp edges

Operational hazards specific to this vendor: writes that fan out to
customer-visible notifications, rate limits that degrade mid-task,
soft-delete semantics that look reversible but are not. Omit the section
if there genuinely are none.
