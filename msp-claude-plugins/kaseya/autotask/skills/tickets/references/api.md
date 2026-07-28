# Autotask Ticket API Patterns

## Query Builder Patterns

**Open tickets for company with includes:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "status", "op": "noteq", "value": 5}
  ],
  "includeFields": ["Company.companyName", "AssignedResource.firstName", "AssignedResource.lastName"]
}
```

**SLA-breached tickets:**
```json
{
  "filter": [
    {"field": "dueDateTime", "op": "lt", "value": "2024-02-15T12:00:00Z"},
    {"field": "status", "op": "in", "value": [1, 2, 6, 13, 14]}
  ]
}
```

**Tickets created today (CORRECT — must use gte + lt range):**
```json
{
  "filter": [
    {"field": "createDate", "op": "gte", "value": "2026-04-13T00:00:00Z"},
    {"field": "createDate", "op": "lt", "value": "2026-04-14T00:00:00Z"}
  ]
}
```

> **Warning:** Using only today's date returns **zero results**. You MUST use a range: `gte` today AND `lt` tomorrow. See the api-patterns skill for the full explanation and dynamic date computation.

**Tickets by date range:**
```json
{
  "filter": [
    {"field": "createDate", "op": "between", "value": ["2024-02-01", "2024-02-29"]}
  ]
}
```

## Updating Ticket Status

```http
PATCH /v1.0/Tickets
Content-Type: application/json
```

**Setting to Complete (requires resolution):**
```json
{
  "id": 54321,
  "status": 5,
  "resolution": "Cleared Outlook cache and repaired Office installation. Monitored for 30 minutes, email flow restored."
}
```

**Setting to Escalated (requires reason):**
```json
{
  "id": 54321,
  "status": 14,
  "escalationReason": "Complex Exchange hybrid configuration issue requires senior engineer"
}
```

## Adding Notes

```http
POST /v1.0/TicketNotes
Content-Type: application/json
```

**Internal Note:**
```json
{
  "ticketID": 54321,
  "title": "Initial Triage",
  "description": "Issue started after KB5034441 update. Known Outlook cache corruption issue.",
  "noteType": 1,
  "publish": 0
}
```

**External Note (visible to client):**
```json
{
  "ticketID": 54321,
  "title": "Status Update",
  "description": "We've identified the cause of the issue. A technician is working on the fix and will have it resolved within the hour.",
  "noteType": 2,
  "publish": 1
}
```

