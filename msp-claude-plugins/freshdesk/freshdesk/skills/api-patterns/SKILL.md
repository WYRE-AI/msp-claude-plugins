---
name: "Freshdesk API Patterns"
when_to_use: "When working with Freshdesk authentication headers, base URL, pagination, rate limits, or the search query language for the Freshdesk MCP server"
description: >
  Use this skill when working with the Freshdesk MCP tools — header-based
  authentication via `X-Freshdesk-Domain` and `X-Freshdesk-Api-Key` (which the
  MCP server translates into upstream HTTP Basic `apikey:X` auth), the
  `/api/v2` base URL, `page`/`per_page` pagination, per-minute rate limits, and
  the Freshdesk search query language with its status/priority encodings.
triggers:
  - freshdesk api
  - freshdesk authentication
  - freshdesk pagination
  - freshdesk mcp
  - freshdesk search query
  - freshdesk rate limit
  - freshdesk query language
---

# Freshdesk MCP Tools & API Patterns

## Overview

The Freshdesk MCP server exposes the Freshdesk cloud helpdesk: tickets,
conversations, contacts, companies, agents, groups, the nested solutions
knowledge base, SLA policies, and business hours. It wraps the official
Freshdesk REST API v2 (https://developers.freshdesk.com/api/) and presents
tools generically named `freshdesk_<domain>_<action>` (e.g.
`freshdesk_tickets_search`, `freshdesk_contacts_list`). Tool names below are
illustrative of the MCP surface.

## Connection & Authentication

Freshdesk's public API uses HTTP Basic authentication: the API key is the
username and a dummy `X` is the password (`apikey:X`). You never assemble that
Basic header yourself — the MCP server does the upstream translation. The
gateway-facing surface uses two `X-` headers, one credential per header:

| Header | Value |
|--------|-------|
| `X-Freshdesk-Domain` | The account subdomain (the `yourcompany` in `yourcompany.freshdesk.com`) |
| `X-Freshdesk-Api-Key` | The raw Freshdesk API key |

The gateway maps the environment variables `FRESHDESK_DOMAIN` and
`FRESHDESK_API_KEY` onto those headers automatically. The MCP server then
translates them into the upstream Freshdesk Basic auth (`apikey:X`).

```bash
export FRESHDESK_DOMAIN="yourcompany"
export FRESHDESK_API_KEY="your-freshdesk-api-key"
```

## Base URL

All upstream Freshdesk calls target:

```
https://{domain}.freshdesk.com/api/v2
```

where `{domain}` is the account subdomain carried in `X-Freshdesk-Domain`.
Resource paths hang off this base — for example `/tickets`, `/contacts`,
`/companies`, `/solutions/categories`, `/sla_policies`, and
`/business_hours`.

## Tool Surface

Tools follow `freshdesk_<domain>_<action>` across the major Freshdesk
resources:

- **tickets** — list, get, search, create, update, reply, add_note, conversations
- **contacts** — list, get, search, create, update, merge, make_agent
- **companies** — list, get, search, create, update
- **agents / groups** — list, get
- **solutions** — categories_list, folders_list, articles_list, articles_get, articles_search
- **sla_policies** — list
- **business_hours** — list

## Pagination

List endpoints accept query parameters `page` and `per_page`:

| Parameter | Description | Limit |
|-----------|-------------|-------|
| `page` | 1-based page number | — |
| `per_page` | Items per page | Max 100 |

When more pages exist, Freshdesk returns a `link` response header containing
the URL of the next page (with `rel="next"`). Follow that `link` header rather
than guessing the next `page` value, and stop when it is absent. Some list
endpoints cap the total number of results that can be paged through — when a
list is capped, narrow the query (by date or status) instead of paging
indefinitely.

```http
GET /api/v2/tickets?page=2&per_page=100
Link: <https://yourcompany.freshdesk.com/api/v2/tickets?page=3&per_page=100>; rel="next"
```

## Rate Limiting

Freshdesk enforces a per-account, per-minute request limit. Every response
carries the current rate-limit state:

| Header | Meaning |
|--------|---------|
| `X-RateLimit-Total` | Total calls allowed per minute for the account |
| `X-RateLimit-Remaining` | Calls remaining in the current window |
| `X-RateLimit-Used-CurrentRequest` | Cost of the request just made |
| `Retry-After` | Seconds to wait (present on HTTP 429) |

On HTTP `429 Too Many Requests`, read `Retry-After` and back off for at least
that many seconds before retrying. Add jitter when retrying in a loop, and
spread bulk operations across windows rather than bursting.

```javascript
async function requestWithRetry(call, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const res = await call();
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After')) || 30;
      const jitter = Math.random() * 1000;
      await sleep(retryAfter * 1000 + jitter);
      continue;
    }
    return res;
  }
}
```

## Search Query Language

Filtered search for tickets, contacts, and companies uses dedicated search
endpoints and the Freshdesk query language:

```
GET /api/v2/search/tickets?query="status:2 AND priority:4"
GET /api/v2/search/contacts?query="..."
GET /api/v2/search/companies?query="..."
```

### Query rules

- The entire query is wrapped in double quotes; string field **values** are
  also quoted (e.g. `tag:'vip'`).
- Combine clauses with `AND` / `OR`.
- Supported ticket fields include `status`, `priority`, `agent_id`,
  `group_id`, `type`, `tag`, `created_at`, and `updated_at`.
- Date fields take ISO `YYYY-MM-DD` values and support range comparisons,
  e.g. `created_at:>'2024-02-01'`.

### Search result caps

Search is paged at **30 results per page** with a **maximum of 10 pages**, so
a single search returns at most **300 matching records**. When a result set
would exceed 300, tighten the query (narrower date window, add a status or
group filter) and run multiple targeted searches rather than expecting one
search to return everything.

### Example queries

```text
# Open, urgent tickets
"status:2 AND priority:4"

# Resolved tickets for one agent in a date range
"status:4 AND agent_id:42 AND created_at:>'2024-02-01'"

# High or urgent tickets in a group
"group_id:7 AND (priority:3 OR priority:4)"
```

## Status & Priority Encodings

Ticket `status`, `priority`, and `source` are integers in both the API and
the query language:

### Status

| Value | Status |
|-------|--------|
| 2 | Open |
| 3 | Pending |
| 4 | Resolved |
| 5 | Closed |

### Priority

| Value | Priority |
|-------|----------|
| 1 | Low |
| 2 | Medium |
| 3 | High |
| 4 | Urgent |

### Source

| Value | Source |
|-------|--------|
| 1 | Email |
| 2 | Portal |
| 3 | Phone |

(Additional source values exist for chat, feedback widget, and other
channels; 1-3 are the most common in MSP workflows.)

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 400 | Validation failed | Check required fields and encodings |
| 401 | Missing or invalid credentials | Re-check `FRESHDESK_DOMAIN` / `FRESHDESK_API_KEY` |
| 403 | Authenticated but not permitted | Check the API key's agent scope |
| 404 | Unknown ticket / contact / company / article ID | Re-list or re-search to confirm |
| 429 | Rate limit exceeded | Read `Retry-After` and back off |
| 5xx | Freshdesk server error | Retry with exponential backoff |

## Best Practices

- Treat `status`, `priority`, and `source` as integers everywhere — translate
  them to labels only for human-readable output.
- Prefer the search endpoints over client-side filtering of large `list`
  pulls; respect the 300-result search cap by narrowing queries.
- Follow the `link` response header for pagination instead of incrementing
  `page` blindly.
- Keep `per_page` at 100 for bulk reads to minimize request count against the
  per-minute rate limit.
- Always check rate-limit headers during bulk operations and pace accordingly.

## Related Skills

- [Freshdesk Ticketing](../ticketing/SKILL.md) - Tickets, conversations, replies, notes
- [Freshdesk Contacts & Companies](../contacts-companies/SKILL.md) - Requester resolution
- [Freshdesk Knowledge Base](../knowledge-base/SKILL.md) - Nested solutions hierarchy
- [Freshdesk SLA & Business Hours](../sla-business-hours/SKILL.md) - SLA targets and breach detection
