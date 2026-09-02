---
name: psa-tool-map
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
| List new/untriaged tickets | `autotask__autotask_search_tickets` | `halopsa__halopsa_tickets_list` | not yet verified — use guided discovery |
| Get ticket detail | `autotask__autotask_get_ticket_details` | `halopsa__halopsa_tickets_get` | not yet verified — use guided discovery |
| Update ticket (priority/status/etc.) | `autotask__autotask_update_ticket` | `halopsa__halopsa_tickets_update` | not yet verified — use guided discovery |
| Add a ticket note/action | `autotask__autotask_create_ticket_note` | `halopsa__halopsa_tickets_add_action` | not yet verified — use guided discovery |
| List valid ticket statuses (discover once, don't call per-run) | `autotask__autotask_list_ticket_statuses` | no dedicated list tool observed — confirm via `halopsa__halopsa_tickets_list` field values before baking in IDs | not yet verified |
| List valid ticket priorities (discover once, don't call per-run) | `autotask__autotask_list_ticket_priorities` | no dedicated list tool observed — confirm via ticket field values before baking in IDs | not yet verified |

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
- Tool surface not yet verified against a live connection. Treat as
  guided-discovery-only until confirmed; do not present this vendor as
  equally vetted to Autotask/HaloPSA in any workflow skill that cites it.
