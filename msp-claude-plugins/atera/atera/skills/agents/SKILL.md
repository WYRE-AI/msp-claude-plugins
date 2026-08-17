---
name: "Atera Agents"
description: >
  Atera RMM agents: agent records and fields, online/offline status,
  endpoint search and monitoring, PowerShell and script execution, and agent
  lifecycle.
when_to_use: >-
  When listing, searching, monitoring, or running commands on Atera-managed
  endpoints. Use when: atera agent, rmm agent, atera device, agent status,
  agent online, agent offline, powershell atera, run script atera, managed
  device, or endpoint atera.
---

# Atera Agent Management

## Overview

Atera agents are lightweight software installed on managed endpoints that provide remote monitoring and management capabilities. Agents report system information, health metrics, and enable remote execution of scripts and commands.

## Anti-triggers

- **Atera's own "devices"** — an Atera *device* is an agentless HTTP,
  SNMP, or TCP monitor with no agent behind it; use `atera-devices`.
  Atera is the odd one out: in `ncentral-devices`,
  `ninjaone-devices`, and `datto-rmm-devices` "device" means the
  managed endpoint, which here is an agent.
- **Claude subagents** — "agent" here is an Atera endpoint sensor, never
  an AI subagent definition under `agents/*.md`. In `halopsa-agents` it
  is a human technician, and in `liongard-overview` it is one
  inspection runner per customer site.
- **Running a script on an endpoint managed by another RMM** — "run
  PowerShell on this machine" matches every RMM in this marketplace
  equally, and none of them reach Atera's agents. Confirm which RMM the
  endpoint is enrolled in, then use `syncro-assets`,
  `superops-runbooks`, `immybot-script-execution`,
  `ncentral-monitoring-tasks`, `connectwise-automate-scripts`, or
  `datto-rmm-jobs`.
- **The alert an agent raised** — agent records carry health and
  inventory, not monitoring output; use `atera-alerts`.

## Agent Information Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `AgentID` | int | Unique agent identifier |
| `AgentName` | string | Agent display name |
| `MachineID` | int | Machine reference ID |
| `CustomerID` | int | Associated customer ID |
| `CustomerName` | string | Customer display name |
| `Online` | boolean | Current online status |
| `LastSeenDate` | datetime | Last communication timestamp |

### System Information

| Field | Type | Description |
|-------|------|-------------|
| `MachineName` | string | Computer hostname |
| `DomainName` | string | AD domain (if joined) |
| `OS` | string | Operating system name |
| `OSVersion` | string | OS version/build |
| `OSType` | string | Windows, Mac, Linux |
| `OSSerialNumber` | string | OS serial number |
| `Processor` | string | CPU model |
| `Memory` | long | Total RAM in bytes |

### Network Information

| Field | Type | Description |
|-------|------|-------------|
| `IPAddresses` | string | Comma-separated IP list |
| `MacAddresses` | string | Network adapter MACs |
| `LastIPAddress` | string | Most recent IP |

### Agent Status

| Field | Type | Description |
|-------|------|-------------|
| `AgentVersion` | string | Installed agent version |
| `CreatedDate` | datetime | When agent was installed |
| `Monitored` | boolean | Monitoring enabled |
| `MonitoredStatus` | string | Monitoring state |
| `Favorite` | boolean | Marked as favorite |

### Hardware Details

| Field | Type | Description |
|-------|------|-------------|
| `Vendor` | string | Hardware manufacturer |
| `VendorSerialNumber` | string | Device serial number |
| `VendorModel` | string | Device model |
| `VendorBrandModel` | string | Full brand/model string |

## API Patterns

### List All Agents (Paginated)

```http
GET /api/v3/agents?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "AgentID": 98765,
      "AgentName": "DESKTOP-ABC123",
      "MachineName": "DESKTOP-ABC123",
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "Online": true,
      "LastSeenDate": "2024-02-15T14:30:00Z",
      "OS": "Windows 11 Pro",
      "OSType": "Windows",
      "Processor": "Intel Core i7-12700",
      "Memory": 34359738368,
      "IPAddresses": "192.168.1.100,10.0.0.50",
      "AgentVersion": "2.0.1.25",
      "Monitored": true
    }
  ],
  "totalItems": 500,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 10
}
```

### Get Agent by ID

```http
GET /api/v3/agents/{agentId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "AgentID": 98765,
  "AgentName": "DESKTOP-ABC123",
  "MachineName": "DESKTOP-ABC123",
  "DomainName": "ACME.LOCAL",
  "CustomerID": 12345,
  "CustomerName": "Acme Corporation",
  "Online": true,
  "LastSeenDate": "2024-02-15T14:30:00Z",
  "OS": "Windows 11 Pro",
  "OSVersion": "10.0.22621",
  "OSType": "Windows",
  "OSSerialNumber": "00330-80000-00000-AA123",
  "Processor": "Intel(R) Core(TM) i7-12700 CPU @ 2.10GHz",
  "Memory": 34359738368,
  "IPAddresses": "192.168.1.100",
  "MacAddresses": "00:1A:2B:3C:4D:5E",
  "Vendor": "Dell Inc.",
  "VendorSerialNumber": "ABC1234567",
  "VendorModel": "OptiPlex 7090",
  "AgentVersion": "2.0.1.25",
  "CreatedDate": "2023-06-15T09:00:00Z",
  "Monitored": true,
  "MonitoredStatus": "Healthy"
}
```

### Get Agents by Customer

```http
GET /api/v3/agents/customer/{customerId}
X-API-KEY: {api_key}
```

### Get Agent by Machine Name

```http
GET /api/v3/agents/machine/{machineName}
X-API-KEY: {api_key}
```

### Delete Agent

```http
DELETE /api/v3/agents/{agentId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "ActionID": 12345,
  "Success": true
}
```

## PowerShell Execution

### Run PowerShell Script

```http
POST /api/v3/agents/{agentId}/powershell
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Script": "Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object Name, DisplayName"
}
```

**Response:**
```json
{
  "ActionID": 55555,
  "Status": "Queued",
  "Message": "Script queued for execution"
}
```

### PowerShell Best Practices

1. **Keep scripts concise** - Long-running scripts may timeout
2. **Handle errors** - Use try/catch blocks
3. **Return structured data** - Use Select-Object for clean output
4. **Avoid interactive commands** - No prompts or user input
5. **Test locally first** - Validate before remote execution

### Common PowerShell Commands

**Get system information:**
```powershell
Get-ComputerInfo | Select-Object CsName, WindowsVersion, OsArchitecture
```

**Check disk space:**
```powershell
Get-WmiObject Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace
```

**List running processes:**
```powershell
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, WorkingSet
```

**Check Windows updates:**
```powershell
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5
```

**Restart a service:**
```powershell
Restart-Service -Name "Spooler" -Force
```

## Agent Online Status

### Checking Online Status

The `Online` field indicates current connectivity:

| Status | Description | Action |
|--------|-------------|--------|
| `true` | Agent communicating | Commands available |
| `false` | Agent not responding | Check network/power |

### Handling Offline Agents

1. **Check LastSeenDate** - Determine when agent was last online
2. **Verify network** - Ensure device has connectivity
3. **Check power state** - Device may be powered off
4. **Review alerts** - Look for related alerts
5. **Contact user** - Verify device status

### Offline Thresholds

| Duration | Interpretation | Action |
|----------|----------------|--------|
| < 5 min | Temporary | Normal fluctuation |
| 5-30 min | Short outage | Monitor |
| 30 min - 4 hr | Extended outage | Investigate |
| > 4 hr | Long-term offline | Contact customer |

## Agent Lifecycle

### Installation

1. Generate installer from Atera portal
2. Download and run on target device
3. Agent registers with Atera cloud
4. Appears in agent list within minutes

### Monitoring

- Agent sends heartbeat every few minutes
- Reports system metrics and alerts
- Receives commands from portal/API

### Removal

1. Uninstall from device (if accessible)
2. Delete via API or portal
3. Agent record removed from system

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid agent ID | Verify agent exists |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify permissions |
| 404 | Agent not found | Confirm agent ID |
| 429 | Rate limited | Wait and retry (700 req/min) |

### PowerShell Execution Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Agent offline | Device not connected | Wait for reconnection |
| Script timeout | Execution too long | Simplify script |
| Access denied | Insufficient privileges | Check agent permissions |
| Syntax error | Invalid PowerShell | Validate script locally |

## Best Practices

1. **Monitor agent health** - Track online/offline patterns
2. **Keep agents updated** - Use latest agent version
3. **Use meaningful names** - Rename agents for clarity
4. **Group by customer** - Organize for efficient management
5. **Review regularly** - Remove stale/decommissioned agents
6. **Document scripts** - Comment PowerShell for reuse
7. **Test before bulk execution** - Validate on single agent first

## Related Skills

- [Atera Customers](../customers/SKILL.md) - Customer agent associations
- [Atera Alerts](../alerts/SKILL.md) - Agent-generated alerts
- [Atera Devices](../devices/SKILL.md) - Non-agent monitored devices
- [Atera API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
