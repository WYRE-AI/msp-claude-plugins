---
name: "ScalePad Backup Radar"
description: >
  Use this skill when working with ScalePad Backup Radar — the
  read-only backup monitoring surface: per-client backup health
  records and backup device inventory, in regions us and eu.
when_to_use: >-
  When checking backup health, failed or stale backups, or backup device inventory in Backup 
  Radar. Use when: backup radar, scalepad backup, backup health, failed backups scalepad.
---

# ScalePad Backup Radar

## Overview

Backup Radar aggregates backup job results across vendors and scores
their health. The API surface is read-only (v3): backup health and
backup device inventory per client. Regional: `us` (default) or `eu`
via `X-ScalePad-Region`. Discover this domain's tools with
`scalepad_navigate` (domain `backup-radar`). Requires an active
Backup Radar subscription
(402 otherwise).

## API Tools

| Tool | Purpose |
|------|---------|
| `scalepad_br_backups_list_health` | List backup health records (paginate with `cursor` + `page_size`) |
| `scalepad_br_backups_get_health` | Get one backup health record by ID |
| `scalepad_br_backups_list_devices` | List backup devices per client |

## Common Workflows

1. **Daily failure sweep** — `scalepad_br_backups_list_health`,
   paginate fully, then group by client and surface failures and
   no-result (stale) backups first.
2. **Client backup audit** — `scalepad_br_backups_list_devices` for
   the client's device inventory, cross-checked against
   `scalepad_br_backups_list_health` to find devices with no recent
   successful backup.
3. **Drill into one backup** — `scalepad_br_backups_get_health` with
   the record ID from the list call.

## Error Handling

402 means no active Backup Radar subscription. A consistently empty
result for a known tenant usually means the wrong region — Backup
Radar supports `us` and `eu` only.

## Best Practices

- Everything is read-only — safe for scheduled/repeated sweeps within
  the shared 50-req/5-s rate limit.
- Paginate to completion before reporting totals; partial pages
  undercount failures.
- Pair with Core (`scalepad_core_hardware_assets_list`) to find
  servers that have no backup device at all.

## Related Skills

- [core](../core/SKILL.md) - asset inventory to compare coverage against
- [api-patterns](../api-patterns/SKILL.md) - auth, regions, pagination
