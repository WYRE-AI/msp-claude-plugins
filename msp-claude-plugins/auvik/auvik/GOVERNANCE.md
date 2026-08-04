# Auvik plugin — governance and safety model

Unofficial. Community-built plugin for the Auvik API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Auvik through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Auvik username or API key is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log
  answers "who dismissed that alert" — Auvik's own audit trail records
  only the API user.
- Revoking gateway access revokes Auvik access with it, immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change Auvik or device state. Safe for autonomous agents. | `auvik_status`, `auvik_navigate`, `auvik_tenants_list`, `auvik_tenants_get`, `auvik_tenants_detail`, `auvik_devices_list`, `auvik_devices_get`, `auvik_devices_get_details`, `auvik_devices_get_lifecycle`, `auvik_devices_get_warranty`, `auvik_networks_list`, `auvik_networks_get`, `auvik_interfaces_list`, `auvik_configurations_list`, `auvik_configurations_get`, `auvik_alerts_list`, `auvik_alerts_get`, `auvik_statistics_device`, `auvik_statistics_interface`, `auvik_statistics_service`, `auvik_statistics_snmp_poller`, `auvik_billing_client_usage`, `auvik_billing_device_usage`, `auvik_entities_list_audits`, `auvik_entities_list_notes` |
| **Write** | Changes Auvik-side state. Reversible in effect, permanent in the audit log. | `auvik_alerts_dismiss` |
| **Destructive** | Nothing in the curated surface deletes data, revokes access, or changes device configuration. | — (see `auvik_raw_request` below) |

**Auvik cannot configure network devices.** It polls them over SNMP and
reads their saved configurations; there is no tool that pushes a change
to a switch, router, or firewall. For an MSP evaluating agent risk this
is the single most reassuring fact about this plugin: a mistake here
produces a wrong answer, not an outage.

`auvik_raw_request` is the exception and is deliberately left out of
the tiers above, because its blast radius is whatever endpoint it is
pointed at. It reaches the Auvik REST API directly and is not bounded
by the curated tool set. Treat it as destructive-tier by default: the
gateway cannot tell a read from a write once the call is inside the
passthrough. If your agent policy does not need it, do not grant it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.**

- Read tools: allow. Fleet inventory, lifecycle risk reporting, and
  cross-tenant triage sweeps are the intended autonomous use.
- Write tools: `auvik_alerts_dismiss` should be drafted by the agent
  and approved by a human. It is one call, but see the sharp edges.
- `auvik_raw_request`: require a named human approver per invocation,
  or withhold it entirely.

## What it cannot reach

- Only the Auvik tenants mapped to the operator's gateway identity. A
  single MSP credential typically sees every client tenant the MSP
  manages, so scope is broad by design — see the cross-tenant note in
  the sharp edges.
- Only the Auvik region cluster the credential belongs to. Auvik is
  region-pinned; a credential for `us1` cannot see `eu1` data.
- No filesystem, no shell, no other vendor's data.
- No device CLI. Auvik reads configuration; it does not offer a shell
  onto the monitored hardware.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- **`auvik_configurations_get` returns device running configurations.**
  On real network gear those routinely contain SNMP community strings,
  VPN pre-shared keys, RADIUS secrets, and hashed local credentials.
  This is the most sensitive tool in the plugin and the one most worth
  restricting — a config diff pulled into a chat transcript is a
  credential disclosure.
- `auvik_billing_client_usage` and `auvik_billing_device_usage` return
  commercial data. Restrict these if your agents run unattended.
- Device and interface records include IP addressing and topology for
  customer networks — useful to an attacker, and worth treating as
  confidential rather than merely technical.

## Known sharp edges

- **Dismissal is not resolution.** `auvik_alerts_dismiss` hides an
  alert; it does not clear the condition. Auvik re-evaluates on a
  schedule, so if the condition still holds a *new* alert with a *new
  ID* appears minutes later. An agent told to "clear the alert queue"
  will loop, generate audit noise, and mask a genuine outage behind
  repeated dismissals. Dismissal is appropriate only for confirmed
  noise, already-ticketed conditions, and transients that have
  cleared.
- **Cross-tenant leakage is a formatting failure, not a permissions
  failure.** One credential sees every tenant, and several list tools
  return across all of them unless a tenant is passed explicitly. An
  agent building a per-client report must scope every call, or it will
  put one customer's devices in another customer's document.
- **Rate limits degrade mid-task.** The `auvik_statistics_*` tools are
  far heavier than entity listings and hit the per-key limit first. A
  fleet-wide statistics sweep tends to fail partway, leaving a report
  that looks complete but silently covers only the tenants processed
  before the 429.
- **Stale entities outlive their alerts.** An alert can reference a
  device already deleted in Auvik; enriching it returns 404. That is
  evidence the alert is stale, not evidence of a broken credential.
