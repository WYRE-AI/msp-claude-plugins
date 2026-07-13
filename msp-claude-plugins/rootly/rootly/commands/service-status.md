---
description: Check service health and dependency status across the Rootly service catalog
argument-hint: "[service] [team]"
arguments: [service, team]
---

# Check Service Health

Check the health status of services in the Rootly service catalog by cross-referencing with active incidents. Provides a summary of which services are affected, their severity levels, and dependency impact.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `services_get` and `incidents_get` available

## Steps

1. **Fetch services from the catalog**

   Call `services_get` to list all services (or filter by name or team if specified). Include service tier, owner team, and description.

2. **Fetch active incidents**

   Call `incidents_get` with `status=in_triage` and `status=detected` to find all active incidents. Also include `status=mitigated` for partially resolved issues.

3. **Map incidents to services**

   Cross-reference active incidents with their affected services to determine which services currently have open incidents.

4. **Build service health table**

   For each service, show:
   - Service name and tier
   - Current status (operational, degraded, outage)
   - Number and severity of active incidents
   - Owning team
   - Dependency count

5. **Identify cascading impact**

   For services with active incidents, check downstream dependencies to flag services that may be indirectly affected.

6. **Provide summary**

   Show overall health metrics: total services, services with active incidents, services at risk from dependencies, and a breakdown by tier.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| service | string | No | all | Filter to a specific service by name |
| team | string | No | all | Filter services by owning team |

## Examples

### Check All Service Health

```
/service-status
```

### Check a Specific Service

```
/service-status --service "payment-service"
```

### Check Services by Team

```
/service-status --team "Platform Team"
```

## Error Handling

- **No Services Found:** Verify the service catalog has been populated in Rootly
- **Authentication Error:** Verify `ROOTLY_API_TOKEN` is set correctly
- **Service Name Not Found:** Check the exact service name; call `services_get` to list available services

## Related Commands

- `/incident-triage` - Triage active incidents
- `/create-incident` - Create a new incident for an affected service
- `/action-items` - List outstanding action items
