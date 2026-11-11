---
name: "Zabbix Monitoring Coverage"
description: >
  Monitoring-coverage and collector-health review for a customer's Zabbix:
  disabled and unreachable hosts, hosts with no templates or triggers,
  templates linked to nothing, site proxies that stopped reporting, proxy
  group HA state, maintenance windows that never end, and disabled web
  scenarios. Covers host status, interface availability and proxy state
  fields across Zabbix 6.x and 7.x. Read-only.
when_to_use: >-
  When checking whether a customer is actually being monitored, onboarding a
  new site into Zabbix, auditing coverage before a QBR, or finding out why a
  site went quiet. Use when: zabbix coverage, unmonitored hosts, zabbix
  proxy offline, site collector down, hosts without templates, zabbix
  onboarding check, stale maintenance, zabbix agent unreachable, or zabbix
  health check.
---

# Zabbix Monitoring Coverage

## Overview

Problem triage only shows what Zabbix can see. This skill checks the things
that make Zabbix go blind: hosts that are disabled or unreachable, hosts with
nothing linked to them, a site proxy that stopped talking to the server, and
maintenance windows that silently suppress a host forever. Run it when a
customer is onboarded, before a quarterly review, and whenever a site
"has been quiet for a suspiciously long time".

Read [api-patterns](../api-patterns/SKILL.md) first. No tool in this
workflow is admin-gated in Conduit. `zabbix_host_interfaces_list` is opt-in
and not listed in Conduit; this skill gets interface availability from
`zabbix_hosts_list` with `selectInterfaces` instead.

## Anti-triggers

- **What is broken right now on monitored hosts** - use
  [problem-triage](../problem-triage/SKILL.md).
- **Availability percentages for a customer report** - use
  [sla-reporting](../sla-reporting/SKILL.md).

## Key Concepts

| Object | Field | Values |
|--------|-------|--------|
| Host | `status` | 0 monitored, 1 not monitored (disabled) |
| Host | `maintenance_status` | 1 when a maintenance is in effect |
| Host | `monitored_by` (7.0+) | 0 server, 1 proxy, 2 proxy group |
| Interface | `type` | 1 agent, 2 SNMP, 3 IPMI, 4 JMX |
| Interface | `available` | 0 unknown, 1 available, 2 unavailable; `error` says why |
| Proxy (7.0+) | `state` | 0 unknown, 1 offline, 2 online |
| Proxy | `lastaccess` | Unix time the server last heard from it |
| Proxy (7.0+) | `operating_mode` | 0 active, 1 passive |
| Proxy group (7.0+) | `state` | 0 unknown, 1 offline, 2 recovering, 3 online, 4 degraded |

On Zabbix 6.x proxies have no `state` or `operating_mode`; judge them by
`lastaccess` alone, and the proxy name is in `host`, not `name`. Proxy
groups do not exist before 7.0. Check `zabbix_api_version` first.

## Common Workflows

### Customer coverage review

1. `zabbix_hostgroups_list` with `search: {"name": "<customer>"}` and
   `selectHosts: "count"` for the group IDs and host counts.
2. `zabbix_hosts_list` with `groupids`,
   `output: ["hostid","host","name","status","maintenance_status"]`,
   `selectInterfaces: ["type","ip","dns","available","error"]`,
   `selectParentTemplates: ["name"]`, `selectTags: "extend"`,
   `limit: 500`. If the group is larger than 500, call once per group.
3. Flag, per host:
   - `status: 1` - disabled. Confirm the device was retired, otherwise it is
     a gap.
   - every interface `available: 2` - Zabbix cannot reach it; quote `error`.
   - no parent templates - nothing is collected.
4. `zabbix_triggers_list` with `groupids`, `output: ["triggerid"]`,
   `selectHosts: ["hostid"]` and `monitored: true` (page by host group) to
   find enabled hosts with no active triggers: they collect data but can
   never raise a problem. `zabbix_hosts_list` with `with_triggers: true`
   and `countOutput: true` gives the quick count to compare against.
5. `zabbix_templates_list` with `selectHosts: "count"` to list templates
   linked to no host (cleanup) and to confirm the customer's standard
   templates (OS, network, backup) are actually linked.

### Site collector (proxy) health

1. `zabbix_proxies_list` with
   `selectHosts: "count"` and `output: "extend"`.
2. A proxy whose `lastaccess` is more than a few minutes old (or `state: 1`
   on 7.0+) has stopped reporting. Every host behind it is blind, and Zabbix
   may raise only one internal problem for it, or none.
3. On 7.0+, `zabbix_proxy_groups_list` with `selectProxies: ["name","state"]`
   shows whether HA failover still has a healthy member (`state: 4` degraded
   means one proxy is left).
4. Report each silent proxy with the number of hosts it carries and how long
   it has been silent.

### Maintenance hygiene

1. `zabbix_maintenance_list` with `groupids`, `selectHosts: ["name"]`,
   `selectHostGroups: ["name"]`, `selectTimeperiods: "extend"`.
2. Flag windows whose `active_till` is months or years out, and windows that
   cover a whole customer group. They hide real problems. `maintenance_type`
   1 means "no data collection", which also blanks SLA and trend data.
3. Cross-check `zabbix_hosts_list` with `filter: {"maintenance_status": 1}`
   for hosts in maintenance right now.

### Synthetic checks

`zabbix_web_scenarios_list` with `groupids`, `selectHosts: ["name"]` and
`output: ["httptestid","name","status","delay"]`. `status: 1` means the
scenario is disabled. Authentication fields and sensitive headers are
redacted by the sidecar.

## Gotchas

- **Host count from Zabbix is not the customer's asset count.** Compare
  against the RMM or PSA inventory before calling coverage complete.
- **A disabled host raises no problems.** That is exactly why it belongs on
  this report and never shows up in triage.
- **`available` is per interface.** A host with a working agent interface
  and a dead SNMP interface is partly blind; report the interface type.
- **Proxy offline is easy to miss.** Hosts behind a dead proxy often show
  stale "OK" in dashboards because no new data arrived to change state.
- **Older frontends reject 7.0+ fields.** `selectProxyGroup` and
  `proxy_groupids` fail on 6.x with an invalid-params error.

## Output

Per customer: host count, disabled hosts, unreachable hosts (with error),
hosts with no templates, hosts with no triggers, proxies silent and for how
long, maintenance windows to review. End with the three fixes that close the
biggest blind spots.

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Parameters and errors
- [problem-triage](../problem-triage/SKILL.md) - Open problems
