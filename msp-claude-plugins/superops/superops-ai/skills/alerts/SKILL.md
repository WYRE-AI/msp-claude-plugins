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

## Anti-triggers

- **The customer-facing work an alert becomes** — use
  `superops-tickets`; the conversion is described here but the ticket
  lifecycle is not.
- **Alerts from a different RMM** — `atera-alerts`,
  `ninjaone-alerts`, `datto-rmm-alerts`, and N-central active issues
  (`ncentral-monitoring-tasks`) are separate stores with their own
  severity scales.
- **Security detections** — EDR and MDR findings are not RMM alerts; use
  `huntress-incidents`, `sentinelone-alerts`, or
  `rocketcyber-incidents`.
- **Fixing what the alert reports** — remediation runs through
  `superops-runbooks`; resolving an alert does not fix a machine.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `superops_assets_get` | read | Context for the alerting asset |
| `superops_custom_query` | admin | List or read alerts (no typed alert tool exists) |
| `superops_custom_mutation` | admin | Acknowledge or resolve alerts (no typed alert tool exists) |

Anything without a typed tool goes through `superops_custom_query` (read-only GraphQL) or `superops_custom_mutation` (arbitrary GraphQL mutation); both are `admin` tier and need human approval. The GraphQL examples in this skill show what those passthrough calls send.

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

In the published SuperOps schema an `Alert` carries `id`, `message`,
`description`, `severity`, `status`, `createdTime`, `resolvedTime`,
`occurrenceCount`, and `asset` and `policy`. `asset` and `policy` are `JSON`
scalars: select them by name only, with no nested field selection.

See [references/fields.md](references/fields.md) for the complete field reference.

## GraphQL Operations

| Operation | Type | Purpose |
|-----------|------|---------|
| `getAlertList` | query | List/filter alerts across all assets (`input: ListInfoInput!`) |
| `getAlertsForAsset` | query | Alerts scoped to one asset (`input: AssetDetailsListInput!`) |
| `resolveAlerts` | mutation | `input: [ResolveAlertInput]`, each `{ id }`; returns `Boolean` |

The published schema has **no** acknowledge mutation, no single-alert query and no
alert-to-ticket mutation: acknowledge in the SuperOps console, and create a ticket
with `superops_tickets_create`. `getAlertList` returns `listInfo` (`page`,
`pageSize`, `hasMore`, `totalCount`): page with `page`/`pageSize` only while `hasMore`
is `true`.

The longer examples in `references/` and in the alert commands predate the published
schema (`schema/superops.graphql` in superops-mcp) and use fields and operations it
does not define. Check an operation against the schema before sending it.

Filters accept either a scalar or an array for `status` and `severity`
(`"status": "Active"` and `"status": ["Active", "Acknowledged"]` are both valid),
and `createdTime` supports `gte`/`lte` range operators.

See [references/api.md](references/api.md) for the full operation catalog with
request shapes and variable examples.

## Common Workflows

### Alert Triage Workflow

1. Query `getAlertList` filtered to `status: "Active"`, `severity: "Critical"`,
   ordered by `createdTime` ascending (oldest first).
2. Acknowledge the alert being worked in the SuperOps console (there is no API mutation for it).
3. `superops_tickets_create` if the issue needs tracked service delivery.
4. Once fixed, `resolveAlerts` with `input: [{ id: "<alert id>" }]`, sent through `superops_custom_mutation` (admin tier). Never send it without a human approver who has seen the exact mutation.

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
