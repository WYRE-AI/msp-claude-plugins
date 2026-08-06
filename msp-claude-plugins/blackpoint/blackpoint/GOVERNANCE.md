# Blackpoint Cyber plugin — governance and safety model

Unofficial. Community-built plugin for the Blackpoint Cyber
(CompassOne) API. Not affiliated with, endorsed by, or sponsored by the
vendor.

## What it connects as

This plugin does not hold credentials. It reaches CompassOne through the
WYRE Conduit gateway, which brokers authentication centrally and scopes
every call to the partner account the operator is authorised for.

- **The endpoint matches this document.** This plugin's `.mcp.json`
  points at `https://conduit.wyre.ai/v1/blackpoint/mcp` — the Conduit
  deployment every claim below is derived from.
- No CompassOne API token is stored on the technician's machine, in this
  repo, or in the model's context. Conduit maps `BLACKPOINT_API_TOKEN`
  onto the `X-Blackpoint-Api-Token` header and forwards it upstream as a
  Bearer token; the outbound header set is built from scratch, never
  proxied from the client.
- The org's CompassOne credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every technician's
  machine. There is no rotate action, though — you re-submit the connect
  form, which overwrites the stored credential in place, and nothing
  tracks its age or prompts you. Blackpoint is not an OAuth vendor in
  Conduit, so there is no automatic token refresh either.
- Every call carries operator identity, so Conduit's audit log answers
  "who pulled this customer's dark-web exposure" — CompassOne's own log
  records only the API account. It records *who called what*, never with
  what arguments.
- Removing a technician's Conduit org membership stops their CompassOne
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit derives every tool's tier from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`, the `blackpoint` block), which
`src/access/tool-classification.ts:4` declares the single source of
truth. The convention is `isAdmin → admin` (outranks), `isWrite → write`,
neither → `read` (`tool-classification.ts:33-38`).

**Blackpoint's block in that table contains exactly one tool.** Of the
fifteen tools this plugin documents, fourteen have no entry at all, so no
tier is invented for them below.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change CompassOne or endpoint state. Safe for autonomous agents. | `read` | `blackpoint_status` |
| **Write** | *Empty for this vendor.* | `write` | *None.* |
| **Delete** | *Empty for this vendor.* | `write` — **not a tier of its own** | *None.* |
| **Admin** | Nothing is deliberately classified `admin` — but everything below arrives there by fail-closed coercion. | `admin` | *No explicit entries.* |
| **Not classified** | Documented and server-registered, but absent from `VENDOR_TOOL_CONFIG`. **Requires `admin` today.** | `admin` (coerced) | `blackpoint_tenants_list`, `blackpoint_tenants_get`, `blackpoint_assets_list`, `blackpoint_assets_get`, `blackpoint_assets_search`, `blackpoint_assets_relationships`, `blackpoint_detections_list`, `blackpoint_detections_get`, `blackpoint_vulnerabilities_list`, `blackpoint_vulnerabilities_scans_list`, `blackpoint_vulnerabilities_darkweb_list`, `blackpoint_vulnerabilities_external_list`, `blackpoint_navigate`, `blackpoint_back` |

### This plugin is read-only — and that is not the same as tier `read`

There is no tool that mutates CompassOne state, acknowledges a detection,
isolates a host, or opens a ticket. Every response action must be taken
in the CompassOne portal by a human. That makes Blackpoint one of the
safest connectors to hand to an unattended agent — and it means an agent
that claims to have "responded to" or "closed" a detection is describing
something it did not do. The Write and Delete groups are empty and there
is nothing waiting to fill them.

That is a statement about the tool surface, not about the grant an
operator needs. Conduit fails closed:

```ts
const requiredTier: PermissionTier = classified ?? 'admin'; // UNCLASSIFIED -> ADMIN
```
— `src/access/access-enforcement.ts:63`. The `tools/list` filter mirrors
the same decision (`src/proxy/list-visibility.ts:44`), so the fourteen
unclassified tools are invisible below `admin`, not merely un-callable.

**A `read` grant on Blackpoint reaches one tool: a health check.** Every
tenant sweep, asset inventory, detection roll-up, and exposure report
this document describes as the intended autonomous use requires `admin`
today — including `blackpoint_vulnerabilities_darkweb_list`, the most
sensitive read here. There is no safe middle setting until Blackpoint's
tools are classified, and classifying them would be a privilege
*reduction*: it would move the reads down from `admin` to `read` and, for
the first time, make it possible to admit the asset tools while withholding
the dark-web one.

`blackpoint_navigate` and `blackpoint_back` are a separate case. They
move a cursor through the MCP server's own decision-tree context and
change nothing at the vendor, but discovery tools (`*_navigate` /
`*_back`) are refused for every caller — owners and personal connections
included — by Conduit's discovery-tool suppression gate
(`src/proxy/tool-call-enforcement.ts:125-130`), regardless of tier.

### There is no per-call approval step

Conduit compares tiers. It has no approval mechanism, no per-call
confirmation, and no elicitation anywhere in the request path — see
`wyre-gateway/GOVERNANCE.md`, *The tier model*. Conduit's enforcement
tiers are only `read`, `write` and `admin`, plus `none` meaning deny
(`src/access/permission-tier.ts:27`); "Delete" is a presentation group in
the access editor, and a delete-group tool compiles to and enforces at
tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`), so granting `write` on a vendor also grants
every delete tool on it. For Blackpoint both groups are empty, so a
`write` grant buys nothing over `read` today. Any per-call approval you
want is a policy you impose on your agents, and it is only as good as the
agent configuration that carries it.

## Recommended agent policy

The house default — read autonomously, propose writes, never
self-approve deletes — has no writes or deletes to apply to here. What is
left is about the size of the grant and the sensitivity of what comes
back:

- Allow `blackpoint_status` at tier `read`. That is all `read` reaches.
- Everything else needs `admin`. Do not hand a broad `admin` grant to an
  unattended agent just to unlock reporting — use a granular per-tool
  grant whose `customTools` list names the specific tools that agent
  needs. That allowlist is the only mechanism that can admit
  `blackpoint_detections_list` while withholding
  `blackpoint_vulnerabilities_darkweb_list`.
- Keep `blackpoint_vulnerabilities_darkweb_list` out of an unattended
  agent's allowlist by default — see *Data handling*.

## What it cannot reach

- Only the CompassOne tenants the connected credential can reach.
  Conduit controls *who in your organisation may use that credential and
  which tools they may call*, not which slice of the data comes back. A
  tenant-scoped token sees one customer; only a partner token sees the
  portfolio. Scope the credential at CompassOne if you need a narrower
  boundary.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every tool is point-in-time; CompassOne's own
  notification channels carry the push feed.
- Six tool domains — `alerts`, `cloud security`, `notifications`,
  `partners`, `threat intel`, `tickets` — are stubbed in the MCP server
  and not implemented. They are not an alternative surface; do not call
  them.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
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
- **An unclassified tool fails silently, not loudly.** Because
  `tools/list` filters the same way the call gate denies, a technician on
  tier `read` does not see `blackpoint_detections_list` refuse — they see
  a connector that appears to have one tool. Rule out the classification
  gap before concluding the vendor is down.
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
