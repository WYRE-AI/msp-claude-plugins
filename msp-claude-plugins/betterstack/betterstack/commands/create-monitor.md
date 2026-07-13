---
description: Create a new Better Stack uptime monitor
argument-hint: "<url> [check_type] [name] [check_frequency] [expected_status]"
arguments: [url, check_type, name, check_frequency, expected_status]
---

# Create Better Stack Monitor

Create a new uptime monitor in Better Stack to track the availability of a URL, host, or service.

## Prerequisites

- Better Stack MCP server connected with valid API token
- MCP tool `create_monitor` available

## Steps

1. **Validate inputs**

   Verify the URL is valid and the check type is supported. For HTTP monitors, confirm the URL is reachable.

2. **Set monitor name**

   If no `name` is provided, derive a meaningful name from the URL (e.g., "example.com - HTTP").

3. **Create the monitor**

   Call `create_monitor` with the provided parameters:
   - `url` - The URL or host to monitor
   - `monitor_type` - The check type (status for HTTP, ping, tcp, etc.)
   - `pronounceable_name` - The human-readable name
   - `check_frequency` - The check interval in seconds
   - `expected_status_codes` - Expected HTTP status codes (for HTTP monitors)

4. **Verify creation**

   Confirm the monitor was created successfully and report the monitor ID.

5. **Recommend next steps**

   Suggest adding the monitor to a monitor group, linking to a status page, or configuring notification policies.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| url | string | Yes | | The URL or host to monitor |
| check_type | string | No | http | Monitor type: http, ping, tcp, udp, dns, smtp, pop, imap |
| name | string | No | derived | Human-readable name for the monitor |
| check_frequency | integer | No | 180 | Check interval in seconds |
| expected_status | integer | No | 200 | Expected HTTP status code |

## Examples

### Create HTTP Monitor

```
/create-monitor --url "https://example.com"
```

### Create Ping Monitor

```
/create-monitor --url "10.0.1.5" --check_type ping --name "Database Server"
```

### Create Monitor with 30s Interval

```
/create-monitor --url "https://api.example.com/health" --check_frequency 30 --name "Production API"
```

## Error Handling

- **Invalid URL:** Verify the URL format and accessibility
- **Duplicate Monitor:** A monitor for this URL may already exist; check existing monitors first
- **Authentication Error:** Verify `BETTERSTACK_API_TOKEN` is set correctly

## Related Commands

- `/monitor-status` - Check the status of all monitors
- `/status-page-update` - Add the new monitor to a status page
- `/incident-triage` - Review incidents triggered by monitors
