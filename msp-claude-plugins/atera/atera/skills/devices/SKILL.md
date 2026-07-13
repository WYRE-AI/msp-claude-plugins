---
name: "Atera Devices"
description: >
  Use this skill when working with Atera device monitors - HTTP, SNMP, and TCP
  monitors for network devices, services, and applications. Covers monitor types,
  configuration, thresholds, and monitoring best practices.
  Essential for MSP network monitoring through Atera.
when_to_use: >-
  When working with HTTP, SNMP, and TCP monitors for network devices, services, and applications
  in Atera device monitors. Use when: atera device, atera monitor, http monitor, snmp monitor, tcp
  monitor, network monitor, device monitoring, snmp polling, uptime monitoring, or port monitor.
---

# Atera Device Monitoring

## Overview

Atera device monitors extend monitoring capabilities beyond agent-based endpoints to include network devices, services, and applications. These agentless monitors use HTTP, SNMP, and TCP protocols to check availability and gather metrics.

## Monitor Types

### HTTP Monitors

Monitor web services and applications via HTTP/HTTPS requests.

| Feature | Description |
|---------|-------------|
| **Protocol** | HTTP or HTTPS |
| **Methods** | GET, POST, HEAD |
| **Validation** | Status code, response content |
| **Authentication** | Basic, custom headers |
| **Use Cases** | Websites, APIs, web apps |

### SNMP Monitors

Monitor network devices using Simple Network Management Protocol.

| Feature | Description |
|---------|-------------|
| **Versions** | SNMP v1, v2c, v3 |
| **Operations** | GET, GETNEXT, WALK |
| **Data Types** | OIDs, MIBs, counters |
| **Use Cases** | Routers, switches, firewalls, printers |

### TCP Monitors

Monitor service availability via TCP port connectivity.

| Feature | Description |
|---------|-------------|
| **Protocol** | TCP |
| **Check Type** | Port open/closed |
| **Response** | Connection success/timeout |
| **Use Cases** | Custom services, databases, mail servers |

## Device Monitor Fields

### Common Fields

| Field | Type | Description |
|-------|------|-------------|
| `DeviceID` | int | Unique device identifier |
| `CustomerID` | int | Associated customer ID |
| `CustomerName` | string | Customer display name |
| `DeviceName` | string | Monitor display name |
| `DeviceType` | string | HTTP, SNMP, TCP |
| `Hostname` | string | Target host/IP address |
| `Online` | boolean | Current status |
| `LastSeen` | datetime | Last successful check |
| `CreatedOn` | datetime | Monitor creation date |

### HTTP-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `URL` | string | Full URL to monitor |
| `Port` | int | HTTP port (default 80/443) |
| `CheckCertificateExpiration` | boolean | Monitor SSL cert |
| `CheckCertificateRevocation` | boolean | Check cert revocation |
| `Username` | string | Basic auth username |
| `Password` | string | Basic auth password |
| `ResponseText` | string | Expected response content |
| `ResponseCode` | int | Expected HTTP status |

### SNMP-Specific Fields (v1/v2c)

| Field | Type | Description |
|-------|------|-------------|
| `Port` | int | SNMP port (default 161) |
| `Community` | string | SNMP community string |
| `OID` | string | Object identifier to query |
| `Threshold` | string | Alert threshold |
| `ThresholdComparison` | string | Comparison operator |

### SNMP v3-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `Username` | string | SNMPv3 username |
| `AuthProtocol` | string | MD5, SHA, SHA256, SHA384, SHA512 |
| `AuthPassword` | string | Authentication password |
| `PrivProtocol` | string | DES, AES, AES192, AES256 |
| `PrivPassword` | string | Privacy password |
| `ContextName` | string | SNMPv3 context |

### TCP-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `Port` | int | TCP port to check |
| `Timeout` | int | Connection timeout (ms) |

## API Patterns

### List Generic Devices (Paginated)

```http
GET /api/v3/devices/generic?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "DeviceID": 55555,
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "DeviceName": "Core Router",
      "DeviceType": "SNMP",
      "Hostname": "192.168.1.1",
      "Online": true,
      "LastSeen": "2024-02-15T14:30:00Z"
    }
  ],
  "totalItems": 25,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 1
}
```

### Create HTTP Monitor

```http
POST /api/v3/devices/http
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerID": 12345,
  "DeviceName": "Website Monitor",
  "Hostname": "www.acme.com",
  "URL": "https://www.acme.com/health",
  "Port": 443,
  "CheckCertificateExpiration": true,
  "ResponseCode": 200,
  "ResponseText": "OK"
}
```

**Response:**
```json
{
  "ActionID": 55556,
  "DeviceID": 55556
}
```

### Create SNMP v1/v2c Monitor

```http
POST /api/v3/devices/snmp
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerID": 12345,
  "DeviceName": "Core Router",
  "Hostname": "192.168.1.1",
  "Port": 161,
  "Community": "public",
  "OID": "1.3.6.1.2.1.1.3.0",
  "Threshold": "1000",
  "ThresholdComparison": ">"
}
```

### Create SNMP v3 Monitor

```http
POST /api/v3/devices/snmpv3
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerID": 12345,
  "DeviceName": "Firewall",
  "Hostname": "192.168.1.254",
  "Port": 161,
  "Username": "snmpuser",
  "AuthProtocol": "SHA256",
  "AuthPassword": "authpass123",
  "PrivProtocol": "AES256",
  "PrivPassword": "privpass123",
  "OID": "1.3.6.1.4.1.9.9.109.1.1.1.1.3.1",
  "Threshold": "80",
  "ThresholdComparison": ">"
}
```

### Create TCP Monitor

```http
POST /api/v3/devices/tcp
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerID": 12345,
  "DeviceName": "Database Server",
  "Hostname": "db.acme.local",
  "Port": 1433,
  "Timeout": 5000
}
```

### Delete Device Monitor

```http
DELETE /api/v3/devices/{deviceType}/{deviceId}
X-API-KEY: {api_key}
```

**Device types:** `http`, `snmp`, `snmpv3`, `tcp`, `generic`

## Common SNMP OIDs

### System Information

| OID | Description |
|-----|-------------|
| `1.3.6.1.2.1.1.1.0` | System description |
| `1.3.6.1.2.1.1.3.0` | System uptime |
| `1.3.6.1.2.1.1.5.0` | System name |
| `1.3.6.1.2.1.1.6.0` | System location |

### Interface Statistics

| OID | Description |
|-----|-------------|
| `1.3.6.1.2.1.2.2.1.2` | Interface description |
| `1.3.6.1.2.1.2.2.1.8` | Interface operational status |
| `1.3.6.1.2.1.2.2.1.10` | Bytes in |
| `1.3.6.1.2.1.2.2.1.16` | Bytes out |

### CPU and Memory

| OID | Description |
|-----|-------------|
| `1.3.6.1.4.1.9.9.109.1.1.1.1.3` | Cisco CPU 5 min avg |
| `1.3.6.1.4.1.2021.10.1.3.1` | Linux 1 min load avg |
| `1.3.6.1.4.1.2021.4.6.0` | Linux available RAM |

### Storage

| OID | Description |
|-----|-------------|
| `1.3.6.1.2.1.25.2.3.1.5` | Storage size |
| `1.3.6.1.2.1.25.2.3.1.6` | Storage used |

## Common TCP Ports

| Port | Service | Monitor Name |
|------|---------|--------------|
| 21 | FTP | FTP Server |
| 22 | SSH | SSH Access |
| 25 | SMTP | Mail Server (SMTP) |
| 53 | DNS | DNS Server |
| 80 | HTTP | Web Server |
| 110 | POP3 | Mail Server (POP3) |
| 143 | IMAP | Mail Server (IMAP) |
| 443 | HTTPS | Secure Web Server |
| 445 | SMB | File Sharing |
| 1433 | MSSQL | SQL Server |
| 3306 | MySQL | MySQL Server |
| 3389 | RDP | Remote Desktop |
| 5432 | PostgreSQL | PostgreSQL |
| 5900 | VNC | VNC Server |

## Monitoring Best Practices

### HTTP Monitors

1. **Use dedicated health endpoints** - `/health` or `/status`
2. **Check SSL certificates** - Enable cert expiration alerts
3. **Validate response content** - Don't just check status codes
4. **Set reasonable timeouts** - 10-30 seconds typical
5. **Monitor critical paths** - Login, API endpoints

### SNMP Monitors

1. **Use SNMPv3 when possible** - Better security
2. **Change default community strings** - Never use "public"
3. **Monitor interface status** - Not just availability
4. **Set appropriate thresholds** - Based on baseline
5. **Use meaningful OIDs** - Document what you monitor

### TCP Monitors

1. **Monitor service ports** - Not just ICMP ping
2. **Use appropriate timeouts** - Account for latency
3. **Monitor critical services** - Databases, mail, etc.
4. **Document port purposes** - Future reference

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid device ID | Verify device exists |
| 400 | Invalid hostname | Check host/IP format |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify permissions |
| 404 | Device not found | Confirm device ID |
| 429 | Rate limited | Wait and retry (700 req/min) |

### Monitor Configuration Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Host unreachable | Network issue | Verify connectivity |
| SNMP timeout | Wrong community | Check SNMP config |
| Certificate error | Invalid/expired cert | Update certificate |
| Port closed | Service not running | Start service |

## Alerting Configuration

### Threshold Types

| Comparison | Usage |
|------------|-------|
| `>` | Above threshold (CPU > 90%) |
| `<` | Below threshold (disk free < 10%) |
| `=` | Exact match |
| `!=` | Not equal |

### Alert Intervals

| Setting | Recommendation |
|---------|----------------|
| Check interval | 1-5 minutes |
| Alert after | 2-3 failures |
| Recovery after | 2-3 successes |

## Related Skills

- [Atera Alerts](../alerts/SKILL.md) - Device monitor alerts
- [Atera Agents](../agents/SKILL.md) - Agent-based monitoring
- [Atera Customers](../customers/SKILL.md) - Customer device associations
- [Atera API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
