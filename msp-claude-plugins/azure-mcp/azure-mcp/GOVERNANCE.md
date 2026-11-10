# azure-mcp plugin — governance and safety model

Unofficial. Community-built plugin wrapping Microsoft's official Azure
MCP Server. Not affiliated with, endorsed by, or sponsored by
Microsoft.

## What it connects as

This plugin does not hold credentials. It reaches Azure through the
WYRE Conduit gateway (`https://conduit.wyre.ai/v1/mcp`), which brokers
authentication centrally and scopes every call to the tenant the
operator is authorised for.

- No Azure tenant ID, client ID, or client secret is stored on the
  technician's machine, in this repo, or in the model's context. The
  service principal you register lives at the gateway.
- The org's Azure credential is stored once at the gateway, so
  replacing it is one edit rather than a change on every
  technician's machine. There is no rotate action, though — you
  re-submit the connect form, which overwrites the stored credential
  in place, and nothing tracks its age or prompts you. That matters more
  here than elsewhere: Azure client secrets expire on a fixed date, and
  Conduit will not warn you before one does.
- Every call carries operator identity, so the gateway audit log
  answers "who ran that KQL query". Azure's activity log records only
  the service principal.
- Removing someone from the organisation clears their per-vendor grants and revokes their gateway refresh tokens at once; a user deactivated in your identity provider is refused on their very next request.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Tool permission groups

Tools here are Azure MCP Server *namespaces*, not single operations — `monitor` runs a KQL query, `pricing` answers a rate lookup.

| Group | What it can do | Enforcement tier | Tools |
|---|---|---|---|
| **Read** | Cannot change any Azure resource. Safe for autonomous agents, subject to the data and cost notes below. | `read` for four; `admin` for the other five — see below | `subscription_list`, `group_list`, `group_resource_list`, `advisor`, `monitor`, `resourcehealth`, `applens`, `pricing`, `quota` |
| **Write** | *Empty.* No tool in this connector creates or modifies an Azure resource. | — | — |
| **Delete** | *Empty.* | — | — |
| **Admin** | *Empty by classification* — but see below: five read tools currently enforce at `admin` because Conduit has no entry for them. | — | — |

**This plugin is read-only, and that is enforced in two independent
places.** The gateway runs the Azure MCP Server with the `--read-only`
flag, and it applies a namespace allowlist that admits only the eight
observability, cost, and inventory namespaces. Write- and
delete-capable namespaces (`storage`, `keyvault`, `compute`, `role`,
`aks`, and others) are not enabled, so even an over-privileged service
principal has no mutating call to route.

For an MSP assessing agent risk, this is the strongest statement in
the batch: nothing this connector does can change a customer's Azure
infrastructure. A mistake produces a wrong answer or a wasted query,
never an outage.

### What Conduit actually classifies

So **a `read` grant on this vendor reaches inventory and Advisor, and nothing else.** Health triage and cost review need `admin`.

Two of those five deserve a second look before anyone "fixes" this by
classifying them all at `read`:

- **`monitor` runs arbitrary KQL** against whatever a customer ingested into Log Analytics. It arrives at `admin` today by accident, but that is where the convention would put it deliberately.
- **`applens` diagnostic output can surface connection strings.** Same
  reasoning.

`pricing`, `quota`, and `resourcehealth` are ordinary reads and belong at
`read`. Classifying them is a privilege *reduction*: it moves them down from
`admin`.

### There is no write surface to grant, and no delete row to misread

Nothing here for a `write` grant to admit.

They cannot express "Priya may query Log Analytics, the overnight agent may not." Only a Conduit grant can, and only at the granularity above.

## Recommended agent policy

The safe default for most plugins is "read autonomously, propose
writes". Here there are no writes to propose, so:

- Read tools: allow, including for scheduled and unattended agents. Health triage, Advisor review, quota headroom checks, and inventory reporting are all safe to automate — but note that a bare `read` grant reaches only four of the nine tools today.
- **Withhold `monitor` from unattended agents specifically**, whatever tier it settles at.
- The two controls worth applying anyway are on **data** and **cost**,
  not on state changes — see below.
- When a user asks for a write, provision, restart, or quota increase,
  the correct response is to say it is out of scope and hand off. Do
  not look for a workaround through another namespace.

## What it cannot reach

- Only the Azure subscriptions where the registered service principal
  holds a role assignment. A "missing" subscription is almost always a
  missing Reader assignment, not a deleted subscription.
- Only Azure Resource Manager. **Microsoft 365, Exchange, SharePoint,
  and Entra ID directory objects are not reachable here** — that is a
  different API surface entirely, and the most common misconception
  about this connector.
- No filesystem, no shell, no other vendor's data.
- No ability to raise a quota, apply an Advisor recommendation,
  acknowledge an alert, or restart a resource.

## Data handling

- Responses pass through the gateway into model context for the
  session and are not persisted by this plugin.
- **Read-only in the ARM sense is not read-limited in the data
  sense.** The `monitor` namespace runs arbitrary KQL against Log
  Analytics workspaces, and a workspace contains whatever the customer
  ingested into it — application traces, request bodies, sign-in logs,
  security events. This is by far the most sensitive capability here,
  and the one to restrict if agents run unattended. Scope queries with
  a time bound and an explicit column projection rather than
  `SELECT *`-style pulls.
- `applens` diagnostic output can include connection strings and
  resource identifiers surfaced in dependency failures.
- `pricing` and `quota` are commercial and capacity data. Harmless
  individually; a full inventory plus cost profile is a useful
  document for someone targeting the customer.

## Known sharp edges

- **A read can still cost money.** An unbounded KQL query over a large
  workspace is billed on data scanned and can run for a long time.
  "Read-only" is not "free" — an agent looping broad queries across
  subscriptions produces a real line item.
- **Retail price is not the customer's price.** The `pricing` namespace
  returns public list rates. It knows nothing about EA/CSP discounts,
  reservations, or actual consumption. An agent that presents a retail
  estimate as "your Azure bill" has produced a commercially wrong
  answer that reads as authoritative.
- **Advisor lags reality.** Recommendations refresh periodically, not
  in real time, so a recommendation may reference a change made hours
  ago or a resource already remediated.
- **The connector fails all at once when the secret expires.** Azure
  client secrets have a hard expiry. The symptom is every tool
  returning authorization errors or empty results simultaneously,
  which reads like a permissions regression rather than a lapsed
  credential.
- **Empty results are ambiguous.** An empty subscription or resource
  list can mean "nothing there" or "no role assignment at that scope".
  These are not the same finding, and an agent reporting "the customer
  has no resources" from an RBAC gap is reporting a falsehood.
