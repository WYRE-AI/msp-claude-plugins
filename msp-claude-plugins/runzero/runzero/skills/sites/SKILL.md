---
name: "runZero Sites"
description: >
  runZero sites: creating and managing organization sites, defining scan scope and
  exclusions, deploying explorers, and organizing assets by location or client.
when_to_use: >-
  When creating, scoping, or organizing runZero sites, or deploying explorers to them.
  Use when: runzero site, runzero organization, site management, site scope, site
  create, explorer deployment, site overview, or client site.
---

# RunZero Sites

## Overview

Sites are the primary organizational unit in RunZero. Each site represents a network boundary -- typically a client location, office, data center, or cloud environment. Sites contain assets, define scan targets, and have explorers assigned for discovery. For MSPs, each client typically maps to one or more sites.

## Anti-triggers

- **The customer as a business record.** A runZero site is a network
  boundary, not a client account — one customer often has several, and
  the names rarely match. Company records, contacts, and contracts are
  `connectwise-manage-companies`.
- **A monitored network in another tool.** Auvik and Meraki both call
  their boundary a "network"; the IDs are unrelated to runZero site IDs.
  Use `auvik-networks` or `meraki-devices`.
- **Launching a scan against the site's ranges** — the site holds the
  scope, `runzero-tasks` runs it.

## Key Concepts

### Site Structure

```
Organization (RunZero Account)
  +-- Site: "ACME HQ"
  |     +-- Explorer: acme-hq-scanner
  |     +-- Assets: 342
  |     +-- Subnets: 192.168.0.0/16
  |
  +-- Site: "ACME Branch - Denver"
  |     +-- Explorer: acme-den-scanner
  |     +-- Assets: 58
  |     +-- Subnets: 10.10.0.0/24
  |
  +-- Site: "ACME Cloud - Azure"
        +-- Explorer: hosted-explorer
        +-- Assets: 127
        +-- Subnets: (cloud connector)
```

### Site Scoping

Each site defines its network scope:

- **Subnets** -- IP ranges that belong to this site
- **Exclusions** -- IP ranges to skip during scans
- **Auto-assignment** -- Assets are assigned to sites based on where they are discovered

### Explorer Assignment

Each site needs at least one explorer to perform scans:

- Managed explorers are deployed on the client's network
- Hosted explorers scan from RunZero's cloud
- Multiple explorers can be assigned to a single site

## API Patterns

### List Sites

```
runzero_sites_list
```

Parameters:
- `count` -- Results per page
- `offset` -- Pagination offset

**Example response:**

```json
{
  "sites": [
    {
      "id": "site-uuid-456",
      "name": "ACME HQ",
      "description": "ACME Corp headquarters - main office",
      "scope": "192.168.0.0/16",
      "excludes": "192.168.255.0/24",
      "asset_count": 342,
      "service_count": 1205,
      "explorer_count": 1,
      "created_at": "2025-06-01T00:00:00Z",
      "updated_at": "2026-03-27T08:30:00Z"
    }
  ]
}
```

### Get Site Details

```
runzero_sites_get
```

Parameters:
- `site_id` -- The specific site UUID

Returns full site details including scope, exclusions, asset/service counts, and assigned explorers.

### Create a Site

```
runzero_sites_create
```

Parameters:
- `name` -- Site name (required)
- `description` -- Human-readable description
- `scope` -- Network scope (CIDR ranges)
- `excludes` -- Excluded ranges

### Update a Site

```
runzero_sites_update
```

Parameters:
- `site_id` -- Site to update (required)
- `name` -- Updated name
- `description` -- Updated description
- `scope` -- Updated network scope
- `excludes` -- Updated exclusions

## Common Workflows

### Client Onboarding

1. Create a site for the new client: `runzero_sites_create`
2. Define the network scope (subnets to scan)
3. Deploy a managed explorer on the client's network
4. Run an initial discovery scan
5. Review discovered assets and services

### Site Overview Report

1. Call `runzero_sites_get` for the target site
2. Retrieve asset count, service count, and scope
3. List recent scans for the site via `runzero_tasks_list`
4. Summarize asset types and OS distribution
5. Present findings with scan coverage analysis

### Multi-Site Client Review

1. Call `runzero_sites_list` to get all sites
2. For each client, aggregate asset and service counts
3. Check explorer health per site
4. Identify sites with stale scan data
5. Generate cross-site summary

### Scope Expansion

1. Get current site scope via `runzero_sites_get`
2. Add new subnets to the scope
3. Update the site with `runzero_sites_update`
4. Schedule a scan of the new subnets
5. Review newly discovered assets

## Error Handling

### Site Not Found

**Cause:** Invalid site UUID
**Solution:** List all sites and verify the ID

### Explorer Not Assigned

**Cause:** Site has no explorer; scans cannot run
**Solution:** Deploy a managed explorer or assign a hosted explorer

### Overlapping Scope

**Cause:** Two sites have overlapping subnets
**Solution:** Review and adjust site scopes to avoid duplicate asset assignment

## Best Practices

- Name sites descriptively with client name and location
- Define scope precisely to avoid scanning unrelated networks
- Use exclusions to skip sensitive or restricted ranges
- Ensure every site has at least one healthy explorer
- Review site asset counts after each scan for anomalies
- Map sites to PSA organizations for consistent client management

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - API authentication and pagination
- [assets](../assets/SKILL.md) - Assets within sites
- [tasks](../tasks/SKILL.md) - Scans executed within sites
- [services](../services/SKILL.md) - Services discovered in sites
