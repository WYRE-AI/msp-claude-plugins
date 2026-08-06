# Microsoft Graph Plugin

Claude plugins for the **Microsoft Graph MCP Server for Enterprise** — Microsoft's hosted MCP server (currently in **public preview**) that lets MSPs query a client's Microsoft Entra (Azure AD) identity and directory data in natural language.

This plugin orients Claude around the `microsoft-graph` vendor on the [Wyre MCP Gateway](https://conduit.wyre.ai). The Graph Enterprise MCP server exposes a small, deliberate tool surface designed for a Retrieval-Augmented-Generation (RAG) query workflow rather than raw API access. Skills and agents in this plugin embed that workflow so Claude answers identity and directory questions correctly instead of inventing Graph endpoints.

> **Public preview.** The Microsoft Graph MCP Server for Enterprise is a Microsoft preview service hosted at `https://mcp.svc.cloud.microsoft/enterprise`. Behavior, the example catalog, and available scopes may change before general availability. Treat output as advisory and verify anything material in the Entra admin center.

## What's in this plugin

### The three tools

The Graph Enterprise MCP server exposes exactly three tools — no more:

| Tool | What it does |
|------|--------------|
| `microsoft_graph_suggest_queries` | RAG search over a curated catalog of Microsoft Graph API examples. Given a natural-language intent, it returns candidate Graph API calls that best match. **This is the entry point for almost every task.** |
| `microsoft_graph_get` | Executes a **read-only** Microsoft Graph API call. Honors the caller's Entra roles, the scopes granted to the connecting app, and Graph throttling. |
| `microsoft_graph_list_properties` | Returns the schema for a Graph entity (e.g. `user`, `group`, `application`) — available properties and relationships — so the model knows what it can request before constructing a call. |

### Skills (2)

| Skill | Covers |
|-------|--------|
| `microsoft-graph-connection` | Connecting `microsoft-graph` through the Wyre gateway, the BYOC Entra app registration, and the out-of-band per-tenant admin consent requirement |
| `microsoft-graph-querying` | The `suggest_queries → select → get` RAG workflow with worked examples |

### Agents (1)

- **`entra-reporting-analyst`** — a read-only Entra reporting / IT-helpdesk analyst that drives the suggest→select→get loop, answers identity and directory questions, and translates raw Graph JSON into plain-language answers for non-technical readers.

### Commands (2)

- **`/microsoft-graph:entra-audit`** — runs a set of identity hygiene checks (inactive accounts, admins without MFA registered, unassigned licenses, guest inventory)
- **`/microsoft-graph:entra-report`** — conversational directory reporting (license usage, user/group counts, app inventory) for client check-ins and QBRs

## What it can and cannot do

**Can:** read users, groups, applications, service principals, devices, directory roles, license/subscription data, and admin reporting (sign-in activity, registration details) from a client's Entra tenant — in natural language, scoped to whatever the connecting app and caller are permitted to see.

**Cannot:** write, modify, or delete anything. The Graph Enterprise MCP server is **read-only by design** — `microsoft_graph_get` is the only execution tool and it issues `GET` requests. For changes, use a write-capable tool such as the `cipp` plugin.

## How to connect

The Graph Enterprise MCP server is reached through the Wyre MCP Gateway as the `microsoft-graph` vendor.

1. In the gateway connection UI, connect the **`microsoft-graph`** vendor.
2. This uses **BYOC (bring-your-own-credentials) Entra OAuth** — each MSP registers its own multi-tenant Entra app (a confidential client) and supplies `tenantId`, `clientId`, and `clientSecret`.
3. **Critical:** the `MCP.*` delegated permissions the server needs require **per-tenant admin consent granted out of band**. The OAuth connect flow alone is *not* enough — a Global Administrator in each customer tenant must grant admin consent before the connection will return data for that tenant.

The `microsoft-graph-connection` skill documents the full app-registration and admin-consent procedure step by step. Read it before connecting — the admin-consent step is the single most common thing that trips MSPs up.

- **Rate limit:** 100 calls/min/user (in addition to standard Microsoft Graph service throttling).
- **Licensing:** no extra license cost for the MCP server itself, but the caller still needs appropriate licenses for the data they access (e.g. Microsoft Entra ID P2 for Privileged Identity Management data).

## Resources

- Wyre MCP Gateway: https://conduit.wyre.ai
- Microsoft Graph documentation: https://learn.microsoft.com/graph
- Microsoft Entra app registration: https://learn.microsoft.com/entra/identity-platform/quickstart-register-app
