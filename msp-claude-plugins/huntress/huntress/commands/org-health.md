---
description: Organization health check covering agents, incidents, and escalations
argument-hint: "<organization_id>"
arguments: [organization_id]
---

# Organization Health Check

Comprehensive health check for a Huntress organization, covering agent status, open incidents, and pending escalations. Provides an at-a-glance view of a client's security posture.

## Prerequisites

- Huntress MCP server connected with valid API credentials
- MCP tools for agents, incidents, escalations, and organizations available

## Steps

1. **Get organization details**

   Call `huntress_organizations_get` with the specified `organization_id`.

2. **List agents for the organization**

   Call `huntress_agents_list` filtered by `organization_id`. Summarize total count, online/offline status, and platform distribution.

3. **List open incidents**

   Call `huntress_incidents_list` filtered by `organization_id` and `status=open`. Summarize by severity.

4. **List open escalations**

   Call `huntress_escalations_list` filtered by `organization_id` and open status. Highlight any pending items.

5. **Compile health summary**

   Present a unified view: agent health, incident load, escalation status, and overall risk assessment.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| organization_id | string | Yes | The organization ID to check |

## Examples

### Check Organization Health

```
/org-health --organization_id "org-456"
```

## Error Handling

- **Organization Not Found:** Verify the organization ID; use `huntress_organizations_list` to find it
- **Rate Limit:** This command makes multiple API calls; may hit rate limits for large orgs
- **Authentication Error:** Verify API credentials

## Related Commands

- `/incident-triage` - Triage incidents across all organizations
- `/agent-inventory` - Detailed agent listing
- `/billing-report` - Billing details for the organization
