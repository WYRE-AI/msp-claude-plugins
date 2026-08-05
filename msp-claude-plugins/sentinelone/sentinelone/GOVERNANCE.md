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
- Credential rotation happens once at Conduit, not per technician.
  SentinelOne is not an OAuth vendor there, so rotation means
  re-submitting the connect form; nothing tracks credential age for you.
- Every call carries operator identity, so Conduit's audit log answers
  "who ran that Data Lake query" — SentinelOne's own log records only the
  Service User. It records *who called what*, never with what arguments,
  so it will not show you the query text.
- Removing a technician's Conduit org membership stops their SentinelOne
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

Conduit derives every tool's tier from `VENDOR_TOOL_CONFIG`
(`src/proxy/result-cache.ts`, the `sentinelone` block), which
`src/access/tool-classification.ts:4` declares the single source of
truth. The convention is `isAdmin → admin` (outranks), `isWrite → write`,
neither → `read` (`tool-classification.ts:33-38`).

**Six of this plugin's twenty-two tools are classified.** The other
sixteen have no entry in that table, so no tier is invented for them
below.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change SentinelOne or endpoint state. Safe for autonomous agents. | `read` | `list_alerts`, `get_alert`, `search_inventory_items`, `get_timestamp_range` |
| **Write** | *Empty for this vendor.* | `write` | *None.* |
| **Delete** | *Empty for this vendor.* | `write` — **not a tier of its own** | *None.* |
| **Admin** | Unbounded query surfaces. They change nothing, but Conduit tiers them by what they can pull back, not by whether they mutate. | `admin` | `powerquery`, `purple_ai` |
| **Not classified** | Documented and server-registered, but absent from `VENDOR_TOOL_CONFIG`. **Requires `admin` today.** | `admin` (coerced) | `search_alerts`, `get_alert_notes`, `get_alert_history`, `list_vulnerabilities`, `search_vulnerabilities`, `get_vulnerability`, `get_vulnerability_notes`, `get_vulnerability_history`, `list_misconfigurations`, `search_misconfigurations`, `get_misconfiguration`, `get_misconfiguration_notes`, `get_misconfiguration_history`, `list_inventory_items`, `get_inventory_item`, `iso_to_unix_timestamp` |

### This plugin is read-only — but "read-only" is not the same as tier `read`

There is no tool here that isolates a host, kills a process, quarantines
a file, rolls back a remediation, changes an alert's status, or applies a
patch. An agent given every tool in this plugin cannot alter a single
byte of customer state. The Write and Delete groups are empty and there
is nothing waiting to fill them.

That is a statement about the tool surface. It is **not** a statement
about which grant an operator needs, and the two come apart badly here:

- `powerquery` and `purple_ai` are deliberately `admin`
  (`result-cache.ts:845`, `:848`). They mutate nothing; they are
  unbounded query surfaces over the Data Lake, and Conduit's convention
  sends "unbounded passthrough/query surfaces" to `admin`
  (`tool-classification.ts:13-16`). `wyre-gateway/GOVERNANCE.md` lists
  both in the no-fixed-blast-radius class alongside
  `autotask_raw_request`.
- The sixteen unclassified tools reach `admin` a different way. Conduit
  fails closed:

  ```ts
  const requiredTier: PermissionTier = classified ?? 'admin'; // UNCLASSIFIED -> ADMIN
  ```
  — `src/access/access-enforcement.ts:63`. The `tools/list` filter
  mirrors the same decision (`src/proxy/list-visibility.ts:44`), so
  those sixteen are invisible below `admin`, not merely un-callable.

So a `read` grant on SentinelOne reaches four tools. Everything a
vulnerability report or a misconfiguration sweep needs — every
`*_vulnerabilities` and `*_misconfigurations` tool, `list_inventory_items`,
and every `_notes` / `_history` detail call — requires `admin` today,
which on any vendor grants the whole surface. **There is no safe middle
setting for this plugin right now.** Classifying the sixteen would be a
privilege reduction, not an addition.

One more qualification, unchanged by any of this: **the read-only
property belongs to the tool surface, not to the credential.** The
Service User token behind Conduit may well carry response permissions in
SentinelOne. Nothing in this plugin exercises them, but if SentinelOne
ships response tools in a future Purple MCP release they would appear
through the same connection — unclassified, and therefore reachable by
anyone already holding `admin`. Re-read this table after a vendor
upgrade rather than assuming it still holds.

### There is no per-call approval step

Conduit compares tiers. It has no approval mechanism, no per-call
confirmation, and no elicitation anywhere in the request path — see
`wyre-gateway/GOVERNANCE.md`, *The tier model*. Nothing you write into an
agent's prompt is enforced by the gateway; per-call approval is a policy
you impose on your agents, and it is only as good as the agent
configuration that carries it.

Conduit's enforcement tiers are only `read`, `write` and `admin`, plus
`none` meaning deny (`src/access/permission-tier.ts:27`). "Delete" is a
presentation group in the access editor, and a delete-group tool compiles
to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`) — so granting `write` on a vendor also grants
every delete tool on it. For SentinelOne both groups are empty, so a
`write` grant buys nothing over `read` today.

## Recommended agent policy

With no write or delete tier, the usual "propose and approve" ceremony
has nothing to apply to. The policy that matters here is about data
volume, cost, and the size of the grant:

- Allow the four `read`-tier tools to scheduled and unattended agents.
- Everything else needs `admin`. Do not hand a broad `admin` grant to an
  unattended agent just to unlock vulnerability reporting — use a
  granular per-tool grant whose `customTools` list names the specific
  tools that agent needs, which is the only mechanism that separates
  them.
- Bound `powerquery` and `purple_ai` in that allowlist deliberately.
  Require an explicit time range on every Data Lake query and cap how
  many an unattended agent may issue per run. Conduit's gates match on
  tool name only — arguments are never inspected
  (`src/proxy/tool-call-enforcement.ts:69-79`) — so nothing upstream
  will notice an unbounded query.
- Keep `list_inventory_items` / `search_inventory_items` out of an
  unattended agent's allowlist if the `IDENTITY` surface is in scope;
  see *Data handling*.

## What it cannot reach

- Only the SentinelOne accounts and sites the connected credential can
  reach. Conduit controls *who in your organisation may use that
  credential and which tools they may call*, not which slice of the data
  comes back. Purple MCP rejects Global-scope tokens outright, so the
  connection is Account- or Site-bounded by construction.
- No filesystem, no shell, no other vendor's data.
- No response, policy, exclusion, or agent-management surface. Those
  exist in the SentinelOne console and are not brokered here.
- No live event stream. Every tool is point-in-time.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `list_inventory_items` with `surface=IDENTITY` returns end-user PII
  from Active Directory, Entra ID, and Okta — names, email addresses,
  department, last-login time, and MFA state, across every managed
  client. This is the single most sensitive read in the plugin.
- `powerquery` returns raw endpoint telemetry: command lines, file paths,
  usernames, and network destinations. A broad query can pull far more
  customer detail into context than the question required. Its `admin`
  tier is the enforcement acknowledging exactly that.
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
- **An unclassified tool fails silently, not loudly.** Because
  `tools/list` filters the same way the call gate denies, a technician
  on tier `read` does not see `list_vulnerabilities` refuse — they see a
  connector that appears to have four tools. Rule out the classification
  gap before concluding the vendor is misbehaving.
- **Read-only invites over-trust.** Because nothing can be broken, it is
  tempting to let an agent report findings straight to a customer. The
  data is point-in-time and scoped to whatever the connected credential
  can see; a "zero critical vulnerabilities" summary may simply mean the
  agent never had visibility of that site.
