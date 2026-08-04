---
name: "PagerDuty Services"
description: >
  PagerDuty service catalog: service statuses, integrations and integration
  keys as event sources, alert grouping modes, upstream/downstream service
  dependencies, and maintenance windows.
when_to_use: >-
  When inspecting, creating, or configuring PagerDuty services, or scheduling maintenance
  on them. Use when: pagerduty
  service, service catalog, service dependencies, service integrations, maintenance window,
  service health, or service status.
---

# PagerDuty Services

## Overview

Services in PagerDuty represent the applications, components, or infrastructure that your team is responsible for. Each service has an escalation policy, integrations (event sources), and configuration for how incidents are created and grouped. Services are the primary organizational unit for routing alerts to the right responders.

## Anti-triggers

A PagerDuty service is a technical component with an escalation policy
attached. It is not a commercial service, and not a service ticket.

- **A managed service you sell and bill for** — service lines, coverage
  scope, and rates live in the contract; use `halopsa-contracts` or
  `autotask-contracts`.
- **A service request from a customer** — that is a ticket type in a
  helpdesk or PSA; use `freshdesk-ticketing`, `halopsa-tickets`, or
  `connectwise-manage-tickets`.
- **Rootly's service catalog** — a different vendor's model, with tiers
  and ownership metadata rather than integration keys; use
  `rootly-services`.
- **A maintenance window's effect on customer SLA** — suppressing alerts
  here does not pause a PSA's SLA clock; use
  `freshdesk-sla-business-hours` or `halopsa-contracts` for that side.

## Key Concepts

### Service Status

| Status | Description |
|--------|-------------|
| `active` | Service is live and will create incidents from alerts |
| `warning` | Service has acknowledged but unresolved incidents |
| `critical` | Service has triggered (unacknowledged) incidents |
| `maintenance` | Service is in a maintenance window; alerts are suppressed |
| `disabled` | Service is disabled; no incidents will be created |

### Integrations

Integrations are the event sources that feed into a service. Each integration has a unique `integration_key` used to route events:

- **Events API v2** -- Generic integration for any monitoring tool
- **Email** -- Incidents created from emails sent to a service-specific address
- **Vendor-specific** -- Pre-built integrations (Datadog, CloudWatch, Nagios, etc.)

### Alert Grouping

Services can be configured to automatically group related alerts into a single incident:

| Mode | Description |
|------|-------------|
| `intelligent` | PagerDuty ML groups related alerts automatically |
| `time` | Alerts within a time window are grouped together |
| `content_based` | Alerts with matching fields are grouped |

### Dependencies

Service dependencies map upstream and downstream relationships between services. This helps identify blast radius during incidents and understand service topology.

## API Patterns

### List Services

```
pagerduty_list_services
```

Parameters:
- `query` -- Search by service name
- `team_ids[]` -- Filter by team
- `include[]` -- Include related resources (escalation_policies, teams, integrations)
- `sort_by` -- Sort field (name)
- `limit` / `offset` -- Pagination

**Example response:**

```json
{
  "services": [
    {
      "id": "PSVC123",
      "name": "Payment API",
      "status": "active",
      "description": "Payment processing service",
      "escalation_policy": {
        "id": "PPOLICY1",
        "summary": "Engineering On-Call"
      },
      "alert_creation": "create_alerts_and_incidents",
      "alert_grouping_parameters": {
        "type": "intelligent"
      },
      "teams": [
        {
          "id": "PTEAM01",
          "summary": "Platform Team"
        }
      ]
    }
  ],
  "limit": 25,
  "offset": 0,
  "total": 1,
  "more": false
}
```

### Get Service Details

```
pagerduty_get_service
```

Parameters:
- `id` -- Service ID
- `include[]` -- Include integrations, escalation_policies, teams

### Create Service

```
pagerduty_create_service
```

Parameters:
- `name` -- Service name (required)
- `description` -- Service description
- `escalation_policy` -- Escalation policy reference (required)
- `alert_creation` -- `create_alerts_and_incidents` or `create_incidents`
- `alert_grouping_parameters` -- Alert grouping configuration

### Update Service

```
pagerduty_update_service
```

Parameters:
- `id` -- Service ID
- `name` -- Updated name
- `description` -- Updated description
- `status` -- `active` or `disabled`
- `alert_grouping_parameters` -- Updated grouping config

### List Service Dependencies

```
pagerduty_list_service_dependencies
```

Parameters:
- `id` -- Service ID

Returns upstream (depends on) and downstream (depended on by) service relationships.

### Maintenance Windows

#### List Maintenance Windows

```
pagerduty_list_maintenance_windows
```

Parameters:
- `service_ids[]` -- Filter by service
- `filter` -- `ongoing`, `future`, `past`, or `all`
- `query` -- Search by description

#### Create Maintenance Window

```
pagerduty_create_maintenance_window
```

Parameters:
- `start_time` -- Start time (ISO 8601)
- `end_time` -- End time (ISO 8601)
- `description` -- Description of the maintenance
- `services` -- List of service references

**Example request body:**

```json
{
  "maintenance_window": {
    "type": "maintenance_window",
    "start_time": "2026-03-28T02:00:00Z",
    "end_time": "2026-03-28T06:00:00Z",
    "description": "Database upgrade - v12 to v15",
    "services": [
      {
        "id": "PSVC123",
        "type": "service_reference"
      }
    ]
  }
}
```

## Common Workflows

### Service Health Check

1. Call `pagerduty_list_services` to get all services
2. Check `status` field for each service (critical, warning, active)
3. For services in `critical` or `warning` status, list their incidents
4. Report services with active incidents and their severity

### Creating a New Service

1. Identify or create the escalation policy
2. Create the service with `pagerduty_create_service`
3. Add integrations for monitoring tools
4. Configure alert grouping as appropriate
5. Set up service dependencies

### Scheduling Maintenance

1. Identify affected services
2. Create a maintenance window with `pagerduty_create_maintenance_window`
3. During the window, alerts on those services are suppressed
4. After the window ends, normal alerting resumes automatically

### Mapping Service Dependencies

1. List services to find the target service
2. Call `pagerduty_list_service_dependencies` for the service
3. Visualize upstream and downstream relationships
4. Use during incidents to assess blast radius

## Error Handling

### Service Not Found

**Cause:** Invalid service ID
**Solution:** List services to find the correct ID

### Cannot Delete Service with Active Incidents

**Cause:** Service has unresolved incidents
**Solution:** Resolve all incidents before disabling or deleting

### Duplicate Service Name

**Cause:** A service with the same name already exists
**Solution:** Use a unique name or update the existing service

## Best Practices

- Use descriptive service names that match your infrastructure topology
- Configure intelligent alert grouping to reduce incident noise
- Map service dependencies for faster incident triage
- Schedule maintenance windows for planned changes to suppress false alerts
- Assign each service to a team for clear ownership
- Use `include[]=integrations` to verify monitoring sources are connected

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents on services
- [oncall](../oncall/SKILL.md) - Escalation policies assigned to services
- [alerts](../alerts/SKILL.md) - Alerts routed to services
- [analytics](../analytics/SKILL.md) - Per-service performance metrics
