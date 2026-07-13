---
name: "Better Stack Status Pages"
description: >
  Use this skill when working with Better Stack status pages --
  managing status pages, adding resources/components, posting
  maintenance windows, and communicating service status to end users.
when_to_use: >-
  When managing status pages, adding resources/components, posting maintenance windows, and
  communicating service status to end users. Use when: betterstack status page, status page,
  status page component, maintenance window, service status, status update, public status, or
  better stack status.
---

# Better Stack Status Pages

## Overview

Status pages in Better Stack provide a public-facing view of your service health. They automatically reflect monitor statuses and allow manual incident and maintenance updates. MSPs use status pages to communicate service availability to clients without exposing internal monitoring details.

## Key Concepts

### Status Page Components

Status pages are composed of resources (components) that map to monitors:
- Each resource shows a status indicator (operational, degraded, downtime, maintenance)
- Resources are automatically updated based on linked monitor status
- Resources can be grouped into sections for organization

### Component Statuses

- **Operational** - Service is fully functional
- **Degraded Performance** - Service is working but with reduced performance
- **Partial Outage** - Some aspects of the service are unavailable
- **Major Outage** - Service is completely unavailable
- **Maintenance** - Service is under planned maintenance

### Maintenance Windows

Maintenance windows allow you to:
- Schedule downtime in advance
- Notify subscribers before maintenance begins
- Suppress alerts during planned work
- Auto-update status page during the maintenance period

## API Patterns

### List Status Pages

```
betterstack_list_status_pages
```

Parameters:
- `page` - Pagination cursor

**Example response:**

```json
{
  "data": [
    {
      "id": "sp-123",
      "type": "status_page",
      "attributes": {
        "company_name": "Acme Corp",
        "company_url": "https://acme.com",
        "subdomain": "status-acme",
        "custom_domain": "status.acme.com",
        "timezone": "America/New_York"
      }
    }
  ]
}
```

### Get Status Page Details

```
betterstack_get_status_page
```

Parameters:
- `status_page_id` - The status page ID

### Create Status Page

```
betterstack_create_status_page
```

Parameters:
- `company_name` - Name displayed on the status page (required)
- `company_url` - Company website URL
- `subdomain` - Subdomain for the Better Stack hosted status page
- `custom_domain` - Custom domain for the status page
- `timezone` - Timezone for the status page display

### List Status Page Resources

```
betterstack_list_status_page_resources
```

Parameters:
- `status_page_id` - The status page ID

## Common Workflows

### Setting Up a Client Status Page

1. Create a status page with `betterstack_create_status_page`
2. Configure the subdomain or custom domain
3. Add resources (components) linked to the client's monitors
4. Group resources by service category (Web, API, Email, etc.)
5. Share the status page URL with the client

### Posting a Maintenance Window

1. Identify affected monitors and status page resources
2. Pause affected monitors to suppress false alerts
3. Update status page resources to "Maintenance" status
4. Perform maintenance work
5. Resume monitors and verify recovery
6. Update status page resources back to "Operational"

### Incident Communication

1. When an incident is triggered, verify status page reflects downtime
2. Post a status update with the current investigation status
3. Update as investigation progresses
4. Post resolution update when the issue is fixed
5. Verify status page returns to all-operational

## Error Handling

### Status Page Not Found

**Cause:** Invalid status page ID
**Solution:** List status pages to verify the correct ID

### Custom Domain DNS Not Configured

**Cause:** Custom domain CNAME record not pointing to Better Stack
**Solution:** Configure CNAME record as documented in Better Stack settings

### Resource Already Linked

**Cause:** Attempting to add a monitor that's already linked to the status page
**Solution:** Check existing resources before adding

## Best Practices

- Create a separate status page per client or product
- Use meaningful resource names that clients understand (avoid internal jargon)
- Group resources by service category for clarity
- Schedule maintenance windows during off-peak hours
- Communicate proactively -- post updates before clients report issues
- Use custom domains for professional branding
- Include only client-relevant monitors, not internal infrastructure
- Keep historical incident data for SLA reporting

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [monitors](../monitors/SKILL.md) - Monitors linked to status page resources
- [incidents](../incidents/SKILL.md) - Incidents reflected on status pages
- [oncall](../oncall/SKILL.md) - On-call team notified during outages
