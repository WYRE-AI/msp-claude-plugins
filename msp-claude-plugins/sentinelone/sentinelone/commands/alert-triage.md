---
description: Triage new and unresolved SentinelOne alerts by severity
argument-hint: "[severity] [view_type] [limit]"
arguments: [severity, view_type, limit]
---

# SentinelOne Alert Triage

Triage new and unresolved alerts across all managed client environments. Lists alerts filtered by NEW status, sorted by severity, with a summary of alert counts by severity level. This is the primary daily workflow for MSP security operations.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `list_alerts` and `get_alert` available
- Token must be Account or Site level (NOT Global)

## Steps

1. **Fetch new alerts sorted by severity**

   Call `list_alerts` with `status=NEW`, `sortBy=severity`, `sortOrder=DESC`, and the specified `limit`. If a `severity` filter is provided, include it. If a `view_type` is provided, include it.

2. **Count alerts by severity**

   Aggregate the results to show counts of CRITICAL, HIGH, MEDIUM, LOW, INFO, and UNKNOWN alerts.

3. **Build triage summary table**

   For each alert, extract: alert ID, severity, name, detection time, affected endpoint, and site (client).

4. **Highlight critical items**

   Flag any CRITICAL or HIGH severity alerts that need immediate attention and identify which clients are affected.

5. **Provide next-step recommendations**

   Suggest investigating the most critical alerts first using `/investigate-alert`.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| severity | string | No | all | Filter by severity (CRITICAL, HIGH, MEDIUM, LOW, INFO) |
| view_type | string | No | ALL | Alert domain filter (ALL, CLOUD, KUBERNETES, IDENTITY, etc.) |
| limit | integer | No | 50 | Maximum number of alerts to return |

## Examples

### Triage All New Alerts

```
/alert-triage
```

### Triage Critical Alerts Only

```
/alert-triage --severity CRITICAL
```

### Triage Cloud Alerts

```
/alert-triage --view_type CLOUD
```

### Triage with Higher Limit

```
/alert-triage --limit 100
```

### Triage Critical and High Cloud Alerts

```
/alert-triage --severity HIGH --view_type CLOUD --limit 25
```

## Output

### Triage Summary

```
SentinelOne Alert Triage
================================================================
Generated: 2026-02-24
Status: NEW (Unreviewed)
View: ALL

Alert Severity Summary:
+----------+-------+
| Severity | Count |
+----------+-------+
| CRITICAL | 3     |
| HIGH     | 12    |
| MEDIUM   | 28    |
| LOW      | 45    |
| INFO     | 7     |
+----------+-------+
Total: 95 new alerts

CRITICAL Alerts (Immediate Action Required):
+------------+----------+----------------------------------------+-----------------------+------------------+
| Alert ID   | Severity | Name                                   | Detected              | Client / Asset   |
+------------+----------+----------------------------------------+-----------------------+------------------+
| 1234567890 | CRITICAL | Ransomware Activity Detected           | 2026-02-24 08:15 UTC  | Acme / ACME-WS-042 |
| 1234567891 | CRITICAL | Credential Dump via LSASS              | 2026-02-24 07:42 UTC  | TechStart / TS-SRV-01 |
| 1234567892 | CRITICAL | Lateral Movement via PsExec            | 2026-02-24 07:30 UTC  | Acme / ACME-DC-01  |
+------------+----------+----------------------------------------+-----------------------+------------------+

HIGH Alerts (Investigate Within 1 Hour):
+------------+----------+----------------------------------------+-----------------------+------------------+
| Alert ID   | Severity | Name                                   | Detected              | Client / Asset   |
+------------+----------+----------------------------------------+-----------------------+------------------+
| 1234567893 | HIGH     | Suspicious PowerShell Execution        | 2026-02-24 08:10 UTC  | Acme / ACME-WS-015 |
| 1234567894 | HIGH     | Encoded Command Line Detected          | 2026-02-24 07:55 UTC  | Global / GL-WS-003 |
| 1234567895 | HIGH     | Unusual Outbound Connection            | 2026-02-24 07:48 UTC  | Metro / MT-WS-021 |
| ...        | ...      | ...                                    | ...                   | ...              |
+------------+----------+----------------------------------------+-----------------------+------------------+
(9 more HIGH alerts)

Clients with Critical Alerts:
  - Acme Corporation: 2 CRITICAL, 4 HIGH
  - TechStart Inc: 1 CRITICAL, 3 HIGH

Recommended Actions:
  1. Investigate CRITICAL alerts immediately:
     /investigate-alert --alert_id "1234567890"
     /investigate-alert --alert_id "1234567891"
     /investigate-alert --alert_id "1234567892"
  2. Review HIGH alerts within 1 hour
  3. Contact Acme Corporation -- multiple critical detections may indicate active incident
================================================================
```

### No New Alerts

```
SentinelOne Alert Triage
================================================================
Generated: 2026-02-24
Status: NEW (Unreviewed)
View: ALL

No new alerts found.

All environments are clear. Last triage recommended: check again in 1 hour.
================================================================
```

### Filtered Results

```
SentinelOne Alert Triage
================================================================
Generated: 2026-02-24
Status: NEW (Unreviewed)
View: CLOUD
Severity Filter: CRITICAL

CRITICAL Cloud Alerts:
+------------+----------+----------------------------------------+-----------------------+------------------+
| Alert ID   | Severity | Name                                   | Detected              | Client / Asset   |
+------------+----------+----------------------------------------+-----------------------+------------------+
| 1234567900 | CRITICAL | Unauthorized Cloud API Access           | 2026-02-24 06:30 UTC  | Acme / AWS us-east-1 |
+------------+----------+----------------------------------------+-----------------------+------------------+
Total: 1 alert

Investigate: /investigate-alert --alert_id "1234567900"
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Possible causes:
  - Service User token is invalid or expired
  - Token is Global-level (must be Account or Site level)
  - MCP server is not configured
  - uvx is not installed

Check your MCP configuration and verify your Service User token.
```

### Authentication Error

```
Error: 401 Unauthorized

Your Service User token may be invalid. Common causes:
  1. Token is a Global-level token (must be Account or Site level)
  2. Token has been revoked or expired
  3. Service User has been disabled

Regenerate at: SentinelOne Console > Policy & Settings > User Management > Service Users
```

### Rate Limit

```
Warning: Rate limit reached during alert retrieval.

Partial results available. Wait 30-60 seconds and retry.
Tip: Use --severity CRITICAL to reduce the result set.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `list_alerts` | Fetch new alerts with severity/status/viewType filters |
| `get_alert` | Get full details for critical alerts |

## Related Commands

- `/investigate-alert` - Deep investigation of a specific alert
- `/hunt-threat` - Hunt for related threats via Purple AI and PowerQuery
- `/vuln-report` - Check vulnerabilities on affected endpoints
- `/posture-review` - Review security posture for affected clients
