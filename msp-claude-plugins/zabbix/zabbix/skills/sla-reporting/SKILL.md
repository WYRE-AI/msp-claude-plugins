---
name: "Zabbix SLA Reporting"
description: >
  Customer availability reporting from Zabbix: the business service tree and
  its status, SLA definitions (SLO, period, schedule, excluded downtime),
  per-period SLI figures from sla.getsli, a problem-history summary for
  customers without configured SLAs, and hourly trend aggregates for
  capacity notes. Read-only.
when_to_use: >-
  When preparing a monthly or quarterly customer report, answering "did we
  meet the SLA", summarizing major incidents for a QBR, or pulling capacity
  trends for a server. Use when: zabbix sla, zabbix sli, uptime report,
  availability report, qbr monitoring, business service status, error
  budget, zabbix trends, capacity report, or monthly monitoring summary.
---

# Zabbix SLA Reporting

## Overview

Zabbix models customer-facing availability as **business services** (a
tree whose status rolls up from tagged problems) measured by **SLAs** (an
SLO percentage over daily to annual periods, with a schedule and excluded
downtimes). `sla.getsli` returns the computed uptime, downtime, SLI and
error budget per period. MSPs use it for monthly customer reports and QBRs.

Read [api-patterns](../api-patterns/SKILL.md) first. No tool in this
workflow is admin-gated in Conduit.

## Anti-triggers

- **What is broken right now** - use [problem-triage](../problem-triage/SKILL.md).
- **Whether hosts are monitored at all** - use
  [monitoring-coverage](../monitoring-coverage/SKILL.md). An SLA over
  hosts that are disabled or behind a dead proxy reports 100% because it
  saw nothing.

## Key Concepts

| Object | Field | Values |
|--------|-------|--------|
| Service | `status` | -1 OK; otherwise the severity of the worst problem affecting it |
| SLA | `slo` | Target percentage, e.g. `99.9` |
| SLA | `period` | 0 daily, 1 weekly, 2 monthly, 3 quarterly, 4 annually |
| SLA | `status` | 0 disabled, 1 enabled |
| SLA | `effective_date` | Unix time the SLA starts counting |
| SLA | `timezone` | Period boundaries follow this zone, not UTC |
| SLI result | `sli` | Achieved percentage for one service in one period |
| SLI result | `uptime` / `downtime` | Seconds in the period |
| SLI result | `error_budget` | Seconds of downtime left before the SLO is missed (negative = missed) |
| SLI result | `excluded_downtimes` | Planned windows removed from the calculation |

`sla.getsli` returns `periods` (each with `period_from` / `period_to`),
`serviceids`, and `sli` as a two-dimensional array: `sli[period][service]`.
Match columns to `serviceids` by position.

## Common Workflows

### Monthly SLA report for one customer

1. `zabbix_services_list` with `search: {"name": "<customer>"}` (or the
   customer's service tag via `tags`), `selectChildren: ["serviceid","name"]`
   and `output: ["serviceid","name","status"]` to find the customer's
   service subtree.
2. `zabbix_slas_list` with `serviceids` and
   `selectExcludedDowntimes: "extend"`,
   `output: ["slaid","name","slo","period","timezone","status","effective_date"]`.
   Skip SLAs with `status: 0`.
3. For each SLA, `zabbix_sla_sli_get` with `slaid`, `serviceids` (the
   customer's services) and either `periods: 3` for the last three periods
   or `period_from` / `period_to` for an exact month.
4. Per service and period report SLI against SLO, downtime in minutes, error
   budget, and any excluded downtime (planned maintenance) separately so the
   customer sees it was excluded rather than hidden.

### Customer with no SLAs configured

Many instances have no services or SLAs. Summarize problem history instead,
and say clearly that it is not an SLA figure:

1. `zabbix_events_list` with the customer's `groupids`, `source: 0`,
   `value: [1]`, `severities: [4,5]`, `time_from` / `time_till` for the
   month, `selectHosts: ["name"]`,
   `output: ["eventid","clock","name","severity","r_eventid"]`,
   `sortfield: "clock"`. Page with `time_till` if you get `limit` rows.
2. Collect the non-zero `r_eventid` values and fetch them with
   `zabbix_events_list` (`eventids`, `output: ["eventid","clock"]`) to get
   each recovery time. Duration = recovery `clock` minus problem `clock`;
   `r_eventid: 0` means still open at the end of the window.
3. Report the count, the longest five, and total high/disaster minutes per
   host.

### Capacity trend notes

`zabbix_trends_get` with `itemids`, `time_from` / `time_till` and
`output: ["itemid","clock","value_min","value_avg","value_max"]` returns
hourly aggregates for numeric items. Item IDs are not discoverable through
Conduit (`zabbix_items_list` is opt-in and not listed), so take them from the
Zabbix frontend's Latest data page or from the customer's dashboards
(`zabbix_dashboards_list` gives dashboard IDs for deep links). Summarize
as weekly peak and average, not hour-by-hour rows.

## Gotchas

- **Service status is inverted from intuition.** `-1` is healthy; any
  number from 0 to 5 is a problem severity.
- **SLA periods follow the SLA's `timezone`.** A "November" report from
  `period_from` / `period_to` in UTC will not match the frontend for a US
  customer. Use `periods` or convert the boundaries to the SLA timezone.
- **Nothing before `effective_date`.** Periods before it come back empty;
  that is not 100% uptime.
- **No data is not uptime.** Hosts in "no data collection" maintenance or
  behind a dead proxy contribute no problems. Check coverage before
  publishing a perfect number.
- **Trends are hourly and numeric only.** Text and log items have none.
- **`periods` is capped at 100.**

## Output

A customer-ready table per SLA: service, period, SLO, SLI, downtime
(minutes), error budget, excluded downtime. Follow with the top incidents
of the period (from the event summary) and one sentence of capacity outlook
when trends were pulled. Mark clearly any figure that came from problem
history rather than an SLA.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Paging by time range
- [monitoring-coverage](../monitoring-coverage/SKILL.md) - Confirm coverage before reporting
