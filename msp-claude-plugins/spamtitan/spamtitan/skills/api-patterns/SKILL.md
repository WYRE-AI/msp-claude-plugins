---
name: "SpamTitan API Patterns"
description: >
  SpamTitan MCP fundamentals: the available tool catalog and its exact
  parameters, API-key header authentication, API structure, pagination, rate
  limiting, and error handling. Includes the tenant-isolation limit —
  spamtitan_get_queue takes no domain filter.
when_to_use: >-
  When authenticating to SpamTitan, navigating its MCP tools, paging results, or interpreting a
  SpamTitan API error. Use when: spamtitan, spamtitan api, spam filter, titanhq, SpamTitan API,
  SpamTitan tools, spamtitan authentication, spamtitan mcp, spamtitan rate limit, or spamtitan
  error.
---

# SpamTitan MCP Tools & API Patterns

## Overview

The SpamTitan MCP server provides AI tool integration with the SpamTitan email security platform by TitanHQ. It exposes tools covering quarantine queue management, email flow statistics, and sender allowlist/blocklist management. The API uses an API key passed as an HTTP header.

## Connection & Authentication

### API Key Header Auth

SpamTitan authenticates using an API key passed via HTTP header:

| Header | Description |
|--------|-------------|
| `X-SpamTitan-API-Key` | Your SpamTitan API key |

Generate credentials at: **SpamTitan Admin Interface > Settings > API**

**Environment Variables:**

```bash
export SPAMTITAN_API_KEY="your-api-key"
```

> **IMPORTANT:** Never hardcode credentials. Always use environment variables.

## Available MCP Tools

The server registers nine tools. There is no separate `list` tool for either
sender list and no separate per-domain statistics tool — both capabilities are
arguments on the tools below.

### Quarantine Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `spamtitan_get_queue` | `page`, `per_page`, `sender`, `recipient`, `subject`, `reason` | List messages in the quarantine queue. **No `domain` parameter — see the warning below.** |
| `spamtitan_get_message` | `message_id` (required) | Get details for a specific quarantined message |
| `spamtitan_release_message` | `message_id` (required) | Release a quarantined message to the recipient |
| `spamtitan_delete_message` | `message_id` (required) | ⚠ Permanently delete a quarantined message. Irreversible |

> **⚠ `spamtitan_get_queue` cannot be scoped to a customer domain.** Its
> shipped input schema is exactly `page`, `per_page`, `sender`, `recipient`,
> `subject`, `reason` (`spamtitan-mcp/src/domains/quarantine.ts:21-53`). On a
> multi-tenant appliance the listing therefore spans every tenant, and
> per-customer filtering has to be done client-side on `recipient` after the
> fetch. This is easy to miss because the sibling `spamtitan_get_stats` *does*
> take `domain`. See the quarantine skill and `GOVERNANCE.md`.

### Email Statistics

| Tool | Parameters | Description |
|------|------------|-------------|
| `spamtitan_get_stats` | `period` (`today`\|`yesterday`\|`last_7_days`\|`last_30_days`\|`last_90_days`), `domain` | Email flow statistics. Pass `domain` for a single customer's numbers |

Per-domain statistics are real — they are the `domain` argument on this tool,
not a separate tool.

### List Management

| Tool | Parameters | Description |
|------|------------|-------------|
| `spamtitan_manage_allowlist` | `action` (required: `add`\|`remove`\|`list`), `sender`, `note` | Add, remove, or list sender allowlist entries |
| `spamtitan_manage_blocklist` | `action` (required: `add`\|`remove`\|`list`), `sender`, `note` | ⚠ HIGH-IMPACT. Add, remove, or list sender blocklist entries. Changes deliverability for real users |

Listing is `action: "list"` on the same tool — there is no separate list tool.
`action` is the only required parameter; `sender` is required by the handler
for `add` and `remove`. Omitting `action` makes the server elicit it from the
caller, which an unattended agent cannot answer.

### Discovery

| Tool | Parameters | Description |
|------|------------|-------------|
| `spamtitan_status` | — | Show credentials status and available domains |
| `spamtitan_navigate` | `domain` (required) | Discover tools by domain. This `domain` is a *tool category*, not a mail domain |

## Pagination

The quarantine queue uses page/per-page pagination:

- Pass `page` (1-based) and `per_page` (default 50, max 200)
- Continue fetching pages until the result count is less than `per_page`

**Example workflow:**

1. Call `spamtitan_get_queue` with `page=1`, `per_page=100`
2. If 100 results returned, call again with `page=2`
3. Repeat until fewer than `per_page` results are returned

## Rate Limiting

SpamTitan enforces API rate limits per API key:

- HTTP 429 responses indicate rate limit exceeded
- Wait before retrying — use exponential backoff
- Use date range filters to reduce result set sizes
- Avoid polling at high frequency; fetch on demand

## Error Handling

### Common Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| 401 | Unauthorized | Check `X-SpamTitan-API-Key` header value |
| 403 | Forbidden | Insufficient API key permissions |
| 404 | Not Found | Resource doesn't exist or wrong ID |
| 422 | Unprocessable Entity | Invalid request parameters |
| 429 | Rate Limited | Wait and retry after delay |
| 500 | Server Error | Retry; contact TitanHQ support if persistent |

### Error Response Format

```json
{
  "error": {
    "code": 401,
    "message": "Invalid or missing API key"
  }
}
```

## Best Practices

- Narrow the quarantine queue with the filters that exist — `sender`,
  `recipient`, `subject`, `reason` — rather than paging the whole appliance.
  There is no date filter and no domain filter on `spamtitan_get_queue`.
- To approximate per-customer scope on the queue, pass `recipient` (a full
  address) or filter the results client-side on the recipient's domain. Do not
  tell an operator the listing is scoped to their customer when it is not.
- `spamtitan_get_stats` does accept `domain`, so per-customer statistics are
  genuinely scoped server-side. The asymmetry with the queue is the trap.
- There is no bulk release or bulk delete tool — both act on one `message_id`
  per call. Iterate deliberately and confirm each destructive call.
- Always confirm before deleting quarantined messages — deletion is irreversible
- Log all list management changes (allowlist/blocklist) for audit trail purposes,
  using the `note` parameter on `spamtitan_manage_allowlist` /
  `spamtitan_manage_blocklist`

## Related Skills

- [quarantine](../quarantine/SKILL.md) - Quarantine queue management
- [lists](../lists/SKILL.md) - Sender allowlist and blocklist management
