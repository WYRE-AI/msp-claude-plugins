---
name: "Anthropic Admin Spend Review"
description: >
  Claude API spend and token usage for a client's Anthropic organization:
  the daily cost report, the Messages usage report, and the beta cost and
  usage analytics, with breakdowns by workspace, model, API key, and
  person; month-over-month comparison, per-client chargeback when clients
  are split by workspace, spike investigation, and rate-limit headroom.
  All tools are read-tier.
when_to_use: >-
  When reviewing what a client spent on the Claude API, preparing chargeback or a billing
  reconciliation, explaining a spend spike, or checking rate-limit headroom before a rollout.
  Use when: anthropic spend, claude api cost, anthropic bill, anthropic usage report,
  token usage, chargeback by workspace, anthropic cost spike, anthropic rate limits, or
  429 from claude api.
---

# Anthropic Spend Review

## Overview

A client's Claude API bill is driven by tokens, split across workspaces,
models, and keys. This skill turns the Admin API's cost and usage reports
into the numbers an MSP needs: last month's total, who or what drove it,
how it compares to the month before, and what to charge back to whom.

## Anti-triggers

- **Claude Code seat value** (sessions, lines, PRs per developer) — use
  [claude-code-adoption](../claude-code-adoption/SKILL.md).
- **Whether a high-spend key should exist** — use
  [key-and-audit-review](../key-and-audit-review/SKILL.md) (admin-gated).

## Which tool for which question

| Question | Tool | Notes |
|----------|------|-------|
| What did the org spend per day, per workspace? | `anthropic_admin_cost_report` | `group_by: ["workspace_id"]` or `["description"]`; daily buckets only, 31 per page |
| Which models, keys, or workspaces used the tokens? | `anthropic_admin_usage_report_messages` | `group_by` on `model`, `api_key_id`, `workspace_id`, `service_tier` and more |
| Spend per person, product, model, or key? | `anthropic_admin_analytics_cost` | Beta; `group_by` includes `actor`, `api_key_id`, `product`, `cost_type`; max 31 days per call |
| Tokens and requests per person or team? | `anthropic_admin_analytics_usage` | Beta; same limits; `order_by` `total_tokens` or `requests` |
| How much headroom before 429s? | `anthropic_admin_rate_limits_list`, `anthropic_admin_workspace_rate_limits_list` | Requests and tokens per minute by model group |

## Units

Every cost figure here is in **cents**, as a decimal string. The cost
report's `currency: "USD"` names the currency, not the unit: `"123.45"` is
$1.23. Divide by 100 before you write a dollar amount, and sum the strings
as decimals rather than floats when the total goes on an invoice.

## Workflows

### Monthly spend review

1. `anthropic_admin_organization_get` - confirm the org.
2. `anthropic_admin_cost_report` for the month: `starting_at` the 1st at
   `00:00:00Z`, `ending_at` the 1st of the next month (exclusive),
   `limit: 31`, `group_by: ["workspace_id"]`. Page `next_page` if
   `has_more`.
3. Repeat for the prior month. Report total, change, and the workspaces
   that moved most.
4. For the top movers, `anthropic_admin_analytics_cost` over the same
   range with `group_by: ["model"]` or `["actor"]` and `order_by: "amount"`
   to name what drove the change.

### Chargeback by workspace (workspace-per-client MSPs)

1. `anthropic_admin_workspaces_list` (add `include_default: true`) to map
   `workspace_id` to client names.
2. `anthropic_admin_cost_report` grouped by `workspace_id` for the billing
   period.
3. Sum per workspace, convert cents to dollars once at the end, and list
   spend with `workspace_id: null` (the default workspace) on its own line.
   Unattributed spend is a finding: keys in the default workspace should
   move to a client workspace.

### Spike investigation

1. `anthropic_admin_cost_report` daily for the last 30 days to find the
   day.
2. `anthropic_admin_usage_report_messages` for that day with
   `bucket_width: "1h"` and `group_by: ["api_key_id", "model"]` to find
   the hour, key, and model.
3. `anthropic_admin_analytics_usage` for the same window grouped by
   `actor` to name the person or key.
4. If the key looks wrong, hand off to
   [key-and-audit-review](../key-and-audit-review/SKILL.md).

### Rate-limit headroom

1. `anthropic_admin_rate_limits_list`, optionally `model`, for org limits.
2. `anthropic_admin_workspace_rate_limits_list` with
   `include_inherited: true` for a workspace about to take more load.
3. Compare against peak per-minute usage from
   `anthropic_admin_usage_report_messages` with `bucket_width: "1m"` over
   the busiest hour. Report the gap, not just the limit.

## Gotchas

- `anthropic_admin_cost_report` cannot group by API key or person. Use
  `anthropic_admin_analytics_cost` for that.
- Analytics are capped at 31 days per call and 365 days back; a quarter
  is three calls.
- The cost report and the Console invoice can differ by credits, taxes,
  and plan fees that are not token usage. Call the figure "API usage
  cost", not "the invoice".
- `ending_at` is exclusive. A month ending at `...-31T00:00:00Z` drops the
  last day.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - pagination, units, errors
- [claude-code-adoption](../claude-code-adoption/SKILL.md) - Claude Code usage per developer
