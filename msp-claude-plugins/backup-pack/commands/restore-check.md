---
description: Restore-readiness check - has this actually been restore-tested, for one client or the whole portfolio
argument-hint: "[client]"
arguments: [client]
---

# Restore Check

Runs the restore-readiness check for one client or the whole portfolio: the
strongest available restore-evidence type per protected system (actual restore, boot
verification, screenshot verification, or spot-check restore), classified against a
data-criticality-tiered test cadence, with a recommended test schedule for anything
overdue or never tested. Omit `client` to run across the whole portfolio.

## Prerequisites

- Conduit MCP Gateway connected (`conduit`)
- At least one backup/BCDR connector (Datto BCDR, Datto SaaS Protection, Spanning, or
  Unitrends) for the target client(s)
- Optional: a documentation platform (IT Glue / Hudu) with a data-criticality
  classification, and/or a PSA for DR-test ticket history — both sharpen the result
  but aren't required

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to confirm which
   backup/BCDR connectors — and, optionally, documentation/PSA connectors — are
   available. Restore-evidence depth degrades per system based on what's connected.
2. **Scope the run.** If `client` is given, resolve it to its protected systems
   across connected backup/BCDR tools. If omitted, enumerate all clients with at
   least one connected backup/BCDR tool and run the check for each.
3. **Invoke the `restore-readiness-checker` agent** for the resolved scope. The agent
   resolves the strongest available restore-evidence type per system, applies
   data-criticality tiering, and classifies each system as current, due, overdue, or
   never-tested.
4. **Present the report**, critical findings first — never-tested Tier 1 systems
   lead, followed by overdue systems, then the full status table and a recommended
   test schedule.
5. **If portfolio-wide**, close with a rollup ranking clients by number of
   never-tested/overdue mission-critical systems.

## Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `client` | No | — (portfolio-wide) | The client/organization name to check restore readiness for. Omit to run across every client with a connected backup/BCDR tool. |

## Examples

### Single client restore check

```
/backup-pack:restore-check "Acme Corp"
```

### Portfolio-wide restore-readiness sweep

```
/backup-pack:restore-check
```

## Output

```
================================================================================
Restore Readiness Report — Acme Corp
================================================================================
Systems assessed:   6
Never-tested:       2
Overdue:            1

--------------------------------------------------------------------------------
Critical Findings
--------------------------------------------------------------------------------
[!] SQL01 (Tier 1) — no restore evidence of any kind on record. Backup job has
    succeeded nightly for 90+ days, but this has never been proven recoverable.
    Recommended: schedule a boot/restore verification within 30 days.

--------------------------------------------------------------------------------
Restore-Test Status
--------------------------------------------------------------------------------
System        Vendor          Tier  Evidence            Last Tested   Status
SQL01         Datto BCDR      1     None                Never         NEVER-TESTED
FILE01        Datto BCDR      2     Screenshot           2026-04-02    Current
M365 tenant   Spanning        —     Spot-check restore  2025-11-10    Overdue

--------------------------------------------------------------------------------
Recommended Test Schedule
--------------------------------------------------------------------------------
P1  SQL01        Boot/restore verification   Within 30 days
P2  M365 tenant  Spot-check mailbox restore  Within 60 days
================================================================================
```

## Error Handling

### No backup/BCDR connectors available

```
No Datto BCDR, Datto SaaS Protection, Spanning, or Unitrends connector found via
conduit__search_tools.

Restore-readiness checking requires at least one backup/BCDR connector. Connect one
through Conduit, then re-run.
```

### Client not found (single-client mode)

```
Client "Acme Corp" not found among connected backup/BCDR tenants or appliances.

Verify the name against the connected tool's own client/tenant listing.
```

### Connector present but no restore-test history exposed

```
[Vendor] connector is connected but does not expose restore/screenshot history
through its API for [system]. Marked "unable to verify" rather than assumed
untested — confirm test status manually.
```

## Related Commands

- `/backup-pack:backup-status` — portfolio-wide job health snapshot (is the backup
  even running, before asking whether it's recoverable)
- `/backup-pack:retention-audit [client]` — retention/RPO compliance check
