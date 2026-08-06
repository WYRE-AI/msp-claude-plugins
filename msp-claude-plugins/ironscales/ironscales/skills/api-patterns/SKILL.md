---
name: "IRONSCALES API Patterns"
description: >
  Ironscales MCP fundamentals: API-key plus company-ID header authentication and
  the per-tenant scoping that follows from it, the nine tools this server
  registers and what each one actually changes, offset/limit pagination without
  a total count, rate-limit behavior, and how API failures surface to the model.
when_to_use: >-
  When authenticating to the Ironscales MCP server, paging through its results, or
  diagnosing an API error. Use when: ironscales, ironscales api,
  ironscales mcp, ironscales tools, ironscales authentication, ironscales pagination, ironscales
  error, or ironscales connection.
---

# Ironscales MCP Tools & API Patterns

## Overview

The Ironscales MCP server provides AI tool integration with the Ironscales
anti-phishing platform. It exposes tools for listing and investigating
phishing incidents, asking Ironscales' AI to classify a raw email, taking
remediation actions against delivered mail, managing sender allowlists, and
reading company-wide phishing statistics. Authentication uses an API key and
company ID passed as request headers.

## Connection & Authentication

### API Key + Company ID

Ironscales uses a static API key combined with a company ID for
authentication. The MCP Gateway injects these via headers on every upstream
call to `https://appapi.ironscales.com`:

| Header | Description |
|--------|-------------|
| `X-IronScales-API-Key` | Your Ironscales API key |
| `X-IronScales-Company-ID` | Your Ironscales company (tenant) ID |

Generate credentials at: **Ironscales Platform > Settings > API**

**Environment Variables (self-hosted):**

```bash
export IRONSCALES_API_KEY="your-api-key"
export IRONSCALES_COMPANY_ID="your-company-id"
```

The Company ID scopes all API requests to a specific tenant. MSPs managing
multiple clients require a separate API key and company ID per client. There
is no cross-tenant query.

Requests carry a 30-second timeout.

## Available MCP Tools

This server registers nine tools and no others. Anything not in these tables
does not exist.

### Navigation

The server uses progressive disclosure: it advertises the navigation tools
first, and the domain tools become visible once you navigate.

| Tool | Description |
|------|-------------|
| `ironscales_navigate` | Move to a domain: `incidents`, `email`, `remediation`, `stats`, `allowlist` |
| `ironscales_status` | Check API connection status and list available domains |
| `ironscales_back` | Return to the domain navigation menu |

### Incidents

| Tool | Description |
|------|-------------|
| `ironscales_incidents_list` | List phishing incidents, filtered by `status` and/or `severity` |
| `ironscales_incidents_get` | Get one incident in full by `incident_id` |

### Email Classification

| Tool | Description |
|------|-------------|
| `ironscales_email_classify` | Submit a **raw email** to Ironscales AI and get a verdict back. Stateless — see below |

### Remediation

| Tool | Description |
|------|-------------|
| `ironscales_remediation_act` | Take one of five remediation actions against an incident's mail |

### Statistics & Reporting

| Tool | Description |
|------|-------------|
| `ironscales_stats_company` | Company-wide phishing statistics for a `period` of `7d`/`30d`/`90d`/`1y` |

### Allowlist Management

| Tool | Description |
|------|-------------|
| `ironscales_allowlist_manage` | `add`, `remove`, or `list` allowlist entries typed `email`/`domain`/`ip` |

### The one tool whose name misleads

`ironscales_email_classify` does not classify an incident. It POSTs a raw
email you assemble (`sender` required; subject, bodies, headers, URLs, and
attachment metadata optional) to `/api/v1/email/classify` and returns a
verdict. It takes no incident ID, writes nothing, and changes no state. The
only tool on this server that changes incident state is
`ironscales_remediation_act`.

## Pagination

`ironscales_incidents_list` uses offset-based pagination.

- Pass `offset` (default `0`) and `limit` (default `50`, max `100`).
- **The tool response does not carry a total count.** The server unwraps the
  vendor's list and returns only the records plus the offset and limit you
  asked for.

**Example tool response shape:**

```json
{
  "incidents": [ ... ],
  "offset": 0,
  "limit": 50
}
```

**Pagination workflow:**

1. Call with `offset=0` and `limit=50`.
2. If the returned `incidents` array is exactly `limit` long, there may be
   more — call again with `offset=50`.
3. Stop when a page returns fewer than `limit` records. Do not try to compute
   the number of pages up front; you have no total to compute it from.

Narrow with `status` and `severity` before paging. Those two are the only
filters `ironscales_incidents_list` accepts — there is no `source`
parameter, so a user-reported-versus-AI-detected split has to be partitioned
client-side from the records you get back.

## Rate Limiting

Ironscales enforces per-endpoint rate limits.

- HTTP 429 responses indicate rate limiting.
- Use exponential backoff before retrying.
- Use `status` and `severity` filters to limit result volumes.
- Avoid unnecessary polling.

## Error Handling

Upstream HTTP failures do not reach you as a JSON error body. The server
raises them as tool errors whose message is prefixed by category, with the
vendor's `message` field appended when present.

| Status | Message you will see | Resolution |
|--------|----------------------|------------|
| 400 | `Ironscales API error (HTTP 400): …` | Check required parameters and enum values — `status`, `severity`, `action`, `operation`, `entry_type`, `period` |
| 401 | `Ironscales authentication failed: …` | Verify API key and company ID |
| 403 | `Ironscales access forbidden: …` | API key lacks permissions for this operation |
| 404 | `Ironscales resource not found: …` | Incident ID or resource does not exist |
| 429 | `Ironscales rate limit exceeded: …` | Wait and retry with exponential backoff |
| 5xx | `Ironscales API error (HTTP 5xx): …` | Retry; contact Ironscales support if persistent |

Two failures are raised by the server itself before any HTTP call:

- `Ironscales credentials not configured…` — neither gateway-scoped nor
  environment credentials were available.
- `entry_type and value are required for add/remove operations.` —
  `ironscales_allowlist_manage` was called with `operation=add` or
  `operation=remove` and no entry.

A 400 that reads like a rejected enum is usually a value that does not
exist. There is no `resolved` status, no `source` filter, no `block_domain`
or `allowlist_sender` remediation action.

## Best Practices

- Filter with `status` and `severity` rather than pulling the whole queue;
  they are the only server-side filters available.
- Page until a short page rather than until a total — no total is returned.
- Verify incident status with `ironscales_incidents_list` before remediating.
  A closed incident rejects remediation with an error that reads like a
  permissions failure.
- Treat `ironscales_incidents_get` output as vendor pass-through. Only `id`,
  `subject`, `status`, `severity`, `sender`, `created_at`, `recipients[]`,
  `recipient_count`, and `threat_indicators[]` are read and normalised by
  this server; verify anything else is present before branching on it.
- Check `ironscales_stats_company` weekly to track phishing trends. Its
  payload is vendor pass-through too — inspect the response before writing
  logic against a field name.

## Related Skills

- [incidents](../incidents/SKILL.md) - Incident lifecycle, remediation, and allowlist management
