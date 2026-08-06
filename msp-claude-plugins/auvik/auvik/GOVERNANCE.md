# Auvik plugin — governance and safety model

Unofficial. Community-built plugin for the Auvik API. Not affiliated
with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches Auvik through
**Conduit** (`https://conduit.wyre.ai/v1/auvik/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for. Every tier claim below is derived from
Conduit's source, and this plugin's `.mcp.json` points at it.

Consequences worth stating plainly:

- No Auvik username or API key is stored on the technician's machine,
  in this repo, or in the model's context.
- The org's Auvik credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the
  connect form, which overwrites the stored credential in place, and
  nothing tracks its age or prompts you. Auvik is an API-key vendor, not
  an OAuth one, so there is no automatic token refresh either.
- Every call carries operator identity, so the audit log answers "who
  dismissed that alert" — Auvik's own audit trail records only the API
  user. The log records *who called what*, never with what arguments.
- Removing a technician's org membership stops their Auvik access on
  their next call, because membership is re-read per request. It does
  **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Grouped into the four buckets Conduit's access editor presents, with the
tier each bucket actually enforces at.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change Auvik or device state. Safe for autonomous agents. | `read` | `auvik_status`, `auvik_tenants_list`, `auvik_tenants_get`, `auvik_tenants_detail`, `auvik_devices_list`, `auvik_networks_list`, `auvik_interfaces_list`, `auvik_configurations_list`, `auvik_alerts_list`, `auvik_billing_client_usage`, `auvik_billing_device_usage`, `auvik_entities_list_notes` |
| **Write** | — | `write` | **Empty.** Conduit classifies no Auvik tool as a write. |
| **Delete** | — | `write` — **not** a tier of its own | **Empty.** |
| **Admin** | Forensic-class reads and unbounded surfaces. | `admin` | `auvik_entities_list_audits` (classified); plus every unclassified tool below |

**Auvik cannot configure network devices.** It polls them over SNMP and
reads their saved configurations; there is no tool that pushes a change
to a switch, router, or firewall. For an MSP evaluating agent risk this
is the single most reassuring fact about this plugin: a mistake here
produces a wrong answer, not an outage.

### Fourteen of the server's tools are unclassified, and every one requires `admin`

The Auvik MCP server registers 27 tools. Conduit's `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`) classifies **13** of them. Classification
is fail-closed: an unclassified tool is coerced to the highest tier at
the enforcement gate —
`const requiredTier: PermissionTier = classified ?? 'admin';`
(`src/access/access-enforcement.ts:63`). So today these fourteen tools
require tier `admin`, whatever their name suggests:

| Unclassified tool | What it does | Why the gap matters |
|---|---|---|
| `auvik_devices_get`, `auvik_devices_get_details`, `auvik_devices_get_lifecycle`, `auvik_devices_get_warranty` | Per-device detail, lifecycle and warranty | Plain reads that a `read`-tier agent cannot call |
| `auvik_networks_get`, `auvik_alerts_get` | Single network / single alert | Same |
| `auvik_configurations_get` | Device running configuration | Plain read of the *most* sensitive payload here — see *Data handling* |
| `auvik_statistics_device`, `auvik_statistics_interface`, `auvik_statistics_service`, `auvik_statistics_snmp_poller` | Performance series | Same |
| `auvik_alerts_dismiss` | Dismisses an alert | The one state-changing tool; `admin` today, `write` if ever classified |
| `auvik_raw_request` | Arbitrary Auvik REST call | `admin` for the right reason, by the wrong mechanism — see below |
| `auvik_navigate` | Vendor menu | Refused for *everyone* — see below |

This is not a "read tools are safe" table with a footnote. It means a
read-only agent cannot pull a device detail record, a warranty date, or
an interface statistic without being granted `admin` on Auvik — which
grants it `auvik_raw_request` at the same time. There is no safe middle
setting until these are classified. **Classifying them would be a
privilege reduction, not an addition.**

`auvik_raw_request` reaches the Auvik REST API directly and is not
bounded by the curated tool set; its blast radius is whatever endpoint it
is pointed at, chosen at call time. Conduit's policy matches on tool name
only and never inspects arguments, so this cannot be gated any lower than
the highest tier. Conduit has a guard pinning every arbitrary-request
passthrough (`*_raw_request`, `*_execute_tool`, `*_custom_mutation`,
`<vendor>_router`) to `admin`
(`src/access/tool-classification.test.ts`) — but that guard only sees
tools that are *in* `VENDOR_TOOL_CONFIG`, and this one is not. It lands
on `admin` via the unclassified fallback instead. Same tier, weaker
guarantee: classify it and the guard holds it there permanently.

`auvik_navigate` is refused for every caller, at every tier, including
org owners. Conduit suppresses `*_navigate` and `*_back` unconditionally
before any tier check (`src/proxy/tool-call-enforcement.ts:125-130`,
`src/proxy/discovery-tools.ts:41-50`) because a vendor menu advertises
tools without knowing the caller's access. Use `conduit__my_access`
instead.

### What granting `write` would mean

Conduit's enforcement tiers are only `read`, `write`, and `admin` (plus
`none`, meaning deny) — `src/access/permission-tier.ts:27`. "Delete" is a
presentation group in the access editor, and a delete-group tool compiles
to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). **Granting a technician `write` for a vendor
also grants every delete tool on it**; the only way to admit some write
tools but not the delete ones is a granular per-tool grant, which
compiles to an explicit `customTools` allowlist.

For Auvik specifically that consequence is currently vacuous — both
groups are empty — but it becomes live the moment `auvik_alerts_dismiss`
is classified. `dismiss` is one of Conduit's delete-verb tokens
(`src/access/tool-naming.ts:136`), so it would land in the **Delete**
presentation group and a plain `write` grant would admit it.

Conduit has no approval step, no per-call confirmation, and no
interactive prompt. It compares tiers. Any per-call approval discipline
below is a workflow you impose on your agents, and it is only as good as
the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve deletes.**

- Read tools: allow. Fleet inventory, tenant listing, and cross-tenant
  alert triage are the intended autonomous use — but note that the
  device-detail and statistics tools an inventory report actually needs
  are currently `admin`.
- Write tools: none are classified. `auvik_alerts_dismiss` should be
  drafted by the agent and approved by a human regardless of the tier it
  currently enforces at. It is one call, but see the sharp edges.
- Admin tools: treat the grant as equivalent to full Auvik
  administrator, because it carries `auvik_raw_request` with it. Do not
  give it to a scheduled or unattended agent. If you need the
  passthrough, give it its own grant whose `customTools` contains that
  tool and nothing else.

## What it cannot reach

- Only the Auvik tenants the connected credential can reach. Conduit
  controls *who in your organisation may use that credential and which
  tools they may call*, not which slice of Auvik's data comes back. A
  single MSP credential typically sees every client tenant the MSP
  manages, so scope is broad by design — see the cross-tenant note in
  the sharp edges. Scope the credential at Auvik if you need a narrower
  boundary.
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
  credential disclosure. It is unclassified, so it enforces at `admin`
  today; if it is ever classified, classify it deliberately rather than
  letting the `get` verb put it in `read`.
- `auvik_entities_list_audits` is classified `admin` on purpose: an
  entity audit log is forensic evidence, not routine telemetry.
- `auvik_billing_client_usage` and `auvik_billing_device_usage` return
  commercial data, and are classified `read`. Restrict them with a
  `customTools` allowlist if your agents run unattended.
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
- **A tier grant and a working workflow are different things here.**
  Because half the read surface is unclassified, an agent granted `read`
  will get denials on tools this document's Read group does not mention.
  Check `conduit__my_access` rather than inferring from the table.
