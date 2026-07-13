---
description: Create a new incident in Rootly with title, severity, and affected services
argument-hint: "<title> [severity] [services] [summary]"
arguments: [title, severity, services, summary]
---

# Create Rootly Incident

Create a new incident in Rootly with the specified title, severity, and affected services. Automatically looks up severity and service IDs before creating the incident.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `incidents_post`, `severities_get`, `services_get`, and `teams_get` available

## Steps

1. **Look up severity ID**

   Call `severities_get` to list available severity levels. Match the specified severity name or slug to get the UUID.

2. **Look up service IDs**

   If `services` is provided, call `services_get` to find matching service records by name. Collect the UUIDs for each.

3. **Look up team IDs**

   If services have owning teams, include the team IDs for proper routing and on-call paging.

4. **Create the incident**

   Call `incidents_post` with:
   - `title` -- the provided title
   - `severity_id` -- the UUID from step 1
   - `service_ids` -- the UUIDs from step 2 (if provided)
   - `team_ids` -- the UUIDs from step 3 (if available)
   - `summary` -- the provided summary (if provided)

5. **Confirm creation**

   Display the created incident with its sequential ID (e.g., INC-342), URL, severity, and status.

6. **Suggest next steps**

   Recommend calling `find_related_incidents` to check for similar past incidents and `suggest_solutions` for remediation suggestions.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| title | string | Yes | | Short description of the incident |
| severity | string | No | high | Severity level (critical, high, medium, low) |
| services | string | No | | Comma-separated affected service names |
| summary | string | No | | Detailed description of the incident |

## Examples

### Create a Critical Incident

```
/create-incident --title "Database connection pool exhaustion" --severity critical --services "payment-service,api-gateway"
```

### Create a High Severity Incident

```
/create-incident --title "Elevated error rates on checkout flow" --summary "5xx errors increased to 15% on the checkout endpoint starting at 14:30 UTC"
```

### Create a Low Severity Incident

```
/create-incident --title "Intermittent timeout on internal dashboard" --severity low
```

## Error Handling

- **Severity Not Found:** Verify the severity slug matches configured severities; call `severities_get` to list valid options
- **Service Not Found:** Verify service names match the service catalog; call `services_get` to list valid services
- **Authentication Error:** Verify `ROOTLY_API_TOKEN` is set correctly

## Related Commands

- `/incident-triage` - Triage active incidents
- `/postmortem-summary` - Generate postmortem after resolution
- `/service-status` - Check service health
