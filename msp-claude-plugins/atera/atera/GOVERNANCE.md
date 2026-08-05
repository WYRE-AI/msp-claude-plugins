# Atera plugin — governance and safety model

Unofficial. Community-built plugin for the Atera API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

The supported deployment reaches Atera through the WYRE Conduit gateway
(`https://conduit.wyre.ai/v1/atera/mcp`), which brokers authentication
centrally and scopes every call to the tenant the operator is authorised
for.

- No Atera API key is stored on the technician's machine, in this repo,
  or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who asked for this". Atera's own log records only the user that owns
  the API key, which is usually a shared service account.
- Revoking a technician's gateway access revokes Atera access with it,
  immediately.

**If you run without the gateway**, the plugin README documents a direct
mode where `ATERA_API_KEY` sits in the technician's Claude settings.
That mode gives up all four properties above: the key lives on the
endpoint, rotation is per technician, and every action in Atera is
attributed to one shared key holder. The tiers below are then advisory
rather than enforced.

## Tool permission tiers

Grouped by blast radius, not HTTP verb.

> **Not classified in Conduit — every tool in the table below requires
> tier `admin` today.** Conduit derives each tool's tier from
> `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`) and fails closed for
> anything absent from it:
> `const requiredTier: PermissionTier = classified ?? 'admin';`
> (`src/access/access-enforcement.ts:63`). `atera` has no entry, so the
> grouping below carries no enforcement weight right now — read tools
> require `admin` exactly as the rest do, and there is no narrower grant
> that admits them. The grouping is still the right *risk* reading, and it
> becomes the enforcement reading on the day this vendor is classified.
> The list of unclassified vendors moves whenever one of them is
> classified, so it is stated in one place only:
> `wyre-gateway/GOVERNANCE.md`, *Fail-closed, and the vendors Conduit has
> not classified*.
>
> *This blockquote is the whole of the not-classified caveat. When `atera`
> appears in `VENDOR_TOOL_CONFIG`, delete this blockquote and change
> nothing else.*

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Atera or endpoint state. Safe for autonomous agents. | `atera_navigate`, `atera_back`, `atera_agents_list`, `atera_agents_get`, `atera_agents_get_by_machine`, `atera_alerts_list`, `atera_alerts_get`, `atera_alerts_by_agent`, `atera_alerts_by_device`, `atera_customers_list`, `atera_customers_get`, `atera_contacts_list`, `atera_contacts_get`, `atera_contacts_by_customer`, `atera_tickets_list`, `atera_tickets_get` |
| **Write** | Creates or modifies records. Reversible, but customer-visible. | `atera_customers_create`, `atera_tickets_create`, `atera_tickets_update`, `atera_tickets_add_comment` |
| **Destructive** | Empty. | — |

**The destructive tier is empty, and that is a deliberate property of
this plugin, not an oversight.** The Atera REST API can run PowerShell
on an agent (`POST /agents/{id}/runscript`) and delete an agent record
(`DELETE /agents/{id}`) — both documented in the `atera-agents` skill
because a technician will meet them in the API — but the MCP surface
exposes neither. Nothing this plugin can call reaches a customer's
production machine. If a future release adds script execution, it
belongs in the destructive tier on day one: script execution is
destructive regardless of what the API calls it.

`atera_tickets_add_comment` defaults to `isInternal: true`, so the
plugin's default is a private note. The moment an agent passes
`isInternal: false` the comment becomes an end-user-visible reply — a
write to the customer's inbox, not just to the database. Treat that
parameter as the approval boundary.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Fleet audits, alert sweeps, and ticket reporting
  across customers are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it
  runs. `atera_tickets_add_comment` deserves the same care as an
  outbound email, because it often is one.
- Destructive tools: none exist today. Do not work around that by
  driving the Atera web UI or a raw HTTP client from an agent.

## What it cannot reach

- Only the Atera account mapped to the operator's gateway identity.
  Atera has one API key per account; there is no reseller scope that
  spans tenants.
- No filesystem, no shell, no other vendor's data.
- No endpoint. There is no remote-execution, patch, reboot, or wipe
  tool in this surface.
- No billing, contract, or knowledge-base surface — those Atera
  entities have no tools here.
- No live event stream. Every tool is point-in-time; Atera webhooks
  carry the push feed.

## Data handling

- Atera responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- `atera_contacts_*` returns end-user PII (names, email addresses,
  phone numbers) for the MSP's clients' staff. `atera_agents_*` returns
  hostnames, IP and MAC addresses, domain membership, serial numbers,
  and installed OS versions — an inventory that is useful to an
  attacker. Restrict both if agents run unattended.
- An Atera API key inherits the permissions of the user who created it.
  A key made by an admin is an admin key. Create a dedicated
  least-privilege API user rather than reusing a technician's account.

## Known sharp edges

- **"Device" does not mean endpoint.** In Atera a device is an
  agentless HTTP/SNMP/TCP monitor; the managed endpoint is an agent.
  An agent told to "list the customer's devices" can silently return
  the wrong set. Every other RMM in this marketplace uses the opposite
  convention.
- **Resolving an alert deletes it.** Atera's alert resolution is a
  DELETE against the alert record. The alert does not move to a
  resolved state you can review later — it is gone. Do not let an agent
  bulk-clear alerts to tidy a dashboard.
- **700 requests/minute, shared.** The rate limit is per account, not
  per technician. A full-fleet sweep by one unattended agent will
  throttle the humans working alongside it.
