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
- Removing someone from the organisation clears their per-vendor grants
  and revokes their gateway refresh tokens at once; a user deactivated
  in your identity provider is refused on their very next request. A
  user only removed from the org keeps an already-issued access token
  for up to an hour, but it reaches only a personal Graph connection
  made with their own key — never the org's. See
  `wyre-gateway/GOVERNANCE.md`.

- Separately, a Global Administrator in **each customer tenant** must
  grant admin consent out of band before that tenant returns any data.
  Consent is per tenant and revocable by the customer at any time, from
  their side, without involving you.

## Tool permission groups

Conduit's access editor presents four groups. This vendor fills two of
them, and not the two you would guess from "read-only".

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Describes the Graph query surface. Reaches no customer tenant and returns no tenant data. | `read` | `microsoft_graph_suggest_queries`, `microsoft_graph_list_properties` |
| **Write** | *Empty.* | — | None. |
| **Delete** | *Empty.* | — | None. |
| **Admin** | Issues an arbitrary `GET` against any Microsoft Graph endpoint the caller's roles and the consented scopes allow. | `admin` | `microsoft_graph_get` |

**`microsoft_graph_get` is a read-only tool pinned to `admin`, and that
is the single most instructive fact in this document.** Conduit
classifies it `isWrite: false, isAdmin: true`
(`src/proxy/result-cache.ts:1043`), and `isAdmin` outranks `isWrite`
(`src/access/tool-classification.ts:33-38`), so it requires the highest
tier Conduit has despite mutating nothing.

The reason is a property of the enforcement model, not a judgement
about Graph. Conduit's tier check matches on **tool name only** — the
gate input carries `identity`, `vendorSlug`, and `toolName` and has no
`arguments` field at all (`src/proxy/tool-call-enforcement.ts:69-79`).
For `microsoft_graph_get` the blast radius is chosen entirely by the
arguments: one call returns the room list, the next returns every
sign-in record for a named director. A name-matching gate cannot tell
those apart, so the tool is pinned where the worst argument belongs.
This is the same rule that pins `autotask_raw_request` and
`cwautomate_scripts_execute` to `admin`, applied to a tool that only
reads.

The lesson generalises past this plugin: **"read" and "safe" are
different questions.** Conduit's tiers answer the first one — can this
call change vendor state — and nothing in the model answers the second.
A tool that reads a customer's entire directory is tier `read` on most
vendors; the fact that this one is not is an accident of it being a
passthrough, not evidence that Conduit is grading disclosure.

**The practical consequence: an agent restricted to tier `read` cannot
use this plugin for anything.** The two read tools describe the query
surface; they return no tenant data. Every question this plugin exists
to answer goes through `microsoft_graph_get`, which needs `admin`.
Granting `write` changes nothing at all here — there is no write tool
and no delete tool to admit — so the only meaningful settings are
`read` (effectively off) and `admin` (everything).

A granular per-tool grant whose `customTools` is exactly
`["microsoft_graph_get"]` still compiles to stored tier `admin`, because
the compiled tier is the highest any checked tool requires
(`src/access/tier-group-mapping.ts`, `selectionToGrant`). On a
three-tool vendor that narrowing buys nothing; on a vendor where the
same operator also holds `admin` for other reasons, it is the difference
between a scoped grant and a blanket one.

It remains true that **nothing here can write.** The server exposes
three tools, the only one that reaches a tenant issues HTTP `GET`, and
there is no parameter that turns a read into a write. If an operator
asks for a change, route to a write-capable plugin — `m365` for one
tenant, `cipp` for the fleet — rather than looking for a way to do it
here.

## Recommended agent policy

The safe default is **allow the two read tools freely; treat the
`admin` grant that `microsoft_graph_get` requires as a deliberate
decision, not a formality.**

- Read tools (`suggest_queries`, `list_properties`): allow. They
  describe the query surface and disclose nothing about a tenant.
- `microsoft_graph_get`: the grant is `admin`, so make it on purpose.
  Unattended audits, scheduled reporting, and cross-tenant
  question-answering are the intended use and the read-only ceiling
  makes them safe *from a damage standpoint* — but you are handing the
  agent every Graph read the caller's Entra roles permit, which is a
  disclosure decision. Scope it at Entra, where the boundary is real.
- Write and delete tools: none exist, so there is nothing to withhold.

Conduit will not ask a human before any of this. It compares tiers — it
has no approval step, no per-call confirmation, and no interactive
prompt. Any "check with me first" rule lives in your agent
configuration and is only as good as that configuration.

The residual risk here is not damage — it is **disclosure and wrong
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
