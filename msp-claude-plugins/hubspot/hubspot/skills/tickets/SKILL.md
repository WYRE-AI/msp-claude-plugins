---
name: "HubSpot Tickets"
description: >
  HubSpot support tickets: core fields, default pipeline stages, priority
  levels, MSP ticket categories, SLA timestamp properties, and associating
  tickets with contacts, companies, and deals.
when_to_use: >-
  When creating, retrieving, updating, or reporting on support tickets in HubSpot CRM. Use when:
  hubspot ticket, hubspot support, hubspot service, hubspot issue, ticket search hubspot, ticket
  management hubspot, hubspot help desk, hubspot case, support ticket hubspot, or service ticket
  hubspot.
---

# HubSpot Ticket Management

## Overview

Tickets in HubSpot represent support requests, service issues, or tasks that need resolution. For MSPs, tickets are the backbone of client service delivery -- tracking everything from break-fix requests and password resets to complex infrastructure projects. Tickets belong to a pipeline (e.g., "Support Pipeline") and progress through stages (e.g., "New", "In Progress", "Resolved"). They can be associated with contacts (the person who reported the issue), companies (the client organization), and deals (if the ticket relates to a service agreement).

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_ticket` | Get a single ticket by ID | `ticketId` (required) |
| `hubspot_create_ticket` | Create a new ticket | `subject` (required), `content`, `hs_pipeline`, `hs_pipeline_stage` |
| `hubspot_update_ticket` | Update an existing ticket | `ticketId` (required), property fields to update |

### Create a Ticket

Call `hubspot_create_ticket` with the ticket's properties:

**Example: Create a support ticket:**
- `subject`: `Email delivery issues - Acme Corp`
- `content`: `Client reports intermittent email delivery failures since Monday morning. Affects 5 users on the acmecorp.com domain.`
- `hs_pipeline`: `0` (default support pipeline)
- `hs_pipeline_stage`: `1` (New)
- `hs_ticket_priority`: `HIGH`
- `hubspot_owner_id`: `67890`

### Update a Ticket

Call `hubspot_update_ticket` with the `ticketId` and the properties to change:

**Example: Move ticket to In Progress:**
- `ticketId`: `77777`
- `hs_pipeline_stage`: `2`

**Example: Resolve a ticket:**
- `ticketId`: `77777`
- `hs_pipeline_stage`: `4`
- `hs_resolution`: `Reconfigured mail relay settings. Confirmed delivery restored for all 5 users.`

### Retrieve a Ticket

Call `hubspot_retrieve_ticket` with the `ticketId`:

**Example:**
- `hubspot_retrieve_ticket` with `ticketId=77777`

### Search Tickets

Tickets can be found via the associations API. To find tickets for a specific contact or company:

1. Call `hubspot_access_associations` with the contact or company ID and `toObjectType=ticket`
2. Retrieve each ticket by ID using `hubspot_retrieve_ticket`

## Key Concepts

### Default Ticket Pipeline Stages

HubSpot's default support pipeline includes these stages (your account may have custom stages):

| Stage ID | Display Name | Description |
|----------|-------------|-------------|
| `1` | New | Ticket just created, not yet assigned |
| `2` | Waiting on contact | Awaiting response from the client |
| `3` | Waiting on us | MSP team needs to take action |
| `4` | Closed | Ticket resolved and closed |

### Ticket Priority Levels

| Priority | Description | MSP Context |
|----------|-------------|-------------|
| `LOW` | Low priority | Non-urgent request, no business impact |
| `MEDIUM` | Medium priority | Some business impact, can wait |
| `HIGH` | High priority | Significant business impact, needs prompt attention |

### Ticket Categories

MSPs commonly categorize tickets by type:

| Category | Examples |
|----------|---------|
| Break-Fix | Hardware failure, software crash |
| Service Request | Password reset, new user setup |
| Project | Network upgrade, server migration |
| Billing | Invoice question, contract change |
| Monitoring Alert | Automated alert from RMM/monitoring |

## Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `subject` | string | Ticket subject line |
| `content` | string | Ticket description/body |
| `hs_pipeline` | enumeration | Pipeline the ticket belongs to |
| `hs_pipeline_stage` | enumeration | Current pipeline stage |
| `hs_ticket_priority` | enumeration | Priority level (LOW, MEDIUM, HIGH) |
| `hs_ticket_category` | enumeration | Ticket category |
| `hubspot_owner_id` | number | Assigned owner (user ID) |
| `hs_resolution` | string | Resolution description |
| `source_type` | enumeration | How the ticket was created (EMAIL, CHAT, PHONE, FORM) |
| `createdate` | datetime | Record creation date |
| `lastmodifieddate` | datetime | Last modification date |
| `closed_date` | datetime | When the ticket was closed |
| `hs_time_to_close_sla_due_date` | datetime | SLA close deadline |
| `hs_time_to_first_response_sla_due_date` | datetime | SLA first response deadline |
| `hs_last_message_received_at` | datetime | Last client message timestamp |
| `hs_last_message_sent_at` | datetime | Last agent message timestamp |
| `num_associated_contacts` | number | Associated contacts count |

## Common Workflows

### Create a Support Ticket

1. **Find the contact** - Call `hubspot_search_contacts` to find the person reporting the issue
2. **Find the company** - Call `hubspot_search_companies` to find the client organization
3. **Create the ticket** - Call `hubspot_create_ticket` with subject, content, pipeline, stage, priority, and owner
4. **Associate with contact** - Call `hubspot_create_association` from ticket to contact
5. **Associate with company** - Call `hubspot_create_association` from ticket to company
6. **Log initial note** - Call `hubspot_create_note` to document initial triage findings

### Search Tickets for a Client

1. Find the company with `hubspot_search_companies`
2. Call `hubspot_access_associations` with the company ID and `toObjectType=ticket`
3. For each ticket ID, call `hubspot_retrieve_ticket` to get full details
4. Filter by pipeline stage to find open tickets

### Update Ticket Status

1. Call `hubspot_retrieve_ticket` to confirm current state
2. Call `hubspot_update_ticket` with the new `hs_pipeline_stage`
3. If closing, include `hs_resolution` describing the fix
4. Call `hubspot_create_note` to log the status change details

### Ticket Volume Report for a Client

1. Find the company with `hubspot_search_companies`
2. Call `hubspot_access_associations` to get all tickets
3. Retrieve each ticket and categorize by:
   - Status (open vs. closed)
   - Priority (high, medium, low)
   - Category (break-fix, service request, project)
   - Time to resolution
4. Calculate average resolution time and ticket volume trends

### Escalation Workflow

1. Call `hubspot_retrieve_ticket` to review the current ticket
2. Call `hubspot_update_ticket` to set `hs_ticket_priority` to `HIGH`
3. Call `hubspot_update_ticket` to reassign `hubspot_owner_id` to the escalation engineer
4. Call `hubspot_create_note` to document the escalation reason
5. Call `hubspot_create_task` to create a follow-up task for the assigned engineer

## Response Examples

**Single Ticket:**

```json
{
  "id": "77777",
  "properties": {
    "subject": "Email delivery issues - Acme Corp",
    "content": "Client reports intermittent email delivery failures since Monday morning.",
    "hs_pipeline": "0",
    "hs_pipeline_stage": "2",
    "hs_ticket_priority": "HIGH",
    "hubspot_owner_id": "67890",
    "source_type": "EMAIL",
    "createdate": "2026-02-20T09:15:00.000Z",
    "lastmodifieddate": "2026-02-21T14:30:00.000Z",
    "closed_date": null,
    "num_associated_contacts": "1"
  },
  "createdAt": "2026-02-20T09:15:00.000Z",
  "updatedAt": "2026-02-21T14:30:00.000Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Ticket not found | Invalid ticket ID | Verify the ID by checking associations or searching |
| Invalid pipeline | Pipeline ID not recognized | Check your HubSpot account for available pipelines |
| Invalid pipeline stage | Stage ID not valid for the pipeline | Use a valid stage ID for the selected pipeline |
| Invalid priority | Priority value not recognized | Use `LOW`, `MEDIUM`, or `HIGH` |
| Rate limited | Too many requests | Wait 10 seconds and retry |

## Best Practices

1. **Write clear subjects** - Include the client name and a brief issue description in the subject
2. **Set priority accurately** - Use HIGH sparingly to maintain urgency signal integrity
3. **Associate with contact and company** - Always link tickets to both for full context
4. **Update stages promptly** - Move tickets through stages as work progresses
5. **Document resolutions** - Always fill in `hs_resolution` when closing tickets
6. **Track SLA deadlines** - Monitor `hs_time_to_first_response_sla_due_date` and `hs_time_to_close_sla_due_date`
7. **Assign owners** - Every ticket should have a `hubspot_owner_id` for accountability
8. **Log notes on progress** - Create notes to document troubleshooting steps and findings
9. **Categorize consistently** - Use standardized categories for accurate reporting
10. **Review open tickets regularly** - Check for stale or forgotten tickets weekly

## Related Skills

- [HubSpot API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [HubSpot Contacts](../contacts/SKILL.md) - Contacts who submitted tickets
- [HubSpot Companies](../companies/SKILL.md) - Companies associated with tickets
- [HubSpot Deals](../deals/SKILL.md) - Deals that may relate to service delivery
- [HubSpot Activities](../activities/SKILL.md) - Notes and tasks on tickets
