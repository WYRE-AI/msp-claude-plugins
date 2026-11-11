---
name: "NinjaOne Tickets"
description: >
  NinjaOne's built-in ticketing system, which integrates with device monitoring:
  ticket creation and updates, core/status/metadata fields, status and priority
  values with SLA targets, log entry types, device linkage, tagging patterns, and
  error codes.
when_to_use: >-
  When creating, updating, searching, or working the NinjaOne ticket queue. Use when:
  ninjaone ticket, ninjarmm ticket, ninja ticket create, ninja ticket search, ticket
  status ninja, or ninja service ticket.
---

# NinjaOne Ticket Management

## Overview

NinjaOne includes a built-in ticketing system that integrates with device monitoring. Tickets can be manually created or auto-generated from alerts, providing a complete service desk solution.

## Anti-triggers

- **The MSP's real service desk** — most MSPs running NinjaOne keep their
  ticket queue in a PSA and use NinjaOne ticketing only for
  monitoring-generated work, or not at all. If the ticket has a contract,
  an SLA, and billable time against it, it is in the PSA: use
  `autotask-tickets`, `connectwise-psa-tickets`, `halopsa-tickets`,
  `syncro-tickets`, or `atera-tickets`. Check which system holds the queue
  before assuming this one.
- **How to prioritise, categorise, and route an incoming ticket** — this
  skill covers the NinjaOne ticket API; the triage practice itself is
  vendor-agnostic, so use `shared-skills-ticket-triage`.
- **Pulling device and alert context onto a ticket** — that is a
  cross-tool lookup; use `shared-skills-incident-correlation`.
- **The alert that would become a ticket** — use `ninjaone-alerts`.

## MCP Tools

| Tool | Tier | Purpose |
|------|------|---------|
| `ninjaone_tickets_boards_list` | read | Ticket boards; listing tickets needs a `board_id` |
| `ninjaone_tickets_list` | read | Tickets on one board (`board_id` required) |
| `ninjaone_tickets_get` | read | One ticket, including its `version` for optimistic locking |
| `ninjaone_tickets_comments` | read | Log entries for a ticket, filterable by entry `type` |
| `ninjaone_tickets_forms_list` | admin (unclassified) | Ticket forms; a form ID is **required** to create a ticket |
| `ninjaone_tickets_form_get` | admin (unclassified) | One form's fields (`form_id`) |
| `ninjaone_tickets_statuses_list` | admin (unclassified) | The tenant's status IDs |
| `ninjaone_tickets_attributes_list` | admin (unclassified) | Custom-field attribute IDs for `attributes` |
| `ninjaone_tickets_contacts_list` | admin (unclassified) | Contacts, for `requester_uid` |
| `ninjaone_tickets_users_list` | admin (unclassified) | Technicians / end users / contacts, for `assignee_id` |
| `ninjaone_tickets_create` | write | Create a ticket (`subject`, `organization_id`, `ticket_form_id` required) |
| `ninjaone_tickets_update` | write | Update a ticket (`ticket_id`; pass `version` from `ninjaone_tickets_get`) |
| `ninjaone_tickets_add_comment` | write | Add a public or internal comment |

The six lookup tools were added in ninjaone-mcp's ticketing release and have no Conduit classification yet, so they enforce at `admin` until Conduit classifies them. A `write` grant alone can create a ticket only if the form ID is already known; status and assignee are optional (the status defaults to New), so leave them out when their IDs are unknown.

### Creating a ticket

1. `ninjaone_organizations_list` for `organization_id`.
2. `ninjaone_tickets_forms_list` for `ticket_form_id` (NinjaOne rejects a ticket without one).
3. Optional: `ninjaone_tickets_statuses_list` (status ID, default 1000 = New), `ninjaone_tickets_users_list` (`assignee_id`), `ninjaone_tickets_contacts_list` (`requester_uid`), `ninjaone_tickets_attributes_list` (`attributes`).
4. `ninjaone_tickets_create` with those IDs plus `description`, `priority`, `severity`, `type`, `device_id` and `tags`.

Underlying REST: `POST /api/v2/ticketing/ticket`, `PUT /api/v2/ticketing/ticket/{ticketId}`, `GET /api/v2/ticketing/ticket/{ticketId}/log-entry`. The tools map `organization_id` to `clientId`, `device_id` to `nodeId` and `assignee_id` to `assignedAppUserId`.

## Ticket Fields

| Tool argument | REST field | Required | Notes |
|---------------|------------|----------|-------|
| `subject` | `subject` | Yes | Max 200 characters |
| `organization_id` | `clientId` | Yes | |
| `ticket_form_id` | `ticketFormId` | Yes | From `ninjaone_tickets_forms_list` |
| `description` | first log entry | No | `description_public: false` keeps it internal |
| `device_id` | `nodeId` | No | |
| `status` | `status` | No | Per-tenant status ID |
| `priority` | `priority` | No | See below |
| `severity` | `severity` | No | See below |
| `type` | `type` | No | `PROBLEM`, `QUESTION`, `INCIDENT`, `TASK`, `CHANGE_REQUEST`, `SERVICE_REQUEST`, `PROJECT`, `APPOINTMENT`, `MISCELLANEOUS` |
| `assignee_id` | `assignedAppUserId` | No | |
| `requester_uid` | `requesterUid` | No | Contact UUID |
| `tags` | `tags` | No | |
| `attributes` | `attributes` | No | Array of `{ attributeId, value }` |

## Status Values

Statuses are **per tenant**. Read them with `ninjaone_tickets_statuses_list`; do not assume names such as `OPEN` or `IN_PROGRESS`. Create and update take the status **ID** (a new ticket defaults to 1000, New). The `status` filter on `ninjaone_tickets_list` takes the status **display name**, matched client-side.

## Priority and Severity

NinjaOne separates urgency (priority) from impact (severity). **There is no `CRITICAL` priority**; sending it is rejected.

| Priority | Typical SLA target |
|----------|--------------------|
| `HIGH` | 1 hour |
| `MEDIUM` | 4 hours |
| `LOW` | 24 hours |
| `NONE` | Best effort |

| Severity | Meaning |
|----------|---------|
| `CRITICAL` | Business down |
| `MAJOR` | Major impact |
| `MODERATE` | Moderate impact |
| `MINOR` | Minor issue |
| `NONE` | No impact recorded |

For a "critical" ticket, set `severity: "CRITICAL"`, and set `priority: "HIGH"` only if the user did not ask for a priority (keep an explicit one, even `LOW`).


## Log Entries

Log entries track all ticket activity:

### Entry Types

The `type` filter accepts `DESCRIPTION`, `COMMENT`, `CONDITION`, `SAVE`, `DELETE`, `PRODUCT` and `INFO`. Use `COMMENT` for just the conversation.

### Log Entry Structure

```json
{
  "id": 123,
  "type": "COMMENT",
  "content": "Investigated and found corrupted index",
  "public": false,
  "createdBy": {
    "id": 456,
    "name": "John Tech"
  },
  "createTime": "2024-02-15T14:30:00Z"
}
```

## Common Workflows

### Create Ticket from Alert

1. Receive alert notification
2. Get device and organization context
3. Create ticket with device linked
4. Add alert details to description
5. Set priority based on alert severity
6. Assign to appropriate technician

### Ticket Resolution Flow

1. Update status to IN_PROGRESS
2. Add log entries documenting work
3. Log time entries for billing
4. Update status to RESOLVED
5. Add resolution notes
6. Close ticket

### Escalation Workflow

1. Review ticket age and SLA
2. Update priority if needed
3. Reassign to senior tech
4. Add escalation note
5. Notify stakeholders

## Integration with Devices

Link tickets to devices for context:

```json
{
  "subject": "Outlook crashes repeatedly",
  "deviceId": 12345,
  "description": "User reports Outlook crashes when opening attachments"
}
```

Benefits:
- Quick access to device details
- View device alerts in ticket context
- Run remote actions from ticket

## Tags for Categorization

```json
{
  "tags": [
    "email",
    "outlook",
    "crash",
    "user-reported"
  ]
}
```

Common tag patterns:
- Issue type: `hardware`, `software`, `network`
- Application: `outlook`, `office`, `vpn`
- Source: `user-reported`, `alert`, `scheduled`
- Priority override: `vip`, `urgent`

## Best Practices

1. **Use descriptive subjects** - Include who, what, where
2. **Log all work** - Essential for billing and knowledge
3. **Update status promptly** - Keeps queues accurate

## Error Handling

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Invalid request | Check required fields |
| 404 | Ticket not found | Verify ticket ID |
| 403 | Access denied | Check organization permissions |
| 422 | Validation error | Review field values |

## Related Skills

- [Devices](../devices/SKILL.md) - Device context
- [Alerts](../alerts/SKILL.md) - Alert-to-ticket flow
- [Organizations](../organizations/SKILL.md) - Client context
- [API Patterns](../api-patterns/SKILL.md) - Authentication
