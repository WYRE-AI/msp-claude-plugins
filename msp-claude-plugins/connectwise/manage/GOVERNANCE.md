# ConnectWise PSA plugin — governance and safety model

Unofficial. Community-built plugin for the ConnectWise PSA (Manage) API.
Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches ConnectWise PSA through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the operator
is authorised for.

- No company ID, public key, private key or `clientId` is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who closed that ticket". ConnectWise's own audit trail records only the
  API member the integration authenticates as, so without the gateway
  every agent action looks like one shared robot.
- Revoking gateway access revokes ConnectWise PSA access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change PSA state. Safe for autonomous agents. | `cw_test_connection`, `cw_get_ticket`, `cw_search_tickets`, `cw_get_ticket_notes`, `cw_list_boards`, `cw_list_statuses`, `cw_list_priorities`, `cw_get_company`, `cw_search_companies`, `cw_get_contact`, `cw_search_contacts`, `cw_get_project`, `cw_search_projects`, `cw_get_project_ticket`, `cw_search_project_tickets`, `cw_get_project_ticket_notes`, `cw_get_time_entry`, `cw_search_time_entries`, `cw_get_activity`, `cw_search_activities`, `cw_get_agreement`, `cw_search_agreements`, `cw_get_agreement_additions`, `cw_get_invoice`, `cw_search_invoices`, `cw_get_member`, `cw_search_members`, `cw_get_configuration`, `cw_search_configurations`, `cw_get_opportunity`, `cw_search_opportunities`, `cw_search_opportunity_forecasts`, `cw_search_opportunity_notes`, `cw_search_sales_stages`, `cw_get_catalog_item`, `cw_search_catalog_items`, `cw_list_catalog_categories`, `cw_list_catalog_subcategories`, `cw_list_manufacturers` |
| **Write** | Creates or modifies records. Reversible by a human, but visible to the customer. | `cw_create_ticket`, `cw_add_ticket_note`, `cw_add_project_ticket_note`, `cw_create_company`, `cw_create_contact`, `cw_create_project`, `cw_create_activity`, `cw_create_catalog_item`, `cw_update_company`, `cw_update_catalog_item` |
| **Destructive** | Changes what the customer is told or billed, with no undo through this toolset. Requires explicit per-call human approval. | `cw_update_ticket`, `cw_create_time_entry` |

This plugin exposes no delete tool. That is not the same as being safe —
the two tools below reach the customer through a path that cannot be
walked back from here.

`cw_update_ticket` sits in the destructive tier deliberately. It is the
only route to closing a ticket, and closing is not a bookkeeping change:
it stops the SLA clock, fires whatever close notification and satisfaction
survey the board is wired to, and in most MSP configurations ends the
window in which unbilled work can still be added. The tool takes raw JSON
Patch, so `op: "remove"` can also strip a field outright. Tiering is
per-tool and the gateway cannot see which `path` an agent intends, so the
whole tool inherits the blast radius of its worst operation. If your
gateway can gate on argument values, the narrower rule is: allow
`cw_update_ticket` freely for `owner`, `priority` and `board`, and require
approval for any patch touching `status` or `closedFlag`.

`cw_create_time_entry` is billing, not bookkeeping. An entry against a
`ServiceTicket` or `ProjectTicket` lands on the customer's next invoice at
the work role's rate. There is no `cw_delete_time_entry` and no
`cw_update_time_entry` in this plugin, so an agent that logs the wrong
hours to the wrong ticket has created a correction that has to be made by
hand in the PSA — and once the owning time sheet is submitted, by someone
with approval rights.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Cross-company triage sweeps, SLA reporting and
  agreement/invoice reconciliation are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  Pay particular attention to `cw_add_ticket_note` — see sharp edges.
- Destructive tools: require a named human approver per invocation. Do not
  grant these to scheduled or unattended agents, and specifically do not
  let a nightly "close stale tickets" agent hold `cw_update_ticket`.

## What it cannot reach

- Only the ConnectWise PSA instance mapped to the operator's gateway
  identity, and within it only what the underlying API member's security
  role permits. ConnectWise security roles are per-module; a read-only
  role makes the write tiers above fail at the API, not at the gateway.
- No filesystem, no shell, no other vendor's data.
- Not ConnectWise Automate and not ConnectWise CPQ. They are separate
  products with separate APIs and separate gateway connectors, despite the
  shared brand. A PSA `company/id` is not an Automate `ClientID`.
- No live event stream. Every tool is point-in-time; ConnectWise callbacks
  carry the push feed.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `cw_search_contacts` / `cw_get_contact` return customer PII (names,
  email addresses, direct phone numbers, portal login state).
  `cw_search_members` / `cw_get_member` return your own staff records.
- `cw_get_invoice`, `cw_search_invoices`, `cw_get_agreement` and
  `cw_get_agreement_additions` return commercial terms — contract rates,
  margins and MRR. Restrict these if your agents run unattended or if
  transcripts are shared beyond the finance team.

## Known sharp edges

- **Notes default to customer-visible.** `cw_add_ticket_note` writes a
  plain discussion note unless `internalAnalysisFlag: true` is passed. On
  most boards that emails the contact immediately. An agent drafting
  "internal" analysis without the flag has published it. There is no
  delete-note tool here.
- **Closure ordering.** A ticket must pass through `Completed` before
  `Closed`, and closing without a populated `resolution` leaves the ticket
  incomplete in reporting. An agent that patches straight to `Closed` gets
  an error whose message reads like a permissions failure.
- **60 requests per minute, per member.** The limit is enforced on the API
  member the gateway authenticates as, so concurrent operators share one
  budget. A wide `cw_search_*` sweep by one agent will 429 everyone else's
  calls mid-task.
- **`conditions` is plural here; Automate's is singular.** The two
  ConnectWise products do not share filter syntax. Treat any result set an
  agent produced under a borrowed filter as unverified — a filter the API
  did not recognise is not the same as a filter that matched nothing, and
  the difference matters most on the sweeps that feed bulk decisions.
