---
name: "Rootly Services"
description: >
  Use this skill when working with the Rootly service catalog -- listing services,
  managing dependencies, ownership, service health, and understanding how services
  relate to incidents and alerts.
when_to_use: >-
  When listing services, managing dependencies, ownership, service health, and understanding how
  services relate to incidents and alerts. Use when: rootly service, service catalog, service
  dependency, service ownership, service health, service status, or service tier.
---

# Rootly Services

## Overview

The Rootly service catalog provides a centralized registry of all services in your infrastructure. Each service has ownership, tier classification, dependencies, and is linked to incidents and alerts. This enables rapid identification of affected components during incidents and accurate impact assessment.

## Key Concepts

### Service Tiers

Services are classified by business criticality:

- **Tier 1 / Critical** -- Revenue-generating, customer-facing services (e.g., payment processing, API gateway)
- **Tier 2 / High** -- Important internal services (e.g., CI/CD, monitoring)
- **Tier 3 / Medium** -- Supporting services (e.g., internal dashboards, dev tools)
- **Tier 4 / Low** -- Non-critical services (e.g., documentation sites)

### Service Ownership

Each service has:

- **Owner Team** -- Team responsible for the service
- **Slack Channel** -- Communication channel for the service
- **Escalation Policy** -- How alerts are routed
- **Runbooks** -- Links to operational documentation

### Service Dependencies

Rootly tracks upstream and downstream dependencies:

- **Upstream** -- Services this service depends on
- **Downstream** -- Services that depend on this service
- **Impact Analysis** -- When a service is affected, Rootly identifies dependent services at risk

## API Patterns

### List Services

```
rootly_list_services
```

Parameters:
- `team` -- Filter by owning team
- `tier` -- Filter by service tier
- `environment` -- Filter by environment

**Example response:**

```json
{
  "data": [
    {
      "id": "svc-001",
      "type": "services",
      "attributes": {
        "name": "payment-service",
        "slug": "payment-service",
        "description": "Handles payment processing via Stripe",
        "tier": "tier_1",
        "owner": { "name": "Platform Team" },
        "slack_channel": "#payment-service",
        "status": "operational",
        "incidents_count": 2,
        "dependencies_count": 3
      }
    }
  ]
}
```

### Get Service Details

```
rootly_get_service
```

Parameters:
- `service_id` -- The service ID

### Create Service

```
rootly_create_service
```

Parameters:
- `name` -- Service name (required)
- `description` -- Service description
- `tier` -- Service tier
- `team_id` -- Owning team ID
- `slack_channel` -- Associated Slack channel

### Update Service

```
rootly_update_service
```

Parameters:
- `service_id` -- The service ID
- `name` -- Updated name
- `description` -- Updated description
- `tier` -- Updated tier
- `team_id` -- Updated owning team

## Common Workflows

### Service Health Check

1. Call `rootly_list_services` to get all services
2. Cross-reference with active incidents via `rootly_list_incidents`
3. Identify services with open incidents
4. Check dependency chains for cascading impact
5. Report overall service health summary

### Service Dependency Analysis

1. Get service details with `rootly_get_service`
2. Review upstream and downstream dependencies
3. Identify single points of failure
4. Assess blast radius for potential outages
5. Recommend redundancy improvements

### Incident Impact Assessment

1. Get incident details to identify affected services
2. For each affected service, look up downstream dependencies
3. Assess total impact scope (direct + transitive dependencies)
4. Determine affected teams and escalation paths
5. Communicate impact to relevant stakeholders

## Error Handling

### Service Not Found

**Cause:** Invalid service ID or service deleted
**Solution:** List services to verify the correct ID

### Duplicate Service Name

**Cause:** Service with this name already exists
**Solution:** Use a unique name or update the existing service

### Invalid Tier

**Cause:** Tier value doesn't match configured tiers
**Solution:** Use valid tier values (tier_1, tier_2, tier_3, tier_4)

## Best Practices

- Keep the service catalog up to date as infrastructure evolves
- Assign clear ownership for every service
- Map dependencies accurately for blast radius analysis
- Use consistent naming conventions for services
- Link services to monitoring dashboards and runbooks
- Review service tiers quarterly as business priorities change
- Tag services with environments for accurate incident scoping
- Track incident frequency per service to identify reliability gaps

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents affecting services
- [alerts](../alerts/SKILL.md) - Alert routing by service
- [workflows](../workflows/SKILL.md) - Service-triggered workflows
