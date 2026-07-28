---
name: "Better Stack Monitors"
description: >
  Better Stack uptime monitors: check types, monitor fields, heartbeat
  monitors, monitor groups, and create/update/pause/delete operations.
when_to_use: >-
  When listing, creating, updating, pausing, or deleting Better Stack
  monitors. Use when: betterstack monitor, uptime monitor, heartbeat
  monitor, monitor group, check type, monitor status, monitor downtime,
  betterstack uptime, or better uptime.
---

# Better Stack Uptime Monitors

## Overview

Uptime monitors are the core of Better Stack's monitoring platform. They periodically check URLs, ports, or heartbeats to detect downtime and performance degradation. Monitors can be grouped, paused, and configured with custom check intervals, expected status codes, and alerting thresholds.

## Key Concepts

### Monitor Types

- **HTTP/HTTPS** - Check a URL for expected status code and response
- **Ping (ICMP)** - Ping a host to verify reachability
- **TCP** - Check if a TCP port is open and responding
- **UDP** - Check UDP port connectivity
- **Heartbeat** - Expect periodic check-ins from cron jobs or services
- **DNS** - Verify DNS record resolution
- **SMTP** - Check mail server connectivity
- **POP3/IMAP** - Check email retrieval services

### Monitor Statuses

- **Up** - Monitor is healthy, all checks passing
- **Down** - Monitor detected downtime
- **Paused** - Monitor is paused and not checking
- **Pending** - Monitor was just created and hasn't checked yet
- **Maintenance** - Monitor is in a maintenance window
- **Validating** - Confirming downtime before alerting

### Check Intervals

Better Stack supports check intervals from 30 seconds to 24 hours. Common intervals:
- **30s** - Critical production services
- **60s** - Standard web applications
- **180s** - Non-critical services
- **300s** - Background or internal services

### Heartbeat Monitors

Heartbeat monitors expect periodic pings from your services. If a ping is missed, the monitor triggers an incident. Use for:
- Cron jobs and scheduled tasks
- Backup processes
- Queue workers and consumers
- Batch data pipelines

## API Patterns

### List Monitors

```
betterstack_list_monitors
```

Parameters:
- `page` - Pagination cursor
- `per_page` - Results per page (default 50, max 100)

**Example response:**

```json
{
  "data": [
    {
      "id": "12345",
      "type": "monitor",
      "attributes": {
        "url": "https://example.com",
        "pronounceable_name": "Example Website",
        "monitor_type": "status",
        "status": "up",
        "check_frequency": 60,
        "last_checked_at": "2026-03-27T10:00:00Z",
        "paused": false
      }
    }
  ],
  "pagination": {
    "next": null,
    "prev": null
  }
}
```

### Create Monitor

```
betterstack_create_monitor
```

Parameters:
- `url` - The URL or host to monitor (required)
- `monitor_type` - Type: status, ping, tcp, udp, dns, smtp, pop, imap (required)
- `pronounceable_name` - Human-readable name
- `check_frequency` - Check interval in seconds (default 180)
- `expected_status_codes` - Expected HTTP status codes (e.g., [200, 301])
- `regions` - Monitoring regions (us, eu, as, au)
- `confirmation_period` - Seconds to wait before confirming downtime
- `monitor_group_id` - Assign to a monitor group

### Get Monitor

```
betterstack_get_monitor
```

Parameters:
- `monitor_id` - The monitor ID

### Update Monitor

```
betterstack_update_monitor
```

Parameters:
- `monitor_id` - The monitor ID
- Any attributes to update (url, check_frequency, expected_status_codes, etc.)

### Delete Monitor

```
betterstack_delete_monitor
```

Parameters:
- `monitor_id` - The monitor ID

### Pause / Resume Monitor

```
betterstack_pause_monitor
betterstack_resume_monitor
```

Parameters:
- `monitor_id` - The monitor ID

### List Heartbeats

```
betterstack_list_heartbeats
```

### Create Heartbeat

```
betterstack_create_heartbeat
```

Parameters:
- `name` - Heartbeat name (required)
- `period` - Expected interval in seconds (required)
- `grace` - Grace period in seconds before alerting

## Common Workflows

### Daily Monitor Health Check

1. Call `betterstack_list_monitors` to get all monitors
2. Filter for monitors with status `down` or `validating`
3. Group by monitor group to identify affected clients
4. Check incident history for recurring issues
5. Escalate persistent downtime to on-call team

### Onboarding a New Client

1. Create a monitor group for the client
2. Create HTTP monitors for all client-facing URLs
3. Create heartbeat monitors for critical cron jobs
4. Configure appropriate check intervals by service criticality
5. Assign monitors to the client's notification group

### Maintenance Window

1. Pause monitors for services under maintenance
2. Update status page with maintenance notice
3. Perform maintenance work
4. Resume monitors after maintenance
5. Verify all monitors return to "up" status

## Error Handling

### Monitor Not Found

**Cause:** Invalid monitor ID or monitor was deleted
**Solution:** List monitors to verify the correct ID

### Invalid URL

**Cause:** URL format is incorrect or unreachable
**Solution:** Verify the URL is valid and accessible from Better Stack's monitoring regions

### Duplicate Monitor

**Cause:** A monitor for the same URL already exists
**Solution:** Check existing monitors before creating; update the existing one instead

## Best Practices

- Group monitors by client or environment for organization
- Use meaningful names that include the client and service
- Set check intervals based on service criticality
- Configure confirmation periods to avoid false positives
- Use multiple regions for critical services
- Set up heartbeat monitors for all scheduled tasks
- Review paused monitors regularly to avoid forgotten monitors
- Use expected status codes to catch partial failures (e.g., 200 but error page)

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and error handling
- [incidents](../incidents/SKILL.md) - Incidents triggered by monitors
- [status-pages](../status-pages/SKILL.md) - Status pages linked to monitors
- [oncall](../oncall/SKILL.md) - On-call notifications from monitors
