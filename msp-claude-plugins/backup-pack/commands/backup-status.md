---
description: Portfolio-wide backup job health snapshot - failure count, at-risk clients, and storage trends
argument-hint: ""
arguments: []
---

# Backup Status

Cross-vendor, portfolio-wide backup job health snapshot: active failure count,
missed backups, at-risk clients, and storage trends — pulled from whatever backup
and BCDR tools the org has connected through the gateway.

## Prerequisites

- WYRE MCP Gateway connected (`conduit`) with at least one backup/BCDR connector
  (Datto BCDR, Datto SaaS Protection, Spanning, or Unitrends). Without one, there is
  no backup job data to report on.

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to determine which
   backup/BCDR connectors are live and what their actual tool names are (e.g.
   `datto-bcdr__list_devices`, `spanning__list_jobs`). Never assume a specific
   vendor's tool surface — a portfolio commonly has more than one backup/BCDR tool
   connected at once (an on-prem appliance plus a SaaS-backup tenant).

2. **Invoke the `backup-health-auditor` agent** for the full portfolio (no client
   scope). The agent normalizes image-based appliance backups and SaaS-data snapshot
   backups into one comparable health view per the `backup-job-health` skill.

3. **Assemble and return the snapshot**, in the order: active failure streaks →
   missed backups → storage risk → healthy summary. Lead with whichever category has
   the most urgent finding if one clearly dominates (e.g., a mission-critical system
   with a multi-night failure streak).

## Arguments

This command takes no arguments — it always reports the full portfolio across
whatever backup/BCDR tools are connected. Use `/backup-pack:restore-check [client]`
or `/backup-pack:retention-audit [client]` to scope to a single client.

## Examples

### Basic Usage

```
/backup-pack:backup-status
```

## Output

```
================================================================================
Backup Status — [Date]
================================================================================

ACTIVELY FAILING
--------------------------------------------------------------------------------
[Client] — [protected unit] ([vendor]): [N] consecutive failures, last success [date]
...

MISSED BACKUPS
--------------------------------------------------------------------------------
[Client] — [protected unit] ([vendor]): no run recorded since [date]
...

STORAGE RISK
--------------------------------------------------------------------------------
[Client] — [appliance/tenant]: [approaching capacity X% / anomalous growth]
...

PORTFOLIO SUMMARY
--------------------------------------------------------------------------------
Protected units assessed:  [N]
Healthy:                   [N]
Actively failing:          [N]
Missed:                    [N]
Storage risk:               [N]
================================================================================
```

## Error Handling

- **No backup/BCDR connector connected:** Report plainly that a backup status
  snapshot can't be produced without one, and stop rather than fabricating figures.
- **A connected tool doesn't expose storage/quota data:** Note the storage-risk
  section as "unable to verify" for that vendor rather than omitting it silently.

## Related Commands

- `/backup-pack:restore-check [client]` — deeper restore-test verification, optional
  single-client scope
- `/backup-pack:retention-audit [client]` — retention/RPO compliance against
  contracted requirements, optional single-client scope
