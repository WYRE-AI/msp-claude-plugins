---
name: "Liongard Environments"
description: >
  Liongard environments — the per-customer containers that own all agents,
  launchpoints, systems, detections, and metrics. Covers environment CRUD,
  the lightweight count endpoint, v2 environment groups, tiering, related-entity
  lookups, and integration mappings to PSA/RMM platforms.
when_to_use: >-
  When creating, updating, organizing, or decommissioning customer organizations in
  Liongard, or when scoping other queries to a particular environment. Use when:
  liongard environment, liongard customer, environment group, liongard site,
  liongard org, liongard environment management, create environment liongard, or liongard client.
---

# Liongard Environment Management

## Overview

Environments in Liongard represent customer organizations or sites being monitored. Each environment is the top-level container for all inspection activity, discovered systems, detections, and metrics associated with a particular client, so nearly every other Liongard query is scoped by `EnvironmentID`.

## Anti-triggers

- **A dev, staging, or production environment** — a Liongard environment
  is a customer organization. It has nothing to do with deployment
  tiers.
- **The client's commercial record** — creating an environment does not
  onboard a client; use `connectwise-psa-companies`, `autotask-crm`, or
  `superops-clients`.
- **A Microsoft 365 tenant** — an environment can hold an M365
  inspection but is not a tenant; use `cipp-tenants`.
- **What was discovered inside an environment** — `liongard-systems` for
  the assets, `liongard-detections` for the changes.

## Key Concepts

### Environments

`Name` is the only required field on create and must be unique across the instance. `Status` is `Active` or `Inactive`; `Visible` controls UI visibility; `Tier` is a free-form service-tier classification MSPs use for SLA and reporting segmentation. The counts (`AgentCount`, `LaunchpointCount`, `SystemCount`, `DetectionCount`) are returned only on the single-environment GET, not in list responses.

See [references/fields.md](references/fields.md) for the complete field reference and the entity relationship map.

### Environment Groups

Environment Groups (v2) are a logical grouping layer over environments — by category, region, or service level — that helps MSPs manage large client counts. Group membership is independent of the environment record itself: deleting a group ungroups its environments rather than deleting them.

### Integration Mappings

An environment can be mapped to external systems (PSA tools, RMM platforms) so Liongard data correlates with tickets and devices elsewhere. Mappings are read via a sub-resource on the environment.

## API Patterns

The full endpoint catalog with request/response bodies lives in [references/api.md](references/api.md). The non-obvious parts:

- **v1 list is GET with query params; v2 list is POST with a filter body.** `POST /api/v2/environments` takes `conditions: [{path, op, value}]`, an optional `fields` array for field selection, and `orderBy: [{path, direction}]`. Use v2 when you need server-side filtering or narrower payloads.
- **`Pagination` is PascalCase and nested** in v2 bodies — `{"Pagination": {"Page": 1, "PageSize": 100}}`. Response envelopes are PascalCase everywhere (`Data`, `TotalRows`, `HasMoreRows`, `CurrentPage`, `TotalPages`, `PageSize`); page until `HasMoreRows` is false.
- **`GET /api/v1/environments/count`** returns just `{"Count": N}` — use it for health checks and dashboard summaries instead of paging a full list.
- **Environment groups are v2-only** at `/api/v2/environment-groups`, while environment CRUD is v1 at `/api/v1/environments`.
- **Related entities are fetched from their own endpoints filtered by `environmentId`** (camelCase query param) — `/api/v1/launchpoints`, `/api/v1/systems`, `/api/v1/agents` — except detections, which require `POST /api/v1/detections` with an `EnvironmentID` condition.

## Common Workflows

### New Client Onboarding

1. **Create environment** - Add the new customer organization
2. **Assign to group** - Place in appropriate environment group
3. **Set tier** - Configure service tier for SLA tracking
4. **Deploy agent** - Install agent on client infrastructure
5. **Configure launchpoints** - Set up inspectors for relevant platforms
6. **Run initial inspections** - Trigger immediate runs to capture baseline
7. **Verify discovery** - Confirm systems are being discovered correctly

### Client Decommissioning

1. **Review active inspections** - Document current state
2. **Disable launchpoints** - Stop scheduled inspections
3. **Export data** - Archive historical inspection data if needed
4. **Set status to Inactive** - Mark environment as inactive
5. **Remove from groups** - Clean up group memberships
6. **Delete environment** - Remove when retention period expires

### Organizing by Tier

1. **Create tier groups** - e.g., Premium, Standard, Basic
2. **Assign environments** - Move each client to their tier group
3. **Configure metrics** - Set tier-appropriate compliance metrics
4. **Set up detections** - Enable tier-appropriate change monitoring
5. **Review regularly** - Audit tier assignments quarterly

See [references/examples.md](references/examples.md) for worked bulk-update and full-export implementations.

## Gotchas

- **Deleting an environment cascades and cannot be undone.** It removes all associated launchpoints, systems, detections, and historical inspection data. Set `Status` to `Inactive` instead when you only need to stop service but retain history.
- **Duplicate names return 409, not a validation body.** Environment names must be unique instance-wide, so a collision surfaces as a conflict on create.
- **Deleting an environment group does not delete its environments** — they are simply ungrouped. This is the opposite of the environment delete behavior above.
- **Rate limit is 300 requests/minute.** Bulk updates must be paced (roughly a 200 ms delay per request) since there is no batch endpoint for environment writes.

See [references/errors.md](references/errors.md) for the complete API and validation error tables.

## Best Practices

1. **Use consistent naming** - Follow a standard naming convention (e.g., "CompanyName - SiteName")
2. **Complete all fields** - Add descriptions and tiers for better reporting
3. **Organize with groups** - Use environment groups for logical categorization
4. **Set appropriate tiers** - Match tier to service agreement level
5. **Review regularly** - Audit environments quarterly for accuracy
6. **Map integrations** - Link to PSA/RMM for cross-platform correlation

## Related Skills

- [Liongard Overview](../overview/SKILL.md) - Platform overview and terminology
- [Liongard Inspections](../inspections/SKILL.md) - Inspectors and launchpoints
- [Liongard Systems](../systems/SKILL.md) - Systems and dataprints
- [Liongard Detections](../detections/SKILL.md) - Change detection and alerts
