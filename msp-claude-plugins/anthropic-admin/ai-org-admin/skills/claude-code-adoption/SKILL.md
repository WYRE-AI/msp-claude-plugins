---
name: "Anthropic Admin Claude Code Adoption"
description: >
  Claude Code adoption and value reporting for a client's Anthropic
  organization: the per-user daily Claude Code usage report (sessions,
  lines added and removed, commits, pull requests, tool accept/reject
  counts, tokens and estimated cost per model), how to roll days up into a
  month, and how to set it against seat inventory to find unused seats.
  All tools are read-tier.
when_to_use: >-
  When reporting how a client's developers use Claude Code, finding Claude Code seats
  nobody uses, or preparing a Claude Code ROI slide for a QBR.
  Use when: claude code usage, claude code adoption, claude code seats unused, claude code
  roi, claude code productivity, developer ai usage, or claude code report.
---

# Claude Code Adoption

## Overview

Clients buying Claude Code seats want to know whether they are used and
what they produce. `anthropic_admin_usage_report_claude_code` returns one
record per user (or API key) per UTC day with sessions, lines of code,
commits, PRs, tool acceptance, and per-model token use and estimated
cost. This skill rolls that into an adoption picture.

## Anti-triggers

- **The client's whole API bill** — use
  [spend-review](../spend-review/SKILL.md). Claude Code cost here is an
  estimate for Claude Code activity only.

## Key Concepts

- **One day per call.** `starting_at` is a single UTC date
  (`YYYY-MM-DD`). A month is one call per day, each paged with `page` /
  `next_page` (`limit` up to 1000).
- **Actor.** `actor.type` is `user_actor` (with `email_address`) or
  `api_actor` (with `api_key_name`). Report them separately; an API-key
  actor is automation, not a person.
- **Core metrics:** `num_sessions`, `lines_of_code.added` /
  `.removed`, `commits_by_claude_code`, `pull_requests_by_claude_code`.
- **Tool actions:** accepted and rejected counts per tool (edit, write,
  and so on). Acceptance rate = accepted / (accepted + rejected). A low
  rate points at onboarding or prompt habits, not at the product.
- **Estimated cost** is per model in `model_breakdown[].estimated_cost`,
  in **cents**.
- `customer_type` is `api` or `subscription`; `subscription_type` is
  `team` or `enterprise` for subscription orgs. Local and remote (web)
  sessions arrive as separate rows (`is_remote`).

## Workflows

### Monthly adoption report

1. `anthropic_admin_organization_get` - confirm the org.
2. For each day of the month, `anthropic_admin_usage_report_claude_code`
   with that date, paging to the end.
3. Sum per `actor.email_address`: active days, sessions, lines added,
   commits, PRs, acceptance rate, estimated cost (cents to dollars once).
4. Rank by active days, not lines of code. Lines reward churn; active
   days show habit.

### Unused seats

1. `anthropic_admin_users_list` with `roles: ["claude_code_user"]` (Console
   orgs) or the full list (Enterprise), paged to the end.
2. Build the set of emails with any activity in the last 30 days from the
   daily reports.
3. Seats with no activity are reclaim candidates. Give the client the
   list with each person's `added_at`; someone added last week is not idle.

### Per-team view

`anthropic_admin_analytics_usage` with `group_by: ["actor"]` or
`["workspace_id"]` and `products` filtered to Claude Code gives a 31-day
token and request roll-up in one call when day-by-day detail is not
needed. Check the `product` values the org returns before filtering.

## Gotchas

- 30 calls for a month is normal. Run them in order and stop on a 429
  (see [api-patterns](../api-patterns/SKILL.md)) rather than retrying
  hard.
- Today's data is incomplete. Report through yesterday (UTC).
- Present productivity numbers as usage, not performance. Per-person
  tables stay with the client's engineering lead; QBR slides carry team
  totals.

## Related Skills

- [seat-inventory](../seat-inventory/SKILL.md) - who holds a Claude Code seat
- [spend-review](../spend-review/SKILL.md) - total API spend
