---
description: Search for tickets in ConnectWise PSA by various criteria
argument-hint: "[query] [company] [status] [priority] [board] [assignee] [date-from] [date-to] [limit]"
arguments: [query, company, status, priority, board, assignee, date-from, date-to, limit]
---

# Search ConnectWise PSA Tickets

Search and filter tickets in ConnectWise PSA using various criteria.

## Prerequisites

- Valid ConnectWise PSA API credentials configured
- User must have ticket read permissions

## Steps

1. **Build search conditions**
   - Parse all provided arguments
   - Resolve names to IDs (company, board, assignee)
   - Map status/priority text to appropriate conditions

2. **Construct API query**
   ```http
   GET /service/tickets?conditions=<conditions>&page=1&pageSize=<limit>&orderBy=priority/id asc, dateEntered desc
   ```

3. **Execute search**
   - Handle pagination if needed
   - Include related fields (company, contact, status)

4. **Format and return results**
   - Display ticket list with key details
   - Include quick actions for each ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search in summary |
| company | string/int | No | - | Company filter |
| status | string | No | open | open/closed/all or specific status |
| priority | string/int | No | - | critical/high/medium/low or 1-4 |
| board | string/int | No | - | Service board filter |
| assignee | string | No | - | Assigned member filter |
| date-from | date | No | - | Created on/after date |
| date-to | date | No | - | Created before date |
| limit | int | No | 25 | Max results (1-1000) |

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
/search-tickets --company "Acme" --status open --board "Service Desk" --limit 10
```

### Search by Ticket ID

```
/search-tickets "54321"
```

### Date Range Search

```
/search-tickets --date-from "2024-02-01" --date-to "2024-02-15" --status all
```

### Critical Priority Only

```
/search-tickets --priority 1 --status open
```

## Output

```
Found 3 tickets matching criteria

+----------+----------------------------------+------------------+----------+-------------+
| ID       | Summary                          | Company          | Priority | Status      |
+----------+----------------------------------+------------------+----------+-------------+
| 54321    | Email not working                | Acme Corporation | High     | In Progress |
| 54318    | Outlook crashes on startup       | Acme Corporation | Medium   | New         |
| 54305    | Cannot send attachments > 10MB   | Acme Corporation | Low      | Waiting     |
+----------+----------------------------------+------------------+----------+-------------+

Quick Actions:
- View ticket: /show-ticket <id>
- Update ticket: /update-ticket <id>
- Add note: /add-note <id>
```

### Detailed View

```
/search-tickets --company "Acme" --detailed
```

```
Found 2 tickets for Acme Corporation

================================================================================
#54321 - Email not working
================================================================================
Company:    Acme Corporation
Contact:    John Smith (john.smith@acme.com)
Priority:   High (2)
Status:     In Progress
Board:      Service Desk
Assignee:   Jane Technician
Created:    2024-02-15 09:23:00
Updated:    2024-02-15 10:45:00
SLA Due:    2024-02-15 11:23:00 (38 min remaining)

Description:
Multiple users unable to send or receive email since 9am.
Affects sales team primarily.

Last Note (10:45):
"Identified issue with mail flow rules. Working on fix."
================================================================================
```

## Filter Reference

### Status Values

| Text | Condition Generated |
|------|---------------------|
| open | `closedFlag=false` |
| closed | `closedFlag=true` |
| all | No status filter |
| new | `status/name="New"` |
| in-progress | `status/name="In Progress"` |
| waiting | `status/name contains "Waiting"` |
| completed | `status/name="Completed"` |

### Priority Values

| Text | Priority ID | Condition |
|------|-------------|-----------|
| critical | 1 | `priority/id=1` |
| high | 2 | `priority/id=2` |
| medium | 3 | `priority/id=3` |
| low | 4 | `priority/id=4` |

### Date Formats

- `YYYY-MM-DD` - Date only (2024-02-15)
- `YYYY-MM-DDTHH:MM:SS` - Date and time (2024-02-15T09:00:00)

## Generated API Conditions

### Example Condition Strings

**Open tickets for company:**
```
conditions=company/id=12345 and closedFlag=false
```

**High priority open tickets:**
```
conditions=priority/id<=2 and closedFlag=false
```

**Text search:**
```
conditions=summary contains "email" and closedFlag=false
```

**Date range:**
```
conditions=dateEntered>=[2024-02-01] and dateEntered<[2024-02-15]
```

**Assigned to specific member:**
```
conditions=resources contains "jsmith" and closedFlag=false
```

## Error Handling

### No Results

```
No tickets found matching criteria

Suggestions:
- Broaden your search (remove filters)
- Check spelling of company/board names
- Try --status all to include closed tickets
- Verify date format is YYYY-MM-DD
```

### Invalid Company

```
Error: Company not found: "Acm"

Did you mean?
- Acme Corporation (ID: 12345)
- Acme Industries (ID: 12346)
```

### Invalid Board

```
Error: Service board not found: "Invalid"

Available boards:
- Service Desk (ID: 1)
- Managed Services (ID: 2)
- Projects (ID: 3)
```

### Rate Limiting

```
Rate limited by ConnectWise API

Retrying in 5 seconds...
```

### Too Many Results

```
Found 1,247 tickets matching criteria (showing first 25)

Use --limit to increase results or add filters to narrow search.
```

## API Query Details

### Default Query

```http
GET /service/tickets?conditions=closedFlag=false&page=1&pageSize=25&orderBy=priority/id asc,dateEntered desc&fields=id,summary,company/name,status/name,priority/name,dateEntered,resources
```

### Ordering

Results are ordered by:
1. Priority (ascending - critical first)
2. Date entered (descending - newest first)

### Fields Retrieved

- `id` - Ticket ID
- `summary` - Ticket summary
- `company/name` - Company name
- `status/name` - Status name
- `priority/name` - Priority name
- `dateEntered` - Creation date
- `resources` - Assigned member
- `board/name` - Board name
- `contact/name` - Contact name
- `_info/lastUpdated` - Last update time

## Related Commands

- `/create-ticket` - Create new ticket
- `/show-ticket` - View full ticket details
- `/update-ticket` - Modify ticket
- `/add-note` - Add note to ticket
- `/log-time` - Log time against ticket
