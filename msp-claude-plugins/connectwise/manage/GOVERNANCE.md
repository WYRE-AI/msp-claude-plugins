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
- Credential rotation happens once at Conduit, not per technician.
- Every call carries operator identity, so Conduit's audit log answers
  "who closed that ticket". ConnectWise's own audit trail records only the
  API member the integration authenticates as, so without Conduit every
  agent action looks like one shared robot. Conduit records *who called
  what*, never with what arguments.
- Removing a technician's Conduit org membership stops their PSA access on
  their next call, because membership is re-read per request. It does
  **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than one
  step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit's access editor presents four groups — Read, Write, Delete, Admin
— so these are the buckets an owner actually clicks. Enforcement knows
only three tiers, `read`, `write` and `admin` (plus `none`, meaning deny)
— `src/access/permission-tier.ts:27`. All 51 tools below are classified in
`VENDOR_TOOL_CONFIG` under the slug `connectwise-psa`.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change PSA state. Safe for autonomous agents. | `read` | `cw_test_connection`, `cw_get_ticket`, `cw_search_tickets`, `cw_get_ticket_notes`, `cw_list_boards`, `cw_list_statuses`, `cw_list_priorities`, `cw_get_company`, `cw_search_companies`, `cw_get_contact`, `cw_search_contacts`, `cw_get_project`, `cw_search_projects`, `cw_get_project_ticket`, `cw_search_project_tickets`, `cw_get_project_ticket_notes`, `cw_get_time_entry`, `cw_search_time_entries`, `cw_get_activity`, `cw_search_activities`, `cw_get_agreement`, `cw_search_agreements`, `cw_get_agreement_additions`, `cw_get_invoice`, `cw_search_invoices`, `cw_get_member`, `cw_search_members`, `cw_get_configuration`, `cw_search_configurations`, `cw_get_opportunity`, `cw_search_opportunities`, `cw_search_opportunity_forecasts`, `cw_search_opportunity_notes`, `cw_search_sales_stages`, `cw_get_catalog_item`, `cw_search_catalog_items`, `cw_list_catalog_categories`, `cw_list_catalog_subcategories`, `cw_list_manufacturers` |
| **Write** | Creates or modifies records — including closing a ticket and billing the customer. | `write` | `cw_create_ticket`, `cw_update_ticket`, `cw_add_ticket_note`, `cw_add_project_ticket_note`, `cw_create_company`, `cw_update_company`, `cw_create_contact`, `cw_create_project`, `cw_create_activity`, `cw_create_time_entry`, `cw_create_catalog_item`, `cw_update_catalog_item` |
| **Delete** | **Empty.** This plugin exposes no delete tool. | `write` — **not** a tier of its own | *(none)* |
| **Admin** | **Empty.** No passthrough, dispatcher, or org-level tool in this surface. | `admin` | *(none)* |

**Two of the four groups are empty, which makes this vendor's grant model
unusually blunt.** There is no delete tool for the delete-group rule to
apply to, and no admin tool to hold back — so for ConnectWise PSA the
whole access editor collapses to one real decision: `read`, or `write`.
**Granting `write` grants all twelve write tools at once**, including the
two that reach the customer. There is no tier between them. The only way
to admit ticket creation and notes without admitting ticket closure and
time entries is a granular per-tool grant, which compiles to an explicit
`customTools` allowlist rather than a tier.

Conduit has no approval step, no per-call confirmation, and no interactive
prompt. It compares tiers. Any per-call human approval described below is
a workflow you impose on your agents, and it is only as good as the agent
configuration that carries it.

### This plugin exposes no delete tool. That is not the same as being safe.

Two write tools reach the customer through a path that cannot be walked
back from here. Both enforce at `write`, identically to
`cw_create_catalog_item`.

**`cw_update_ticket`** is the only route to closing a ticket, and closing
is not a bookkeeping change: it stops the SLA clock, fires whatever close
notification and satisfaction survey the board is wired to, and in most
MSP configurations ends the window in which unbilled work can still be
added. The tool takes raw JSON Patch, so `op: "remove"` can also strip a
field outright. Classification is per-tool and the gate never reads
arguments — `ToolCallGateInput` has no `arguments` field at all — so the
whole tool carries the blast radius of its worst operation. If your agent
framework can gate on argument values, the narrower rule is: allow
`cw_update_ticket` freely for `owner`, `priority` and `board`, and require
approval for any patch touching `status` or `closedFlag`. Conduit cannot
express that rule; only your agent configuration can.

**`cw_create_time_entry`** is billing, not bookkeeping. An entry against a
`ServiceTicket` or `ProjectTicket` lands on the customer's next invoice at
the work role's rate. There is no `cw_delete_time_entry` and no
`cw_update_time_entry` in this plugin, so an agent that logs the wrong
hours to the wrong ticket has created a correction that has to be made by
hand in the PSA — and once the owning time sheet is submitted, by someone
with approval rights.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a customer-visible change.**

- **Read tools: allow.** Cross-company triage sweeps, SLA reporting and
  agreement/invoice reconciliation are the intended autonomous use.
- **Write tools: agent drafts the exact call, human approves, then it
  runs.** Pay particular attention to `cw_add_ticket_note` — see sharp
  edges.
- **Inside the write group, treat `cw_update_ticket` and
  `cw_create_time_entry` as requiring a named human approver per
  invocation.** Do not let a nightly "close stale tickets" agent hold
  `cw_update_ticket`. Conduit cannot enforce this separation for you — a
  `write` grant already admits both — so it has to live in the agent's own
  configuration, or in a granular `customTools` grant that lists the write
  tools you actually meant.
- For unattended work, prefer a `read` grant and a human in the loop for
  anything that writes. A service client with a `write` grant on this
  vendor can close tickets and bill customers.

## What it cannot reach

- Only the ConnectWise PSA instance mapped to the operator's Conduit
  identity, and within it only what the underlying API member's security
  role permits. Conduit controls *who in your organisation may use that
  credential and which tools they may call*, not which slice of PSA's data
  comes back. ConnectWise security roles are per-module; a read-only role
  makes the write tools fail at the API rather than at Conduit. Scope the
  credential at the vendor if you need a narrower boundary.
- No filesystem, no shell, no other vendor's data.
- Not ConnectWise Automate and not ConnectWise CPQ. They are separate
  products with separate APIs and separate Conduit connectors, despite the
  shared brand. A PSA `company/id` is not an Automate `ClientID`.
- No live event stream. Every tool is point-in-time; ConnectWise callbacks
  carry the push feed.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `cw_search_contacts` / `cw_get_contact` return customer PII (names,
  email addresses, direct phone numbers, portal login state).
  `cw_search_members` / `cw_get_member` return your own staff records.
- `cw_get_invoice`, `cw_search_invoices`, `cw_get_agreement` and
  `cw_get_agreement_additions` return commercial terms — contract rates,
  margins and MRR. Restrict these if your agents run unattended or if
  transcripts are shared beyond the finance team. Because these are all
  `read`-tier, a plain `read` grant includes them; separating them needs a
  granular `customTools` grant.

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
  member Conduit authenticates as, so concurrent operators share one
  budget. A wide `cw_search_*` sweep by one agent will 429 everyone else's
  calls mid-task.
- **`conditions` is plural here; Automate's is singular.** The two
  ConnectWise products do not share filter syntax. Treat any result set an
  agent produced under a borrowed filter as unverified — a filter the API
  did not recognise is not the same as a filter that matched nothing, and
  the difference matters most on the sweeps that feed bulk decisions.
