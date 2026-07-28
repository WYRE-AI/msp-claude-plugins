---
name: "runZero Services"
description: >
  runZero discovered services: listing services, filtering by port or protocol,
  identifying vulnerabilities, and auditing exposed services across sites.
when_to_use: >-
  When reviewing discovered services, open ports, protocols, or service exposure across
  runZero sites. Use when: runzero service, discovered service, service inventory, open
  port, service protocol, service vulnerability, port scan, exposed service, or service
  audit.
---

# RunZero Services

## Overview

RunZero discovers services running on every asset -- open ports, protocols, software versions, and TLS configurations. Service data is critical for vulnerability assessment, compliance auditing, and attack surface management. This skill covers listing, filtering, and analyzing discovered services.

## Key Concepts

### Service Attributes

Each discovered service includes:

| Attribute | Description |
|-----------|-------------|
| `port` | TCP/UDP port number |
| `protocol` | Application protocol (HTTP, SSH, RDP, etc.) |
| `transport` | Transport layer (TCP, UDP) |
| `summary` | Service banner or description |
| `software` | Detected software and version |
| `tls` | TLS/SSL configuration details |
| `asset_id` | The asset this service runs on |
| `first_seen` | When the service was first discovered |
| `last_seen` | When the service was last observed |

### Common Protocols

| Protocol | Default Port | Risk Considerations |
|----------|-------------|---------------------|
| `ssh` | 22 | Check for weak ciphers, old versions |
| `rdp` | 3389 | High-risk if exposed externally |
| `http` | 80 | Check for unencrypted admin panels |
| `https` | 443 | Verify TLS version and certificate |
| `smb` | 445 | Ransomware vector if exposed |
| `snmp` | 161 | Check for default community strings |
| `telnet` | 23 | Unencrypted; should be disabled |
| `ftp` | 21 | Unencrypted; check for anonymous access |

### Vulnerability Indicators

RunZero flags services with security concerns:

- Expired or self-signed TLS certificates
- Outdated software versions with known CVEs
- Insecure protocols (Telnet, FTP, SNMPv1)
- Default credentials detected
- Exposed management interfaces

## API Patterns

### List Services

```
runzero_services_list
```

Parameters:
- `site_id` -- Filter by site
- `search` -- RunZero query string
- `count` -- Results per page
- `offset` -- Pagination offset

**Example response:**

```json
{
  "services": [
    {
      "id": "svc-uuid-123",
      "asset_id": "asset-uuid-456",
      "port": 3389,
      "transport": "tcp",
      "protocol": "rdp",
      "summary": "Microsoft Terminal Services",
      "software": "Windows RDP 10.0",
      "first_seen": "2026-01-15T10:00:00Z",
      "last_seen": "2026-03-27T08:30:00Z"
    }
  ]
}
```

### Get Service Details

```
runzero_services_get
```

Parameters:
- `service_id` -- The specific service UUID

### Export Services

```
runzero_services_export
```

Parameters:
- `search` -- RunZero query to filter services
- `site_id` -- Filter by site

Use for bulk service data retrieval.

### Service Query Examples

```
protocol:rdp AND alive:true
port:445 AND NOT address:10.0.0.0/8
protocol:ssh AND software:OpenSSH AND software:<8
protocol:telnet
port:443 AND tls.version:TLSv1.0
```

## Common Workflows

### Exposed Service Audit

1. Search for high-risk services: `protocol:rdp OR protocol:telnet OR protocol:ftp`
2. Filter to externally-facing assets if possible
3. Flag services that should not be exposed
4. Generate remediation recommendations

### TLS Certificate Audit

1. Search for HTTPS services: `protocol:https`
2. Check for expired certificates, weak TLS versions
3. Identify self-signed certificates
4. Generate certificate expiry report

### Port Scan Summary

1. Export all services for a site
2. Aggregate by port and protocol
3. Count unique assets per service type
4. Identify unexpected or unauthorized services

### Vulnerability Surface Analysis

1. Search for services with known vulnerable software versions
2. Cross-reference with CVE databases
3. Prioritize by severity and exposure
4. Generate actionable remediation report

### SMB/RDP Exposure Check

1. Search: `protocol:rdp OR protocol:smb`
2. Identify assets exposing these services
3. Check if any are externally reachable
4. Recommend firewall rules or VPN-only access

## Error Handling

### Service Not Found

**Cause:** Invalid service UUID or service no longer detected
**Solution:** Search by port/protocol on the asset instead

### Large Result Sets

**Cause:** Broad queries returning thousands of services
**Solution:** Add site or protocol filters; use the Export API

## Best Practices

- Use the Export API for service inventories across large environments
- Focus security audits on high-risk protocols (RDP, SMB, Telnet, FTP)
- Monitor for new services appearing between scans
- Track TLS certificate expiry dates proactively
- Cross-reference discovered services with firewall rules
- Generate per-client service reports for security reviews

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Query language and pagination
- [assets](../assets/SKILL.md) - Assets running the services
- [sites](../sites/SKILL.md) - Sites containing the services
- [tasks](../tasks/SKILL.md) - Scans that discover services
