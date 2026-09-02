---
name: "PSA Tool Map"
description: >
  Maps abstract PSA/ticketing operations (list new tickets, get ticket
  detail, update priority + status, list statuses, list priorities) to
  concrete Conduit tool names for Autotask, HaloPSA, and ConnectWise PSA.
when_to_use: >-
  Fetched by another advanced-workflow skill that needs PSA access, never
  used standalone. Use when: PSA tool names, Autotask tools, HaloPSA tools,
  ConnectWise PSA tools, ticket status IDs, ticket priority IDs.
---

## Curated vendors

This role is curated for: Autotask, HaloPSA, ConnectWise PSA. A connected
PSA not listed here needs guided discovery: inspect the org's available
tools for that connector, reason from naming and shape, and tell the human
this vendor isn't fully vetted yet.

## Operation map

| Abstract operation | Autotask | HaloPSA | ConnectWise PSA |
|---|---|---|---|
| List new/untriaged tickets | `autotask__autotask_search_tickets` | `halopsa__halopsa_tickets_list` | `connectwise-psa__cw_search_tickets` |
| Get ticket detail | `autotask__autotask_get_ticket_details` | `halopsa__halopsa_tickets_get` | `connectwise-psa__cw_get_ticket` |
| Update ticket (priority/status/etc.) | `autotask__autotask_update_ticket` | `halopsa__halopsa_tickets_update` | `connectwise-psa__cw_update_ticket` |
| Add a ticket note/action | `autotask__autotask_create_ticket_note` | `halopsa__halopsa_tickets_add_action` | `connectwise-psa__cw_add_ticket_note` |
| List valid ticket statuses (discover once, don't call per-run) | `autotask__autotask_list_ticket_statuses` | no dedicated list tool observed — confirm via `halopsa__halopsa_tickets_list` field values before baking in IDs | `connectwise-psa__cw_list_statuses` |
| List valid ticket priorities (discover once, don't call per-run) | `autotask__autotask_list_ticket_priorities` | no dedicated list tool observed — confirm via ticket field values before baking in IDs | `connectwise-psa__cw_list_priorities` |

## Vendor-specific gotchas

### Autotask
- Priority IDs are typically **not** ordered by severity — discover them
  by name, never assume numeric ordering.
- Status/priority/queue IDs are tenant-specific — always discover once at
  build time, never hardcode across tenants.
- Don't call `list_*` discovery tools on every routine run — it's slow
  enough to hit the 60-second tool timeout. Discover once, bake the IDs
  into the routine prompt.

### HaloPSA
- No dedicated "list statuses"/"list priorities" tool was found in this
  vendor's observed tool surface — confirm the actual field values by
  reading a sample ticket via `halopsa_tickets_get` before baking any ID
  into a routine, don't assume symmetry with Autotask's shape.

### ConnectWise PSA
- Tool names are `cw_`-prefixed, not `connectwise_manage_`-prefixed —
  verified against `connectwise/manage/GOVERNANCE.md`'s `VENDOR_TOOL_CONFIG`
  listing, registered under the gateway slug `connectwise-psa` (so gateway
  names are `connectwise-psa__cw_*`, e.g. `connectwise-psa__cw_search_tickets`).
- `cw_add_ticket_note` writes a **customer-visible** note by default —
  pass `internalAnalysisFlag: true` explicitly for an internal-only note,
  or an agent's internal analysis gets emailed to the contact immediately.
  There is no delete-note tool to undo a mistaken send.
- `cw_update_ticket` is the **only** route to closing a ticket (it takes
  raw JSON Patch, so `op: "remove"` can strip a field outright). Closing
  stops the SLA clock and can fire close notifications/satisfaction
  surveys, and Conduit's access tiers gate the whole tool at `write`
  regardless of which field the patch touches — there's no way to allow
  priority/owner patches while blocking status/closure patches at the
  gateway level. Treat `cw_update_ticket` as requiring a named human
  approver per invocation; never grant it to unattended/nightly
  automation.
- Closure must pass through `Completed` before `Closed`, with a populated
  `resolution` field, or the patch fails with an error that reads like a
  permissions failure rather than a workflow-ordering one.
- The 60-requests/minute rate limit is shared across all operators on the
  same ConnectWise API member — a wide `cw_search_*` discovery sweep by
  one routine can 429 everyone else's concurrent calls.
