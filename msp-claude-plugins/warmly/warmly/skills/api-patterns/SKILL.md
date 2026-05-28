---
name: "Warmly API Patterns"
description: >
  Use this skill when working with the Warmly MCP tools - available tools,
  WorkOS AuthKit OAuth 2.0 + PKCE authentication, organization scoping,
  Streamable HTTP transport, credit usage, error handling, and best practices.
  Covers the official remote MCP server connection and all Warmly visitor
  intelligence tools.
when_to_use: "When working with available tools, authentication, organization scoping, transport, credits, error handling, and best practices in the Warmly MCP tools"
triggers:
  - warmly api
  - warmly mcp
  - warmly oauth
  - warmly authkit
  - warmly authentication
  - warmly request
  - warmly tools
  - warmly connection
  - warmly organization
  - warmly credits
  - warmly rate limit
  - warmly error
---

# Warmly MCP Tools & API Patterns

## Overview

Warmly hosts a remote MCP server at `https://opps-api.getwarmly.com/api/mcp` that exposes three read-only tools backed by Warmly's visitor identification platform. Authentication is OAuth 2.0 with PKCE, delegated to a WorkOS AuthKit tenant. Transport is MCP Streamable HTTP and the server is stateful — it issues an `Mcp-Session-Id` on `initialize` that must accompany subsequent requests.

Official docs: [docs.getwarmly.com/mcp](https://docs.getwarmly.com/mcp)

## Connection & Authentication

### MCP Server Endpoint

```
POST https://opps-api.getwarmly.com/api/mcp
Accept: application/json, text/event-stream
```

### OAuth 2.0 via WorkOS AuthKit

Warmly publishes RFC 9728 protected-resource metadata; the authorization server is a WorkOS AuthKit tenant:

```
GET https://opps-api.getwarmly.com/.well-known/oauth-protected-resource
→ authorization_servers: ["https://vigorous-paper-03.authkit.app"]
```

AuthKit's `.well-known/oauth-authorization-server` exposes:

- `authorization_endpoint`: `https://vigorous-paper-03.authkit.app/oauth2/authorize`
- `token_endpoint`: `https://vigorous-paper-03.authkit.app/oauth2/token`
- `registration_endpoint`: `https://vigorous-paper-03.authkit.app/oauth2/register` (Dynamic Client Registration supported)
- `code_challenge_methods_supported`: `["S256"]`
- `grant_types_supported`: `["authorization_code", "refresh_token"]`
- `token_endpoint_auth_methods_supported`: `["none", "client_secret_post", "client_secret_basic"]` — **public PKCE clients are supported**, so `client_secret` may be empty

Scopes used at the IdP: `openid profile email offline_access`. The MCP resource itself has `scopes_supported: []` — no resource-specific scopes are required, only a valid bearer token.

### Multi-Organization Scoping

For accounts with multiple Warmly organizations, every call must pin org context. Two equivalent transports:

- Header (preferred): `X-Warmly-Organization-Id: <uuid>`
- Query: `?organization_id=<uuid>` appended to the MCP URL

The WYRE MCP Gateway uses the header form so the org never leaks into proxy access logs. Single-organization tokens resolve their org server-side; the header is optional.

## Available Tools

All three tools are read-only synchronous calls and do not consume identification credits (a list call returns the same visitors that have already been identified — Warmly bills on identification, not retrieval).

### `list_warm_visitors`

Returns identified site visitors with full enrichment.

Per-visitor fields include:
- Visitor identifier and session(s)
- Company profile (name, domain, industry, employee count)
- Contact profile when available (name, title, email, LinkedIn)
- Pageviews and session timing
- CRM intersection (whether the visitor matches a CRM contact or account)

### `list_warm_accounts`

Visitor activity rolled up to the account/company level.

Per-account fields include:
- Company profile
- Aggregate visit/visitor counts
- First-seen / last-seen timestamps
- Engagement summary (page categories, depth)
- Top contacts identified at that account

### `get_credits_remaining`

Current month's identification credit balance. Useful for catching credit exhaustion before scaling outreach off Warmly data.

## Best Practices

- **Filter before iterating.** Both `list_warm_*` tools return all currently identified visitors/accounts for the period. For large workspaces, narrow by company domain, date window, or engagement threshold in your downstream code rather than asking the model to scan the full payload.
- **Pair with CRM tools.** Warmly's intersection signals tell you whether a visitor is already a known contact/account in your CRM. Combine with the HubSpot or PSA plugins to enrich identified accounts in-place rather than maintaining a separate Warmly list.
- **Watch credits before bulk workflows.** Call `get_credits_remaining` first if a workflow plans to drive prospecting volume off Warmly identifications — credit exhaustion silently stops new visitor enrichment but leaves previously identified visitors visible.
- **Treat as warm, not closed.** Visitor identification is probabilistic at the contact level. Treat `list_warm_visitors` contact data as the *highest-likelihood* identification for an account, not as a confirmed individual buyer signal.

## Error Handling

| Status | Meaning | Likely cause |
|---|---|---|
| 401 `invalid_token` | Missing or expired bearer token | Refresh the OAuth token; check `WWW-Authenticate: Bearer resource_metadata=...` for the auth server |
| 403 | Token valid, organization context wrong | Pass `X-Warmly-Organization-Id` for multi-org accounts, or verify the token's authorized org |
| 400 missing session | `Mcp-Session-Id` not sent | The server is stateful — every tool call must carry the session id issued on `initialize` |
| 5xx | Warmly platform error | Retry with backoff; persistent 5xx → contact Warmly support |

The WYRE MCP Gateway handles the initialize handshake, session id, and token refresh automatically — these are concerns only when connecting to Warmly's MCP directly.

## Rate Limits

Warmly has not published explicit MCP rate limits. The three tools are list reads, not write operations; sustained polling is unnecessary because identifications are batched server-side. A safe pattern is to call `list_warm_visitors` / `list_warm_accounts` no more than once per minute per workspace.
