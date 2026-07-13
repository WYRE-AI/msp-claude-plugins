---
description: Create a new PagerDuty incident on a service
argument-hint: "<title> <service_name> [urgency] [details]"
arguments: [title, service_name, urgency, details]
---

# Create PagerDuty Incident

Create a new incident on a specified service. The incident will be routed through the service's escalation policy, notifying the on-call responder according to urgency-based notification rules.

## Prerequisites

- PagerDuty MCP server connected with valid API token
- MCP tools `list_services`, `create_incident`, and `list_oncalls` available

## Steps

1. **Resolve the service**

   Call `list_services` with `query` set to the provided `service_name`. If multiple services match, present them and ask the user to clarify. Extract the service ID.

2. **Confirm the on-call responder**

   Call `list_oncalls` filtered by the service's escalation policy to show who will be notified. Present the on-call chain so the user can confirm before creating.

3. **Create the incident**

   Call `create_incident` with:
   - `type`: `incident`
   - `title`: the provided title
   - `service`: `{ "id": "<service_id>", "type": "service_reference" }`
   - `urgency`: the provided urgency (default: high)
   - `body`: `{ "type": "incident_body", "details": "<details>" }` if details are provided

4. **Confirm creation**

   Display the created incident number, ID, title, service, urgency, and assigned responder.

5. **Provide next steps**

   Suggest monitoring the incident with `/incident-triage` and checking the on-call responder's acknowledgement status.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| title | string | Yes | | Short summary of the incident |
| service_name | string | Yes | | Name of the service to create the incident on |
| urgency | string | No | high | Urgency level (high, low) |
| details | string | No | | Detailed description of the incident |

## Examples

### Create a High-Urgency Incident

```
/create-incident --title "Payment processing failures" --service_name "Payment API"
```

### Create a Low-Urgency Incident with Details

```
/create-incident --title "Elevated latency on search" --service_name "Search Service" --urgency low --details "P99 latency increased from 200ms to 800ms starting at 14:00 UTC. No errors, just slowness."
```

## Error Handling

- **Service Not Found:** Verify the service name; use `list_services` to find available services
- **Service Disabled:** Cannot create incidents on disabled services; enable the service first
- **Authentication Error:** Verify `PAGERDUTY_API_TOKEN` is set correctly
- **Missing Required Fields:** Title and service are required

## Related Commands

- `/incident-triage` - Triage open incidents including the newly created one
- `/escalate-incident` - Escalate the incident if the responder doesn't acknowledge
- `/oncall-schedule` - Check who will be notified
- `/service-health` - Check service health before creating
