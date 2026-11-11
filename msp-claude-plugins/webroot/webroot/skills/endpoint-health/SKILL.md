---
name: "Webroot Endpoint Health"
description: >
  Webroot endpoint protection posture triage: console-wide and per-site
  statistics (infected, needs attention, active threats), stale agents by
  last seen, outdated agent versions, endpoints on detect-only or unmanaged
  policies, SkyStatus agent status classes, and coverage gaps against the
  site's expected device count. Read-only; remediation happens in the GSM
  console.
when_to_use: >-
  When checking whether a customer's or the whole console's Webroot
  protection is healthy, finding infected or stale endpoints, or confirming
  a new client's deployment. Use when: webroot health, infected devices,
  webroot needs attention, stale webroot agents, webroot agent version,
  webroot coverage, webroot deployment check, or webroot policy audit.
---

# Webroot Endpoint Health

## Overview

The daily "is Webroot protecting everyone?" pass. Start wide with the statistics tools,
then drill into the sites and endpoints that stand out. Every tool here is in Conduit's
Read group; none needs Admin access.

## Anti-triggers

- **Detection details** (which file, which malware group, which URL or domain): use
  [threat-review](../threat-review/SKILL.md).
- **Seat counts and billing**: use [usage-reconciliation](../usage-reconciliation/SKILL.md).

## Workflow: console-wide triage

1. `webroot_statistics_console_get`: devices installed, infected, requiring attention and
   with active threats, plus active, trial, expired, expiring, suspended and deactivated
   site counts. If infected, attention and active-threat counts are all zero, say so and
   stop unless the user asked for staleness.
2. `webroot_sites_list`: every site in one call. Rank by PCs infected in the last 24 hours,
   and note deactivated or suspended sites that still report endpoints.
3. For each flagged site, `webroot_statistics_site_get` for its current counts.
4. Drill into a site with the per-site workflow below.

## Workflow: one site

1. Resolve the `siteId` (`webroot_sites_list`, or `webroot_sites_lookup` from a keycode).
2. **Infected or recently infected.** `webroot_endpoints_list` with `type` = `active`,
   `order` = `lastinfected`, `orderDirection` = `D`. The top of the list is the most
   recently infected. Hand those to [threat-review](../threat-review/SKILL.md) for detail.
3. **Stale agents.** `webroot_endpoints_list` with `type` = `active`, `order` = `lastseen`,
   `orderDirection` = `A`. Endpoints not seen for 7+ days are either offline, rebuilt
   without the agent being deactivated, or have a broken agent. More than 30 days usually
   means a retired machine still holding a seat.
4. **Agent versions.** `webroot_endpoints_list` with `order` = `agentversion`. Group by
   version; a long tail of old versions on machines that are online means updates are
   failing, not that the machines are off.
5. **Policy.** `webroot_policies_list_site` (and `webroot_policies_list` for GSM-level
   policies) to map policy IDs to names, then group the endpoint list by policy. Webroot's
   built-in policies include a detect-only *Silent Audit* policy and an *Unmanaged*
   policy; endpoints on either are not being remediated automatically. Confirm the names
   from the policy list rather than assuming them.
6. **Groups.** `webroot_groups_list` and `webroot_groups_list_endpoints` when the
   customer organises endpoints by group (servers, laptops, a branch office) and the
   question is about one group.
7. **Coverage gap.** Compare the site's total endpoints with the device count the
   customer expects (from the RMM or PSA, if those plugins are connected). Webroot cannot
   see machines that never got the agent.

## Agent status (SkyStatus)

`webroot_agent_status_site` (by **site keycode**) and `webroot_agent_status_gsm` (all
sites) return the agent's own view: versions, first/last seen, and the info classes you
request. Ask for only what you need:

| Question | `returnedInfo` |
|---|---|
| Which protection features are on | `EnabledFeatures` |
| Scan and seen times, counters | `TimesAndStats` |
| OS and agent versions | `OSAndVersions` |
| Scan schedule | `Scheduling` |

Use `modifiedSince` for "what changed since yesterday" runs, and follow
`ContinuationToken` until it stops.

## Output

For each site reviewed: endpoints total, infected now, needing attention, stale (7+ and
30+ days), on a detect-only or unmanaged policy, and on an outdated agent version. End
with the actions a technician should take in the GSM console (scan, cleanup, deactivate
retired devices, move to a protective policy). This plugin cannot perform any of them.

## Gotchas

- `webroot_endpoints_list` includes deactivated endpoints unless `type` = `active`.
  Deactivated devices are not protected; count them separately.
- Statistics are current counts, not trends. For a trend, compare against a previous
  report or use threat history.
- Page with `pageNr` until you have `TotalAvailable` endpoints before reporting a count.
