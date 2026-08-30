---
description: Check service health and dependency status across the Rootly service catalog
argument-hint: "[service] [team]"
arguments: [service, team]
---

# Check Service Health

Check the health status of services in the Rootly service catalog by cross-referencing with active incidents. Provides a summary of which services are affected, their severity levels, and dependency impact.

## Prerequisites

- Rootly MCP server connected with valid API credentials
- MCP tools `list_services` and `list_incidents` available

## Steps

1. **Fetch services from the catalog**

   Call `list_services` to list all services (optionally filtered by `filter[name]`). Include owner team (`owner_group_ids`) and description. Rootly has no built-in tier/criticality field -- if your org tracks one, it lives in a custom field, not on the service record itself.

2. **Fetch active incidents**

   Call `list_incidents` with `filter[status]=in_triage` and `filter[status]=detected` to find all active incidents. Also include `filter[status]=mitigated` for partially resolved issues.

3. **Map incidents to services**

   Cross-reference active incidents' `service_ids` with the fetched services to determine which services currently have open incidents.

4. **Build service health table**

   For each service, show:
   - Service name and owning team
   - Current status (operational, degraded, outage) inferred from open incidents
   - Number and severity of active incidents
   - Dependency count (`service_ids` on the record)

5. **Identify cascading impact**

   For services with active incidents, check their `service_ids` (dependent services) to flag services that may be indirectly affected.

6. **Provide summary**

   Show overall health metrics: total services, services with active incidents, and services at risk from dependencies.

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
- **Service Name Not Found:** Check the exact service name; call `list_services` to list available services

## Related Commands

- `/incident-triage` - Triage active incidents
- `/create-incident` - Create a new incident for an affected service
- `/action-items` - List outstanding action items
