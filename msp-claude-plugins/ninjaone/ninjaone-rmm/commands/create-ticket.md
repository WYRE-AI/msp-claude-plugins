---
description: Create a new ticket in NinjaOne
argument-hint: "<subject> <organization> [description] [priority] [device_id]"
arguments: [subject, organization, description, priority, device_id]
---

Create a new ticket in NinjaOne for "$ARGUMENTS.organization".

## Arguments

- `subject` (required) — Ticket subject/title
- `organization` (required) — Organization name or ID
- `description` (optional) — Detailed description of the issue
- `priority` (optional) — Priority level (critical, high, medium, low)
- `device_id` (optional) — Link to a specific device

## Ticket Details
- **Subject:** $ARGUMENTS.subject
- **Priority:** $ARGUMENTS.priority (default: MEDIUM)
- **Description:** $ARGUMENTS.description
- **Device:** $ARGUMENTS.device_id (if specified)

## Instructions

1. Resolve organization name to ID if needed
2. Validate the device belongs to the organization (if device_id provided)
3. Create the ticket via API
4. Return the ticket ID and confirmation

## API Endpoint

```http
POST /api/v2/ticketing/ticket
Content-Type: application/json

{
  "clientId": {org_id},
  "subject": "{subject}",
  "description": "{description}",
  "priority": "{PRIORITY}",
  "status": "OPEN",
  "deviceId": {device_id}
}
```

## Output Format

### Ticket Created

**Ticket ID:** {ticket_id}
**Subject:** {subject}
**Organization:** {org_name}
**Priority:** {priority}
**Status:** Open

{if device linked}
**Linked Device:** {device_name}
{/if}

### Next Steps
- Assign to technician
- Add additional details
- Link related alerts
