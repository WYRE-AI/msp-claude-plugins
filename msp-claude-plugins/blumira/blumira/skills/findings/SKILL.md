---
name: "Blumira Findings"
description: >
  The Blumira finding lifecycle: status and severity codes, resolution types, list
  filtering, enriched detail retrieval, assignment, and comment threads.
when_to_use: >-
  When triaging, investigating, assigning, commenting on, or resolving Blumira
  security detections. Use when: blumira finding,
  blumira alert, blumira detection, security finding, triage finding, resolve finding, or finding
  status.
---

# Blumira Findings

## Overview

Findings are Blumira's primary security detection unit — they represent threats, suspicious activity, or policy violations detected across your environment. This skill covers the full finding lifecycle from discovery through resolution.

## Anti-triggers

- **Any client account other than your own org** — every tool here is
  an `/org/*` call scoped to the credential's own organization. With
  MSP credentials these return 403 or an empty set; use `blumira-msp`
  and its `blumira_msp_findings_*` equivalents.
- **Choosing between Valid / Not Applicable / False Positive** — the
  resolve *call* is here, but the disposition semantics and their effect
  on detection tuning are `blumira-resolutions`.
- **A detection from another security product** — "finding", "alert",
  and "detection" are shared vocabulary. Use `huntress-incidents`,
  `sentinelone-alerts`, `blackpoint-incident-response`, or
  `cipp-alerts` depending on which platform raised it.
- **Containing or remediating the threat** — Blumira has no isolate,
  kill, or block action; resolving a finding is a bookkeeping change
  only. Response happens in the EDR or firewall.

## Key Concepts

### Finding Statuses

| Status Code | Label | Description |
|-------------|-------|-------------|
| 10 | Open | New, unreviewed finding |
| 20 | In Progress | Under investigation |
| 30 | Resolved | Closed with a resolution |

### Finding Severity

Findings have severity levels (e.g., LOW, MEDIUM, HIGH, CRITICAL) that indicate the potential impact. Always triage CRITICAL and HIGH findings first.

### Resolution Types

When resolving a finding, you must specify a resolution type:

| Resolution Code | Label | Use When |
|----------------|-------|----------|
| 10 | Valid | Confirmed real threat, action was taken |
| 20 | Not Applicable | Finding doesn't apply to this environment |
| 30 | False Positive | Detection was incorrect |

## API Patterns

### List Findings

```
blumira_findings_list
  status.eq=10          # Open findings only
  severity.in=HIGH,CRITICAL
  order_by=-created     # Most recent first
  page_size=25
```

### Get Finding Details

```
blumira_findings_get
  finding_id=<UUID>
```

```
blumira_findings_details
  finding_id=<UUID>
```

The `details` endpoint returns enriched data including related context, evidence, and recommended actions.

### Resolve a Finding

```
blumira_findings_resolve
  finding_id=<UUID>
  resolution_type=10    # Valid
  notes="Confirmed brute force attempt. Blocked source IP in firewall."
```

### Assign a Finding

```
blumira_findings_assign
  finding_id=<UUID>
  user_id=<UUID>
```

### List Comments

```
blumira_findings_comments_list
  finding_id=<UUID>
```

### Add a Comment

```
blumira_findings_comments_add
  finding_id=<UUID>
  comment="Investigating source IP. Checking firewall logs for correlation."
```

## Common Workflows

### Triage Open Findings

1. `blumira_findings_list` with `status.eq=10` and `order_by=-severity`
2. Review CRITICAL and HIGH findings first
3. For each finding, use `blumira_findings_details` to get context
4. Assign to an analyst with `blumira_findings_assign`
5. Add investigation notes with `blumira_findings_comments_add`

### Investigate a Finding

1. `blumira_findings_get` to retrieve the finding
2. `blumira_findings_details` for enriched context and evidence
3. `blumira_findings_comments_list` to review prior investigation notes
4. Add findings with `blumira_findings_comments_add`
5. Resolve when investigation is complete

### Resolve Multiple Findings

1. `blumira_findings_list` with filters matching the batch (e.g., same detection rule)
2. Review a representative sample to confirm the resolution applies
3. Resolve each with `blumira_findings_resolve` and appropriate resolution type
4. Document the rationale in the notes field

### Filter by Date Range

```
blumira_findings_list
  created.gt=2025-01-01
  created.lt=2025-02-01
  status.eq=10
```

## Error Handling

### Finding Not Found

**Cause:** Invalid finding ID or finding not accessible in current org scope
**Solution:** Verify the finding ID. If using MSP credentials, use `blumira_msp_findings_get` instead.

### Cannot Resolve — Missing Resolution Type

**Cause:** Resolution type not provided or invalid
**Solution:** Provide a valid resolution type: 10 (Valid), 20 (Not Applicable), or 30 (False Positive).

### Cannot Assign — Invalid User

**Cause:** User ID doesn't exist or isn't a member of the organization
**Solution:** Use `blumira_users_list` to get valid user IDs.

## Best Practices

- Always triage by severity: CRITICAL → HIGH → MEDIUM → LOW
- Add comments before resolving to document the investigation trail
- Use resolution types accurately — false positive tracking improves detection tuning
- Filter by date range when reviewing historical findings to avoid overwhelming results
- Assign findings to specific analysts for accountability

## Related Skills

- [API Patterns](../api-patterns/SKILL.md) — Filtering and pagination
- [Resolutions](../resolutions/SKILL.md) — Resolution types in depth
- [Users](../users/SKILL.md) — Finding user IDs for assignment
- [MSP](../msp/SKILL.md) — Cross-account finding management
