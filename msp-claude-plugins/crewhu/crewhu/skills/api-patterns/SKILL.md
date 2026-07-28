---
name: "Crewhu API Patterns"
description: >
  Crewhu MCP fundamentals: token authentication via the `X-Crewhu-Api-Token`
  header and its gateway env-var mapping, the flat 18-tool surface across the
  surveys, users, badges, and prizes domains (only `crewhu_badges_update_contest`
  writes), pagination, and error codes.
when_to_use: >-
  When working with Crewhu authentication headers, pagination, or error handling for the Crewhu
  MCP server. Use when: crewhu api, crewhu authentication, crewhu pagination, crewhu mcp, or
  crewhu token.
---

# Crewhu MCP Tools & API Patterns

## Overview

The Crewhu MCP server exposes CSAT/NPS surveys, employee recognition
(badges), and prize/redemption data for MSP teams. The tool surface is
read-heavy — only `crewhu_badges_update_contest` performs writes.

## Connection & Authentication

Crewhu uses an API token passed via header:

| Header | Value |
|--------|-------|
| `X-Crewhu-Api-Token` | The raw API token |

The gateway maps the environment variable `X_CREWHU_APITOKEN` onto the
`X-Crewhu-Api-Token` header automatically.

```bash
export X_CREWHU_APITOKEN="your-crewhu-api-token"
```

## Tool Surface

All 18 tools are exposed flat via `tools/list` — there is no
navigation gating. Tool names follow `crewhu_<domain>_<action>`
across four domains:

- **surveys** (5): list, get, search, detractors, promoters
- **users** (3): list, get, search
- **badges** (5): list, get, history_list, user_recognition, update_contest
- **prizes** (5): list, get, history_list, user_redemptions, pending_redemptions

## Pagination

Crewhu list endpoints typically accept page/limit-style parameters.
Always check whether more pages exist before claiming a result set is
complete; for survey trend analysis, pull enough history to have a
stable denominator.

## Error Handling

| Status | Meaning | Action |
|--------|---------|--------|
| 401 | Missing or invalid token | Re-check `X_CREWHU_APITOKEN` |
| 403 | Token valid but not authorized for this resource | Check token scope |
| 404 | Unknown survey / user / badge / prize ID | Re-list to confirm |
| 429 | Rate limit | Back off and retry |

## Best Practices

- Flag `crewhu_badges_update_contest` explicitly before invoking it — it is
  the only tool in the surface that mutates data.
- For multi-team MSPs, group survey results by user/team after fetching.

## Related Skills

- [surveys](../surveys/SKILL.md) - CSAT/NPS analysis (the primary skill)
