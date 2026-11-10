---
description: Create a new ticket in NinjaOne
argument-hint: "<subject> <organization> [description] [priority] [severity] [device_id] [form]"
arguments: [subject, organization, description, priority, severity, device_id, form]
---

Create a new ticket in NinjaOne for "$ARGUMENTS.organization".

## Arguments

- `subject` (required) — Ticket subject (max 200 characters)
- `organization` (required) — Organization name or ID
- `description` (optional) — Detailed description; stored as the ticket's first log entry
- `priority` (optional) — `NONE`, `LOW`, `MEDIUM` or `HIGH`. NinjaOne has **no** `CRITICAL` priority
- `severity` (optional) — `NONE`, `MINOR`, `MODERATE`, `MAJOR` or `CRITICAL`. Use this for "critical"
- `device_id` (optional) — Link the ticket to a device
- `form` (optional) — Ticket form name or ID; required by NinjaOne, asked for if omitted

## Ticket Details
- **Subject:** $ARGUMENTS.subject
- **Priority:** $ARGUMENTS.priority (default: MEDIUM)
- **Severity:** $ARGUMENTS.severity
- **Description:** $ARGUMENTS.description
- **Device:** $ARGUMENTS.device_id (if specified)

## Instructions

1. **Resolve the organization.** If a name was given, `ninjaone_organizations_list` and match it; the ID becomes `organization_id`.
2. **Pick the ticket form.** NinjaOne rejects a ticket without a form, so `ticket_form_id` is required. If the user gave a numeric form ID, use it directly. Otherwise call `ninjaone_tickets_forms_list` (admin tier until Conduit classifies it) and match the name; if several forms fit, ask which one, and `ninjaone_tickets_form_get` shows a form's fields. If the lookup is not available to the caller, ask the user for the form ID.
3. **Check the device** (if `device_id` was given) with `ninjaone_devices_get`, and confirm it belongs to the organization.
4. **Optional lookups:**
   - Status: `ninjaone_tickets_statuses_list` (statuses are per tenant; default is 1000, New)
   - Assignee: `ninjaone_tickets_users_list` for the technician's ID (`assignee_id`)
   - Requester: `ninjaone_tickets_contacts_list` for the contact's UUID (`requester_uid`)
   - Custom fields: `ninjaone_tickets_attributes_list` for attribute IDs (`attributes`)
5. **Map "critical".** If the user asked for a critical ticket, set `severity: "CRITICAL"`, and set `priority: "HIGH"` only if the user did not give a priority (keep an explicit one, even `LOW`). Sending `CRITICAL` as a priority is rejected by the API.
6. **Create** with `ninjaone_tickets_create`: `subject`, `organization_id`, `ticket_form_id`, plus `description`, `priority`, `severity`, `type`, `device_id`, `status`, `assignee_id`, `requester_uid`, `tags` and `attributes` as resolved. This is a `write`-tier tool.
7. Return the ticket ID and confirmation.

## Output Format

### Ticket Created

**Ticket ID:** {ticket_id}
**Subject:** {subject}
**Organization:** {org_name}
**Form:** {form_name}
**Priority:** {priority} | **Severity:** {severity}
**Status:** {status}

{if device linked}
**Linked Device:** {device_name}
{/if}

### Next Steps
- Assign to a technician (`ninjaone_tickets_update` with `assignee_id`; write tier)
- Add details (`ninjaone_tickets_add_comment`; write tier)
- Link related alerts
