---
name: "Zabbix Problem Triage"
description: >
  NOC triage of Zabbix problems for MSPs: pulling open problems by severity
  and customer host group, resolving each problem to its host through the
  trigger or event, separating cause from symptom and suppressed problems,
  checking maintenance and acknowledgement state, confirming whether an
  alert was actually sent, and reading recent event history for flapping.
  Read-only: the plugin cannot acknowledge or close problems.
when_to_use: >-
  When reviewing what is currently broken in a customer's Zabbix, ranking
  open problems, or investigating one problem before opening or updating a
  ticket. Use when: zabbix problems, open problems, zabbix alerts today,
  what's down, NOC triage, zabbix disaster, unacknowledged problems, was
  anyone paged, flapping trigger, or zabbix shift handover.
---

# Zabbix Problem Triage

## Overview

A Zabbix **problem** is an open problem event: a trigger (or an internal or
service check) went into PROBLEM state and has not recovered. Triage means
deciding which problems need a human now, which customer they belong to, and
whether someone has already been told. Everything here is read-only;
acknowledging, changing severity or closing happens in the Zabbix frontend.

Read [api-patterns](../api-patterns/SKILL.md) first for headers, the shared
get parameters, and event-ID paging. No tool in this workflow is
admin-gated in Conduit.

## Anti-triggers

- **Hosts with no monitoring, or a site proxy that went silent** - problems
  only exist for things being monitored; use
  [monitoring-coverage](../monitoring-coverage/SKILL.md).
- **Monthly availability numbers for a customer** - use
  [sla-reporting](../sla-reporting/SKILL.md).

## Key Concepts

| Field (problem) | Meaning |
|-----------------|---------|
| `eventid` | Problem event ID; also the paging key |
| `objectid` | The trigger ID when `object` is 0 (the default) |
| `name` | Trigger name with macros expanded at the time of the event |
| `severity` | 0 not classified, 1 information, 2 warning, 3 average, 4 high, 5 disaster |
| `clock` | Unix time the problem started |
| `acknowledged` | 1 when someone acknowledged it in Zabbix |
| `suppressed` | 1 when maintenance or a manual suppression hides it |
| `r_eventid` | Recovery event ID; non-zero means it already resolved |
| `cause_eventid` | Non-zero on a **symptom** problem; points at its cause |

- `zabbix_problems_list` returns **no host**. Resolve the host through the
  trigger (`zabbix_triggers_list` with `triggerids` set to the problems'
  `objectid` values and `selectHosts`) or through the event
  (`zabbix_events_list` with `eventids` and `selectHosts`).
- MSPs usually keep one host group per customer or site. Get the group IDs
  from `zabbix_hostgroups_list` and pass `groupids` to scope everything else.
  Some instances tag hosts by customer instead; then use `tags`.

## Common Workflows

### Open-problem sweep (one customer or all)

1. `zabbix_hostgroups_list` with `search: {"name": "<customer>"}` and
   `with_monitored_hosts: true` to get the customer's group IDs. Skip for an
   all-customer sweep.
2. `zabbix_problems_list` with `groupids`, `severities: [3,4,5]`,
   `sortfield: "eventid"`, `sortorder: "DESC"`, `selectTags: "extend"`,
   `selectSuppressionData: "extend"`, `limit: 200`. Add
   `symptom: false` to see only cause problems first.
3. Collect the `objectid` values and call `zabbix_triggers_list` once with
   `triggerids`, `selectHosts: ["host","name"]`,
   `selectHostGroups: ["name"]`, `expandDescription: true` and
   `output: ["triggerid","description","priority","comments","url"]`. This maps
   every problem to its host and customer group in one call, and the trigger
   `comments` often carry the runbook note.
4. If any problem came back on a host in maintenance or with
   `suppressed: 1`, confirm with `zabbix_maintenance_list` (`hostids`,
   `selectTimeperiods: "extend"`) before calling it noise.
5. Rank: unacknowledged disaster/high first, then by age (`clock`), then
   problems shared by many hosts in one group (a site-wide outage beats ten
   single-host warnings).

### Was anyone paged?

`zabbix_alerts_list` with `eventids` set to the problem event IDs and
`selectHosts: ["name"]`. Each alert shows `sendto`, `status`
(0 not sent yet, 1 sent, 2 failed) and `error`. A disaster with no alert, or
with failed alerts, is an escalation gap to report, not just a problem.

### Is it flapping?

`zabbix_events_list` with `objectids: ["<triggerid>"]`,
`time_from` 24-72 hours back, `sortfield: "clock"`, `sortorder: "DESC"`,
`output: ["eventid","clock","value","severity"]`. Many 1/0 (problem/OK)
pairs in a short window means a flapping trigger: the fix is a threshold or
hysteresis change on the trigger, not a ticket per occurrence.

### Currently-firing triggers (alternative view)

`zabbix_triggers_list` with `only_true: true`, `monitored: true`,
`skipDependent: true`, `expandDescription: true`, `filter: {"value": 1}`,
`min_severity: 3`, `selectHosts: ["name"]`, `selectLastEvent: "extend"`.
`skipDependent` hides triggers whose parent (for example the site uplink)
is already in problem, which is usually what a NOC wants.

## Gotchas

- **Suppressed is not resolved.** Problems on hosts in maintenance are
  hidden in the frontend's default views but still returned unless you pass
  `suppressed: false`. Say which you included.
- **`recent: true` mixes in resolved problems.** Check `r_eventid` before
  calling something open.
- **Symptom problems inflate counts.** With cause and symptom linking,
  one router outage can own dozens of symptom problems. Count causes.
- **Severity is per problem, not per trigger.** Someone may have changed the
  problem's severity in the frontend; the trigger's `priority` keeps the
  original.
- **`acknowledged` is only Zabbix's view.** The ticket may live in the PSA
  without an acknowledgement in Zabbix. Do not report "nobody is working
  this" from `acknowledged: 0` alone.
- **Item values are not available.** `zabbix_items_list` and
  `zabbix_history_get` are opt-in and not listed in Conduit. The trigger
  name (with expanded macros) and `zabbix_trends_get` are what you have.

## Output

Group by customer (host group), then severity. Per problem: host, problem
name, severity, age, acknowledged yes/no, suppressed yes/no, alert sent /
failed / none, and a one-line next step. End with counts: open causes,
symptoms, suppressed, and any paging gaps.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Paging and parameters
- [monitoring-coverage](../monitoring-coverage/SKILL.md) - Silent proxies and gaps
