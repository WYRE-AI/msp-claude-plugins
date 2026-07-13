---
description: View SLA status across tickets, including approaching breaches and at-risk tickets
argument-hint: "[client_id] [team] [status] [period] [limit]"
arguments: [client_id, team, status, period, limit]
---

# HaloPSA SLA Dashboard

View SLA status across tickets, including approaching breaches and at-risk tickets for proactive management.

## Prerequisites

- Valid HaloPSA OAuth credentials configured
- User must have ticket read permissions
- SLA profiles must be configured in HaloPSA

## Steps

1. **Authenticate with OAuth 2.0**
   - Obtain access token using client credentials flow
   - Token endpoint: `{base_url}/auth/token?tenant={tenant}`
   ```bash
   # Get OAuth token
   TOKEN=$(curl -s -X POST "{base_url}/auth/token?tenant={tenant}" \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials" \
     -d "client_id={client_id}" \
     -d "client_secret={client_secret}" \
     -d "scope=all" | jq -r '.access_token')
   ```

2. **Build query parameters**
   - Apply time period filter
   - Apply team filter if specified
   - Apply client filter if specified

3. **Fetch tickets with SLA data**
   ```bash
   # Get tickets with SLA information
   curl -s -X GET "{base_url}/api/Tickets?open_only=true&page_size={limit}&includesladetails=true" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Get SLA definitions (for context)**
   ```bash
   curl -s -X GET "{base_url}/api/SLA" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Calculate SLA status for each ticket**
   - Breaching: SLA target has passed
   - At Risk: Less than 25% time remaining
   - On Track: More than 25% time remaining

6. **Filter by requested status**
   - Apply breaching/at_risk/on_track filter
   - Sort by urgency (breaching first, then at_risk)

7. **Format and display dashboard**
   - Summary statistics
   - Detailed ticket list
   - Quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| client_id | integer | No | - | Filter by client ID |
| team | string | No | - | Filter by team name |
| status | string | No | all | breaching/at_risk/on_track/all |
| period | string | No | today | today/week/month |
| limit | integer | No | 25 | Maximum results (max 100) |

## Examples

### View All SLA Status

```
/sla-dashboard
```

### Breaching Tickets Only

```
/sla-dashboard --status breaching
```

### Specific Team

```
/sla-dashboard --team "Service Desk" --status breaching
```

### Client-Specific SLA

```
/sla-dashboard --client_id 12345 --period week
```

### At-Risk Tickets

```
/sla-dashboard --status at_risk --limit 50
```

### Weekly Overview

```
/sla-dashboard --period week --status all
```

## Output

### Dashboard View

```
================================================================================
                          SLA DASHBOARD - Today
================================================================================

SUMMARY
--------------------------------------------------------------------------------
Total Open Tickets:     45
🔴 Breaching:           3  (6.7%)
🟡 At Risk:             8  (17.8%)
🟢 On Track:            34 (75.5%)

Response SLA Met:       42/45 (93.3%)
Resolution SLA Met:     38/45 (84.4%)

================================================================================
🔴 BREACHING SLA (3)
================================================================================

#12345 - Email not working
  Client:     Acme Corporation
  Priority:   Critical
  Agent:      Jane Tech
  SLA:        Resolution BREACHED by 1h 23m
  Breached:   2024-02-15 14:00:00
  Action:     /update-ticket 12345 --status "Escalated"

#12342 - Server offline
  Client:     Widgets Inc
  Priority:   Critical
  Agent:      Unassigned
  SLA:        Response BREACHED by 45m
  Breached:   2024-02-15 13:15:00
  Action:     /update-ticket 12342 --agent "Level 2"

#12338 - Network slowdown
  Client:     Tech Corp
  Priority:   High
  Agent:      Bob Tech
  SLA:        Resolution BREACHED by 15m
  Breached:   2024-02-15 14:45:00
  Action:     /add-action 12338 "Escalating to network team"

================================================================================
🟡 AT RISK - Action Needed (8)
================================================================================

#12350 - Printer not working
  Client:     Acme Corporation
  Priority:   Medium
  Agent:      Jane Tech
  SLA:        Resolution due in 28 min (15:30)
  Risk Level: High (< 30 min remaining)

#12348 - VPN connection issues
  Client:     Widgets Inc
  Priority:   High
  Agent:      Mike Support
  SLA:        Resolution due in 45 min (15:47)
  Risk Level: Medium (< 1 hour remaining)

#12346 - Password reset request
  Client:     Tech Corp
  Priority:   Low
  Agent:      Sarah Help
  SLA:        Resolution due in 1h 15m (16:17)
  Risk Level: Low (< 2 hours remaining)

... and 5 more at-risk tickets

================================================================================
🟢 ON TRACK (34)
================================================================================

Showing 10 of 34 on-track tickets (use --limit to see more)

#12355 - New user setup
  Client:     Acme Corporation
  SLA:        Resolution due in 3h 45m
  Status:     In Progress

#12354 - Software installation request
  Client:     Widgets Inc
  SLA:        Resolution due in 5h 20m
  Status:     Pending

...

================================================================================
QUICK ACTIONS
================================================================================

View breaching:   /sla-dashboard --status breaching
View at-risk:     /sla-dashboard --status at_risk
Team view:        /sla-dashboard --team "Service Desk"
Weekly report:    /sla-dashboard --period week

================================================================================
```

### Team-Specific View

```
================================================================================
            SLA DASHBOARD - Service Desk - Today
================================================================================

Team:               Service Desk
Active Tickets:     18
Agents Online:      4

TEAM SLA PERFORMANCE
--------------------------------------------------------------------------------
Response SLA:       17/18 (94.4%)
Resolution SLA:     15/18 (83.3%)

BREACHING (1)
--------------------------------------------------------------------------------
#12345 - Email not working
  Agent: Jane Tech | Breached by: 23 min
  /add-action 12345 "Providing update"

AT RISK (3)
--------------------------------------------------------------------------------
#12350 - Printer issue      | Due in: 28 min  | Agent: Jane Tech
#12348 - VPN problems       | Due in: 45 min  | Agent: Mike Support
#12346 - Password reset     | Due in: 1h 15m  | Agent: Sarah Help

AGENT BREAKDOWN
--------------------------------------------------------------------------------
Agent           | Tickets | Breaching | At Risk | On Track
----------------|---------|-----------|---------|----------
Jane Tech       | 5       | 1         | 1       | 3
Mike Support    | 4       | 0         | 1       | 3
Sarah Help      | 5       | 0         | 1       | 4
Bob Support     | 4       | 0         | 0       | 4

================================================================================
```

### Client-Specific View

```
================================================================================
          SLA DASHBOARD - Acme Corporation - Week
================================================================================

Client:           Acme Corporation
Contract:         Managed Services (Premium SLA)
Period:           Last 7 days

PERFORMANCE SUMMARY
--------------------------------------------------------------------------------
Total Tickets:    12
Resolved:         8
Still Open:       4

Response SLA:     12/12 (100%)
Resolution SLA:   10/12 (83.3%)

BREACHES THIS PERIOD
--------------------------------------------------------------------------------
#12290 - Email sync issue
  Breached: 2024-02-12 (Resolution - 45 min late)
  Root Cause: Escalation delay

#12275 - Network outage
  Breached: 2024-02-10 (Resolution - 2 hours late)
  Root Cause: Vendor response time

CURRENT OPEN TICKETS
--------------------------------------------------------------------------------
#12345 - Email not working      | 🔴 BREACHING | Agent: Jane Tech
#12350 - Printer not working    | 🟡 At Risk   | Agent: Jane Tech
#12355 - New user setup         | 🟢 On Track  | Agent: Sarah Help
#12358 - Software request       | 🟢 On Track  | Agent: Unassigned

================================================================================
```

## Error Handling

### No Tickets Found

```
No tickets found matching criteria

Filters applied:
- Status: breaching
- Team: Service Desk
- Period: today

All tickets are currently on track! 🎉

Try broadening your search:
- /sla-dashboard --status all
- /sla-dashboard --period week
```

### Invalid Team

```
Team not found: "Unknown Team"

Available teams:
- Service Desk
- Level 2 Support
- Network Team
- Security Team

Use: /sla-dashboard --team "Service Desk"
```

### Authentication Error

```
Authentication failed

Please verify your HaloPSA credentials:
- HALOPSA_CLIENT_ID
- HALOPSA_CLIENT_SECRET
- HALOPSA_BASE_URL
- HALOPSA_TENANT (for cloud-hosted)

Ensure the API application has 'read:tickets' permission.
```

### Rate Limiting

```
Rate limited by HaloPSA API (429)

HaloPSA allows 500 requests per 3 minutes.
Retrying in 5 seconds...
```

## SLA Status Definitions

| Status | Criteria | Action Required |
|--------|----------|-----------------|
| 🔴 Breaching | Target time exceeded | Immediate escalation |
| 🟡 At Risk | < 25% time remaining | Prioritize or escalate |
| 🟢 On Track | > 25% time remaining | Normal workflow |

## API Reference

### GET /api/Tickets

Query parameters for SLA filtering:
- `open_only=true` - Only open tickets
- `includesladetails=true` - Include SLA information
- `team_id={id}` - Filter by team
- `client_id={id}` - Filter by client
- `page_size={limit}` - Limit results

### GET /api/SLA

Retrieves SLA profile definitions and targets.

## Related Commands

- `/show-ticket` - View ticket details
- `/update-ticket` - Update ticket status/priority
- `/search-tickets` - Search tickets by criteria
- `/add-action` - Add note to ticket
