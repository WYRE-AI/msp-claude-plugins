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
- The org's HaloPSA credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the connect
  form, which overwrites the stored credential in place, and nothing
  tracks its age or prompts you.

- Every call carries operator identity, so the gateway audit log answers
  "who billed that time" and "who emailed the client". HaloPSA's own
  audit records only the API application, so without the gateway every
  action is attributed to one integration user.
- Removing someone from the organisation clears their per-vendor grants and revokes their gateway refresh tokens at once; a user deactivated in your identity provider is refused on their very next request.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin — so those are the buckets an owner actually clicks.

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

`conduit__my_access` replaces it. `halopsa_status` is deliberately kept.

### Where the mechanical tier disagrees with the judgement

An earlier revision of this document put `halopsa_tickets_add_action` in a tier of its own. The reasoning that motivated the separation is unchanged and matters more now that the mechanism cannot express it:

- With `hiddenfromuser: false` and an `emailto` address,
  `halopsa_tickets_add_action` sends mail to the client from your service
  desk. There is no unsend.
- With `timetaken` and `charge: true`, it posts billable time against the
  ticket's contract. That time flows into the next invoice run, deducts
  from a prepaid-hours balance, and is corrected by a human in the
  billing UI, not by another API call.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve anything that reaches the client or the invoice.**

- Read tools: allow. Queue triage, SLA-risk reporting, asset lookups, and
  invoice reconciliation are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- `halopsa_tickets_add_action` specifically: require a named human approver per invocation, and do not grant it to scheduled or unattended agents.
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

- **Closing a ticket is a contractual event, not a status flag.** `halopsa_tickets_update` is the only way to move a ticket to Resolved or Closed, which stops the SLA clock, stamps the attainment numbers your client reports read, and in most configurations fires the satisfaction-survey email. A bulk close of a stale queue rewrites last month's numbers and mails every affected client.
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
