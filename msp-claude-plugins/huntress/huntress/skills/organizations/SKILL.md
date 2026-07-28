---
name: "Huntress Organizations"
description: >
  Huntress organizations as the multi-tenant boundary: org structure, the
  organization key used for agent deployment, full CRUD operations, client
  onboarding and offboarding workflows, and the duplicate-key and
  active-agent deletion errors.
when_to_use: >-
  When creating, listing, updating, or deleting Huntress organizations, or onboarding and
  offboarding a client tenant. Use when: huntress organization, huntress
  org, organization management, create organization, delete organization, client management, or
  multi-tenant.
---

# Huntress Organizations

## Overview

Organizations in Huntress represent MSP client tenants. Each organization contains agents, incidents, and escalations scoped to that client. This skill covers full CRUD operations for organizations and MSP multi-tenant management patterns.

## Key Concepts

### Organization Structure

Organizations are the primary tenant boundary in Huntress. Agents, incidents, escalations, and billing are all scoped to organizations.

### Organization Keys

Each organization has a unique key used during agent installation to associate endpoints with the correct client.

## API Patterns

### List Organizations

```
huntress_organizations_list
```

Parameters:
- `page_token` — Pagination token

**Example response:**

```json
{
  "organizations": [
    {
      "id": "org-456",
      "name": "Acme Corporation",
      "key": "acme_corp",
      "agent_count": 150,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "next_page_token": "eyJwYWdlIjoyfQ=="
}
```

### Get Organization

```
huntress_organizations_get
```

Parameters:
- `organization_id` — The organization ID

### Create Organization

```
huntress_organizations_create
```

Parameters:
- `name` — Organization display name
- `key` — Unique organization key (used in agent install)

**Example request:**

```json
{
  "name": "New Client Inc",
  "key": "new_client_inc"
}
```

### Update Organization

```
huntress_organizations_update
```

Parameters:
- `organization_id` — The organization ID
- `name` — Updated name

### Delete Organization

```
huntress_organizations_delete
```

Parameters:
- `organization_id` — The organization to delete

> **WARNING:** Deleting an organization removes all associated agents and data. This action is irreversible.

## Common Workflows

### Client Onboarding

1. Create organization with `huntress_organizations_create`
2. Note the organization key for agent deployment
3. Deploy agents to client endpoints using the org key
4. Verify agents appear with `huntress_agents_list` filtered by org

### Client Offboarding

1. List agents for the organization
2. Confirm all agents will be removed
3. Delete the organization with `huntress_organizations_delete`
4. Verify cleanup is complete

### Organization Audit

1. List all organizations with `huntress_organizations_list`
2. For each, check agent count and last activity
3. Identify organizations with zero agents (potential cleanup)
4. Cross-reference with PSA/RMM client lists

## Error Handling

### Duplicate Key

**Cause:** Organization key already exists
**Solution:** Use a unique key; check existing organizations first

### Organization Not Found

**Cause:** Invalid organization ID
**Solution:** List organizations to verify the correct ID

### Cannot Delete Organization with Active Agents

**Cause:** Organization still has agents reporting
**Solution:** Uninstall agents before deleting the organization

## Best Practices

- Use consistent naming conventions for organization keys
- Match organization names to PSA/RMM client names for easy cross-reference
- Audit organizations periodically for stale or empty tenants
- Document the organization key used for each client's agent deployment
- Never delete organizations without confirming agent removal first

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication and pagination
- [agents](../agents/SKILL.md) - Agents within organizations
- [incidents](../incidents/SKILL.md) - Incidents scoped to organizations
- [billing](../billing/SKILL.md) - Billing per organization
