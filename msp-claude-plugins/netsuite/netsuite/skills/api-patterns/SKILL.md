---
name: "NetSuite API Patterns"
description: >
  NetSuite MCP fundamentals for this plugin: OAuth 2.0 Client Credentials
  (JWT-bearer) machine-to-machine auth brokered through Conduit, the
  per-tenant vendor-hosted MCP endpoint model, generic error handling, and
  how NetSuite's own role-based permissions — not this plugin — enforce the
  read-only posture.
when_to_use: >-
  When authenticating to NetSuite, reasoning about the connected role's
  permissions, or debugging errors from the NetSuite MCP server. Use when:
  netsuite api, netsuite auth, netsuite authentication, netsuite oauth,
  netsuite role, netsuite permission, netsuite integration record, or
  netsuite error.
---

# NetSuite API Patterns

## Overview

NetSuite is reached here through the **MCP Standard Tools SuiteApp**,
which each NetSuite customer installs into their own account, via the
WYRE Conduit gateway. This skill covers the mechanics that aren't
guessable from the tool names: how auth is brokered, why this is
per-tenant infrastructure rather than a shared endpoint, and how
NetSuite's own permission model actually enforces this plugin's read-only
posture.

## Anti-triggers

- **What a specific tool does or which record/report/search it covers** —
  use `records-and-metadata`, `reports-and-saved-searches`, or
  `suiteql-queries`.
- **Why this plugin excludes `ns_createRecord` and `ns_updateRecord`** —
  that's a governance question, not an API-mechanics one; see
  [GOVERNANCE.md](../../GOVERNANCE.md).

## Connection & Authentication

This plugin does not accept a local NetSuite credential. NetSuite auth is
**OAuth 2.0 Client Credentials Grant using a JWT-bearer client
assertion** — machine-to-machine, with no browser redirect or user-consent
screen at any point. The operator connects four values once, in Conduit's
connect UI (**Connections → NetSuite**): NetSuite **Account ID**, OAuth 2.0
**Client ID**, **Certificate ID**, and the **PKCS8 private key** (PEM).
Conduit uses these to sign a JWT assertion and mint (and cache) a bearer
token server-side per organization — the same `bearerTokenCache` pattern
Conduit already uses for HaloPSA.

This plugin's `.mcp.json` declares no headers and no environment
variables — there is nothing to configure on the client:

```json
{
  "mcpServers": {
    "netsuite": {
      "type": "http",
      "url": "https://conduit.wyre.ai/v1/netsuite/mcp"
    }
  }
}
```

## Per-Tenant, Vendor-Hosted MCP

Unlike a shared hosted MCP server, **each NetSuite customer runs their own
MCP endpoint**, at an account-specific URL:

- MCP endpoint: `https://<accountId>.suitetalk.api.netsuite.com/services/mcp/v1/suiteapp/com.netsuite.mcpstandardtools`
- Token endpoint: `https://<accountId>.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`

Both are resolved by Conduit server-side per organization; this plugin's
`.mcp.json` still just points at Conduit's fixed gateway URL, the same
broker pattern as every other Conduit vendor. Practically, this means a
connection issue for one client's NetSuite account (expired certificate,
role permission changed, SuiteApp not yet installed or updated) says
nothing about any other client's connection.

## How the Read-Only Posture Actually Holds

NetSuite's own MCP Standard Tools SuiteApp "uses the same access controls
as the NetSuite UI" — access to every tool, record type, report, and
saved search is governed by the NetSuite role assigned to the connected
integration user. The setup instructions for this plugin call for that
role to be provisioned **view-only**: no create/update/delete permissions
on any record type. If that instruction was followed, NetSuite itself
refuses `ns_createRecord` / `ns_updateRecord` calls at the platform level
— before the request ever reaches Conduit or this plugin.

**This is a stronger mechanism than PostHog's key-scope convention**
(PostHog's read-only posture depends on a personal API key being scoped
to read-only resources at creation, which PostHog's own API enforces but
which is otherwise identical in shape — an operator-configured setting
this plugin cannot verify after the fact). See
[GOVERNANCE.md](../../GOVERNANCE.md), *How read-only is actually enforced
here*, for the full comparison and the honest caveat: this plugin has no
way to confirm the connected role was actually provisioned view-only.

## Error Handling

| Situation | Meaning | Action |
|------|---------|--------|
| `invalid_client` / `invalid_grant` / `unauthorized_client` at token mint | The Client ID, Certificate ID, or private key mapping is wrong, or the certificate expired | Reconnect in Conduit with current values; confirm the Integration record's Client Credentials Grant is still enabled |
| Permission denied on a tool or record type | The connected role doesn't have view access to that record type, report, or saved search | This is enforced by NetSuite itself — request the client's NetSuite admin grant view access on the dedicated role if the lookup is legitimately needed |
| Tool not visible / not callable | Tools are only exposed if the connected role has all required permissions for that tool | Confirm the role carries **MCP Server Connection** and **Log in using OAuth 2.0 Access Tokens** |
| Empty results, no error | The connected role can't see the record/report/search, or it genuinely doesn't exist | Distinguish the two — NetSuite scopes visibility by role the same way the UI does, so absence of an error doesn't mean absence of data |

## Rate Limiting

This plugin does not hardcode NetSuite's concurrency or request-rate
limits — they vary by account tier and are not part of the confirmed
facts behind this plugin. Consult
[NetSuite's Web Services documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/) for
the connected account's actual limits. Prefer targeted SuiteQL queries and
bounded report/saved-search runs over broad unbounded pulls, which are the
fastest way to hit a limit during a sweep across multiple clients.

## Gotchas

- **Read-only here depends on the connected role's NetSuite permissions,
  not on anything this plugin checks.** See
  [GOVERNANCE.md](../../GOVERNANCE.md), *Open enforcement gap*.
- **`netsuite` is not yet classified in Conduit's `VENDOR_TOOL_CONFIG`.**
  Until it is, there is no coarse `read` tier grant that admits only this
  plugin's read families — access has to go through the gateway allowlist.
  See [GOVERNANCE.md](../../GOVERNANCE.md), *Tool permission tiers*.
- **Every client's NetSuite account is a fully separate MCP endpoint.**
  There is no cross-account behavior to reason about — a tool call always
  targets exactly the one account Conduit resolved for that connection.

## Related Skills

- [Records & Metadata](../records-and-metadata/SKILL.md) — Record retrieval and record-type field metadata
- [Reports & Saved Searches](../reports-and-saved-searches/SKILL.md) — Report and saved-search execution
- [SuiteQL Queries](../suiteql-queries/SKILL.md) — Ad-hoc read-only queries
