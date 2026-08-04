# SentinelOne plugin — governance and safety model

Unofficial. Community-built plugin for the SentinelOne Purple MCP
server. Not affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches SentinelOne through
the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which
brokers authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No SentinelOne Service User token is stored on the technician's
  machine, in this repo, or in the model's context.
- Credential rotation happens once at the gateway, not per technician.
- Every call carries operator identity, so the gateway audit log answers
  "who ran that Data Lake query" — SentinelOne's own log records only the
  Service User.
- Revoking gateway access revokes SentinelOne access with it,
  immediately.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change SentinelOne or endpoint state. Safe for autonomous agents. | `list_alerts`, `search_alerts`, `get_alert`, `get_alert_notes`, `get_alert_history`, `list_vulnerabilities`, `search_vulnerabilities`, `get_vulnerability`, `get_vulnerability_notes`, `get_vulnerability_history`, `list_misconfigurations`, `search_misconfigurations`, `get_misconfiguration`, `get_misconfiguration_notes`, `get_misconfiguration_history`, `list_inventory_items`, `search_inventory_items`, `get_inventory_item`, `powerquery`, `get_timestamp_range`, `iso_to_unix_timestamp`, `purple_ai` |
| **Write** | — | None. |
| **Destructive** | — | None. |

**This plugin is read-only.** There is no tool here that isolates a
host, kills a process, quarantines a file, rolls back a remediation,
changes an alert's status, or applies a patch. An agent given every tool
in this plugin cannot alter a single byte of customer state. For an MSP
owner deciding what to allow, that is the whole answer.

Two qualifications worth understanding before you rely on it:

- **The read-only property belongs to the tool surface, not to the
  credential.** The Service User token behind the gateway may well carry
  response permissions in SentinelOne. Nothing in this plugin exercises
  them, but if SentinelOne ships response tools in a future Purple MCP
  release they would appear through the same connection. Re-read this
  table after a vendor upgrade rather than assuming it still holds.
- **Read-only is not free.** `powerquery` and `purple_ai` consume real
  platform quota and can run long — see the sharp edges below.

## Recommended agent policy

With no write or destructive tier, the usual "propose and approve"
ceremony has nothing to apply to. The policy that matters here is about
data volume and cost, not about state:

- Allow the alert, vulnerability, misconfiguration, and inventory tools
  to scheduled and unattended agents. Cross-tenant triage sweeps and QBR
  reporting are the intended autonomous use.
- Bound `powerquery` and `purple_ai` — require an explicit time range on
  every Data Lake query and cap how many an unattended agent may issue
  per run.
- Restrict `list_inventory_items` / `search_inventory_items` on the
  `IDENTITY` surface if your agents run unattended; see data handling.

## What it cannot reach

- Only the SentinelOne accounts and sites mapped to the operator's
  gateway identity. Purple MCP rejects Global-scope tokens outright, so
  the connection is Account- or Site-bounded by construction.
- No filesystem, no shell, no other vendor's data.
- No response, policy, exclusion, or agent-management surface. Those
  exist in the SentinelOne console and are not brokered here.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- `list_inventory_items` with `surface=IDENTITY` returns end-user PII
  from Active Directory, Entra ID, and Okta — names, email addresses,
  department, last-login time, and MFA state, across every managed
  client. This is the single most sensitive read in the plugin.
- `powerquery` returns raw endpoint telemetry: command lines, file paths,
  usernames, and network destinations. A broad query can pull far more
  customer detail into context than the question required.
- `purple_ai` sends your prompt to SentinelOne's own model. Treat the
  query text as leaving your boundary, and do not paste customer
  credentials or ticket contents into it.

## Known sharp edges

- **Unprefixed tool names.** Purple MCP names its tools `list_alerts`,
  `get_alert`, and so on, with no vendor prefix. In a session that also
  has an EDR or PSA connector loaded, an agent can pick the wrong
  `list_alerts`. Confirm the connector namespace before trusting a
  cross-vendor comparison.
- **A broad PowerQuery is a self-inflicted outage.** Queries without a
  time range scan the whole Data Lake, time out, and burn quota that the
  SOC needs during a live incident. Always set `fromDate` / `toDate`.
- **Purple AI writes queries; it does not check them.** Generated
  PowerQuery is usually right and occasionally wrong in ways that return
  plausible-but-empty results. An empty result is not proof of a clean
  environment.
- **Alert IDs are not stable.** They change after merge operations, so a
  `get_alert` that 404s does not mean the alert was resolved. Re-query
  rather than reporting it closed.
- **Read-only invites over-trust.** Because nothing can be broken, it is
  tempting to let an agent report findings straight to a customer. The
  data is point-in-time and scoped to whatever the gateway identity can
  see; a "zero critical vulnerabilities" summary may simply mean the
  agent never had visibility of that site.
