---
description: Acknowledge an RMM alert to indicate investigation is underway
argument-hint: "<alert_id> [note]"
arguments: [alert_id, note]
---

# Acknowledge SuperOps.ai Alert

Acknowledge an RMM alert to indicate a technician is aware and investigating the issue.

## How this runs through Conduit

> **This cannot be done through Conduit today.** The published SuperOps GraphQL schema (`schema/superops.graphql` in superops-mcp) defines no acknowledge mutation, so there is nothing to send through `superops_custom_mutation`. Acknowledge the alert in the SuperOps console.

The Conduit `superops` connector has **no alert tool**. Reading the alert goes through `superops_custom_query` (admin tier, read-only), which needs a human approver who has seen the query. Use the typed tools for asset and client context (`superops_assets_list`, `superops_assets_get`, `superops_clients_search`). If the operator has no `admin` grant on SuperOps, stop and say so rather than looking for another route.

## Prerequisites

- Valid SuperOps.ai API token configured
- Alert must exist and be in Active status
- User must have alert management permissions
- RMM module enabled in SuperOps.ai

## Steps

1. **Find the alert** - `getAlertList` through `superops_custom_query` (admin tier, read-only, human approval) to show the alert's `id`, `message`, `severity`, `status` and `asset` for confirmation. Use the typed asset tools for context.
2. **Hand off** - Tell the operator to acknowledge it in the SuperOps console, with the alert ID and any note they want to add. Do not send an `acknowledgeAlerts` mutation; the schema has none.
3. **Confirm** - Once the operator says it is done, re-read the alert and report its status.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| alert_id | string | Yes | - | The alert ID to acknowledge |
| note | string | No | - | Note explaining acknowledgment |

## Examples

### Basic Acknowledgment

```
/acknowledge-alert alert_9876
```

### With Investigation Note

```
/acknowledge-alert alert_9876 --note "Investigating disk space issue"
```

### Detailed Note

```
/acknowledge-alert alert_9876 --note "Verified issue on server. Scheduled maintenance window for 2AM to clear temp files."
```

## Output

### Successful Acknowledgment

```
Alert Acknowledged Successfully

Alert ID: alert_9876
Status: Active -> Acknowledged

Alert Details:
  Asset: ACME-DC01
  Client: Acme Corporation
  Type: Disk Space
  Severity: Critical
  Message: Disk Space Critical: C: drive at 5% free

Acknowledgment:
  Acknowledged By: Jane Technician
  Acknowledged At: 2026-02-04 14:32:00 UTC
  Note: Investigating disk space issue

Next Steps:
- Use /resolve-alert alert_9876 when issue is fixed
- Use /create-ticket to track work if needed
- Use /run-script to run remediation scripts
```

### Already Acknowledged

```
Alert Already Acknowledged

Alert ID: alert_9876
Status: Acknowledged

Current Acknowledgment:
  Acknowledged By: John Smith
  Acknowledged At: 2026-02-04 13:15:00 UTC
  Note: Looking into this

To add another note, use /add-alert-note alert_9876 "Your note"
To resolve the alert, use /resolve-alert alert_9876
```

## Error Handling

### Alert Not Found

```
Alert not found: "alert_99999"

Please verify the alert ID is correct.
Use /list-alerts to find active alerts.
```

### Alert Already Resolved

```
Cannot acknowledge: Alert is already resolved

Alert ID: alert_9876
Status: Resolved
Resolved By: John Smith
Resolved At: 2026-02-04 12:00:00 UTC

Resolved alerts cannot be acknowledged.
To reopen, the condition must trigger a new alert.
```

### Permission Denied

```
Permission denied: You do not have permission to acknowledge alerts.

Required permissions:
- Alert Management
- RMM Access

Contact your administrator to request access.
```

### API Errors

| Error | Resolution |
|-------|------------|
| Invalid alert ID | Verify alert exists using /list-alerts |
| Already acknowledged | Alert is already being worked on |
| Already resolved | Alert was resolved before acknowledgment |
| Permission denied | Check user permissions for alert management |
| Rate limited | Wait and retry (800 req/min limit) |

## Why Acknowledgment Matters

1. **Prevents duplicate work** - Other technicians see someone is handling it
2. **Improves visibility** - Management can see response times
3. **Tracks accountability** - Clear record of who is working on what
4. **Reduces alert fatigue** - Acknowledged alerts can be filtered out
5. **Supports SLAs** - Time to acknowledge is a key metric

## Best Practices

1. **Acknowledge quickly** - Even if you can't fix immediately
2. **Add meaningful notes** - Explain what you're investigating
3. **Follow up or escalate** - Don't let acknowledged alerts sit
4. **Create tickets for complex issues** - Track work properly
5. **Resolve when done** - Don't leave alerts in acknowledged state

## Related Commands

- `/list-alerts` - List active alerts
- `/resolve-alert` - Resolve an alert
- `/create-ticket` - Create ticket from alert
- `/get-asset` - View asset details
- `/run-script` - Run remediation script
