# NetSuite Plugin

Claude Code plugin for Oracle NetSuite ERP — read-only at v1.

*Internal fast-track build, 2026-08-12 — not run through the standard
community PRD process.*

## Overview

This plugin gives Claude working knowledge of NetSuite so MSP technicians
and analysts can look up a client's ERP data without leaving the chat:

- **Records & Metadata** — Retrieve individual NetSuite records (customers,
  vendors, transactions, and any other type the connected role can reach)
  and discover a record type's available fields
- **Reports & Saved Searches** — Run existing NetSuite reports and saved
  searches, with the filter-lookup helpers (accounting books, accounting
  contexts, nexuses, subsidiaries) needed to scope them
- **SuiteQL Queries** — Run read-only SuiteQL queries against NetSuite data
  and discover queryable fields via SuiteQL metadata
- **API Patterns** — Auth model (OAuth 2.0 Client Credentials / JWT-bearer),
  per-tenant endpoints, and error handling for the NetSuite MCP surface

**This plugin is read-only by design.** The MCP Standard Tools SuiteApp
exposes 14 tools total; 2 of them (`ns_createRecord`, `ns_updateRecord`)
create or update NetSuite records. This plugin grants and documents only
the 12 read tools. See [GOVERNANCE.md](GOVERNANCE.md) for the full
reasoning, including how NetSuite's own role-based permissions — not just
this plugin's documentation — back the read-only posture.

## Prerequisites

**NetSuite setup for this plugin is heavier than a typical API-key
vendor.** Before Conduit can connect a client's NetSuite account, that
client's NetSuite administrator must complete real configuration inside
NetSuite:

1. Enable **Server SuiteScript**, **REST Web Services**, and OAuth 2.0
   (Setup > Company > Enable Features, SuiteCloud subtab)
2. Install the **MCP Standard Tools SuiteApp** (SuiteApps tab > search
   "MCP Standard Tools" > Install)
3. Create a dedicated custom role with the **MCP Server Connection**
   permission and **Log in using OAuth 2.0 Access Tokens** permission,
   granted **view-only** — no create/update/delete permissions on any
   record type. Do not use the Administrator role; NetSuite does not permit
   the Administrator role to be used for this kind of connection.
4. Create an Integration record with **Client Credentials Grant** enabled
   to obtain a **Client ID**
5. Generate/upload a certificate under Setup > Integration > OAuth 2.0
   Client Credentials Setup (mapping the integration user, the role from
   step 3, and the Integration record from step 4) to obtain a
   **Certificate ID** — keep the matching **PKCS8 private key** (PEM)

See [GOVERNANCE.md](GOVERNANCE.md), *Customer-side setup is heavier than a
typical API-key vendor*, for full detail and why step 3's view-only grant
is what actually makes this plugin's read-only posture hold.

### Connecting through Conduit

This plugin does not accept local credentials of any kind. Connect the
four values from the setup above once in the WYRE Conduit web UI
(**Connections → NetSuite**):

- NetSuite **Account ID**
- OAuth 2.0 **Client ID**
- **Certificate ID**
- **PKCS8 private key** (PEM)

Conduit stores them and mints/caches bearer tokens server-side per
organization.

There are **no environment variables and no headers to configure on the
client** — `.mcp.json` declares only the gateway URL:

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

## Installation

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install netsuite
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `records-and-metadata` | Retrieving individual NetSuite records and record-type field metadata |
| `reports-and-saved-searches` | Running reports and saved searches, plus their filter-lookup helpers |
| `suiteql-queries` | Read-only SuiteQL queries and SuiteQL field metadata |
| `api-patterns` | Auth model, per-tenant endpoints, and error handling |

## Available Commands

| Command | Description |
|---------|-------------|
| `/get-record` | Retrieve a NetSuite record by type and internal ID |
| `/query-records` | Run a read-only SuiteQL query |
| `/run-saved-search` | Run a saved search by name or ID |
| `/run-report` | List available reports, or run one by name or ID |

## Quick Start

### Retrieve a Record

```
/get-record customer 12345
```

### Run a SuiteQL Query

```
/query-records "SELECT id, entityid, companyname FROM customer WHERE isinactive = 'F'"
```

### Run a Saved Search

```
/run-saved-search "Open Sales Orders by Customer"
```

### Run a Report

```
/run-report "Balance Sheet"
```

## Security Considerations

- **Read-only here is backed by NetSuite's own RBAC, which is stronger than
  a client-side convention — but it is still only as good as how the
  client's NetSuite admin configured the integration role.** See
  [GOVERNANCE.md](GOVERNANCE.md) — this plugin does not inspect the
  connected role's actual permission grants after the fact.
- Never paste a NetSuite Client ID, Certificate ID, or private key into a
  technician's local environment, a `.env` file, or this repo. All four
  connect values are entered once, in Conduit's connect UI, and stored
  server-side.
- NetSuite is a client's financial system of record. Review who has access
  to the connected NetSuite account and its integration role regularly.

## Troubleshooting

### Authentication Errors

If a call fails with an authentication or permission error:
1. Confirm the Integration record's Client Credentials Grant is still
   enabled and the certificate mapped to it hasn't expired or been revoked
   in NetSuite (Setup > Integration > OAuth 2.0 Client Credentials Setup).
2. Confirm the connected role still carries **MCP Server Connection** and
   **Log in using OAuth 2.0 Access Tokens** — a role permission removed
   after initial setup breaks the connection silently from this plugin's
   point of view until the next call.
3. Re-connect NetSuite in Conduit (**Connections → NetSuite**) if the
   Account ID, Client ID, Certificate ID, or private key changed.

### Empty or Unexpected Results

1. Confirm the connected role actually has view access to the record type,
   report, or saved search being queried — NetSuite scopes visibility by
   role the same way it does in the UI, so a role without access to a
   record type returns nothing (or a permission error) rather than data
   from a different tenant.
2. Confirm the record, report, or saved search actually exists in that
   NetSuite account — this plugin cannot create any of them, so a missing
   record has to be created in the NetSuite UI first.

### Rate Limiting

If you see a rate-limit or throttling response:
1. Wait before retrying — NetSuite's SuiteTalk/REST platform enforces
   concurrency and request limits that vary by account tier; this plugin
   does not hardcode current thresholds. Consult
   [NetSuite's Web Services documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/) for the account's actual limits.
2. Reduce request frequency, and prefer targeted SuiteQL queries and
   bounded saved-search/report runs over broad unbounded pulls.

## API Documentation

- [MCP Standard Tools SuiteApp overview](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_143403258.html)
- [Installing the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023450.html)
- [Available Tools in the MCP Standard Tools SuiteApp](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/article_0902023508.html)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

This plugin shipped as an Aaron-approved internal fast-track build and did
not go through the standard community PRD process. Contributions that
extend it (including any future write-tool tier) should follow the normal
process and must update [GOVERNANCE.md](GOVERNANCE.md) accordingly.

## Changelog

### 0.1.0 (2026-08-12)

- Initial release — read-only at v1
- 4 skills: records-and-metadata, reports-and-saved-searches,
  suiteql-queries, api-patterns
- 4 commands: get-record, query-records, run-saved-search, run-report
