---
description: Report control and configuration drift since the last known-good baseline for a client or the whole portfolio
argument-hint: "[client]"
arguments: [client]
---

# Drift Report

Compare a client's current configuration against the last known-good compliance baseline and report what changed, prioritized by how much each change matters. Omit `client` to run across the whole portfolio.

## Prerequisites

- Conduit MCP Gateway connected (`conduit`)
- CIPP and/or Liongard connected for the target client(s) — at least one is required to have anything to diff
- A prior baseline is helpful but not required; if none exists, this run establishes one

## Steps

1. **Discover available tools.** Call `conduit__search_tools` to confirm which of CIPP, Liongard, and (optionally) a connected PSA are available — drift detection degrades per plane based on what's connected.
2. **Scope the run.** If `client` is given, resolve it to its M365 tenant (CIPP) and/or Liongard environment. If omitted, enumerate all clients with at least one compliance-relevant connector (e.g. via `cipp__list_tenants` and `liongard__environments_list`) and run the report for each.
3. **Invoke the `control-drift-reporter` agent** for the resolved scope. The agent retrieves the last accepted baseline, re-runs live checks (`cipp__run_standards_check`, `liongard__timeline_list` / `liongard__detections_list`), diffs against baseline, and attempts to correlate each change with a PSA ticket if one is connected.
4. **Present the report**, prioritized findings first (security-weakening and unauthorized/unconfirmed at the top), followed by lower-priority administrative and tightening drift.
5. **If portfolio-wide**, close with a rollup table ranking clients by number of high-priority findings.

## Arguments

| Argument | Required | Default | Description |
|---|---|---|---|
| `client` | No | — (portfolio-wide) | The client/organization name to check for drift. Omit to run across every client with a compliance-relevant connector. |

## Examples

### Single client drift check

```
/compliance-pack:drift-report "Acme Corp"
```

### Portfolio-wide drift sweep

```
/compliance-pack:drift-report
```

## Output

```
================================================================================
Control Drift Report — Acme Corp
================================================================================
Baseline Date:     2026-06-01 (last accepted standards check)
Comparison Date:   2026-07-14
Findings:          4 (1 unauthorized/high-priority)

--------------------------------------------------------------------------------
Priority 1 — Security-Weakening, Unauthorized/Unconfirmed
--------------------------------------------------------------------------------
[!] Conditional access policy "Require MFA - All Users" scope narrowed to
    exclude 3 accounts on 2026-07-02. No matching PSA change ticket found.
    Recommended: confirm with client/tech who made this change; restore scope
    or document justification.

--------------------------------------------------------------------------------
Priority 2 — Security-Weakening, Authorized
--------------------------------------------------------------------------------
[✓] Firewall rule loosened 2026-07-05 for vendor migration (Ticket #4821),
    reverted 2026-07-06 per Liongard timeline. No action needed.

--------------------------------------------------------------------------------
Priority 3 — Administrative / Cosmetic
--------------------------------------------------------------------------------
- 2 license SKU reassignments within same tier

--------------------------------------------------------------------------------
Coverage Notes
--------------------------------------------------------------------------------
CIPP and Liongard both checked. No PSA connector present — ticket correlation
was attempted via manual note search only and could not be confirmed for two
findings; they are conservatively classified as unconfirmed rather than authorized.
================================================================================
```

## Error Handling

### No baseline exists

```
No prior accepted baseline found for Acme Corp.

This run's results are being recorded as the new baseline. Re-run this command
on a regular cadence to begin detecting drift against it.
```

### No compliance connectors available

```
No CIPP or Liongard connector found for Acme Corp via conduit__search_tools.

Drift detection requires at least one of these. Connect CIPP for identity-plane
drift or Liongard for infrastructure drift, then re-run.
```

### Client not found (single-client mode)

```
Client "Acme Corp" not found among connected tenants/environments.

Verify the name against cipp__list_tenants or liongard__environments_list output.
```

## Related Commands

- `/compliance-pack:evidence-pack` — build a full evidence package once drift has been reviewed and resolved
- `/compliance-pack:questionnaire` — reflect any known drift in cyber-insurance answers rather than answering from a stale baseline
