---
description: Create a threshold-based monitor for an Atera agent
argument-hint: "<agent_id> <monitor_type> <name> <target> [interval] [threshold] [alert_severity]"
arguments: [agent_id, monitor_type, name, target, interval, threshold, alert_severity]
---

# Create Atera Monitor

Create a threshold-based monitor for an agent including HTTP, TCP, or SNMP monitoring.

## Prerequisites

- Valid Atera API key configured
- Agent must exist and be online
- User must have monitor creation permissions

## Steps

1. **Validate agent exists**
   ```bash
   curl -s -X GET "https://app.atera.com/api/v3/agents/{agent_id}" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Accept: application/json"
   ```
   - Verify agent exists
   - Capture device and customer info

2. **Validate monitor parameters**
   - Check monitor_type is valid (HTTP, TCP, SNMP)
   - Validate target format based on type
   - Set defaults for optional parameters

3. **Create the monitor**
   Based on monitor_type:

   For HTTP:
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/agents/{agent_id}/monitors/http" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "Name": "<name>",
       "URL": "<target>",
       "Interval": <interval>,
       "AlertSeverity": "<alert_severity>"
     }'
   ```

   For TCP:
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/agents/{agent_id}/monitors/tcp" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "Name": "<name>",
       "Port": <target>,
       "Interval": <interval>,
       "AlertSeverity": "<alert_severity>"
     }'
   ```

   For SNMP:
   ```bash
   curl -s -X POST "https://app.atera.com/api/v3/agents/{agent_id}/monitors/snmp" \
     -H "X-API-KEY: $ATERA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "Name": "<name>",
       "OID": "<target>",
       "Threshold": "<threshold>",
       "Interval": <interval>,
       "AlertSeverity": "<alert_severity>"
     }'
   ```

4. **Return monitor confirmation**
   - Monitor ID
   - Monitor configuration summary
   - Agent and customer info

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| agent_id | integer | Yes | - | The agent ID to monitor |
| monitor_type | string | Yes | - | HTTP, TCP, or SNMP |
| name | string | Yes | - | Monitor display name |
| target | string | Yes | - | URL, port, or OID to monitor |
| interval | integer | No | 5 | Check interval in minutes |
| threshold | string | No | - | Alert threshold value |
| alert_severity | string | No | Warning | Information, Warning, Critical |

## Examples

### HTTP Monitor

```
/create-monitor 12345 --monitor_type HTTP --name "Website Check" --target "https://example.com"
```

### HTTP Monitor with Interval

```
/create-monitor 12345 --monitor_type HTTP --name "Website Check" --target "https://example.com" --interval 5
```

### TCP Port Monitor

```
/create-monitor 12345 --monitor_type TCP --name "SQL Port" --target "1433"
```

### TCP Monitor with Critical Severity

```
/create-monitor 12345 --monitor_type TCP --name "SQL Port" --target "1433" --alert_severity Critical
```

### SNMP Monitor with Threshold

```
/create-monitor 12345 --monitor_type SNMP --name "CPU Usage" --target "1.3.6.1.2.1.25.3.3.1.2" --threshold "90"
```

### SNMP Monitor Full Configuration

```
/create-monitor 12345 --monitor_type SNMP --name "Disk Usage" --target "1.3.6.1.2.1.25.2.3.1.5" --threshold "80" --interval 10 --alert_severity Warning
```

## Output

### HTTP Monitor Created

```
Monitor Created Successfully

Monitor ID: 9876
Type: HTTP
Name: Website Check
Agent: SERVER-WEB01 (ID: 12345)
Customer: Acme Corporation

Configuration:
- URL: https://example.com
- Interval: 5 minutes
- Alert Severity: Warning
- Expected Response: 200 OK

Status: Active
First check scheduled in 5 minutes
```

### TCP Monitor Created

```
Monitor Created Successfully

Monitor ID: 9877
Type: TCP
Name: SQL Port
Agent: SERVER-SQL01 (ID: 12345)
Customer: Acme Corporation

Configuration:
- Port: 1433
- Interval: 5 minutes
- Alert Severity: Critical

Status: Active
Monitoring for port connectivity
```

### SNMP Monitor Created

```
Monitor Created Successfully

Monitor ID: 9878
Type: SNMP
Name: CPU Usage
Agent: SERVER-DC01 (ID: 12345)
Customer: Acme Corporation

Configuration:
- OID: 1.3.6.1.2.1.25.3.3.1.2
- Threshold: 90
- Interval: 5 minutes
- Alert Severity: Warning

Status: Active
Alert when value exceeds threshold
```

## Error Handling

### Agent Not Found

```
Agent not found: 12345

Please verify the agent ID and try again.
Use /search-agents to find valid agent IDs.
```

### Agent Offline

```
Agent is offline: DESKTOP-ABC123 (ID: 12345)

Last seen: 2026-02-03 18:45:00 (16 hours ago)

Monitor can be created but won't collect data until agent is online.
Proceed? [Y/n]
```

### Invalid Monitor Type

```
Invalid monitor type: "PING"

Valid monitor types:
- HTTP: Monitor website or API endpoints
- TCP: Monitor port connectivity
- SNMP: Monitor SNMP metrics with thresholds
```

### Invalid URL for HTTP

```
Invalid URL: "example.com"

HTTP monitors require a full URL:
- https://example.com
- http://192.168.1.100:8080/health
```

### Invalid Port for TCP

```
Invalid port: "sql"

TCP monitors require a numeric port:
- 1433 (SQL Server)
- 3389 (RDP)
- 443 (HTTPS)
```

### Invalid OID for SNMP

```
Invalid OID format: "cpu.usage"

SNMP monitors require a valid OID:
- 1.3.6.1.2.1.25.3.3.1.2 (CPU)
- 1.3.6.1.2.1.25.2.3.1.5 (Storage)
```

### Duplicate Monitor

```
Monitor already exists for this target

Existing Monitor:
ID: 9870
Name: Website Check
Target: https://example.com

Create anyway? [y/N]
```

### Rate Limit Exceeded

```
Rate limit exceeded (700 req/min)

Waiting 30 seconds before retry...
```

## API Patterns

### Get Agent Details
```http
GET /api/v3/agents/{agentId}
X-API-KEY: {api_key}
```

### Create HTTP Monitor
```http
POST /api/v3/agents/{agentId}/monitors/http
X-API-KEY: {api_key}
Content-Type: application/json

{
  "Name": "Website Check",
  "URL": "https://example.com",
  "Interval": 5,
  "AlertSeverity": "Warning"
}
```

### Create TCP Monitor
```http
POST /api/v3/agents/{agentId}/monitors/tcp
X-API-KEY: {api_key}
Content-Type: application/json

{
  "Name": "SQL Port",
  "Port": 1433,
  "Interval": 5,
  "AlertSeverity": "Critical"
}
```

### Create SNMP Monitor
```http
POST /api/v3/agents/{agentId}/monitors/snmp
X-API-KEY: {api_key}
Content-Type: application/json

{
  "Name": "CPU Usage",
  "OID": "1.3.6.1.2.1.25.3.3.1.2",
  "Threshold": "90",
  "Interval": 5,
  "AlertSeverity": "Warning"
}
```

## Common OIDs Reference

| Metric | OID |
|--------|-----|
| CPU Usage | 1.3.6.1.2.1.25.3.3.1.2 |
| Memory Usage | 1.3.6.1.2.1.25.2.3.1.5 |
| Disk Usage | 1.3.6.1.2.1.25.2.3.1.6 |
| Interface Status | 1.3.6.1.2.1.2.2.1.8 |
| System Uptime | 1.3.6.1.2.1.1.3.0 |

## Related Commands

- `/search-agents` - Search for RMM agents
- `/list-alerts` - View monitor alerts
- `/resolve-alert` - Resolve monitor alerts
