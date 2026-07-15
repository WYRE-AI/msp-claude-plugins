---
description: Retention and RPO compliance audit against contracted requirements, for one client or the whole portfolio
argument-hint: "[client]"
arguments: [client]
---

# Retention Audit

Compares actual backup retention configuration and achievable RPO against contracted
or documented requirements, for one client or the whole portfolio. Surfaces gaps
where configured retention falls short of what was promised, where storage capacity
is silently forcing retention shorter than configured, and where current backup
cadence/reliability can't actually meet a contracted recovery point objective. Omit
`client` to run across the whole portfolio.

## Prerequisites

- Conduit MCP Gateway connected (`conduit`)
- At least one backup/BCDR connector (Datto BCDR, Datto SaaS Protection, Spanning, or
  Unitrends) for the target client(s)
- A documented retention/RPO requirement (IT Glue, Hudu, or PSA contract record) is
  helpful but not required — without one, this run reports configured values as
  informational and flags the missing documentation as its own finding

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to confirm which
   backup/BCDR connectors — and, optionally, documentation/PSA connectors — are
   available.
2. **Scope the run.** If `client` is given, resolve it to its protected units and any
   documented retention/RPO requirement. If omitted, enumerate all clients with at
   least one connected backup/BCDR tool and run the audit for each.
3. **Invoke the `retention-compliance-auditor` agent** for the resolved scope. The
   agent pulls actual configured retention and backup cadence, locates the
   contracted/required values where documented, and computes both the retention gap
   (with configuration-gap vs. storage-forced-truncation classified separately) and
   the achievable-RPO-vs-target comparison.
4. **Present the report**, largest retention shortfalls and most severe RPO misses
   first, followed by the full compliance tables and missing-documentation findings.
5. **If portfolio-wide**, close with a rollup ranking clients by gap severity.

## Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `client` | No | — (portfolio-wide) | The client/organization name to audit retention/RPO compliance for. Omit to run across every client with a connected backup/BCDR tool. |

## Examples

### Single client retention audit

```
/backup-pack:retention-audit "Acme Corp"
```

### Portfolio-wide retention/RPO sweep

```
/backup-pack:retention-audit
```

## Output

```
================================================================================
Retention & RPO Compliance Report — Acme Corp
================================================================================
Retention gaps found:  1
RPO gaps found:        1

--------------------------------------------------------------------------------
Critical Findings
--------------------------------------------------------------------------------
[!] SQL01 (Datto BCDR) — contract requires 365-day retention; appliance is
    configured for 90 days. Shortfall: 275 days. Classification: configuration gap
    (not storage-forced — appliance has ample local headroom).
[!] M365 tenant (Spanning) — contract requires 4-hour RPO; current backup schedule
    is nightly-only. Achievable RPO: ~24 hours (worse on nights with a failed run).

--------------------------------------------------------------------------------
Retention Compliance
--------------------------------------------------------------------------------
Unit          Vendor        Contracted   Configured   Gap        Type
SQL01         Datto BCDR    365 days     90 days      275 days   Configuration gap
FILE01        Datto BCDR    365 days     365 days     None       —

--------------------------------------------------------------------------------
RPO Compliance
--------------------------------------------------------------------------------
Unit          Contracted   Schedule    Achievable RPO   Meets Target
M365 tenant   4 hours      Nightly     ~24 hours        No
================================================================================
```

## Error Handling

### No backup/BCDR connectors available

```
No Datto BCDR, Datto SaaS Protection, Spanning, or Unitrends connector found via
conduit__search_tools.

Retention/RPO compliance checking requires at least one backup/BCDR connector.
Connect one through Conduit, then re-run.
```

### No documented retention/RPO requirement found

```
No contracted retention or RPO value found for Acme Corp in any connected
documentation or PSA contract record.

Reporting actual configured values as informational. This is flagged as its own
finding — "no documented requirement on file" — rather than treated as automatic
compliance.
```

### Client not found (single-client mode)

```
Client "Acme Corp" not found among connected backup/BCDR tenants or appliances.

Verify the name against the connected tool's own client/tenant listing.
```

## Related Commands

- `/backup-pack:backup-status` — portfolio-wide job health snapshot, including the
  storage-trending signal that feeds storage-forced-truncation detection here
- `/backup-pack:restore-check [client]` — restore-test verification (a retention
  window that's never been restore-tested is still a compliance gap even when
  correctly configured)
