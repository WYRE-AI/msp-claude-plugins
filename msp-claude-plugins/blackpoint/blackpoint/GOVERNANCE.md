# Blackpoint Cyber plugin — governance and safety model

Unofficial. Community-built plugin for the Blackpoint Cyber
(CompassOne) API. Not affiliated with, endorsed by, or sponsored by the
vendor.

## What it connects as

This plugin does not hold credentials. It reaches CompassOne through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the partner account
the operator is authorised for.

- No CompassOne API token is stored on the technician's machine, in this
  repo, or in the model's context. The gateway maps
  `BLACKPOINT_API_TOKEN` onto the `X-Blackpoint-Api-Token` header and
  forwards it upstream as a Bearer token.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this customer's dark-web exposure" — CompassOne's own log
  records only the API account.
- Revoking gateway access revokes CompassOne access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change CompassOne or endpoint state. Safe for autonomous agents. | `blackpoint_tenants_list`, `blackpoint_tenants_get`, `blackpoint_assets_list`, `blackpoint_assets_get`, `blackpoint_assets_search`, `blackpoint_assets_relationships`, `blackpoint_detections_list`, `blackpoint_detections_get`, `blackpoint_vulnerabilities_list`, `blackpoint_vulnerabilities_scans_list`, `blackpoint_vulnerabilities_darkweb_list`, `blackpoint_vulnerabilities_external_list`, `blackpoint_navigate`, `blackpoint_back`, `blackpoint_status` |
| **Write** | — | *Empty.* |
| **Destructive** | — | *Empty.* |

**This plugin is read-only.** There is no tool that mutates CompassOne
state, acknowledges a detection, isolates a host, or opens a ticket.
Every response action must be taken in the CompassOne portal by a human.
That makes Blackpoint one of the safest connectors to hand to an
unattended agent — and it means an agent that claims to have "responded
to" or "closed" a detection is describing something it did not do.

`blackpoint_navigate` and `blackpoint_back` move a cursor through the
MCP server's own decision-tree context. They change nothing at the
vendor and belong in the read tier.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve destructive calls.** With no write or destructive tier
here, that reduces to:

- Read tools: allow. Cross-tenant detection sweeps, exposure roll-ups,
  and QBR reporting are the intended autonomous use.
- Restrict `blackpoint_vulnerabilities_darkweb_list` separately if your
  agents run unattended — see Data handling.

## What it cannot reach

- Only the CompassOne tenants under the partner account mapped to the
  operator's gateway identity. A tenant-scoped token sees one customer;
  only a partner token sees the portfolio.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; CompassOne's own
  notification channels carry the push feed.
- Six tool domains — `alerts`, `cloud security`, `notifications`,
  `partners`, `threat intel`, `tickets` — are stubbed in the MCP server
  and not implemented. They are not an alternative surface; do not call
  them.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `blackpoint_vulnerabilities_darkweb_list` returns **breached
  credentials and leaked personal data** for the customer's users. It is
  the most sensitive read in this plugin and the one most worth
  restricting from unattended agents and from any transcript that gets
  shared with the customer verbatim.
- `blackpoint_assets_*` returns hostnames, serial numbers, IP addresses,
  and — for the `identity` class — user-identifying records.
- `blackpoint_tenants_list` returns the MSP's full customer list.
  Partner-level output leaks the client roster if it reaches the wrong
  customer's report.

## Known sharp edges

- **"Incident response" is a misnomer for the API.** The skill is named
  for the workflow, not a mutable incident object. CompassOne has
  detections; the MCP surface can only read them.
- **Asset identity drift.** A re-imaged endpoint can produce two asset
  records. Dedupe on hostname or serial via `blackpoint_assets_search`
  before reporting counts, or the same machine is counted twice in a
  QBR.
- **`blackpoint_assets_list` requires a class.** It returns one of
  `endpoint`, `server`, `network`, `cloud`, `mobile`, `iot` per call. An
  agent that calls it once and reports "the tenant's assets" has
  reported a sixth of them.
- **Pagination silently truncates.** Detections and vulnerabilities run
  into the thousands. An unfinished page reads as a clean, small result
  — the failure mode looks like good news.
