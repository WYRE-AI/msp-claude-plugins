---
name: "Syncro Tickets"
description: >
  Use this skill when working with Syncro MSP tickets - creating, updating,
  searching, or managing service desk operations. Covers ticket fields,
  statuses, priorities, problem types, timer operations, and workflow automations.
  Includes business logic for validation, time tracking, and reporting.
  Essential for MSP technicians handling service delivery through Syncro.
when_to_use: >-
  When creating, updating, searching, or managing service desk operations. Use when: syncro
  ticket, service ticket syncro, create ticket syncro, ticket status syncro, ticket priority,
  syncro service desk, ticket timer, resolve ticket syncro, ticket comments, time entry syncro, or
  ticket search syncro.
---

# Syncro MSP Ticket Management

## Overview

Syncro tickets are the core unit of service delivery in the platform. Every client request, incident, and service task flows through the ticketing system. This skill covers comprehensive ticket management including creation, updates, timer operations, comments, and time tracking.

## Ticket Status Values

Syncro provides configurable ticket statuses. These are the common default values:

| Status | Description | Business Logic |
|--------|-------------|----------------|
| **New** | Newly created ticket | Default for new tickets, awaiting triage |
| **In Progress** | Actively being worked | Technician assigned and working |
| **On Hold** | Waiting for external factor | May pause SLA clock |
| **Waiting on Customer** | Awaiting customer response | SLA clock typically paused |
| **Waiting on Parts** | Waiting for hardware/parts | SLA clock may pause |
| **Scheduled** | Work scheduled for future | Has associated appointment |
| **Resolved** | Issue resolved, pending close | Resolution documented |
| **Closed** | Ticket completed | Archived, no further action |

### Status Transition Flow

```
New ──────────────────────────────────> Resolved ──> Closed
 │                                          ↑
 ↓                                          │
In Progress ──────────────────────────────>─┤
 │         │                                │
 │         ↓                                │
 │    On Hold ────────────────────────────>─┤
 │         │                                │
 │         ↓                                │
 │    Waiting on Customer ────────────────>─┤
 │         │                                │
 │         ↓                                │
 │    Waiting on Parts ───────────────────>─┘
 │
 ↓
Scheduled ─────> In Progress ────> Resolved ──> Closed
```

## Ticket Priority Levels

| Priority | Description | Typical Response |
|----------|-------------|------------------|
| **Low** | Minor issues, requests | 24-48 hours |
| **Medium** | Standard issues | 4-8 hours |
| **High** | Significant impact | 1-2 hours |
| **Urgent** | Critical/business down | Immediate |

## Complete Ticket Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Auto-generated unique identifier |
| `number` | integer | System | Human-readable ticket number |
| `subject` | string | Yes | Brief issue summary |
| `body` | text | No | Detailed description (supports HTML) |
| `customer_id` | integer | Yes | Associated customer |
| `contact_id` | integer | No | Primary contact for ticket |

### Classification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | Yes | Current status |
| `priority` | string | Yes | Urgency level |
| `problem_type` | string | No | Issue category |
| `ticket_type_id` | integer | No | Ticket type classification |

### Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `user_id` | integer | No | Assigned technician |
| `created_by` | integer | System | Who created the ticket |

### Date/Time Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `created_at` | datetime | System | Creation timestamp |
| `updated_at` | datetime | System | Last modification |
| `due_date` | date | No | Target completion date |
| `resolved_at` | datetime | System | Resolution timestamp |

### Timer Fields

| Field | Type | Description |
|-------|------|-------------|
| `timer_active` | boolean | Whether timer is running |
| `timer_started_at` | datetime | When current timer started |
| `total_time_seconds` | integer | Cumulative time tracked |

## Timer Operations

### Starting a Timer

```http
POST /api/v1/tickets/{id}/timer
```

```json
{
  "action": "start"
}
```

### Stopping a Timer

```http
POST /api/v1/tickets/{id}/timer
```

```json
{
  "action": "stop"
}
```

### Timer Best Practices

1. **Start timer when beginning work** - Ensures accurate time tracking
2. **Stop timer during interruptions** - Prevents overbilling
3. **Check timer status before closing** - Running timers create time entries
4. **Review time before invoicing** - Verify accuracy

## API Patterns

### Creating a Ticket

```http
POST /api/v1/tickets
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

```json
{
  "customer_id": 12345,
  "subject": "Unable to access email - multiple users affected",
  "body": "<p>Sales team (5 users) reporting Outlook showing disconnected since 9am.</p><p>Webmail is working.</p>",
  "status": "New",
  "priority": "High",
  "problem_type": "Email",
  "contact_id": 67890,
  "due_date": "2024-02-15"
}
```

### Searching Tickets

**Open tickets for customer:**
```http
GET /api/v1/tickets?customer_id=12345&status=open
```

**My assigned tickets:**
```http
GET /api/v1/tickets?mine=true&status=open
```

**Search by text:**
```http
GET /api/v1/tickets?query=email%20not%20working
```

**Date range:**
```http
GET /api/v1/tickets?date_from=2024-02-01&date_to=2024-02-15
```

### Updating a Ticket

```http
PUT /api/v1/tickets/{id}
Content-Type: application/json
```

```json
{
  "status": "Resolved",
  "priority": "Medium",
  "body": "Updated description with resolution details"
}
```

### Adding Comments

```http
POST /api/v1/tickets/{id}/comment
Content-Type: application/json
```

**Public comment (visible to customer):**
```json
{
  "subject": "Status Update",
  "body": "We've identified the cause and are working on a fix.",
  "hidden": false,
  "do_not_email": false
}
```

**Private/Internal note:**
```json
{
  "subject": "Internal Note",
  "body": "Root cause: KB5034441 update corrupted Outlook cache",
  "hidden": true,
  "do_not_email": true
}
```

### Adding Time Entries

```http
POST /api/v1/tickets/{id}/line_items
Content-Type: application/json
```

```json
{
  "product_id": 123,
  "quantity": 1.5,
  "price": 150.00,
  "description": "Troubleshooting and resolving email connectivity issue"
}
```

## Common Workflows

### Ticket Creation Flow

1. **Validate customer exists** - Search by name or use ID
2. **Check for duplicates** - Search open tickets with similar subject
3. **Set initial values:**
   - Status: New
   - Priority: Based on urgency
   - Problem type: Categorize the issue
4. **Assign technician** if known
5. **Send acknowledgment** to customer (automatic if configured)

### Ticket Resolution Flow

1. **Document resolution** in comments
2. **Stop any active timers**
3. **Review time entries** for accuracy
4. **Update status to Resolved**
5. **Generate invoice** if billable

### Time Tracking Workflow

1. **Start timer** when beginning work
2. **Add comments** documenting actions taken
3. **Stop timer** when stepping away
4. **Convert timer to line item** for billing
5. **Review before closing** ticket

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid parameter | Check field values |
| 401 | Unauthorized | Verify API key |
| 404 | Ticket not found | Confirm ticket ID exists |
| 422 | Validation failed | Check required fields |
| 429 | Rate limited | Wait and retry (180 req/min limit) |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| customer_id required | Missing customer | All tickets need a customer |
| subject required | Empty subject | Provide ticket subject |
| Invalid status | Unknown status value | Use valid status string |
| Invalid priority | Unknown priority | Use Low/Medium/High/Urgent |

## Best Practices

1. **Use descriptive subjects** - Include who's affected and symptoms
2. **Categorize properly** - Use problem types for reporting
3. **Track time immediately** - Don't batch at end of day
4. **Update status promptly** - Keeps queues accurate
5. **Document thoroughly** - Future technicians will thank you
6. **Use private notes for technical details** - Keep public comments professional
7. **Set due dates** - Helps with scheduling and SLA tracking
8. **Review before closing** - Ensure all time is captured

## Related Skills

- [Syncro Customers](../customers/SKILL.md) - Customer and contact management
- [Syncro Assets](../assets/SKILL.md) - Asset tracking and RMM
- [Syncro Invoices](../invoices/SKILL.md) - Billing and payments
- [Syncro API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
