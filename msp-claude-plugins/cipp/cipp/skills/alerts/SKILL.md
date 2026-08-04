---
name: "cipp-alerts"
description: "CIPP's read-only alerting and audit surface: the cross-tenant alert queue, tenant-scoped M365 unified audit log queries, the audit operations worth filtering on during a compromise investigation, and audit lag/retention behavior."
when_to_use: >-
  When triaging the CIPP alert queue or pulling tenant audit logs for investigation. Use when:
  cipp alert, alert queue, audit log, sign in log, admin activity, cipp investigation, or audit
  trail.
---

# CIPP Alerts & Audit Logs

CIPP raises alerts based on standards violations, anomaly detection, and configured thresholds. The two tools in this skill let you triage the alert queue and pull underlying audit log evidence.

## Anti-triggers

- **A CIPP tool is erroring or a background job failed** — that is
  CIPP's own application log, `cipp_list_logs`, in `cipp-ops`. It is not
  `cipp_list_audit_logs`, which reads the customer tenant's M365
  unified audit log.
- **An endpoint or SIEM detection** — a CIPP alert is a configuration
  or threshold alert about a tenant, never an EDR finding. Use
  `huntress-incidents`, `blumira-findings`, `sentinelone-alerts`, or
  `blackpoint-incident-response` depending on which product raised it.
- **The forensic snapshot for one compromised user** — `cipp_bec_check`
  is in `cipp-users`; the audit-log queries here supplement it rather
  than replace it.
- **Why an alert fired at all** — the standard that raised it, and its
  Report/Alert/Remediate mode, live in `cipp-standards`.

## Tools

### `cipp_list_alert_queue`

```
cipp_list_alert_queue()
```

Returns queued alerts across all tenants — alert type, tenant, severity, raised time, and current status. This is your daily triage list.

### `cipp_list_audit_logs`

```
cipp_list_audit_logs(tenantFilter='contoso.onmicrosoft.com',
                     startDate?, endDate?,
                     userId?, operation?)
```

Tenant-scoped audit log entries from the M365 unified audit log. Filter by date range, user, or operation to narrow investigation scope. Use to investigate suspicious sign-ins, admin role changes, mailbox access, app consent grants, and policy modifications.

## Workflow patterns

### Daily alert triage

1. `cipp_list_alert_queue` — pull the full queue
2. Group by `tenant` + `alertType` to spot patterns (one tenant generating most alerts often signals a broken standard or runaway script)
3. Triage in severity order: critical → high → medium → low
4. For each alert: drill into the related tenant's audit logs with `cipp_list_audit_logs` filtered to the alert window

### Correlate alert → audit evidence

```
alerts = cipp_list_alert_queue()
critical = [a for a in alerts if a['severity'] == 'critical']
for a in critical:
    logs = cipp_list_audit_logs(
        tenantFilter=a['tenantId'],
        startDate=a['raisedAt'] - 30 minutes,
        endDate=a['raisedAt'] + 5 minutes,
    )
```

The 30-minute lookback usually captures the precipitating event (sign-in, admin change, app consent) that caused the alert.

### Common audit operations to filter on

| `operation` value | What it surfaces |
|-------------------|------------------|
| `UserLoggedIn` | Sign-in events |
| `Add member to role` | Role escalation |
| `Consent to application` | New app permissions granted |
| `New-InboxRule` | Mailbox rule creation (BEC indicator) |
| `Set-Mailbox` | Mailbox config changes |
| `Add policy` | Conditional access policy created |
| `Update conditional access policy` | CA policy modified |

### Investigating a suspected compromise

When `cipp_bec_check` flags a user, supplement it with audit log queries:

1. Pull all `UserLoggedIn` operations for the user over the last 7 days — look for unusual countries, IPs, or bursts of failed → success patterns
2. Pull all `New-InboxRule` and `Set-Mailbox` operations — hidden forwarding/auto-delete rules
3. Pull all `Consent to application` operations — illicit consent grants are common BEC vectors

## Caveats

- The unified audit log has a lag (typically minutes, sometimes hours) — recent events may not appear immediately.
- Audit retention varies by license: 90 days for E3, 1 year for E5, longer with audit log retention add-ons. Plan investigations around what the tenant's licensing actually allows.
- `cipp_list_alert_queue` returns active queue items — historic resolved alerts require the CIPP UI.
