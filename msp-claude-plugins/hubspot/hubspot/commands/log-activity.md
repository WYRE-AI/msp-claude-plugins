---
description: Log a note or create a task on a HubSpot contact, company, or deal
argument-hint: "<type> <content> [contact] [company] [deal] [priority] [due_date]"
arguments: [type, content, contact, company, deal, priority, due_date]
---

# Log Activity in HubSpot

Log a note or create a follow-up task on a HubSpot contact, company, or deal. Ensures all client interactions are documented in the CRM.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `hubspot_create_note`, `hubspot_create_task`, `hubspot_create_association`, and search tools available
- At least one object (contact, company, or deal) must be specified for association

## Steps

1. **Resolve associated objects** - Find the contact, company, and/or deal

   For each specified object:
   - If a name was provided, search using the appropriate search tool
   - If an ID was provided, retrieve the object directly

2. **Create the activity** based on the type

   **For notes:**
   - Call `hubspot_create_note` with `hs_note_body` set to the content
   - Set `hs_timestamp` to the current time

   **For tasks:**
   - Call `hubspot_create_task` with `hs_task_subject` set to a summary and `hs_task_body` set to the full content
   - Set `hs_task_priority` to the specified priority
   - Set `hs_timestamp` to the due date

3. **Associate with objects** - Link the activity to all specified objects

   For each resolved object, call `hubspot_create_association` to link the note or task.

4. **Confirm the activity** was created and associated

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | string | Yes | - | Activity type: "note" or "task" |
| content | string | Yes | - | Note body or task description |
| contact | string | No | - | Contact name or ID |
| company | string | No | - | Company name or ID |
| deal | string | No | - | Deal name or ID |
| priority | string | No | MEDIUM | Task priority (LOW, MEDIUM, HIGH) |
| due_date | string | No | tomorrow | Task due date (YYYY-MM-DD) |

## Examples

### Log a Note on a Contact

```
/log-activity --type note --contact "John Smith" --content "Discussed managed services proposal. Interested in endpoint protection and backup. Follow up next week."
```

### Log a Note on a Company

```
/log-activity --type note --company "Acme Corp" --content "Quarterly business review completed. Client satisfied with SLA performance. Requested quote for additional 10 workstations."
```

### Create a Follow-Up Task

```
/log-activity --type task --contact "John Smith" --content "Send managed services proposal with endpoint protection and backup pricing" --priority HIGH --due_date 2026-03-01
```

### Log Activity on a Deal

```
/log-activity --type note --deal "Acme Corp - Managed IT Services" --content "Proposal reviewed by CFO. Requested adjustments to backup pricing tier. Revised proposal to be sent by Friday."
```

### Log Activity on Multiple Objects

```
/log-activity --type note --contact "John Smith" --company "Acme Corp" --deal "Managed IT Services" --content "Final proposal meeting. All stakeholders aligned. Contract to be sent Monday."
```

## Output

### Note Created

```
Note Logged Successfully
================================================================

Note ID:        88888
Content:        Discussed managed services proposal. Interested in
                endpoint protection and backup. Follow up next week.
Timestamp:      2026-02-24 15:30 UTC
Author:         Sarah Johnson

Associations:
  - Contact: John Smith (ID: 12345)
  - Company: Acme Corporation (ID: 98765)

Quick Actions:
  - Create follow-up task: /log-activity --type task --contact "John Smith" --content "Follow up on proposal"
  - Search contact: /search-contacts "John Smith"
================================================================
```

### Task Created

```
Task Created Successfully
================================================================

Task ID:        99999
Subject:        Send managed services proposal with endpoint
                protection and backup pricing
Priority:       HIGH
Due Date:       2026-03-01
Status:         Not Started
Owner:          Sarah Johnson

Associations:
  - Contact: John Smith (ID: 12345)

Quick Actions:
  - View contact: /search-contacts "John Smith"
  - View deals: /search-deals --company "Acme Corporation"
================================================================
```

### Object Not Found

```
Contact not found: "Unknown Person"

Suggestions:
  - Check spelling of the contact name
  - Search contacts: /search-contacts "person name"
  - Log the activity on a company instead: /log-activity --type note --company "Company Name" --content "..."
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### No Association Specified

```
Error: At least one of --contact, --company, or --deal must be specified

A note or task must be associated with at least one CRM object.

Examples:
  /log-activity --type note --contact "John Smith" --content "Meeting notes..."
  /log-activity --type task --company "Acme Corp" --content "Follow up on quote"
```

### Invalid Task Priority

```
Error: Invalid priority "URGENT"

Valid priorities: LOW, MEDIUM, HIGH
```

### Rate Limit

```
Error: Rate limit exceeded (429)

HubSpot allows 100 requests per 10 seconds.
Please wait a moment and try again.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `hubspot_create_note` | Create a note record |
| `hubspot_create_task` | Create a task record |
| `hubspot_create_association` | Link activity to contact, company, or deal |
| `hubspot_search_contacts` | Find contact by name |
| `hubspot_search_companies` | Find company by name |
| `hubspot_search_deals` | Find deal by name |

## Related Commands

- `/search-contacts` - Find a contact before logging activity
- `/lookup-company` - Find a company before logging activity
- `/search-deals` - Find a deal before logging activity
- `/create-deal` - Create a deal (often follows a logged meeting)
