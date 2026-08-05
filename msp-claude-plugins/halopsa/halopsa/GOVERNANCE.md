# HaloPSA plugin — governance and safety model

Unofficial. Community-built plugin for the HaloPSA API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches HaloPSA through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the instance the
operator is authorised for.

- No HaloPSA client ID, client secret, or access token is stored on the
  technician's machine, in this repo, or in the model's context. HaloPSA
  uses OAuth 2.0 client credentials; the gateway runs that exchange and
  holds the refreshing token.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who billed that time" and "who emailed the client". HaloPSA's own
  audit records only the API application, so without the gateway every
  action is attributed to one integration user.
- Revoking gateway access revokes HaloPSA access with it, immediately.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin —
so those are the buckets an owner actually clicks. The **Enforcement tier**
column is what Conduit compares against a technician's grant, derived
mechanically from `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`).

**Every tool below is classified**, which makes this one of the few
connectors in the marketplace where the table is fully load-bearing. Note
that Conduit also carries a separate `halopsa-official` slug with a slightly
different tool set; it has no marketplace plugin, and it is not what this
one connects to.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change HaloPSA state. Safe for autonomous agents. | `read` | `halopsa_status`, `halopsa_tickets_list`, `halopsa_tickets_get`, `halopsa_clients_list`, `halopsa_clients_get`, `halopsa_clients_search`, `halopsa_assets_list`, `halopsa_assets_get`, `halopsa_assets_search`, `halopsa_assets_list_types`, `halopsa_agents_list`, `halopsa_agents_get`, `halopsa_teams_list`, `halopsa_invoices_list`, `halopsa_invoices_get` |
| **Write** | Creates or modifies records. Reversible in the database, but two of these are visible to the client the moment they run. | `write` | `halopsa_tickets_create`, `halopsa_tickets_update`, `halopsa_clients_create`, `halopsa_tickets_add_action` |
| **Delete** | *Empty.* Nothing here can remove a ticket, client, asset, contract, or invoice. | — | — |
| **Admin** | *Empty.* No passthrough, dispatcher, or credential-reading tool. | — | — |

`halopsa_navigate` is classified `read` and is deliberately omitted from the
table because it is unreachable: Conduit refuses every `*_navigate` and
`*_back` tool before any tier check, for every caller including org owners
and personal connections (`src/proxy/tool-call-enforcement.ts:123-129`,
`src/proxy/discovery-tools.ts:41-50`). `conduit__my_access` replaces it.
`halopsa_status` is deliberately kept.

### Where the mechanical tier disagrees with the judgement

An earlier revision of this document put `halopsa_tickets_add_action` in a
tier of its own. Conduit has no such tier — it classifies the tool `write`
(`isWrite: true`, no `isAdmin`), the same as `halopsa_clients_create`. The
reasoning that motivated the separation is unchanged and matters more now
that the mechanism cannot express it:

- With `hiddenfromuser: false` and an `emailto` address,
  `halopsa_tickets_add_action` sends mail to the client from your service
  desk. There is no unsend.
- With `timetaken` and `charge: true`, it posts billable time against the
  ticket's contract. That time flows into the next invoice run, deducts
  from a prepaid-hours balance, and is corrected by a human in the
  billing UI, not by another API call.

An agent that adds actions unattended is an agent that can bill your
clients and write to them in your name — and **Conduit's policy never
inspects arguments.** `ToolCallGateInput` carries the tool name and the
caller's identity and has no `arguments` field at all
(`src/proxy/tool-call-enforcement.ts:69-79`), so no grant can express "may
add an internal note, may not email the client." That distinction lives
entirely in your agent's configuration.

### What a `write` grant means here

**Granting a technician `write` on HaloPSA grants all four write tools**,
including `halopsa_tickets_add_action`. Conduit's enforcement tiers are only
`read`, `write` and `admin` (plus `none`, meaning deny) —
`src/access/permission-tier.ts:27` — and the access editor's "Delete" group
is presentation only, compiling to and enforcing at tier `write`
(`src/access/tier-group-mapping.ts`, `GROUP_ENFORCEMENT_TIER`). This plugin
has no delete tools, so that trap does not bite here; the one that does is
the same shape. There is no setting that admits ticket creation but not
billable-time posting. The only way to separate them is a granular per-tool
selection, which compiles to an explicit `customTools` allowlist.

Conduit compares tiers. It has **no approval step, no per-call confirmation,
and no elicitation.** Nothing at the gateway will pause an agent before it
emails a client. Per-call approval is a policy you impose on your agents, and
it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve anything that reaches the client or the invoice.**

- Read tools: allow. Queue triage, SLA-risk reporting, asset lookups, and
  invoice reconciliation are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- `halopsa_tickets_add_action` specifically: require a named human approver
  per invocation, and do not grant it to scheduled or unattended agents.
  Conduit cannot enforce this separation for you — a `write` grant already
  admits it — so give unattended agents a granular `customTools` allowlist
  that omits it rather than a `write` tier.
- Admin tools: none exist here. An `admin` grant on this vendor buys nothing
  beyond `write` today, so there is no reason to hand one out.

## What it cannot reach

- Only the HaloPSA instance mapped to the operator's gateway identity.
  Halo is single-tenant per instance; there is no cross-instance or
  reseller view.
- The OAuth client's granted scopes bound everything. A client
  provisioned without ticket write scope will return 401/403 on the write
  tools rather than partial success.
- **No write path to money or coverage.** Invoices are read-only, and
  there are no contract tools at all. An agent cannot raise, edit, send,
  or credit an invoice, and cannot alter a service agreement, its rates,
  or its prepaid-hour balance. Those changes happen in the HaloPSA UI.
- **No write path to the CMDB.** Assets are read-only; an agent cannot
  create, retire, or re-assign a configuration item.
- No filesystem, no shell, no other vendor's data.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- Customer PII is the default payload. `halopsa_clients_*` returns client
  contact and billing details and the end-user ("Users") records beneath
  them. `halopsa_tickets_get` returns ticket details and action notes,
  where end users routinely paste credentials, account numbers, and
  personal information.
- `halopsa_invoices_*` returns commercial data — line items, values, and
  payment status for your clients.
- `halopsa_agents_*` returns your own staff's PII.
- `halopsa_assets_*` returns customer infrastructure detail: hostnames,
  serial numbers, and site placement. Useful to an attacker mapping a
  target.
- Restrict all of the above if your agents run unattended.

## Known sharp edges

- **Closing a ticket is a contractual event, not a status flag.**
  `halopsa_tickets_update` is the only way to move a ticket to Resolved
  or Closed, which stops the SLA clock, stamps the attainment numbers
  your client reports read, and in most configurations fires the
  satisfaction-survey email. It enforces at `write` because it is also
  how you set a priority or assign an agent — but if you bill against SLA
  attainment, treat it like `halopsa_tickets_add_action` and keep it out of
  unattended agents' `customTools` lists. A bulk close of a stale queue
  rewrites last month's numbers and mails every affected client.
- **Writes are array-wrapped.** Every create and update posts
  `[{...}]`, not `{...}`. An agent that sends a bare object gets a
  validation error whose message does not mention the array.
- **An update is a create with an `id`.** Both go to `POST /api/Tickets`.
  Omitting `id` on what was meant as an update silently creates a second
  ticket rather than failing.
- **Status and priority IDs are instance-specific.** The values in this
  plugin's examples are conventions, not constants. An agent that
  hardcodes `status_id: 8` for "Resolved" will set the wrong status on an
  instance that renumbered its statuses, with no error.
- **The asset record is not the device.** HaloPSA holds what you believe
  is deployed and what it is billed under. Live health and patch state
  live in the RMM, and the two drift. Do not let an agent act on Halo
  asset data as though it were current.
