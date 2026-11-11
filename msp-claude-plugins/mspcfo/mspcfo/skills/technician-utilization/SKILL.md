---
name: "MSPCFO Technician Utilization"
description: >
  Reading MSPCFO's Member Work Report, Utilization Hours and Members
  Billing by Month reports: billable vs. non-billable time, utilization
  trends, cost per hour and revenue per member, how labor drives client
  and agreement margin, and handling this employee performance data
  responsibly.
when_to_use: >-
  When a service manager or owner asks how technicians spend their time,
  who is under or over capacity, or which people and work types drive a
  client's labor cost. Use when: technician utilization, billable hours,
  utilization hours, member work report, members billing by month,
  engineer productivity, cost per hour, or capacity planning.
---

# MSPCFO Technician Utilization

## Overview

Labor is most of an MSP's delivery cost, so utilization explains most
margin movement. MSPCFO's MCP page lists **Member Work Report**,
**Members Billing by Month** and **Utilization Hours** among its reports,
and says it applies calculations such as Employee Revenue Productivity.
This skill reads those reports for capacity planning and to explain
client or agreement margin.

Every MSPCFO tool is admin-gated in Conduit while unclassified, and
MSPCFO does not publish tool names. Pick the member and utilization tools
from the live tool list by description; see `mspcfo-api-patterns` if
they are missing.

## Anti-triggers

- **Ranking clients by profit** — use `mspcfo-client-profitability`.
- **Pricing or renewing an agreement** — use
  `mspcfo-agreement-pricing-review`.

## Key concepts

| Term | Meaning |
|---|---|
| Member | A PSA resource (technician, engineer, manager) as MSPCFO names them. |
| Utilization | Share of available hours logged as billable or client work. Use MSPCFO's figure and definition. |
| Members Billing by Month | Billing attributed to each member per month; shows revenue contribution over time. |
| Cost per hour | Fully loaded labor cost per hour, as set up in MSPCFO. Drives every margin figure. |
| Employee Revenue Productivity | MSPCFO's revenue-per-employee style calculation. Quote it; do not re-derive it. |

## Common workflows

### Capacity check

1. Pull Utilization Hours for the last full quarter, by member.
2. Show each member's utilization against the team median, with total
   available hours so part-time staff are not misread.
3. Flag sustained highs (burnout and backlog risk) and sustained lows
   (capacity to sell, or time not being logged).

### Explain a client's labor cost

1. Pull the Member Work Report for that client and period.
2. Group hours by member and work type. Look for senior staff on routine
   work, repeat work on the same issue, or after-hours time.
3. Feed the drivers back into the client-profitability or agreement
   review.

### Monthly billing trend per member

Pull Members Billing by Month for twelve months and show each member's
trend, not a single month. Seasonality, leave and onboarding all move
one month.

## Handling employee data

These reports tie hours, billing and productivity to named people. Treat
them as HR-adjacent:

- Default to team-level summaries. Name individuals only when the asker
  manages them and needs it.
- Never present low utilization as poor performance on its own. It is
  often missing time entries, internal projects, training or leave.
- Do not post per-person rankings in shared channels without the
  manager's decision to do so.

## Gotchas

- **Time-entry hygiene drives everything.** Unlogged time reads as low
  utilization and high margin at once. Say when the data looks
  incomplete.
- **Cost rates come from MSPCFO's setup.** If cost per hour looks wrong,
  the fix is in MSPCFO's configuration, not the analysis.
- **Verify key figures in the MSPCFO app**, as MSPCFO asks for its early
  MCP.

## Related Skills

- [API patterns](../api-patterns/SKILL.md)
- [Client profitability](../client-profitability/SKILL.md)
- [Agreement pricing review](../agreement-pricing-review/SKILL.md)
