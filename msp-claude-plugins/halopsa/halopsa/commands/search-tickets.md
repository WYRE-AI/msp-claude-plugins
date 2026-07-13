---
description: Search for tickets in HaloPSA by various criteria
argument-hint: "[query] [client] [status] [priority] [tickettype] [agent] [team] [daterange] [limit]"
arguments: [query, client, status, priority, tickettype, agent, team, daterange, limit]
---

# Search HaloPSA Tickets

Search and filter tickets in HaloPSA using various criteria.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have ticket read permissions

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`

2. **Build search filter**
   - Parse all provided arguments
   - Resolve names to IDs (client, tickettype, agent, team)
   - Map status/priority text to IDs

3. **Execute search query**
   ```http
   GET /api/Tickets?client_id=123&status_id=1&page_size=25
   Authorization: Bearer {token}
   ```

4. **Format and return results**
   - Display ticket list with key details
   - Include quick actions for each ticket

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Free text search |
| client | string/int | No | - | Client filter |
| status | string | No | open | open/closed/all or status name |
| priority | string | No | - | critical/high/medium/low |
| tickettype | string | No | - | Ticket type name or ID |
| agent | string | No | - | Agent name or ID |
| team | string | No | - | Team name or ID |
| daterange | string | No | - | Date filter (today/week/month/custom) |
| limit | int | No | 25 | Max results (1-500) |

## Examples

### Search by Text

```
/search-tickets "email not working"
```

### Filter by Client

```
/search-tickets --client "Acme Corp"
```

### High Priority Open Tickets

```
/search-tickets --priority high --status open
```

### My Assigned Tickets

```
/search-tickets --agent "me"
```

### Combined Filters

```
/search-tickets --client "Acme" --status open --tickettype "Incident" --limit 10
```

### Search by Ticket ID

```
/search-tickets "54321"
```

### Recent Tickets

```
/search-tickets --daterange today --status all
```

### Team Queue

```
/search-tickets --team "Service Desk" --status open
```

## Output

```
Found 3 tickets matching criteria

+--------+--------------------------------+----------+----------+-------------+
| ID     | Summary                        | Client   | Priority | Status      |
+--------+--------------------------------+----------+----------+-------------+
| 54321  | Email not working              | Acme     | High     | In Progress |
| 54318  | Outlook crashes on startup     | Acme     | Medium   | New         |
| 54315  | Cannot send emails with att... | Acme     | Low      | Pending     |
+--------+--------------------------------+----------+----------+-------------+

Quick Actions:
- View ticket: /show-ticket <id>
- Update ticket: /update-ticket <id>
- Add note: /add-action <id>
```

### Detailed View

```
/search-tickets --client "Acme" --detailed
```

```
Found 2 tickets for Acme Corporation

================================================================================
#54321 - Email not working
================================================================================
Client:     Acme Corporation
Contact:    John Smith (john.smith@acme.com)
Site:       Main Office
Priority:   High (2)
Status:     In Progress
Type:       Incident
Agent:      Jane Tech
Team:       Service Desk
Created:    2024-02-15 09:23:00
Updated:    2024-02-15 10:45:00
SLA Due:    2024-02-15 11:23:00 (38 min remaining)

Summary:
Multiple users unable to send or receive email since 9am.
Affects sales team primarily.

Last Action (10:45):
"Identified issue with mail flow rules. Working on fix."
================================================================================
```

## Filter Reference

### Status Values

| Text | Filter Behavior |
|------|-----------------|
| open | All non-closed statuses |
| closed | Resolved + Closed statuses |
| all | No status filter |
| new | Status = New |
| in-progress | Status = In Progress |
| pending | Status = Pending |
| waiting | Status = Waiting on Client |

### Priority Values

| Text | Priority ID |
|------|-------------|
| critical | 1 |
| high | 2 |
| medium | 3 |
| low | 4 |

### Date Range Values

| Text | Filter |
|------|--------|
| today | Created today |
| week | Created in last 7 days |
| month | Created in last 30 days |
| YYYY-MM-DD:YYYY-MM-DD | Custom date range |

## Output Formats

### Default (Summary)

Shows compact ticket list with key fields.

### Detailed (--detailed)

Shows full ticket information including:
- Contact information
- Site details
- Last action/note
- SLA status

### JSON (--format json)

Returns raw JSON response for scripting.

## Error Handling

### No Results

```
No tickets found matching criteria

Suggestions:
- Broaden your search (remove filters)
- Check spelling of client/agent names
- Try --status all to include closed tickets
```

### Invalid Client

```
Client not found: "Acm"

Did you mean?
- Acme Corporation (ID: 123)
- Acme Industries (ID: 124)
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials are configured correctly.
Run: /halopsa-setup to reconfigure.
```

### Rate Limiting

```
Rate limited by HaloPSA API

Retrying in 5 seconds...
```

## Advanced Usage

### Export Results

```
/search-tickets --client "Acme" --status all --format csv > tickets.csv
```

### Combine with Other Commands

```bash
# Find and update all high priority unassigned tickets
/search-tickets --priority high --agent none --status open | xargs -I {} /assign-ticket {} --agent "Jane Tech"
```

### SLA At-Risk Tickets

```
/search-tickets --sla-status at-risk --status open
```

## Related Commands

- `/create-ticket` - Create new ticket
- `/show-ticket` - View full ticket details
- `/update-ticket` - Modify ticket
- `/add-action` - Add note/time to ticket
