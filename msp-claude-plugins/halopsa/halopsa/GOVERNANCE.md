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

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change HaloPSA state. Safe for autonomous agents. | `halopsa_status`, `halopsa_navigate`, `halopsa_tickets_list`, `halopsa_tickets_get`, `halopsa_clients_list`, `halopsa_clients_get`, `halopsa_clients_search`, `halopsa_assets_list`, `halopsa_assets_get`, `halopsa_assets_search`, `halopsa_assets_list_types`, `halopsa_agents_list`, `halopsa_agents_get`, `halopsa_teams_list`, `halopsa_invoices_list`, `halopsa_invoices_get` |
| **Write** | Creates or modifies records. Reversible, but visible to the client. | `halopsa_tickets_create`, `halopsa_tickets_update`, `halopsa_clients_create` |
| **Destructive** | Emails the client or posts billable time. Requires explicit per-call human approval. | `halopsa_tickets_add_action` |

There are no delete tools in this plugin. Nothing here can remove a
ticket, client, asset, contract, or invoice.

`halopsa_tickets_add_action` sits in the destructive tier deliberately,
because the API calls it an "add" and it does two irreversible things
depending on the payload:

- With `hiddenfromuser: false` and an `emailto` address, it sends mail to
  the client from your service desk. There is no unsend.
- With `timetaken` and `charge: true`, it posts billable time against the
  ticket's contract. That time flows into the next invoice run, deducts
  from a prepaid-hours balance, and is corrected by a human in the
  billing UI, not by another API call.

An agent that adds actions unattended is an agent that can bill your
clients and write to them in your name.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Queue triage, SLA-risk reporting, asset lookups, and
  invoice reconciliation are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Destructive tools: require a named human approver per invocation. Do
  not grant `halopsa_tickets_add_action` to scheduled or unattended
  agents.

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
  satisfaction-survey email. It sits in the Write tier because it is also
  how you set a priority or assign an agent — but if you bill against SLA
  attainment, gate it at the destructive tier instead. A bulk close of a
  stale queue rewrites last month's numbers and mails every affected
  client.
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
