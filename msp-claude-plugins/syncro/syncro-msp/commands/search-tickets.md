---
description: Search for tickets in Syncro MSP by various criteria
argument-hint: "[query] [customer] [status] [priority] [assignee] [date_from] [date_to] [limit]"
arguments: [query, customer, status, priority, assignee, date_from, date_to, limit]
---

# Search Syncro Tickets

Search and filter tickets in Syncro MSP using various criteria.

## Prerequisites

- Valid Syncro API key configured
- User must have ticket read permissions

## Steps

1. **Build search filter**
   - Parse all provided arguments
   - Resolve names to IDs (customer, assignee)
   - Map status text to filter values

2. **Execute search query**
   ```http
   GET /api/v1/tickets?customer_id=123&status=open&page=1
   ```

3. **Format and return results**
   - Display ticket list with key details
   - Include quick actions for each ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search |
| customer | string/int | No | - | Customer filter |
| status | string | No | open | open/closed/all |
| priority | string | No | - | Low/Medium/High/Urgent |
| assignee | string | No | - | User name or "me" |
| date_from | date | No | - | Start date filter |
| date_to | date | No | - | End date filter |
| limit | int | No | 25 | Max results (1-100) |

## Examples

### Search by Text

```
/search-tickets "email not working"
```

### Filter by Customer

```
/search-tickets --customer "Acme Corp"
```

### High Priority Open Tickets

```
/search-tickets --priority High --status open
```

### My Assigned Tickets

```
/search-tickets --assignee "me"
```

### Combined Filters

```
/search-tickets --customer "Acme" --status open --priority Urgent --limit 10
```

### Date Range

```
/search-tickets --date_from 2024-02-01 --date_to 2024-02-15
```

### Search by Ticket Number

```
/search-tickets "1042"
```

## Output

```
Found 3 tickets matching criteria

| Ticket # | Subject                      | Customer | Priority | Status      |
|----------|------------------------------|----------|----------|-------------|
| 1042     | Email not working            | Acme     | High     | In Progress |
| 1038     | Outlook crashes on startup   | Acme     | Medium   | New         |
| 1025     | Cannot send emails with att. | Acme     | Low      | On Hold     |

Quick Actions:
- View ticket: /show-ticket <number>
- Update ticket: /update-ticket <number>
- Add note: /add-note <number>
```

### Detailed View

```
/search-tickets --customer "Acme" --detailed
```

```
Found 2 tickets for Acme Corporation

------------------------------------------------------------
Ticket #1042 - Email not working
------------------------------------------------------------
Customer:    Acme Corporation
Contact:     John Smith (john.smith@acme.com)
Priority:    High
Status:      In Progress
Assignee:    Jane Technician
Created:     2024-02-15 09:23:00
Updated:     2024-02-15 10:45:00

Description:
Multiple users unable to send or receive email since 9am.
Affects sales team primarily.

Last Comment (10:45):
"Identified issue with mail flow rules. Working on fix."
------------------------------------------------------------
```

## Filter Reference

### Status Values

| Text | Filter Behavior |
|------|-----------------|
| open | Excludes Resolved, Closed |
| closed | Only Resolved, Closed |
| all | No status filter |
| new | status = New |
| in-progress | status = In Progress |
| on-hold | status = On Hold |
| resolved | status = Resolved |

### Priority Values

| Text | Description |
|------|-------------|
| Low | Minor issues, no urgency |
| Medium | Normal priority |
| High | Important, needs attention |
| Urgent | Critical, immediate action |

## Error Handling

### No Results

```
No tickets found matching criteria

Suggestions:
- Broaden your search (remove filters)
- Check spelling of customer names
- Try --status all to include closed tickets
```

### Invalid Customer

```
Customer not found: "Acm"

Did you mean?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
```

### Rate Limiting

```
Rate limited by Syncro API (180 req/min)

Retrying in 5 seconds...
```

## Related Commands

- `/create-ticket` - Create new ticket
- `/show-ticket` - View full ticket details
- `/update-ticket` - Modify ticket
