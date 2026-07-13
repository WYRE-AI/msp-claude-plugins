---
description: Review and resolve a Huntress escalation
argument-hint: "<escalation_id>"
arguments: [escalation_id]
---

# Resolve Escalation

Review a Huntress SOC escalation in detail and resolve it after taking appropriate action. Includes escalation context, recommended actions, and related incidents.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tools `huntress_escalations_get`, `huntress_escalations_resolve`, and `huntress_incidents_get` available

## Steps

1. **Get escalation details**

   Call `huntress_escalations_get` with the specified `escalation_id`. Review the title, severity, summary, and recommended actions.

2. **Check related incidents**

   If the escalation references related incidents, call `huntress_incidents_get` for each to understand the full threat context.

3. **Present findings**

   Summarize the escalation, recommended actions, and any related incident details. Highlight urgency.

4. **Resolve escalation**

   After the user confirms actions have been taken, call `huntress_escalations_resolve` to close the escalation.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| escalation_id | string | Yes | The escalation ID to review and resolve |

## Examples

### Review and Resolve an Escalation

```
/resolve-escalation --escalation_id "esc-321"
```

## Error Handling

- **Escalation Not Found:** Verify the escalation ID; use `huntress_escalations_list` to find open escalations
- **Already Resolved:** The escalation may have been resolved by another team member
- **Authentication Error:** Verify API credentials

## Related Commands

- `/incident-triage` - Triage incidents related to escalations
- `/investigate-incident` - Investigate incidents referenced by the escalation
- `/org-health` - Check overall health of the affected organization
