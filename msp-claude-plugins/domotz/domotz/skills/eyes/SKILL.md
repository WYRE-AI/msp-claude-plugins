---
name: "Domotz Eyes"
description: >
  Domotz Eyes, the agent-run synthetic monitoring sensors: TCP, HTTP, and
  custom Eye types, their UP/DOWN/WARNING status model, listing sensors and
  historical results, and diagnosing failed or high-latency checks.
when_to_use: >-
  When inspecting or reasoning about Domotz synthetic sensors and their check
  results. Use when: domotz eyes, domotz
  sensor, tcp check, http check, service monitoring, synthetic monitoring, latency check, uptime
  monitoring, domotz eye, or custom monitor.
---

# Domotz Eyes (Sensors)

## Overview

Domotz Eyes are synthetic monitoring sensors that run from Domotz agents to actively test service availability and performance. Unlike passive SNMP monitoring, Eyes actively probe endpoints with TCP connections, HTTP requests, and custom checks to verify services are responding correctly.

## Key Concepts

### Eye Types

- **TCP Eye** - Tests TCP connectivity to a port; measures connection latency
- **HTTP Eye** - Sends HTTP requests; validates response code, body content, and latency
- **Custom Eye** - User-defined scripts for specialized monitoring

### TCP Eyes

TCP Eyes establish a TCP connection to a specified host and port:
- Measures connection establishment time (latency)
- Detects service availability (port open/closed)
- Supports any TCP service (SMTP, FTP, database, custom apps)

### HTTP Eyes

HTTP Eyes send HTTP/HTTPS requests and validate responses:
- Checks HTTP status code (200, 301, etc.)
- Validates response body content (keyword matching)
- Measures total response time (latency)
- Supports GET and POST methods
- Can send custom headers and authentication

### Eye Status

| Status | Meaning |
|--------|---------|
| `UP` | Check passed successfully |
| `DOWN` | Check failed (connection refused, timeout, wrong response) |
| `WARNING` | Check passed but latency exceeds threshold |

## API Patterns

### List Eyes for an Agent

```
domotz_list_eyes
```

Parameters:
- `agent_id` -- The agent running the sensors (required)

**Example response:**

```json
[
  {
    "id": 101,
    "name": "Web Server HTTPS",
    "type": "http",
    "target": "https://app.acmecorp.com",
    "status": "UP",
    "latency_ms": 145,
    "last_check": "2026-03-27T15:30:00Z",
    "interval_seconds": 300
  },
  {
    "id": 102,
    "name": "Database Port",
    "type": "tcp",
    "target": "192.168.1.50:5432",
    "status": "UP",
    "latency_ms": 2,
    "last_check": "2026-03-27T15:30:00Z",
    "interval_seconds": 60
  }
]
```

### Get Eye Details

```
domotz_get_eye
```

Parameters:
- `agent_id` -- The agent ID (required)
- `eye_id` -- The specific eye/sensor ID (required)

### Get Eye Historical Results

```
domotz_list_eye_results
```

Parameters:
- `agent_id` -- The agent ID (required)
- `eye_id` -- The eye/sensor ID (required)

**Example response:**

```json
[
  {
    "timestamp": "2026-03-27T15:30:00Z",
    "status": "UP",
    "latency_ms": 145,
    "http_status_code": 200
  },
  {
    "timestamp": "2026-03-27T15:25:00Z",
    "status": "UP",
    "latency_ms": 152,
    "http_status_code": 200
  }
]
```

## Common Workflows

### Service Availability Dashboard

1. Call `domotz_list_agents` to get all sites
2. For each agent, call `domotz_list_eyes`
3. Aggregate all eyes with their current status
4. Build a dashboard showing UP/DOWN/WARNING counts per site
5. Flag any DOWN sensors for immediate attention

### Latency Trend Analysis

1. Call `domotz_list_eye_results` for a specific sensor
2. Calculate average, min, max, and p95 latency
3. Identify latency spikes or degradation trends
4. Correlate with network events or speed test results

### Service Health Check

1. List all HTTP Eyes for a site
2. Check status and latency for each
3. Flag any with DOWN status or high latency
4. Cross-reference with device status for the target host

### Monitoring Coverage Audit

1. List all Eyes across all agents
2. Compare against documented critical services
3. Identify services without monitoring
4. Recommend new Eyes for uncovered services

## Error Handling

### Eye Showing DOWN

**Cause:** Target service is unreachable, firewall blocking, or service crashed
**Solution:** Check device status; verify service is running; check firewall rules

### High Latency

**Cause:** Network congestion, server overload, or WAN issues
**Solution:** Check speed test results; review SNMP data for network devices; check server resources

### No Eye Results

**Cause:** Eye was recently created, agent is offline, or eye is disabled
**Solution:** Verify agent is online; check eye configuration; wait for first check cycle

## Best Practices

- Create HTTP Eyes for all customer-facing web applications
- Use TCP Eyes for critical internal services (databases, mail servers, RDP)
- Set appropriate check intervals (60s for critical, 300s for standard)
- Configure latency thresholds that match SLA requirements
- Set up alert profiles on Eyes for automatic notification
- Review Eye results trends weekly to catch gradual degradation
- Use HTTP Eyes with content validation to detect partial outages (200 OK but error page)
- Name Eyes consistently: "ServiceName Protocol" (e.g., "CRM Portal HTTPS")

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and rate limiting
- [agents](../agents/SKILL.md) - Agents that run Eyes sensors
- [devices](../devices/SKILL.md) - Devices being monitored by Eyes
- [alerts](../alerts/SKILL.md) - Alerts generated by Eye failures
- [network](../network/SKILL.md) - Network monitoring and port checks
