---
description: Triage open Blumira findings by severity, presenting a prioritized list for review
argument-hint: "[severity] [limit]"
arguments: [severity, limit]
---

# Finding Triage

## Prerequisites

- Valid Blumira JWT token configured
- Access to the organization's findings

## Steps

1. Call `blumira_findings_list` with `status.eq=10` (Open) and `order_by=-severity` to get open findings sorted by severity
2. If severity argument provided, add `severity.eq=<value>` filter
3. Group findings by severity level (CRITICAL → HIGH → MEDIUM → LOW)
4. Present a summary table with finding ID, severity, title, and creation date
5. Highlight CRITICAL and HIGH findings that need immediate attention
6. Show total counts per severity level

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| severity | string | No | Filter to specific severity (CRITICAL, HIGH, MEDIUM, LOW) |
| limit | number | No | Max findings to show (default 25) |

## Examples

### Basic Usage

```
/finding-triage
```

### Filter to Critical Only

```
/finding-triage --severity CRITICAL
```

### Show More Results

```
/finding-triage --limit 50
```

## Error Handling

- **No open findings:** Report that all findings are resolved — clean slate
- **Authentication error:** Prompt to verify JWT token
- **Rate limited:** Retry with smaller page size

## Related Commands

- `/investigate-finding` - Deep dive into a specific finding
- `/resolve-finding` - Resolve a finding after investigation
- `/security-posture` - Overall security posture review
