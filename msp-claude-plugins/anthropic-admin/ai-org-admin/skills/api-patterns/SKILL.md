---
name: "Anthropic Admin API Patterns"
description: >
  Anthropic Admin MCP fundamentals: the Conduit X-Anthropic-Admin-Key header
  and the sk-ant-admin key it carries, one key = one Anthropic organization,
  the 19 read-only tools and which three are admin-gated in Conduit, the two
  pagination styles (ID cursors and page tokens), response truncation, the
  cents-not-dollars cost units, time-range limits, and how vendor errors and
  429s come back. Every other Anthropic Admin skill assumes these patterns.
when_to_use: >-
  When connecting to, calling, or debugging the Anthropic Admin tools through Conduit.
  Use when: anthropic admin api, anthropic admin key, sk-ant-admin, anthropic admin
  pagination, anthropic admin 401, anthropic admin 429, anthropic admin tools missing,
  or which anthropic org am I looking at.
---

# Anthropic Admin MCP Tools & API Patterns

## Overview

The Anthropic Admin connector gives a read-only view of one Anthropic
organization (the account behind Claude Console and the Claude API):
members, invites, workspaces, API key metadata, usage and cost reports,
Claude Code analytics, the compliance activity feed, and rate limits.
Every tool is a GET. Nothing in this plugin can invite, remove, or change
a user, create or archive a key, or change a workspace or a limit. Those
actions happen in Claude Console.

## Connection & Authentication

Conduit stores the client's Admin key once and sends it to the sidecar on
each call as a header:

| Conduit field | Header | Notes |
|---------------|--------|-------|
| Admin API Key (`adminKey`) | `X-Anthropic-Admin-Key` | Must start with `sk-ant-admin`. A normal API key (`sk-ant-api...`) is rejected. |

The sidecar turns this into the upstream `x-api-key` and
`anthropic-version` headers itself. The upstream host is fixed to
`https://api.anthropic.com`; there is no base-URL setting.

The key is entered only in the Conduit web UI (`/connect/anthropic-admin`).
Nothing is set on the client, and Conduit drops any `X-Anthropic-Admin-Key`
header a client sends. Never paste the key into chat or a ticket.

**Credential scope.** Anthropic has no read-only Admin key. The key that
powers this read-only connector can also invite and remove users, archive
API keys, and change workspaces in Claude Console or through the API
directly. Ask the client for a dedicated Admin key for Conduit, created by
an organization admin under Claude Console > Settings > Admin keys, so it
can be rotated or revoked on its own.

## One key = one organization

An Admin key sees exactly one Anthropic organization. Start every session
with `anthropic_admin_organization_get` and state the org name back before
reporting anything, so a number never lands in the wrong client's report.

MSPs meet two layouts:

- **Org per client.** The client owns its Anthropic org; you connect with
  that org's Admin key.
- **Workspace per client.** The MSP runs one org and splits clients into
  workspaces. Scope every report by `workspace_id` (cost and usage tools
  take `workspace_ids` filters or `group_by` on `workspace_id`).

## Tool Surface

All 19 tools are read-only and classified in Conduit. 16 need the `read`
tier. Three are **sensitive reads gated at the `admin` tier** in Conduit:

| Tool | Tier in Conduit | Why |
|------|-----------------|-----|
| `anthropic_admin_api_keys_list` | admin | Credential inventory (names, owners, status, partial hint; never the secret) |
| `anthropic_admin_api_key_get` | admin | Same, for one key |
| `anthropic_admin_compliance_activities_list` | admin | Audit log (sign-ins, role changes, key lifecycle) |

Org owners bypass the tier gate. A member with an ordinary `read` grant
will not see these three tools; they need an `admin` grant or an explicit
per-tool allowlist entry. If a workflow needs them and they are missing,
check `conduit__my_access` before assuming the connector is broken.

Read-tier tools by area:

- **Organization:** `anthropic_admin_organization_get`
- **Seats:** `anthropic_admin_users_list`, `anthropic_admin_user_get`,
  `anthropic_admin_invites_list`, `anthropic_admin_invite_get`
- **Workspaces:** `anthropic_admin_workspaces_list`,
  `anthropic_admin_workspace_get`, `anthropic_admin_workspace_members_list`,
  `anthropic_admin_workspace_member_get`
- **Usage and cost:** `anthropic_admin_usage_report_messages`,
  `anthropic_admin_cost_report`, `anthropic_admin_analytics_usage`,
  `anthropic_admin_analytics_cost`
- **Claude Code:** `anthropic_admin_usage_report_claude_code`
- **Rate limits:** `anthropic_admin_rate_limits_list`,
  `anthropic_admin_workspace_rate_limits_list`

## Pagination

The server never pages for you. Two styles exist and each tool uses one:

| Style | Tools | Request | Response |
|-------|-------|---------|----------|
| ID cursor | users, invites, workspaces, workspace members, API keys, compliance activities | `limit`, `after_id`, `before_id` | `has_more`, `first_id`, `last_id` |
| Page token | usage report, cost report, Claude Code report, analytics, rate limits | `limit`, `page` | `has_more`, `next_page` |

Pass `last_id` as `after_id` (or `next_page` as `page`) until `has_more` is
false. A seat count, key count, or spend total from one page is wrong
whenever `has_more` was true; say so instead of reporting it.

Limits are capped at the vendor maximum: 1000 for most lists, 5000 for
the compliance feed, and for `anthropic_admin_usage_report_messages` the
cap depends on `bucket_width` (1d: 31, 1h: 168, 1m: 1440 buckets).
`anthropic_admin_cost_report` returns at most 31 daily buckets per page.

## Truncated pages

If a page is larger than the sidecar's response cap, items are dropped
from the end of `data` and the response carries `truncated: true`,
`returned_items`, `total_items_in_page`, and a `truncation_hint`. The
cursors still describe the full vendor page, so paging on would skip the
dropped items. Repeat the same request with a smaller `limit` instead.

## Units and time ranges

- **Costs are in cents.** `anthropic_admin_cost_report` returns `amount`
  as a decimal string in the lowest currency unit with `currency: "USD"`
  ("123.45" is $1.23), even though the report is described as USD.
  `anthropic_admin_analytics_cost` is also cents ("41280.000000" is
  $412.80). Claude Code `estimated_cost.amount` is cents too. Divide by
  100 before showing a dollar figure.
- **Timestamps** are RFC 3339 (`2026-10-01T00:00:00Z`). `ending_at` is
  exclusive. `anthropic_admin_usage_report_claude_code` is the exception:
  it takes one UTC day as `YYYY-MM-DD`.
- **Analytics** (`anthropic_admin_analytics_usage`,
  `anthropic_admin_analytics_cost`) are beta: at most 31 days per call,
  `starting_at` within the last 365 days, and a `1m` bucket width limits
  the range to 24 hours. A month-over-month comparison is two calls.
- Anthropic marks `anthropic_admin_cost_report` and
  `anthropic_admin_usage_report_messages` as the legacy Usage and Cost API
  and points new work at the analytics endpoints. Both still work; prefer
  analytics when you need per-user (`actor`) breakdowns.

## Error Handling

Vendor errors come back as tool errors that keep the HTTP status, error
type, message, and `request_id`:

| Status | Meaning | Action |
|--------|---------|--------|
| 401 / 403 | Admin key invalid, revoked, or lacks permission for this endpoint | Ask the client admin to check the key in Claude Console; reconnect in Conduit with a fresh key |
| 404 | ID not found (user removed, key ID mistyped, wrong org) | Re-list, and re-check `anthropic_admin_organization_get` |
| 429 | Rate limited by Anthropic | Wait for the `Retry after Ns` the error carries, then retry; slow a sweep down rather than retrying in a loop |
| Argument error | A parameter failed validation before reaching Anthropic (bad enum, empty string, `limit` below 1) | Fix the argument; nothing was sent upstream |

A "tools missing" symptom is usually tiering, not an error: see the
admin-gated table above. If no Anthropic Admin tools appear at all, the
connector may not be enabled for your Conduit org yet.

## Related Skills

- [seat-inventory](../seat-inventory/SKILL.md) - who has access, at what role, and pending invites
- [key-and-audit-review](../key-and-audit-review/SKILL.md) - API key hygiene and the compliance feed (admin-gated)
- [spend-review](../spend-review/SKILL.md) - cost, token usage, chargeback, and rate-limit headroom
- [claude-code-adoption](../claude-code-adoption/SKILL.md) - Claude Code seat value reporting
