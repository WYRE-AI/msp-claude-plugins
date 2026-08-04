---
name: "Datto RMM Sites"
description: >
  Datto RMM site management: site hierarchy and identifiers, proxy and
  patch-window settings, site-scoped device/alert queries, and
  create/update/delete operations for client locations.
when_to_use: >-
  When listing, managing, and configuring client locations. Use when: datto site, rmm site, client
  site, site management, location management, site settings, site proxy, or site devices.
---

# Datto RMM Site Management

## Overview

Sites in Datto RMM represent client organizations or locations. Each site contains devices, has its own settings, and can have site-level variables. Sites provide organizational hierarchy and enable scoped operations - alerts, jobs, and reports can all be filtered by site.

## Anti-triggers

- **The client as a billing entity** — use `autotask-crm`; as a
  documentation entity, `it-glue-organizations`; as a SOC tenant,
  `rocketcyber-accounts`. None of these share IDs with a Datto RMM site.
- **The endpoints themselves rather than the grouping** — use
  `datto-rmm-devices`.

## Key Concepts

### Site Hierarchy

```
Account
└── Sites (many)
    └── Devices (many per site)
        └── Alerts, Jobs, Audit Data
```

### Site Types

Sites can represent:
- **Client companies** - External customers
- **Internal locations** - Your own offices
- **Projects** - Temporary groupings
- **Departments** - Internal divisions

### Site Identifiers

| Identifier | Type | Description |
|------------|------|-------------|
| `siteUid` | string | Globally unique identifier |
| `siteId` | integer | Legacy numeric ID |
| `name` | string | Display name |

### Field Reference

A `Site` carries identifiers, `onDemand`/`splapiEnabled` flags, optional
`proxySettings`, device/alert counts, and a `settings` object (auto-patch
approval, patch window, timezone). See
[references/fields.md](references/fields.md) for the complete interfaces.

## Common Workflows

### Site Lookup by Name

```javascript
async function findSiteByName(client, name) {
  const response = await client.request('/api/v2/sites?max=250');
  const sites = response.sites || [];

  // Exact match first
  const exact = sites.find(s =>
    s.name.toLowerCase() === name.toLowerCase()
  );
  if (exact) return { found: true, site: exact };

  // Partial match
  const matches = sites.filter(s =>
    s.name.toLowerCase().includes(name.toLowerCase())
  );

  if (matches.length === 0) {
    return { found: false, suggestions: [] };
  }

  if (matches.length === 1) {
    return { found: true, site: matches[0] };
  }

  return {
    found: false,
    ambiguous: true,
    suggestions: matches.map(s => ({
      name: s.name,
      uid: s.uid,
      deviceCount: s.devicesCount
    }))
  };
}
```

Site health scoring (device status + alert priority weighted into a 0-100
score), a multi-site summary sorted by open alerts, an onboarding
checklist validator, and a safe CRUD wrapper are in
[references/examples.md](references/examples.md).

## API Patterns

- `GET /api/v2/sites?max=250` - list all sites
- `GET /api/v2/site/{siteUid}` - get a single site
- `GET /api/v2/site/{siteUid}/devices?max=250` - devices at a site
- `GET /api/v2/site/{siteUid}/alerts/open` / `.../alerts/resolved?max=250` - site-scoped alerts
- `POST /api/v2/sites` - create a site
- `POST /api/v2/site/{siteUid}` - update a site
- `DELETE /api/v2/site/{siteUid}` - delete a site (devices become unassigned, not deleted)

See [references/api.md](references/api.md) for full request/response examples.

## Gotchas

- **Deleting a site does not delete its devices** - they become unassigned, not removed. Move or reassign devices deliberately before deleting.
- **Site names must be unique** - creating a duplicate name fails with 400.
- **Set the site's timezone deliberately** - `settings.timezone` drives when the patch window actually runs.
- **Health scoring is a convention, not an API field** - `openAlertsCount`/`devicesCount` are raw counts; any "healthy/warning/critical" status is computed client-side (see reference examples).

See [references/errors.md](references/errors.md) for the full site API error table.

## Site Naming Conventions

**Recommended Format:** `{ClientName} - {Location/Purpose}`

Examples:
- `Acme Corp - Main Office`
- `Acme Corp - Remote Workers`
- `TechStart Inc - Data Center`
- `Internal - IT Department`

## Related Skills

- [Datto RMM Devices](../devices/SKILL.md) - Site device management
- [Datto RMM Alerts](../alerts/SKILL.md) - Site alert views
- [Datto RMM Variables](../variables/SKILL.md) - Site variables
- [Datto RMM API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
