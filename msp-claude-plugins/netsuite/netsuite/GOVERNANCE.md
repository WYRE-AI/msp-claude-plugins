# NetSuite plugin — governance and safety model

Unofficial. Community-built plugin for the Oracle NetSuite ERP platform.
Not affiliated with, endorsed by, or sponsored by Oracle or NetSuite.

## What it connects as

This plugin does not hold credentials. It reaches NetSuite through the WYRE
Conduit gateway (`https://conduit.wyre.ai/v1/netsuite/mcp`), which brokers
authentication centrally, per NetSuite account.

- **NetSuite is per-tenant, vendor-hosted MCP — not a central hosted
  endpoint.** Unlike PostHog (one shared PostHog-operated MCP server for
  every customer), each NetSuite customer's own NetSuite account runs its
  own MCP endpoint via the installed **MCP Standard Tools SuiteApp**:
  `https://<accountId>.suitetalk.api.netsuite.com/services/mcp/v1/suiteapp/com.netsuite.mcpstandardtools`.
  Conduit resolves the correct per-tenant endpoint server-side; this
  plugin's `.mcp.json` still just points at Conduit's own fixed gateway
  URL, the same broker pattern as every other Conduit vendor.
- **Auth is machine-to-machine, not interactive.** NetSuite is connected
  via **OAuth 2.0 Client Credentials Grant with a JWT-bearer client
  assertion** — no browser redirect or user-consent screen ever happens.
  Conduit mints and caches the bearer token server-side per organization
  (via a `bearerTokenCache`), the same way it already does for HaloPSA. The
  token is obtained from
  `https://<accountId>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`,
  again resolved per-tenant by Conduit.
- No NetSuite credential — not the Client ID, not the Certificate ID, not
  the private key — is stored on the technician's machine, in this repo, or
  in the model's context. All four are entered once in Conduit's connect
  page and used server-side to mint tokens; this plugin's `.mcp.json`
  declares no headers and no environment variables for the client to set.
- The org's NetSuite credential is stored once at the gateway, so replacing
  it (e.g. after a certificate rotation) is one edit rather than a change on
  every technician's machine.
- Every call carries operator identity, so the gateway audit log answers
  "who pulled this record." NetSuite's own system notes/audit trail
  attributes API activity to the integration role's user, which is fine for
  a single dedicated integration user but says nothing about which agent or
  session made the call.
- Removing someone from the organisation clears their per-vendor grants and revokes their gateway refresh tokens at once; a user deactivated in your identity provider is refused on their very next request.

## Customer-side setup is heavier than a typical API-key vendor

Before Conduit can connect a given client's NetSuite account, that client's
NetSuite administrator has to do real configuration work inside NetSuite —
this is not a "paste an API key" integration:

1. Enable **Server SuiteScript**, **REST Web Services**, and the OAuth 2.0
   feature (Setup > Company > Enable Features, SuiteCloud subtab).
2. Install the **MCP Standard Tools SuiteApp** (SuiteApps tab > search "MCP
   Standard Tools" > Install).
3. Create a dedicated custom role carrying the **MCP Server Connection**
   permission and the **Log in using OAuth 2.0 Access Tokens** permission
   (Setup subtab on the role record) — **view-only**, per this plugin's
   read-only decision (see *Tool permission tiers* below). Oracle
   explicitly disallows using the Administrator role for this connection.
4. Create an Integration record with **Client Credentials Grant** enabled,
   which yields an OAuth 2.0 **Client ID**.
5. Generate or upload a certificate under Setup > Integration > OAuth 2.0
   Client Credentials Setup, mapping Entity (the dedicated integration
   user) + Role (the custom role from step 3) + Application (the
   integration record from step 4) + Certificate, which yields a
   **Certificate ID** — keeping the matching **PKCS8 private key** (PEM).

Conduit's connect step for this plugin needs exactly four values, matching
its `netsuite` vendor-config fields: **NetSuite Account ID**, **OAuth 2.0
Client ID**, **Certificate ID**, and the **PKCS8 private key (PEM)**. There
is no fifth field and no simpler path — a NetSuite admin who has not done
steps 1-5 above cannot be connected through this plugin.

## Tool permission tiers

Until `netsuite` is classified > there, the grouping below carries no tier-enforcement meaning at all on > the Conduit side — a `read` or `write` grant on this vendor admits > nothing, and an `admin` grant admits every tool the upstream MCP server > exposes, including the two write tools this plugin deliberately does not > document or recommend. Classifying a vendor is always a privilege *reduction*, > never an expansion. Configure the allowlist when connecting this > plugin — an `admin` grant with no allowlist restores the full upstream > surface, including the two write tools this document excludes.

The **MCP Standard Tools SuiteApp** exposes a confirmed catalog of 14
tools, documented by Oracle at
[Available Tools in the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023508.html).
Twelve are read tools; two — `ns_createRecord` and `ns_updateRecord` — are
write tools that create or modify NetSuite records.

**This plugin ships read-only at v1 by explicit decision (Aaron/founder
sign-off, 2026-08-12) — adopted alongside PostHog in the same review.**
NetSuite's write surface is much smaller than PostHog's (2 tools, not
200+), but the two write tools reach the same category of hazard: creating
or updating a financial/ERP record (a customer, vendor, invoice, sales
order, journal entry — whatever the connected role can reach) is a real,
often hard-to-cleanly-reverse change to a client's books of record, made
under the operator's or agent's identity with no built-in dry run.

| Tier | What it can do | Tools |
|---|---|---|
| **Read** | Cannot change NetSuite state. The only tier this plugin grants, documents, or recommends. | See the family table below. |
| **Write** | **Not shipped in v1.** Creates or updates NetSuite records. | `ns_createRecord`, `ns_updateRecord` — deliberately excluded. Not granted, not documented per-call, not part of any bundled command or skill. |

### How read-only is actually enforced here — and how it differs from PostHog

**This is a fundamentally different mechanism than PostHog's, and it is
stronger.** PostHog's read-only posture depends on the *customer*
voluntarily scoping their personal API key to read-only `resource:action`
pairs at key-creation time — an honor-system convention Conduit cannot
verify. NetSuite's read-only posture instead rests on **NetSuite's own
native RBAC**, enforced by the NetSuite platform itself, not by this
plugin or by Conduit:

- The custom role created in step 3 above (commonly named something like
  "MCP Server Connection" role) can be granted **view-only** permissions on
  every record type it touches, with no create/update/delete grants at
  all.
- If the connecting integration role has no write permission on a record
  type, NetSuite itself refuses `ns_createRecord` / `ns_updateRecord` calls
  against that type **at the platform level** — the SuiteApp's own docs
  state it "uses the same access controls as the NetSuite UI, so you can
  only see data and take actions allowed by your assigned roles." That
  refusal happens inside NetSuite, before any response reaches Conduit or
  this plugin.
- `ns_runCustomSuiteQL` is documented by Oracle as accepting **read-only
  queries only** — it is not a general SQL-execution tool, so it cannot be
  used to work around the role's write restriction even by an operator who
  wanted to.

**This plugin does not verify that the connecting admin actually
provisioned a view-only role — that is a setup instruction, not something
Conduit or this plugin inspects after the fact.** Say this plainly: if the
client's NetSuite admin instead grants the dedicated role full CRUD
permissions on some or all record types (a role misconfiguration, or a
shortcut taken during setup), NetSuite itself will honor
`ns_createRecord` / `ns_updateRecord` calls against those types, and this
plugin's "read-only" framing becomes aspirational documentation, not an
enforced boundary — exactly the same shape of gap PostHog's GOVERNANCE.md
describes for its own key-scoping convention, just enforced by NetSuite
role permissions instead of PostHog API key scopes. See *Open enforcement
gap* below.

### The read-only tool families this plugin grants

| Family | Read tools |
|---|---|
| Records | `ns_getRecord`, `ns_getRecordTypeMetadata` (`ns_createRecord`, `ns_updateRecord` excluded — see above) |
| Reports | `ns_listAllReports`, `ns_runReport`, plus filter-lookup helpers `ns_getAccountingBooks`, `ns_getAccountingContexts`, `ns_getNexusIds`, `ns_getSubsidiaries` |
| Saved Searches | `ns_listSavedSearches`, `ns_runSavedSearch` |
| SuiteQL | `ns_runCustomSuiteQL` (read-only queries only, per Oracle's own documentation), `ns_getSuiteQLMetadata` |

This is the complete 12-tool read surface Oracle documents for the MCP
Standard Tools SuiteApp as of this writing — not a subset. The full
14-tool catalog (including the 2 excluded write tools) is documented at
the Oracle link above.

The read-only posture above is a combination of (1) the connected role's NetSuite permissions and (2) the gateway allowlist; nothing in Conduit stops a misconfigured role or grant from reaching a write tool if either of those is set up wrong.

## Recommended agent policy

Because this plugin ships no write surface, **read tools are safe to grant
to autonomous and scheduled agents** — record lookups, saved-search runs,
report pulls, and SuiteQL queries are the intended unattended use. Grant
them through the gateway allowlist naming the read families above; do not
grant `admin` on this vendor, because `admin` reaches the full upstream
surface including `ns_createRecord` and `ns_updateRecord`.

There is no write tier to propose-then-approve here, unlike Xero or
Freshdesk. If a future version of this plugin adds write tools, that
version needs its own agent-policy section — do not assume the read-only
recommendation above still holds once this document is updated to grant a
write tier.

## What it cannot reach

- Only the NetSuite account the connected Integration record and role
  belong to. NetSuite accounts are fully separate tenants; there is no
  cross-account visibility through this plugin.
- Only the record types, fields, reports, and saved searches the connected
  role's NetSuite permissions actually cover — **if the role was granted
  broader visibility than intended, this plugin surfaces whatever that role
  can see, not a narrower plugin-defined subset.** See *How read-only is
  actually enforced here* above.
- No write path of any kind, in the tools this plugin grants or documents —
  see *Tool permission tiers*.
- No filesystem, no shell, no other vendor's data.
- No SuiteScript execution, no workflow or script deployment, and nothing
  outside the confirmed 12-tool read surface above — this plugin's skills
  and commands are built only against tools Oracle documents as existing
  today.

## Data handling

Responses pass through the gateway into model context for the session and
are not persisted by this plugin.

- **Financial and ERP data by definition.** NetSuite is a client's books of
  record — customers, vendors, transactions, invoices, journal entries,
  and financial reports are exactly the kind of commercially sensitive data
  this plugin can surface. Treat every record, report, and SuiteQL result
  as sensitive by default.
- **SuiteQL query results depend entirely on what the connected role can
  see and what the query asks for.** A broadly-scoped role plus a broad
  query can return far more than the question needed; prefer targeted
  queries and bounded result sets.
- **Saved searches and reports may already carry PII** — customer contact
  details, employee data on HR-adjacent record types, and similar —
  depending on what the client's own NetSuite configuration exposes. This
  plugin has no way to know in advance whether a given account's data is
  PII-clean.

Restrict the record, report, and SuiteQL tools specifically if agents run
unattended or render output where anyone outside the client's own team
could see it.

Confirm the live permission grant in the gateway access editor before you rely on a tier in this document. This note does not describe gateway enforcement internals.

## Known sharp edges

- **This is per-tenant, vendor-hosted MCP, not a shared hosted endpoint.**
  Every client's NetSuite account runs its own MCP Standard Tools SuiteApp
  instance at its own account-specific URL. A connection problem for one
  client (expired certificate, role permission change, SuiteApp not
  updated) does not imply anything about any other client's connection —
  each is independent.
- **The MCP Standard Tools SuiteApp is Oracle-managed and auto-updates.**
  Oracle's own documentation notes updates may change how tools operate.
  The 12-tool read surface and 2-tool write surface documented here are
  accurate as of this plugin's build (2026-08-12, against Oracle's
  published tool list) and should be reconfirmed against a live connection
  if Oracle ships a SuiteApp update that changes the catalog.
- **A misconfigured role is the single biggest risk in this integration,** more than for a typical API-key vendor, because the "read-only" promise depends entirely on a NetSuite admin doing five setup steps correctly (see *Customer-side setup* above) rather than on a single field like an API key's scope.
- **`ns_runCustomSuiteQL` is documented as read-only-queries-only by
  Oracle**, but this plugin does not independently verify that constraint
  — it is stated in Oracle's own documentation, not something this plugin
  or Conduit tests against.
- Classifying the vendor, when it happens, is what turns the family table above into an actual `read` tier.
