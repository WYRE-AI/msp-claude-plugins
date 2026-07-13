---
name: "Domotz Network"
description: >
  Use this skill when working with Domotz network operations --
  network scanning, SNMP polling, port monitoring, speed tests,
  and network topology discovery.
when_to_use: >-
  When working with network scanning, SNMP polling, port monitoring, speed tests, and network
  topology discovery in Domotz network operations. Use when: domotz network, network scan, snmp,
  port monitoring, speed test, network discovery, network topology, bandwidth, port check, or snmp
  polling.
---

# Domotz Network Operations

## Overview

Domotz provides comprehensive network monitoring capabilities through its agents. This includes network device discovery, SNMP polling for hardware metrics, TCP port monitoring, speed tests for bandwidth measurement, and network topology mapping.

## Key Concepts

### Network Scanning

Domotz agents periodically scan local network subnets to discover devices. Scans can also be triggered on demand. Discovery uses:
- **ARP scanning** - Discovers devices on local subnets
- **SNMP discovery** - Identifies device capabilities and metadata
- **DNS resolution** - Resolves hostnames for discovered IPs
- **MAC OUI lookup** - Identifies device vendor from MAC address

### SNMP Monitoring

Domotz polls SNMP-enabled devices for operational metrics:
- **Interface statistics** - Bandwidth utilization, errors, discards
- **System resources** - CPU, memory, disk usage
- **Environmental** - Temperature, fan status, power supply
- **Custom OIDs** - User-defined SNMP data points

### Port Monitoring

TCP port monitoring checks whether specific services are reachable:
- Web servers (80, 443)
- Remote access (3389, 22)
- Database servers (1433, 3306, 5432)
- Custom application ports

### Speed Tests

Agents can run bandwidth speed tests to measure:
- **Download speed** - Downstream bandwidth
- **Upload speed** - Upstream bandwidth
- **Latency** - Round-trip time

## API Patterns

### Trigger Network Scan

```
domotz_scan_network
```

Parameters:
- `agent_id` -- The agent to run the scan from (required)

### List SNMP Data

```
domotz_list_snmp_data
```

Parameters:
- `agent_id` -- The agent ID (required)
- `device_id` -- The device to get SNMP data for (required)

**Example response:**

```json
[
  {
    "oid": "1.3.6.1.2.1.2.2.1.10.1",
    "label": "ifInOctets (GigabitEthernet0/1)",
    "value": "1234567890",
    "type": "Counter32",
    "last_polled": "2026-03-27T15:00:00Z"
  }
]
```

### List Open Ports

```
domotz_list_ports
```

Parameters:
- `agent_id` -- The agent ID (required)
- `device_id` -- The device to check ports for (required)

**Example response:**

```json
[
  {
    "port": 443,
    "protocol": "tcp",
    "status": "open",
    "service": "https",
    "last_checked": "2026-03-27T15:00:00Z"
  }
]
```

### Run Speed Test

```
domotz_run_speed_test
```

Parameters:
- `agent_id` -- The agent to run the speed test from (required)

**Example response:**

```json
{
  "download_speed": 245.6,
  "upload_speed": 48.2,
  "latency": 12.4,
  "timestamp": "2026-03-27T15:05:00Z"
}
```

## Common Workflows

### Network Discovery Audit

1. Call `domotz_scan_network` to trigger a fresh scan
2. Wait for scan to complete
3. Call `domotz_list_devices` to see all discovered devices
4. Compare against known inventory for new/rogue devices

### Bandwidth Monitoring

1. Call `domotz_list_snmp_data` for network devices
2. Look for `ifInOctets` and `ifOutOctets` counters
3. Calculate bandwidth utilization over time
4. Flag interfaces exceeding capacity thresholds

### Service Availability Check

1. Call `domotz_list_ports` for a server device
2. Verify expected services are showing as `open`
3. Flag any expected ports that are `closed`
4. Cross-reference with Domotz Eyes checks for deeper monitoring

### Site Bandwidth Assessment

1. Call `domotz_run_speed_test` from the site's agent
2. Compare results against the ISP's advertised speeds
3. Track trends over time to identify degradation
4. Flag sites with consistently low bandwidth

## Error Handling

### Scan Not Completing

**Cause:** Agent is busy, offline, or network is very large
**Solution:** Check agent status; wait and retry; reduce scan scope

### No SNMP Data

**Cause:** Device does not support SNMP, wrong community string, or SNMP not configured
**Solution:** Verify SNMP is enabled on the device; check community string configuration

### Port Check Failures

**Cause:** Firewall blocking the scan, device offline, or service not running
**Solution:** Verify device is online; check firewall rules; verify service is running

## Best Practices

- Schedule regular network scans to detect new devices
- Monitor SNMP metrics for all critical network infrastructure
- Set up port monitoring for business-critical services
- Run periodic speed tests to track ISP performance
- Compare discovered devices against documented inventory
- Use SNMP data to build capacity planning reports
- Configure alert profiles for SNMP threshold violations

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Pagination and rate limiting
- [agents](../agents/SKILL.md) - Agents that perform network operations
- [devices](../devices/SKILL.md) - Devices discovered by scans
- [alerts](../alerts/SKILL.md) - Alerts from network monitoring
- [eyes](../eyes/SKILL.md) - Advanced monitoring sensors
