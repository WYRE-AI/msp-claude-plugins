---
description: Update a Better Stack status page with current status or maintenance
argument-hint: "[status_page_id] [action] [message]"
arguments: [status_page_id, action, message]
---

# Better Stack Status Page Update

Review and update status pages with current service status, post incident updates, or schedule maintenance notifications. Used for client-facing communication during outages and planned maintenance.

## Prerequisites

- Better Stack MCP server connected with valid API token
- MCP tools `list_status_pages`, `get_status_page`, `list_status_page_sections`, and `create_status_page_incident` available

## Steps

1. **Identify target status page**

   If `status_page_id` is provided, fetch that page. Otherwise, call `list_status_pages` to show all available pages and let the user select one.

2. **Review current status**

   Call `get_status_page` to see the current page configuration. Call `list_status_page_sections` to see all resources/components and their current statuses.

3. **Execute the requested action**

   Based on the `action` parameter:
   - **review** - Display the current status of all components. Highlight any that are not operational.
   - **post-incident** - Use `create_status_page_incident` to post an incident update with the provided `message`.
   - **post-maintenance** - Use `create_status_page_incident` to post a planned maintenance notice with the provided `message`.

4. **Verify update**

   After posting an update, confirm it was published successfully and report the update details.

5. **Recommend follow-up**

   Suggest updating the status page when the incident is resolved, or remind about resuming monitors after maintenance.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| status_page_id | string | No | prompt | Status page ID (will list pages if not provided) |
| action | string | No | review | Action: review, post-incident, post-maintenance |
| message | string | No | none | Status update message for posts |

## Examples

### Review Status Page

```
/status-page-update
```

### Review a Specific Status Page

```
/status-page-update --status_page_id "sp-123"
```

### Post Incident Update

```
/status-page-update --status_page_id "sp-123" --action post-incident --message "We are investigating elevated error rates on the API."
```

### Post Maintenance Notice

```
/status-page-update --status_page_id "sp-123" --action post-maintenance --message "Scheduled database maintenance on March 28, 2026 from 2:00-4:00 AM EST."
```

## Error Handling

- **Status Page Not Found:** Verify the status page ID with `list_status_pages`
- **Authentication Error:** Verify `BETTERSTACK_API_TOKEN` is set correctly
- **Missing Message:** Incident and maintenance posts require a `message` parameter

## Related Commands

- `/monitor-status` - Check monitor statuses to verify status page accuracy
- `/incident-triage` - Review incidents that may need status page updates
- `/create-monitor` - Add new monitors to link to status page components
