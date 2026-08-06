# SaaS Alerts plugin — governance and safety model

Unofficial. Community-built plugin for the SaaS Alerts API. Not
affiliated with, endorsed by, or sponsored by the vendor.

## What it connects as

This plugin does not hold credentials. It reaches SaaS Alerts through
the WYRE Conduit gateway, which brokers authentication centrally and
scopes every call to the tenant the operator is authorised for.

- **The endpoint matches this document.** This plugin's `.mcp.json`
  points at `https://conduit.wyre.ai/v1/saas-alerts/mcp` — the Conduit
  deployment every claim below is derived from.
- No SaaS Alerts partner API key is stored on the technician's machine,
  in this repo, or in the model's context.
- Credential rotation happens once at Conduit, not per technician. SaaS
  Alerts is not an OAuth vendor there, so rotation means re-submitting
  the connect form; nothing tracks credential age for you.
- Every call carries operator identity, so Conduit's audit log answers
  "who suppressed that alert" — SaaS Alerts' own log records only the
  partner API account. It records *who called what*, never with what
  arguments, so it will not show you which entries a whitelist call sent.
- Removing a technician's Conduit org membership stops their SaaS Alerts
  access on their next call, because membership is re-read per request.
  It does **not** revoke an already-issued token, and it does not touch
  credentials they connected personally. Full offboarding is more than
  one step — see `wyre-gateway/GOVERNANCE.md`, *Revocation*.

## Tool permission groups

These are the four groups Conduit's access editor presents, with the
enforcement tier each one actually compiles to. Every tier below is read
from `VENDOR_TOOL_CONFIG` (`src/proxy/result-cache.ts`, the
`'saas-alerts'` block), which `src/access/tool-classification.ts:4`
declares the single source of truth. The convention is `isAdmin → admin`
(outranks), `isWrite → write`, neither → `read`
(`tool-classification.ts:33-38`).

Every tool this plugin documents is classified, so nothing here falls
through to the unclassified-to-`admin` coercion.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change SaaS Alerts state or monitored tenants. Safe for autonomous agents. | `read` | `saas_alerts_status`, `saas_alerts_customers_list`, `saas_alerts_customers_get`, `saas_alerts_events_query`, `saas_alerts_events_query_advanced`, `saas_alerts_events_count`, `saas_alerts_events_count_advanced`, `saas_alerts_events_scroll`, `saas_alerts_recommended_actions`, `saas_alerts_users_get_msp`, `saas_alerts_users_list_partner`, `saas_alerts_users_list_by_customer`, `saas_alerts_devices_list_mapped`, `saas_alerts_devices_list_unmapped`, `saas_alerts_devices_list_ignored`, `saas_alerts_devices_list_orgs`, `saas_alerts_reports_list_scheduled`, `saas_alerts_reports_get_scheduled`, `saas_alerts_billing_list_dates`, `saas_alerts_billing_get_details`, `saas_alerts_partner_get_profile` |
| **Write** | Creates or modifies records. Reversible, but visible to the customer. | `write` | `saas_alerts_customers_create`, `saas_alerts_customers_update`, `saas_alerts_reports_create_scheduled` |
| **Delete** | *Empty for this vendor.* Both delete-verb tools are `isAdmin`, so they sit in the Admin row rather than here. | `write` — **not a tier of its own** | *None.* |
| **Admin** | Removes monitoring, blinds detection, or changes customer-facing partner identity. | `admin` | `saas_alerts_customers_set_whitelists`, `saas_alerts_customers_set_account_whitelists`, `saas_alerts_customers_delete`, `saas_alerts_reports_delete_scheduled`, `saas_alerts_partner_update_branding` |

`saas_alerts_navigate` is classified `read` but is refused for every
caller — owners and personal connections included — by Conduit's
discovery-tool suppression gate
(`src/proxy/tool-call-enforcement.ts:125-130`), so it is not listed
above.

### The whitelist setters are the entries to read twice

Both `saas_alerts_customers_set_whitelists` and
`saas_alerts_customers_set_account_whitelists` enforce at `admin`, and
Conduit and this document agree on why. A whitelist in SaaS Alerts
**suppresses detection**. Adding an entry does not adjust a preference —
it stops the platform raising alerts for that condition, in that
customer's tenant, from that moment on. Nothing fires to announce it; the
effect is an absence, and absences do not show up in a triage sweep. That
is a security control being switched off for a paying client, whatever
the HTTP verb looks like.

They are also **set**, not **add**. Each call replaces the customer's
whitelist with whatever payload it is given, so an agent that "adds an
entry" by sending a single item silently deletes every existing entry.
Always read the current list first, and require the approver to confirm
the full resulting list rather than just the new item. Conduit cannot
help you here: its gates match on tool name only and never inspect
arguments (`src/proxy/tool-call-enforcement.ts:69-79`), so a one-item
payload and a complete one are the same call as far as enforcement is
concerned.

`saas_alerts_customers_delete` removes a monitored customer outright,
which ends monitoring for that tenant and takes its alert history with
it. `saas_alerts_reports_delete_scheduled` removes a scheduled report,
which is how a customer stops receiving evidence that anything is being
watched.

`saas_alerts_partner_update_branding` is the one that moved: it reads
like a cosmetic write, and Conduit classifies it `admin` because it is
partner-level state that reaches every customer-facing report at once.
An earlier revision of this document put it in the Write tier. The tier
is `admin`; the risk framing — treat it as customer-visible even though
it is trivially reversible — still stands.

### What a `write` grant includes

Conduit's enforcement tiers are only `read`, `write` and `admin`, plus
`none` meaning deny (`src/access/permission-tier.ts:27`). "Delete" is a
presentation group in the access editor, and a delete-group tool compiles
to and enforces at tier `write` (`src/access/tier-group-mapping.ts`,
`GROUP_ENFORCEMENT_TIER`). So granting a technician `write` on a vendor
also grants every tool in that vendor's delete group, and the only way to
admit some write tools but not the delete ones is a granular per-tool
selection, which compiles to an explicit `customTools` allowlist.

For SaaS Alerts that group is empty: both delete-verb tools are
`isAdmin`, so they require `admin` and a `write` grant never reaches
them. A `write` grant here admits exactly the three tools in the Write
row — customer records and scheduled reports. Nothing it admits can
suppress a detection.

The corollary is the one to plan around: **everything that can blind
detection sits behind the same `admin` grant as everything else.** There
is no tier that admits `saas_alerts_customers_delete` while withholding
the whitelist setters, or vice versa. If you need that separation, it has
to be a granular per-tool grant.

### There is no per-call approval step

Conduit compares tiers. It has no approval mechanism, no per-call
confirmation, and no elicitation anywhere in the request path — see
`wyre-gateway/GOVERNANCE.md`, *The tier model*. An earlier revision of
this document said the destructive tier "requires explicit per-call human
approval"; nothing enforced that sentence, and it has been removed rather
than softened. Per-call approval is a workflow you impose on your agents,
and it is only as good as the agent configuration that carries it.

## Recommended agent policy

The safe default is **read autonomously, propose writes, never
self-approve a suppression.**

- Read tools: allow. Cross-tenant critical sweeps, per-customer
  summaries, and impossible-travel pattern hunts are the intended
  autonomous use.
- Write tools: agent drafts the exact call, human approves, then it runs.
- Admin tools: treat the grant as equivalent to full partner
  administrator. Do not grant it to scheduled or unattended agents.
  Whitelist changes in particular should carry a documented reason and an
  expiry review — a suppression added during one incident tends to
  outlive it by years — and since Conduit will not enforce that, it has
  to be a `customTools` allowlist or an agent-side rule.
- Because `saas_alerts_partner_update_branding` needs `admin`, an agent
  you wanted to trust with report branding and nothing else cannot be
  expressed as a tier. Give it its own granular grant.

## What it cannot reach

- Only the SaaS Alerts customers the connected partner credential can
  reach. Conduit controls *who in your organisation may use that
  credential and which tools they may call*, not which slice of the data
  comes back. Scope the credential at SaaS Alerts if you need a narrower
  boundary.
- No filesystem, no shell, no other vendor's data.
- **No Microsoft 365 or Google Workspace tenant.** This is the boundary
  that surprises people most. SaaS Alerts observes SaaS audit logs; it
  cannot disable an account, revoke sessions, reset MFA, block a
  sign-in, or remove a mailbox rule. `saas_alerts_recommended_actions`
  returns guidance for a human to carry out elsewhere, not an executable
  step. Actual M365 remediation runs through the CIPP connector, under
  its own governance.
- No live event stream. Every query is point-in-time.

## Data handling

- Responses pass through Conduit into model context for the session and
  are not persisted by this plugin.
- `saas_alerts_users_list_by_customer` and `saas_alerts_users_list_partner`
  return end-user PII — names and email addresses — for every managed
  tenant. Event payloads add source IP addresses, geolocation, device
  fingerprints, and sign-in times, which together describe an
  identifiable person's movements. Restrict these if your agents run
  unattended.
- `saas_alerts_billing_*` returns commercial data. `saas_alerts_partner_get_profile`
  returns MSP account details.
- Cross-tenant queries (`*_advanced`) can pull the whole customer base
  into a single context window. They are tier `read`, so a read-only
  agent can issue them. Scope them.

## Known sharp edges

- **An empty result is a real answer.** No events for a customer means
  no events, not a failed call. An agent that invents alerts to fill a
  quiet report is worse than one that reports nothing; the MCP server's
  `emptyGuard` signal distinguishes a genuine empty from an error.
- **Missing alerts may be suppressed, not absent.** If an expected alert
  never appears, check the customer's whitelist configuration before
  concluding the tenant is clean.
- **Time window changes the answer.** A one-hour sweep that returns
  nothing may return dozens at twenty-four hours. Every finding an agent
  reports must state the window it used.
- **Per-partner rate limits bite mid-sweep.** A large multi-tenant run
  can start returning 429s partway through, which looks like "those
  customers were clean". Back off and re-run rather than reporting a
  truncated sweep as complete.
- **Recommended actions are vendor-generated text.** They are a starting
  point for an analyst, not a validated runbook, and they assume
  permissions this plugin does not have.
