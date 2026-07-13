---
description: Search for tickets in Autotask PSA by various criteria
argument-hint: "[query] [company] [status] [priority] [queue] [assignee] [limit]"
arguments: [query, company, status, priority, queue, assignee, limit]
---

# Search Autotask Tickets

Search and filter tickets in Autotask PSA using various criteria.

## Prerequisites

- Valid Autotask API credentials configured
- User must have ticket read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Resolve names to IDs (company, queue, assignee)
   - Map status/priority text to IDs

2. **Execute search query**
   ```http
   GET /v1.0/Tickets/query?search={"filter":[...]}
   ```

3. **Format and return results**
   - Display ticket list with key details
   - Include quick actions for each ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search |
| company | string/int | No | - | Company filter |
| status | string | No | open | open/closed/all |
| priority | string | No | - | critical/high/medium/low |
| queue | string | No | - | Queue name or ID |
| assignee | string | No | - | Resource name or ID |
| limit | int | No | 25 | Max results (1-500) |

## Examples

### Search by Text

```
/search-tickets "email not working"
```

### Filter by Company

```
/search-tickets --company "Acme Corp"
```

### High Priority Open Tickets

```
/search-tickets --priority high --status open
```

### My Assigned Tickets

```
/search-tickets --assignee "me"
```

### Combined Filters

```
/search-tickets --company "Acme" --status open --queue "Escalations" --limit 10
```

### Search by Ticket Number

```
/search-tickets "T20240215.0042"
```

## Output

```
🔍 Found 3 tickets matching criteria

┌─────────────────┬──────────────────────────────┬──────────┬──────────┬─────────────┐
│ Ticket #        │ Title                        │ Company  │ Priority │ Status      │
├─────────────────┼──────────────────────────────┼──────────┼──────────┼─────────────┤
│ T20240215.0042  │ Email not working            │ Acme     │ High     │ In Progress │
│ T20240215.0038  │ Outlook crashes on startup   │ Acme     │ Medium   │ New         │
│ T20240214.0156  │ Cannot send emails with att… │ Acme     │ Low      │ Waiting     │
└─────────────────┴──────────────────────────────┴──────────┴──────────┴─────────────┘

Quick Actions:
• View ticket: /show-ticket <number>
• Update ticket: /update-ticket <number>
• Add note: /add-note <number>
```

### Detailed View

```
/search-tickets --company "Acme" --detailed
```

```
🔍 Found 2 tickets for Acme Corporation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 T20240215.0042 - Email not working
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Company:    Acme Corporation
Contact:    John Smith (john.smith@acme.com)
Priority:   High (2)
Status:     In Progress
Queue:      Service Desk
Assignee:   Jane Technician
Created:    2024-02-15 09:23:00
Updated:    2024-02-15 10:45:00
SLA Due:    2024-02-15 11:23:00 (38 min remaining)

Description:
Multiple users unable to send or receive email since 9am.
Affects sales team primarily.

Last Note (10:45):
"Identified issue with mail flow rules. Working on fix."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Filter Reference

### Status Values

| Text | Filter Behavior |
|------|-----------------|
| open | status NOT IN (5, 11) - excludes Complete, Cancelled |
| closed | status IN (5, 11) - only Complete, Cancelled |
| all | No status filter |
| new | status = 1 |
| in-progress | status = 5 |
| waiting | status = 7 |
| escalated | status = 8 |

### Priority Values

| Text | Priority ID |
|------|-------------|
| critical | 1 |
| high | 2 |
| medium | 3 |
| low | 4 |

## Error Handling

### No Results

```
🔍 No tickets found matching criteria

Suggestions:
• Broaden your search (remove filters)
• Check spelling of company/queue names
• Try --status all to include closed tickets
```

### Invalid Company

```
❌ Company not found: "Acm"

Did you mean?
• Acme Corporation (ID: 12345)
• Acme Industries (ID: 12346)
```

### Rate Limiting

```
⏳ Rate limited by Autotask API

Retrying in 5 seconds...
```

## Related Commands

- `/create-ticket` - Create new ticket
- `/show-ticket` - View full ticket details
- `/update-ticket` - Modify ticket
