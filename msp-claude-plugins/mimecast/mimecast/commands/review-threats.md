---
description: Review Mimecast TTP threat logs for URL clicks, malicious attachments, and impersonation attempts
argument-hint: "[start] [end] [type] [blocked_only]"
arguments: [start, end, type, blocked_only]
---

# Mimecast Threat Review

Review Targeted Threat Protection (TTP) logs from Mimecast to identify phishing URL clicks, malicious attachment detections, impersonation attempts, and active threat remediation incidents. This is the primary daily security operations command for Mimecast-protected tenants.

## Prerequisites

- Mimecast MCP server connected with valid credentials
- MCP tools `mimecast_get_ttp_logs` and `mimecast_get_threat_incidents` available
- TTP (Targeted Threat Protection) licensed and enabled in the tenant

## Steps

1. **Retrieve URL protection logs**

   Call `mimecast_get_ttp_logs` with `type=url` for the specified date range (default: past 24 hours). Paginate through all results.

2. **Retrieve attachment protection logs**

   Call `mimecast_get_ttp_logs` with `type=attachment` for the same date range.

3. **Retrieve impersonation protection logs**

   Call `mimecast_get_ttp_logs` with `type=impersonation` for the same date range.

4. **Retrieve threat remediation incidents**

   Call `mimecast_get_threat_incidents` for the same date range.

5. **Analyze and summarize findings**

   Present a structured threat summary:
   - **URL Protection:** Count of blocked vs. allowed clicks; list malicious URLs and affected users
   - **Attachment Protection:** Count of malicious attachments blocked; list filenames and threat definitions
   - **Impersonation:** Count of impersonation attempts; list lookalike domains detected
   - **Threat Incidents:** List open remediation incidents with affected user counts

6. **Flag critical items**

   Escalate immediately if any of the following are found:
   - URL clicks with `action=allow` and `scanResult=malicious` — user accessed a confirmed malicious URL
   - Attachment detections with `result=malicious` and `action=allow` — malware may have been delivered
   - Impersonation events with `action=allow` — executive spoofing reached the inbox

7. **Provide recommendations**

   Based on findings, suggest next steps:
   - For users who clicked malicious URLs: initiate credential reset and security review
   - For malware attachments delivered: isolate affected systems
   - For impersonation in inbox: alert the targeted user and review email security policies

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| start | string | No | -24h | Start datetime (ISO 8601) |
| end | string | No | now | End datetime (ISO 8601) |
| type | string | No | all | TTP log type: url, attachment, impersonation, or all |
| blocked_only | boolean | No | false | Show only blocked/malicious events |

## Examples

### Daily Threat Review (All Types, Last 24 Hours)

```
/review-threats
```

### Review Past Week's Threats

```
/review-threats --start "2026-02-24T00:00:00Z" --end "2026-03-02T23:59:59Z"
```

### Review URL Threats Only

```
/review-threats --type url
```

### Show Only Blocked/Malicious Events

```
/review-threats --blocked_only true
```

## Error Handling

- **No TTP data returned:** Verify TTP is enabled in Mimecast Administration Console under Services > Targeted Threat Protection
- **Authentication errors:** Verify Mimecast credentials and region configuration
- **Partial results:** Use pagination — large tenants may have many TTP events; narrow the date range if needed

## Related Commands

- `/trace-message` - Trace a specific suspicious email
- `/check-queue` - Check delivery queue for held messages
