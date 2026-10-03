---
name: "Rootly Services"
description: >
  The Rootly service catalog: the real service record (ownership via owner teams/users,
  Slack channels, dependency modeling via linked service IDs, and third-party links to
  PagerDuty/Opsgenie/Cortex/Backstage/GitHub/GitLab), service CRUD, incident/uptime
  charts per service, and how services link back to incidents and alerts. Rootly has no
  built-in tier/criticality field -- that claim is removed, not renamed.
when_to_use: >-
  When browsing or maintaining the Rootly service catalog, or assessing which services an
  incident affects. Use when: rootly service, service catalog, service
  dependency, service ownership, service health, service status, or service tier.
---

# Rootly Services

## Overview

The Rootly service catalog provides a centralized registry of all services in your infrastructure. Each service has ownership, dependencies, and is linked to incidents and alerts. This enables rapid identification of affected components during incidents and accurate impact assessment.

## Anti-triggers

A Rootly service is a technical component with an owning team. It is not
a commercial service, not a service ticket, and not a device record.

- **A managed service you sell and bill for** — service lines, coverage
  scope, and rates live in the contract; use `halopsa-contracts` or
  `autotask-contracts`.
- **A service request from a customer** — that is a ticket type in a
  helpdesk or PSA; use `freshdesk-ticketing`, `halopsa-tickets`, or
  `connectwise-psa-tickets`.
- **PagerDuty's service catalog** — a different vendor's model, keyed on
  integrations and escalation policies. A Rootly service can *link* to a
  PagerDuty service via `pagerduty_id`, but the two catalogs are
  separate; use `pagerduty-services` for PagerDuty's own model.
- **The physical or virtual device behind a service** — asset and CI
  records are `halopsa-assets` or the RMM's device skills.

## Key Concepts

### Rootly Has No Tier/Criticality Field

The Rootly `service` object has no built-in "tier" or "criticality" property. If your org needs a Tier 1 / Tier 2 / Tier 3 classification, model it with a custom field or with naming/labeling conventions -- do not expect a `tier` filter or attribute on the service record itself.

### Service Ownership

Each service can carry:

- **`owner_group_ids`** -- Owning team(s)
- **`owner_user_ids`** -- Owning individual user(s)
- **`slack_channels`** / **`slack_aliases`** -- Communication channels for the service
- **`notify_emails`** -- Emails notified for this service
- **`alert_urgency_id`** -- Default urgency assigned to alerts tied to this service (see [alerts](../alerts/SKILL.md))

### Third-Party Links

A service can carry identifiers linking it to external systems, all stored directly on the service record:

- `pagerduty_id`, `opsgenie_id` -- Paging tool service IDs
- `cortex_id`, `backstage_id` -- Service catalog / internal developer portal IDs
- `service_now_ci_sys_id` -- ServiceNow CI record
- `github_repository_name` / `github_repository_branch` -- Source repo
- `gitlab_repository_name` / `gitlab_repository_branch` -- Source repo

### Service Dependencies

Rootly tracks dependencies as a flat list on the service record:

- **`service_ids`** -- Other services that depend on this service

There is no separate upstream/downstream distinction in the API -- `service_ids` on a given service is the set of services Rootly considers dependent on it. Build a fuller dependency graph by reading `service_ids` across multiple services.

### Environments

- **`environment_ids`** -- Environments (production, staging, etc.) this service runs in

## API Patterns

### List Services

```
list_services
```

Parameters:
- `filter[search]` -- Free-text search
- `filter[name]` -- Filter by exact name
- `filter[slug]` -- Filter by slug
- `filter[external_id]`, `filter[backstage_id]`, `filter[cortex_id]`, `filter[opslevel_id]` -- Filter by third-party ID
- `page[number]` / `page[size]` -- Pagination

There is no `team`, `tier`, or `environment` filter parameter on this endpoint -- filter client-side on `owner_group_ids` / `environment_ids` after fetching, or filter incidents by `service_ids` instead (see [incidents](../incidents/SKILL.md)).

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
        "owner_group_ids": ["team-platform"],
        "slack_channels": [{ "id": "C123", "name": "#payment-service" }],
        "environment_ids": ["env-prod"],
        "service_ids": ["svc-002", "svc-003"]
      }
    }
  ]
}
```

### Get Service Details

```
get_service
```

Parameters:
- Service ID

### Create Service

```
create_service
```

Parameters:
- `name` -- Service name (required)
- `description` -- Service description
- `owner_group_ids` -- Owning team ID(s)
- `owner_user_ids` -- Owning user ID(s)
- `environment_ids` -- Associated environments
- `service_ids` -- Dependent services

### Update Service

```
update_service
```

Parameters:
- Service ID
- `name` -- Updated name
- `description` -- Updated description
- `owner_group_ids` -- Updated owning team(s)
- `service_ids` -- Updated dependencies

### Service Incident/Uptime Charts

```
get_service_incidents_chart
get_service_uptime_chart
```

Parameters:
- Service ID

Returns chart data for incident frequency and uptime for the service, useful for reliability reporting.

## Common Workflows

### Service Health Check

1. Call `list_services` to get all services
2. Cross-reference with active incidents via `list_incidents` filtered by `filter[service_ids]`
3. Identify services with open incidents
4. Check `service_ids` on each affected service for cascading impact
5. Report overall service health summary, optionally pulling `get_service_incidents_chart` per service

### Service Dependency Analysis

1. Get service details with `get_service`
2. Review `service_ids` to see which services are recorded as dependent
3. Cross-reference other services' `service_ids` to find what this service itself depends on
4. Identify single points of failure
5. Recommend redundancy improvements

### Incident Impact Assessment

1. Get incident details to identify affected services (`service_ids` on the incident)
2. For each affected service, look up `service_ids` (dependents) via `get_service`
3. Assess total impact scope (direct + transitive dependencies)
4. Determine affected teams via `owner_group_ids` and escalation paths
5. Communicate impact to relevant stakeholders

## Error Handling

### Service Not Found

**Cause:** Invalid service ID or service deleted
**Solution:** List services to verify the correct ID

### Duplicate Service Name

**Cause:** Service with this name already exists
**Solution:** Use a unique name or update the existing service

## Best Practices

- Assign clear ownership (`owner_group_ids` and/or `owner_user_ids`) for every service
- Keep `service_ids` accurate on both sides of a dependency for blast-radius analysis
- Link services to their PagerDuty/Opsgenie/Cortex/Backstage IDs so cross-tool correlation works
- If you need tier/criticality, standardize it as a custom field or naming convention, since Rootly has no native field for it
- Tag services with `environment_ids` for accurate incident scoping
- Review `get_service_incidents_chart` periodically to identify reliability gaps

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents affecting services
- [alerts](../alerts/SKILL.md) - Alert routing by service
- [workflows](../workflows/SKILL.md) - Service-scoped workflow conditions
