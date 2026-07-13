---
description: Escalate a PagerDuty incident to the next level in the escalation policy
argument-hint: "<incident_id> [escalation_level]"
arguments: [incident_id, escalation_level]
---

# Escalate PagerDuty Incident

Escalate an incident to the next level in its escalation policy, notifying the next tier of responders. Use this when the current responder has not acknowledged or when the issue requires more senior attention.

## Prerequisites

- PagerDuty MCP server connected with valid API token
- MCP tools `get_incident`, `update_incident`, `get_escalation_policy`, and `list_oncalls` available

## Steps

1. **Get incident details**

   Call `get_incident` with the specified `incident_id` to retrieve the current status, urgency, service, and escalation policy.

2. **Review current escalation state**

   Call `get_escalation_policy` with the incident's escalation policy ID. Show the full escalation chain with each level's targets and timeouts.

3. **Identify the current and next escalation level**

   Check the incident's log entries with `list_incident_log_entries` to determine the current escalation level. Calculate the next level (or use the specified `escalation_level`).

4. **Show who will be notified**

   Call `list_oncalls` filtered by the escalation policy to show who is at the next escalation level. Present this to the user for confirmation.

5. **Escalate the incident**

   Call `update_incident` with the `escalation_level` set to the target level. This re-triggers notifications to the new tier of responders.

6. **Add an escalation note**

   Call `create_incident_note` to document why the incident was escalated, providing context for the incoming responder.

7. **Confirm escalation**

   Display the updated incident with the new escalation level and assigned responders.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| incident_id | string | Yes | | The incident ID to escalate (e.g., P1234ABC) |
| escalation_level | integer | No | next level | Specific escalation level to jump to |

## Examples

### Escalate to Next Level

```
/escalate-incident --incident_id "P1234ABC"
```

### Escalate to a Specific Level

```
/escalate-incident --incident_id "P1234ABC" --escalation_level 3
```

## Error Handling

- **Incident Not Found:** Verify the incident ID; use `/incident-triage` to list open incidents
- **Incident Already Resolved:** Cannot escalate a resolved incident
- **Maximum Escalation Level Reached:** The incident is already at the highest level; consider reassigning manually
- **Authentication Error:** Verify `PAGERDUTY_API_TOKEN` is set correctly

## Related Commands

- `/incident-triage` - List open incidents to find incident IDs
- `/oncall-schedule` - Check who is on call at each escalation level
- `/create-incident` - Create a new incident
- `/service-health` - Check service health for context
