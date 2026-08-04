# Kaseya BMS plugin — governance and safety model

Unofficial. Community-built plugin for the Kaseya BMS PSA API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Kaseya BMS through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No BMS API token, tenant subdomain, or Kaseya One JWT is stored on the
  technician's machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who opened this ticket" — BMS's own log records only the API user.
- Revoking gateway access revokes BMS access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change BMS state. Safe for autonomous agents. | `kaseya_bms_list_tickets`, `kaseya_bms_get_ticket`, `kaseya_bms_list_time_entries`, `kaseya_bms_list_accounts`, `kaseya_bms_list_contacts`, `kaseya_bms_list_contracts`, `kaseya_bms_list_service_catalog`, `kaseya_bms_search_knowledge_base` |
| **Write** | Creates records. Reversible, but customer-visible. | `kaseya_bms_create_ticket`, `kaseya_bms_add_ticket_note` |
| **Destructive** | — | None. This plugin exposes no delete, no billing mutation, and no endpoint action. |

The destructive tier is genuinely empty, and that is the useful
statement here: the worst an agent can do with this plugin is open a
ticket or append a note. Nothing it exposes deletes data, changes what a
customer is billed, or touches a customer machine.

`kaseya_bms_add_ticket_note` is a write rather than a read because BMS
notes can be customer-facing. The tool takes an internal-only flag that
defaults to false, so an unset flag publishes to the client.

## Recommended agent policy

The safe default is **read autonomously, propose writes.**

- Read tools: allow. Ticket reporting, contract lookups, and knowledge
  base search are the intended autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
  For `kaseya_bms_add_ticket_note`, require the approver to confirm the
  internal-only flag explicitly rather than relying on the default.
- Destructive tools: none exist. Do not grant a destructive policy for
  this plugin; there is nothing for it to apply to.

## What it cannot reach

- Only the BMS tenant mapped to the operator's gateway identity. Each
  MSP has a private tenant subdomain; there is no shared regional
  endpoint and no cross-tenant API.
- Whatever the BMS security role forbids. BMS enforces role permissions
  server-side.
- No Kaseya VSA data. VSA shares Kaseya One SSO with BMS but is a
  separate product, separate API, and separate plugin.
- No Autotask data. Kaseya owns both PSAs; they do not share records.
- No filesystem, no shell, no other vendor's data.

## Implementation status

The skill for this plugin is marked in-development reference
documentation. The ten tools above are the current callable surface of
`kaseya-bms-mcp`. Verify against the deployed gateway before relying on
this table for an access-control decision.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `kaseya_bms_list_contacts` and `kaseya_bms_list_accounts` return
  customer PII (names, email addresses, phone numbers).
- `kaseya_bms_list_contracts` and `kaseya_bms_list_service_catalog`
  return commercial terms and rates. Restrict these if technicians
  should not see pricing.
- `kaseya_bms_list_time_entries` returns per-technician productivity
  data, which may be subject to works-council or employment-law
  constraints in some jurisdictions.

## Known sharp edges

- **Notes default to customer-visible.** The internal-only flag defaults
  to false. An agent that omits it publishes to the client.
- **Tenant subdomain is a credential, not a constant.** It is supplied
  per connection. Anything that hardcodes a BMS hostname will silently
  address the wrong MSP's tenant if reused.
- **BMS and Autotask do not reconcile.** Both are Kaseya PSAs and both
  have tickets, accounts, and contracts. An agent asked to "check the
  ticket" against the wrong one will confidently report that it does not
  exist.
