---
name: "HubSpot Activities"
description: >
  HubSpot tasks, notes, and associations: task priority and status values,
  notes-vs-tasks semantics, the association type matrix linking contacts,
  companies, deals, and tickets, and engagement-history workflows.
when_to_use: >-
  When logging notes, creating follow-up tasks, or linking CRM objects together in HubSpot.
  Use when: hubspot task, hubspot note, hubspot activity, hubspot association,
  hubspot engagement, hubspot log, hubspot follow-up, hubspot link objects, hubspot relationship,
  activity management hubspot, or task creation hubspot.
---

# HubSpot Activities & Associations

## Overview

Activities in HubSpot encompass tasks, notes, and other engagement records that track interactions with contacts, companies, deals, and tickets. Associations are the links that connect HubSpot CRM objects together -- a contact associated with a company, a deal associated with a contact, a note associated with a ticket. For MSPs, activities provide the service history and follow-up tracking that drives client satisfaction, while associations ensure that every interaction is visible from any related record.

## Conduit connector

Conduit's `hubspot` connector is HubSpot's own hosted MCP server (`https://mcp.hubspot.com/anthropic/v1/mcp`, OAuth). Its CRM tools are generic over object type, so every call names the `objectType`:

| Tool | Call shape |
|------|-----------|
| `search_crm_objects` | `objectType`, optional `query` (free text), `filterGroups` (property `filters` and `associatedWith` association filters), `properties`, `sorts`, `limit` (max 200), `offset` |
| `get_crm_objects` | `objectType`, `objectIds` (1-100), `properties` |
| `manage_crm_objects` | `createRequest.objects[]` or `updateRequest.objects[]` (each with `objectType`, `properties`, optional `associations`, and `objectId` for updates), plus `confirmationStatus` (`CONFIRMED` only after the user approved the exact change) |
| `search_properties` / `get_properties` | Discover property names and enumeration values for an `objectType` |
| `search_owners` | Resolve `hubspot_owner_id` values to people |

Parameter names in the tables below (such as `contactId`) describe the HubSpot fields involved; send them in the call shapes above. See `hubspot-api-patterns` for the full tool list.

## Anti-triggers

- **A customer-reported issue that needs resolving** — that is a ticket with a
  pipeline and stage, not a task; use `hubspot-tickets`.
- **The properties of the record being annotated** — this skill covers the
  note, task, and association only; object fields live in `hubspot-contacts`,
  `hubspot-companies`, `hubspot-deals`, or `hubspot-tickets`.
- **Billable time against client work** — HubSpot tasks are not time entries;
  the PSA is the system of record for those.

## MCP Tools

### Available Tools

#### Activity Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `manage_crm_objects` (`createRequest`, `objectType: "tasks"`) | Create a task | `hs_task_subject` (required), `hs_task_body`, `hs_task_priority`, `hs_timestamp` |
| `manage_crm_objects` (`createRequest`, `objectType: "notes"`) | Create a note | `hs_note_body` (required), `hs_timestamp` |

#### Association Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `manage_crm_objects` (`updateRequest` with `associations`) | Create an association between two objects | `updateRequest.objects[]` with `objectType`, `objectId` and `associations: [{ targetObjectType, targetObjectId, labels? }]` |
| `search_crm_objects` (`associatedWith` filter) | List records associated with an object | `objectType` (the records you want) plus `filterGroups[].associatedWith: [{ objectType, operator: "EQUAL", objectIdValues: [id] }]` |

#### Utility Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_user_details` | Get details of the current user | None |

### Create a Task

Call `manage_crm_objects` (`createRequest`, `objectType: "tasks"`) to create a follow-up task:

**Example: Create a follow-up task:**
- `hs_task_subject`: `Follow up with Acme Corp on managed services proposal`
- `hs_task_body`: `Review proposal feedback and schedule next call. Contact: John Smith, IT Director.`
- `hs_task_priority`: `HIGH`
- `hs_timestamp`: `2026-03-01T09:00:00.000Z`
- `hubspot_owner_id`: `67890`

**Example: Create an onboarding task:**
- `hs_task_subject`: `Complete Acme Corp onboarding checklist`
- `hs_task_body`: `Set up monitoring agents, configure backup, verify antivirus deployment.`
- `hs_task_priority`: `HIGH`
- `hs_timestamp`: `2026-02-28T09:00:00.000Z`

### Create a Note

Call `manage_crm_objects` (`createRequest`, `objectType: "notes"`) to log an activity:

**Example: Log a meeting note:**
- `hs_note_body`: `Met with John Smith (IT Director) at Acme Corp. Discussed current IT pain points: frequent email outages, no backup solution, aging network switches. Interested in managed IT services package. Follow-up scheduled for March 1.`
- `hs_timestamp`: `2026-02-24T15:00:00.000Z`

**Example: Log a support resolution:**
- `hs_note_body`: `Resolved email delivery issue for Acme Corp. Root cause: misconfigured SPF record. Updated DNS TXT record and verified delivery to all 5 affected users. Monitoring for 24 hours.`
- `hs_timestamp`: `2026-02-24T11:30:00.000Z`

### Create an Association

Associations are written with `manage_crm_objects`, on the record you are updating (or creating):

**Example: Associate a contact with a company:**

```json
{
  "updateRequest": {
    "objects": [
      {
        "objectType": "contacts",
        "objectId": 12345,
        "associations": [{ "targetObjectType": "COMPANY", "targetObjectId": 98765 }]
      }
    ]
  },
  "confirmationStatus": "CONFIRMED"
}
```

**Example: Create a note already associated with a contact:**

```json
{
  "createRequest": {
    "objects": [
      {
        "objectType": "notes",
        "properties": { "hs_note_body": "Quarterly review held.", "hs_timestamp": "2026-11-09T15:00:00Z" },
        "associations": [{ "targetObjectType": "CONTACT", "targetObjectId": 12345 }]
      }
    ]
  },
  "confirmationStatus": "CONFIRMED"
}
```

Association labels (for example "Billing Contact") go in `labels` on the association and must already exist for that object pair.

### Access Associations

Read associations with `search_crm_objects`: search the object type you want, filtered by what it is associated with.

**Example: Get all contacts for a company:**

```json
{
  "objectType": "contacts",
  "filterGroups": [
    { "associatedWith": [{ "objectType": "companies", "operator": "EQUAL", "objectIdValues": [98765] }] }
  ]
}
```

The same shape returns deals for a contact (`objectType: "deals"`, associated with `contacts`) or tickets for a company (`objectType: "tickets"`, associated with `companies`).


## Key Concepts

### Association Types

HubSpot supports associations between all major CRM object types:

| From | To | Association Type | Description |
|------|----|-----------------|-------------|
| contact | company | `contact_to_company` | Person works at organization |
| deal | contact | `deal_to_contact` | Contact is involved in the deal |
| deal | company | `deal_to_company` | Deal is for this company |
| ticket | contact | `ticket_to_contact` | Contact reported the ticket |
| ticket | company | `ticket_to_company` | Ticket is for this company |
| note | contact | `note_to_contact` | Note is about this contact |
| note | company | `note_to_company` | Note is about this company |
| note | deal | `note_to_deal` | Note is about this deal |
| note | ticket | `note_to_ticket` | Note is about this ticket |
| task | contact | `task_to_contact` | Task is for this contact |
| task | company | `task_to_company` | Task is for this company |
| task | deal | `task_to_deal` | Task is related to this deal |

### Task Priority Levels

| Priority | Description | MSP Context |
|----------|-------------|-------------|
| `NONE` | No priority set | General follow-up |
| `LOW` | Low priority | Non-urgent task |
| `MEDIUM` | Medium priority | Standard follow-up |
| `HIGH` | High priority | Time-sensitive action required |

### Task Status

Tasks track completion status:

| Status | Description |
|--------|-------------|
| `NOT_STARTED` | Task created, not yet started |
| `IN_PROGRESS` | Currently working on |
| `WAITING` | Waiting for external input |
| `COMPLETED` | Task done |
| `DEFERRED` | Postponed |

### Notes vs. Tasks

| Feature | Notes | Tasks |
|---------|-------|-------|
| Purpose | Record what happened | Track what needs to happen |
| Time reference | Past events | Future actions |
| Completion | No status tracking | Has completion status |
| Priority | Not applicable | Has priority level |
| Due date | Not applicable | Has due date/timestamp |
| MSP example | "Resolved printer issue" | "Follow up on network upgrade quote" |

## Common Workflows

### Log a Client Meeting

1. **Create the note** - Call `manage_crm_objects` (`createRequest`, `objectType: "notes"`) with meeting summary
2. **Associate with contact** - Call `manage_crm_objects` (`updateRequest` with `associations`) from note to the contact(s) who attended
3. **Associate with company** - Call `manage_crm_objects` (`updateRequest` with `associations`) from note to the company
4. **Associate with deal** - If the meeting relates to a deal, associate the note with the deal
5. **Create follow-up tasks** - Call `manage_crm_objects` (`createRequest`, `objectType: "tasks"`) for any action items from the meeting

### Create a Follow-Up Task

1. **Create the task** - Call `manage_crm_objects` (`createRequest`, `objectType: "tasks"`) with subject, body, priority, and due date
2. **Assign the task** - Set `hubspot_owner_id` to the responsible team member
3. **Associate with relevant objects** - Link to the contact, company, and/or deal

### Associate a New Contact with Existing Records

1. **Create the contact** - Call `manage_crm_objects` (`createRequest`, `objectType: "contacts"`)
2. **Associate with company** - Call `manage_crm_objects` (`updateRequest` with `associations`) from contact to company
3. **Associate with deals** - If the contact is involved in active deals, create those associations
4. **Log the setup** - Call `manage_crm_objects` (`createRequest`, `objectType: "notes"`) documenting the new contact and their role

### Full Client Relationship View

1. **Find the company** - Call `search_crm_objects` (`objectType: "companies"`) by name or domain
2. **Get contacts** - Call `search_crm_objects` with `objectType: "contacts"` and an `associatedWith` filter on the same record
3. **Get deals** - Call `search_crm_objects` with `objectType: "deals"` and an `associatedWith` filter on the same record
4. **Get tickets** - Call `search_crm_objects` with `objectType: "tickets"` and an `associatedWith` filter on the same record
5. **Retrieve details** - For each associated object, call the appropriate retrieve tool
6. **Present the complete picture** - Company details, all contacts with roles, all deals with stages, all tickets with status

### Onboarding Workflow

1. **Create onboarding tasks** - Create tasks for each onboarding step:
   - Set up monitoring agents
   - Configure backup solution
   - Deploy endpoint protection
   - Document network topology
   - Create client runbook
2. **Associate all tasks** - Link each task to the company and primary contact
3. **Log onboarding kickoff note** - Document the kickoff meeting and expectations
4. **Associate note with company and contacts** - Ensure the note appears on all relevant records

## Response Examples

**Created Task:**

```json
{
  "id": "99999",
  "properties": {
    "hs_task_subject": "Follow up with Acme Corp on managed services proposal",
    "hs_task_body": "Review proposal feedback and schedule next call.",
    "hs_task_priority": "HIGH",
    "hs_task_status": "NOT_STARTED",
    "hs_timestamp": "2026-03-01T09:00:00.000Z",
    "hubspot_owner_id": "67890",
    "createdate": "2026-02-24T15:00:00.000Z"
  }
}
```

**Created Note:**

```json
{
  "id": "88888",
  "properties": {
    "hs_note_body": "Met with John Smith at Acme Corp. Discussed managed IT services.",
    "hs_timestamp": "2026-02-24T15:00:00.000Z",
    "createdate": "2026-02-24T15:05:00.000Z"
  }
}
```

**Associations Response:**

```json
{
  "results": [
    {
      "id": "12345",
      "type": "contact_to_company"
    },
    {
      "id": "12346",
      "type": "contact_to_company"
    },
    {
      "id": "12347",
      "type": "contact_to_company"
    }
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Object not found | Invalid object ID in association | Verify both object IDs exist before creating association |
| Invalid association type | Association type not recognized | Check the association types table above |
| Invalid task priority | Priority value not valid | Use `NONE`, `LOW`, `MEDIUM`, or `HIGH` |
| Missing required field | Required property not provided | Ensure `hs_task_subject` or `hs_note_body` is set |
| Rate limited | Too many requests | Wait 10 seconds and retry |

## Best Practices

1. **Associate activities with all relevant objects** - A meeting note should be linked to the contact, company, and deal
2. **Use tasks for accountability** - Create tasks with owners and due dates for every follow-up action
3. **Write detailed notes** - Include who, what, when, and next steps in every note
4. **Set realistic due dates** - Task due dates should be achievable to maintain trust in the system
5. **Use priority levels meaningfully** - Reserve HIGH priority for truly time-sensitive tasks
6. **Log service activities** - Document every client interaction for continuity when team members change
7. **Review open tasks regularly** - Check for overdue tasks weekly and follow up
8. **Use timestamps accurately** - Set `hs_timestamp` to the actual time of the activity, not when it was logged

## Related Skills

- [HubSpot API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [HubSpot Contacts](../contacts/SKILL.md) - Contact management and search
- [HubSpot Companies](../companies/SKILL.md) - Company management and search
- [HubSpot Deals](../deals/SKILL.md) - Deal pipeline management
- [HubSpot Tickets](../tickets/SKILL.md) - Support ticket management
