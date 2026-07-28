# Autotask Time Entry API Patterns

## Creating a Time Entry

```http
POST /v1.0/TimeEntries
Content-Type: application/json
```

**Ticket Time Entry:**
```json
{
  "ticketID": 54321,
  "resourceID": 29744150,
  "dateWorked": "2024-02-15",
  "hoursWorked": 1.5,
  "summaryNotes": "Troubleshot email delivery issues. Identified DNS misconfiguration.",
  "billingCodeID": 12,
  "roleID": 5,
  "isBillable": true
}
```

**Project Time Entry:**
```json
{
  "projectID": 12345,
  "taskID": 67890,
  "resourceID": 29744150,
  "dateWorked": "2024-02-15",
  "hoursWorked": 4.0,
  "summaryNotes": "Network infrastructure design - Phase 2 planning",
  "internalNotes": "Need to follow up on VLAN configuration",
  "billingCodeID": 8,
  "isBillable": true
}
```

## Query Patterns

**Time entries for a ticket:**
```json
{
  "filter": [
    {"field": "ticketID", "op": "eq", "value": 54321}
  ],
  "includeFields": ["Resource.firstName", "Resource.lastName"]
}
```

**Unapproved time entries for a date range:**
```json
{
  "filter": [
    {"field": "dateWorked", "op": "between", "value": ["2024-02-01", "2024-02-15"]},
    {"field": "approvalStatus", "op": "in", "value": [0, 1]}
  ]
}
```

**Time entries logged today:**
```json
{
  "filter": [
    {"field": "dateWorked", "op": "gte", "value": "2026-04-13"},
    {"field": "dateWorked", "op": "lt", "value": "2026-04-14"}
  ]
}
```

> **Warning:** Using only today's date returns **zero results**. You MUST use a range: `gte` today AND `lt` tomorrow. See the api-patterns skill for the full explanation.

**Billable time by resource (date range):**
```json
{
  "filter": [
    {"field": "resourceID", "op": "eq", "value": 29744150},
    {"field": "isBillable", "op": "eq", "value": true},
    {"field": "dateWorked", "op": "gte", "value": "2024-02-01"},
    {"field": "dateWorked", "op": "lt", "value": "2024-03-01"}
  ]
}
```

## Submitting for Approval

```http
PATCH /v1.0/TimeEntries
Content-Type: application/json
```

```json
{
  "id": 98765,
  "approvalStatus": 1
}
```

## Approving Time Entry

```json
{
  "id": 98765,
  "approvalStatus": 2
}
```

## Rejecting Time Entry

```json
{
  "id": 98765,
  "approvalStatus": 3,
  "internalNotes": "Please add more detail about the work performed"
}
```

