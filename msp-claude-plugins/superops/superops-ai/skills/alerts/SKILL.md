---
name: "SuperOps Alerts"
description: >
  SuperOps.ai RMM alerting: alert types, severity levels, status lifecycle
  and valid transitions, asset/client/monitor associations, and the GraphQL
  operations for listing, acknowledging, resolving, and converting alerts
  into tickets. Includes triage, dashboard, and client-reporting workflows.
when_to_use: >-
  When listing, filtering, acknowledging, or resolving alerts from SuperOps.ai monitored assets.
  Use when: superops alert, alert management, list alerts superops, acknowledge alert, resolve alert
  superops, alert severity, monitoring alert, rmm alert, asset alert, or alert status.
---

# SuperOps.ai Alert Management

## Overview

SuperOps.ai RMM generates alerts when monitored conditions are triggered on managed assets. Alerts can indicate hardware issues, software problems, security events, or custom monitoring conditions. This skill covers alert listing, filtering, acknowledgment, resolution, and automated workflows.

## Alert Severity Levels

| Severity | Description | Typical Response |
|----------|-------------|------------------|
| **Critical** | Immediate attention required | Respond within 15 minutes |
| **High** | Significant issue | Respond within 1 hour |
| **Medium** | Moderate concern | Respond within 4 hours |
| **Low** | Informational | Review during business hours |

## Alert Status Values

| Status | Description |
|--------|-------------|
| **Active** | Alert triggered and unaddressed |
| **Acknowledged** | Alert seen, being worked |
| **Resolved** | Issue fixed, alert closed |
| **Auto-Resolved** | Condition cleared automatically |

## Common Alert Types

| Type | Description | Examples |
|------|-------------|----------|
| **Hardware** | Physical component issues | Disk failure, high temperature |
| **Performance** | Resource utilization | High CPU, low memory, disk space |
| **Security** | Security events | Failed logins, malware detected |
| **Service** | Service state changes | Service stopped, process crashed |
| **Patch** | Update related | Critical patch pending |
| **Connectivity** | Network issues | Agent offline, connectivity lost |
| **Custom** | User-defined monitors | Custom script conditions |

## Key Alert Fields

An alert carries `alertId`, `message`, `severity`, `status`, `type`, and the
`createdTime`/`acknowledgedTime`/`resolvedTime` timestamps. It associates to an
`asset`, `client`, `site`, the triggering `monitor`, and optionally a linked
`ticket`. Resolution metadata lives in `acknowledgedBy`, `resolvedBy`, and
`resolutionNotes`.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `getAlertList` | query | List/filter alerts across all assets |
| `getAlertsForAsset` | query | Alerts scoped to one `assetId` |
| `getAlert` | query | Full detail including `monitor` threshold and `history` |
| `acknowledgeAlerts` | mutation | Takes an `alertIds` array — bulk-capable |
| `resolveAlerts` | mutation | Takes `alertIds` plus `resolutionNotes` |
| `createTicketFromAlert` | mutation | Converts an alert to a linked ticket |

Both mutations take arrays (`alertIds`), so a single call handles bulk
acknowledgment or resolution. `getAlertList` returns a `listInfo` block
(`totalCount`, `hasNextPage`, `endCursor`) for cursor pagination.

Filters accept either a scalar or an array for `status` and `severity`
(`"status": "Active"` and `"status": ["Active", "Acknowledged"]` are both valid),
and `createdTime` supports `gte`/`lte` range operators.

See [references/api.md](references/api.md) for the full operation catalog with
request shapes and variable examples.

## Common Workflows

### Alert Triage Workflow

1. Query `getAlertList` filtered to `status: "Active"`, `severity: "Critical"`,
   ordered by `createdTime` ascending (oldest first).
2. `acknowledgeAlerts` on the alert being worked, with investigation notes.
3. `createTicketFromAlert` if the issue needs tracked service delivery.
4. `resolveAlerts` with `resolutionNotes` once fixed.

### Alert Summary Dashboard

Use GraphQL query aliases to fetch several counts in a single request — active
Critical, active High, Acknowledged, and recently Resolved — each reading only
`listInfo { totalCount }`.

### Client Alert Report

Filter `getAlertList` by `client.accountId` plus a `createdTime` `gte`/`lte`
range to produce a period report of alerts raised and resolved.

See [references/api.md](references/api.md) for all three workflow queries.

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Alert not found | Invalid alert ID | Verify alert exists |
| Already resolved | Alert already closed | Check current status |
| Permission denied | Insufficient access | Check user permissions |
| Asset offline | Cannot verify resolution | Note in resolution |
| Rate limit exceeded | Over 800 req/min | Implement backoff |

### Status Transition Rules

```javascript
// Valid alert status transitions
const validTransitions = {
  'Active': ['Acknowledged', 'Resolved'],
  'Acknowledged': ['Resolved', 'Active'],  // Can un-acknowledge
  'Resolved': ['Active'],  // Can reopen if issue returns
  'Auto-Resolved': ['Active']  // Can reopen
};

function canTransition(currentStatus, newStatus) {
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}
```

## Best Practices

1. **Acknowledge promptly** - Show clients issues are being tracked
2. **Create tickets for complex issues** - Link alert to ticket for tracking
3. **Document resolutions** - Helps with recurring issues
4. **Use bulk operations** - One `alertIds` array beats N calls
5. **Set up auto-resolution** - Let transient issues clear themselves
6. **Monitor acknowledgment time** - Track response SLAs
7. **Review alert patterns** - Identify recurring problems

## Related Skills

- [SuperOps.ai Assets](../assets/SKILL.md) - Asset details
- [SuperOps.ai Tickets](../tickets/SKILL.md) - Create tickets from alerts
- [SuperOps.ai Runbooks](../runbooks/SKILL.md) - Automated remediation
- [SuperOps.ai Clients](../clients/SKILL.md) - Client associations
- [SuperOps.ai API Patterns](../api-patterns/SKILL.md) - GraphQL patterns
