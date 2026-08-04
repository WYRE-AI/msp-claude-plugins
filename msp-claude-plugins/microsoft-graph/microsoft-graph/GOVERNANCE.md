# Microsoft Graph plugin — governance and safety model

Unofficial. Community-built plugin for Microsoft's Graph MCP Server for
Enterprise. Not affiliated with, endorsed by, or sponsored by the
vendor.

> The upstream service is a Microsoft **public preview** hosted at
> `https://mcp.svc.cloud.microsoft/enterprise`. Its tool surface, query
> catalogue, and scopes may change before general availability.

## What it connects as

This plugin does not hold credentials. It reaches the Graph Enterprise
MCP through the WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`),
which brokers authentication centrally and scopes every call to the
tenant the operator is authorised for.

This vendor uses **BYOC** (bring-your-own-credentials): the MSP
registers its own multi-tenant Entra app and supplies `tenantId`,
`clientId`, and `clientSecret` **to the gateway**, not to the
technician. Consequences worth stating plainly:

- No client secret is stored on the technician's machine, in this repo,
  or in the model's context. It lives at the gateway and rotates there
  once, not per technician.
- The token minted is **delegated** — every call executes *as the
  signed-in user*, not as a service principal. Operator identity is
  therefore enforced by Entra itself, not merely logged: a technician
  cannot read what their own Entra roles do not permit.
- Revoking gateway access revokes Graph access with it, immediately.
- Separately, a Global Administrator in **each customer tenant** must
  grant admin consent out of band before that tenant returns any data.
  Consent is per tenant and revocable by the customer at any time, from
  their side, without involving you.

## Tool permission tiers

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change any tenant state. Safe for autonomous agents. | `microsoft_graph_suggest_queries`, `microsoft_graph_list_properties`, `microsoft_graph_get` |
| **Write** | — | None. |
| **Destructive** | — | None. |

**This plugin is read-only, structurally and not just by convention.**
The server exposes exactly three tools, and the only one that reaches a
tenant — `microsoft_graph_get` — issues HTTP `GET` requests to Microsoft
Graph. There is no create, update, delete, or action endpoint to
withhold, no admin-consent scope that would add one, and no parameter
that turns a read into a write.

This is the strongest safety property in the Microsoft part of the
fleet, and it is the reason to prefer this plugin for questions. If an
operator asks for a change, the correct answer is to route to a
write-capable tool — the `m365` plugin for one tenant, the `cipp`
plugin for the fleet — not to look for a way to do it here.

## Recommended agent policy

**Allow all three tools to autonomous agents.** Unattended audits,
scheduled reporting, and cross-tenant question-answering are the
intended use, and the read-only ceiling makes them safe.

The residual risk is not damage — it is **disclosure and wrong
conclusions**. See Data handling and Known sharp edges.

## What it cannot reach

- Only the Entra tenants that have granted admin consent to your BYOC
  app **and** that the signed-in caller's roles permit. Both gates must
  pass.
- Nothing outside the consented `MCP.*` delegated scopes.
- No writes to any tenant, by design.
- No filesystem, no shell, no other vendor's data.
- No live event stream. Every call is point-in-time.
- No fleet view. One delegated token sees one signed-in user in the
  tenants they are consented into; "across all our tenants" is a `cipp`
  question.

## Data handling

- Responses pass through the gateway into model context for the session
  and are not persisted by this plugin.
- **`microsoft_graph_get` returns directory PII by design.** In normal
  use that includes user names, user principal names and email
  addresses, job titles, managers, group memberships, device names,
  licence assignments, and guest/external account details.
- It also returns **sign-in telemetry**: last sign-in timestamps, source
  IP addresses, and geolocation. IP and location data about a named
  individual is personal data in most jurisdictions and is more
  sensitive than the directory record it attaches to.
- Everything returned is bounded by the caller's Entra roles and the
  consented scopes — but within that boundary the model sees the raw
  records, so the presentation guidance in
  `microsoft-graph-querying` (answer in plain language; do not surface
  GUIDs and JSON unasked) is a privacy control, not a style preference.

## Known sharp edges

- **A permissions boundary looks exactly like a clean result.** If
  admin consent is missing, or the caller's roles are narrower than the
  question, the tenant returns nothing — and an audit reports "no
  findings". Confirm consent and scope before treating an empty result
  as good news. This is the single most dangerous failure mode here and
  the reason a read-only plugin still needs governance.
- **Preview service.** Behaviour and the query catalogue may change
  without notice. Verify anything material in the Entra admin center
  before acting on it; do not build hard automation dependencies yet.
- **Rate limit: 100 calls/min/user**, on top of Graph's own throttling.
  Fanning out speculative `get` calls degrades the tenant for the
  signed-in user, not just for the agent. Route through
  `suggest_queries` — one good call beats ten guesses.
- **Delegated means per-caller, so results are not reproducible across
  technicians.** The same question asked by two operators with different
  Entra roles legitimately returns different answers. Record who ran a
  report on the report.
- **Licence-gated data returns empty rather than erroring.** PIM and
  some sign-in reporting need Entra ID P2; without it the field is
  simply absent, which reads as "nothing to see".
