---
name: "SentinelOne Inventory"
description: >
  SentinelOne's unified asset inventory across four surface types — agent-managed
  endpoints, AWS/Azure/GCP cloud resources, AD/Entra identities, and
  Ranger-discovered network devices. Covers the read-only inventory tools, the REST
  (not GraphQL) offset-pagination and filter model, asset field reference, and
  agent-coverage audit workflows.
when_to_use: >-
  When auditing asset coverage, agent health, or unmanaged devices in a SentinelOne
  environment. Use when: sentinelone inventory, sentinelone asset,
  sentinelone endpoint, sentinelone agent, sentinelone device, sentinelone workstation,
  sentinelone server, asset inventory, endpoint health, sentinelone cloud resource, sentinelone
  identity, sentinelone ranger, or network discovery.
---

# SentinelOne Unified Asset Inventory

## Overview

The SentinelOne unified asset inventory provides a single view of all assets across an organization's environment. Assets are categorized by surface type -- endpoints with SentinelOne agents, cloud resources in AWS/Azure/GCP, identity accounts from Active Directory and Entra ID, and network-discovered devices found by Ranger. For MSPs, the inventory is the foundation for security coverage -- ensuring every client device has an active agent, tracking cloud resource sprawl, and identifying unmanaged devices on client networks.

The inventory uses the **REST API** (not GraphQL), with offset-based pagination and direct filter parameters. All inventory tools are **read-only**.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_inventory_item` | Get a single inventory item by ID | `itemId` (required) |
| `list_inventory_items` | List inventory items with filters | `surface`, `limit`, `offset`, `sortBy`, `sortOrder` |
| `search_inventory_items` | Search inventory with REST filters | `filters`, `surface`, `limit`, `offset` |

### List Inventory Items

Call `list_inventory_items` with optional parameters:

- **Filter by surface:** Set `surface` to `ENDPOINT`, `CLOUD`, `IDENTITY`, or `NETWORK_DISCOVERY`
- **Paginate:** Set `limit` (results per page) and `offset` (skip N results)
- **Sort results:** Set `sortBy` and `sortOrder`

**Example: List all endpoints:**
- `list_inventory_items` with `surface=ENDPOINT`, `limit=100`

**Example: List cloud resources:**
- `list_inventory_items` with `surface=CLOUD`, `limit=100`

**Example: List network-discovered devices:**
- `list_inventory_items` with `surface=NETWORK_DISCOVERY`, `limit=100`

### Search Inventory Items

Call `search_inventory_items` with `filters` for targeted queries:

**Example: Search for a specific endpoint by name:**
- `search_inventory_items` with `surface=ENDPOINT`, `filters={"name__contains": "workstation-01"}`

**Example: Search for Windows servers:**
- `search_inventory_items` with `surface=ENDPOINT`, `filters={"osType": "WINDOWS", "machineType": "SERVER"}`

### Get Inventory Item Details

Call `get_inventory_item` with the `itemId` to retrieve full details including agent status, OS information, network details, and security posture.

## Key Concepts

### Surface Types

| Surface | Description | Data Sources |
|---------|-------------|-------------|
| `ENDPOINT` | Managed endpoints with SentinelOne agents | Workstations, servers, laptops, VMs |
| `CLOUD` | Cloud infrastructure resources | AWS EC2, Azure VMs, GCP instances, S3 buckets, etc. |
| `IDENTITY` | User and service accounts | Active Directory, Entra ID (Azure AD), Okta |
| `NETWORK_DISCOVERY` | Network-discovered devices (Ranger) | Switches, printers, IoT, unmanaged devices |

### Endpoint Types

| Type | Description |
|------|-------------|
| `WORKSTATION` | Desktop or laptop workstation |
| `SERVER` | Server (physical or virtual) |
| `LAPTOP` | Laptop (may overlap with WORKSTATION) |
| `VIRTUAL_MACHINE` | Cloud or on-premises VM |
| `CONTAINER` | Container workload |

### Agent Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Agent is running and communicating |
| `INACTIVE` | Agent installed but not communicating |
| `DISCONNECTED` | Agent has lost connection to the console |
| `DECOMMISSIONED` | Agent has been decommissioned |
| `PENDING` | Agent installation in progress |

### REST API Pagination

The inventory uses offset-based pagination (unlike the cursor-based GraphQL tools):

| Parameter | Description | Default |
|-----------|-------------|---------|
| `limit` | Results per page | 50 |
| `offset` | Number of results to skip | 0 |

To iterate through all results:

1. Call with `offset=0`, `limit=100`
2. If 100 results returned, call with `offset=100`, `limit=100`
3. Continue incrementing offset until fewer results than limit are returned

### REST Filter Types

| Filter Type | Syntax | Description |
|-------------|--------|-------------|
| Exact match | `fieldName=value` | Direct value comparison |
| Contains | `fieldName__contains=value` | Substring matching |
| Greater than or equal | `fieldName__gte=value` | Minimum value (dates, numbers) |
| Less than or equal | `fieldName__lte=value` | Maximum value (dates, numbers) |
| Not equal | `fieldName__ne=value` | Exclude matches |
| In list | `ids=id1,id2,id3` | Match multiple IDs |

## Field Reference

### Core Inventory Fields

| Field | Type | Description |
|-------|------|-------------|
| `itemId` | string | Unique inventory item identifier |
| `name` | string | Asset name/hostname |
| `surface` | string | ENDPOINT/CLOUD/IDENTITY/NETWORK_DISCOVERY |
| `siteName` | string | SentinelOne site (MSP client) |
| `accountName` | string | SentinelOne account |
| `lastSeen` | datetime | Last communication timestamp |

### Endpoint-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `osType` | string | WINDOWS/MACOS/LINUX |
| `osName` | string | Full OS name (e.g., "Windows 11 Enterprise") |
| `osVersion` | string | OS version string |
| `machineType` | string | WORKSTATION/SERVER/LAPTOP/VIRTUAL_MACHINE |
| `agentVersion` | string | SentinelOne agent version |
| `agentStatus` | string | ACTIVE/INACTIVE/DISCONNECTED |
| `isUpToDate` | boolean | Whether agent is on the latest version |
| `externalIp` | string | External/public IP address |
| `internalIp` | string | Internal/private IP address |
| `domain` | string | AD domain membership |
| `lastLoggedInUser` | string | Last logged-in user |
| `encryptionStatus` | string | Disk encryption status |
| `firewallStatus` | string | Firewall enabled/disabled |

### Cloud-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `cloudProvider` | string | AWS/AZURE/GCP |
| `region` | string | Cloud region |
| `resourceType` | string | Resource type (EC2, VM, S3, etc.) |
| `resourceId` | string | Cloud resource identifier |
| `tags` | object | Cloud resource tags |

### Identity-Specific Fields

| Field | Type | Description |
|-------|------|-------------|
| `identityProvider` | string | AD/ENTRA_ID/OKTA |
| `email` | string | User email address |
| `department` | string | Department |
| `lastLogin` | datetime | Last login timestamp |
| `mfaEnabled` | boolean | Whether MFA is enabled |
| `accountStatus` | string | Active/Disabled/Locked |

### Network Discovery Fields

| Field | Type | Description |
|-------|------|-------------|
| `deviceType` | string | Discovered device type |
| `manufacturer` | string | Device manufacturer |
| `macAddress` | string | MAC address |
| `ipAddress` | string | Discovered IP address |
| `managed` | boolean | Whether a SentinelOne agent is installed |
| `firstSeen` | datetime | When Ranger first discovered the device |

## Common Workflows

### Asset Audit

1. Call `list_inventory_items` with `surface=ENDPOINT`, `limit=100`
2. Paginate through all results using `offset`
3. Count by OS type, agent status, and machine type
4. Identify endpoints with inactive or disconnected agents
5. Identify endpoints with outdated agent versions

### Endpoint Health Check

1. Call `list_inventory_items` with `surface=ENDPOINT`
2. Filter for agents not on the latest version: `isUpToDate=false`
3. Filter for disconnected agents: `agentStatus=DISCONNECTED`
4. Group by client (siteName) to identify which clients have unhealthy endpoints
5. Generate a health report with upgrade and reconnection recommendations

### Cloud Resource Inventory

1. Call `list_inventory_items` with `surface=CLOUD`
2. Group by cloud provider and resource type
3. Count resources per client (siteName)
4. Identify resources not tagged according to client standards
5. Cross-reference with misconfigurations for exposed resources

### Unmanaged Device Discovery

1. Call `list_inventory_items` with `surface=NETWORK_DISCOVERY`
2. Filter for `managed=false` to find devices without SentinelOne agents
3. Group by client (siteName) and device type
4. Generate a list of unmanaged devices for agent deployment

### Identity Inventory

1. Call `list_inventory_items` with `surface=IDENTITY`
2. Check for accounts without MFA enabled
3. Identify stale accounts (no login in 90+ days)
4. Group by identity provider and department
5. Generate an identity hygiene report

### Client Coverage Report

1. For each client, query all four surfaces: ENDPOINT, CLOUD, IDENTITY, NETWORK_DISCOVERY
2. Count managed vs. unmanaged assets
3. Calculate coverage percentage
4. Identify gaps in agent deployment
5. Present as a security coverage dashboard for QBR

## Response Examples

**Endpoint Inventory Item:**

```json
{
  "itemId": "inv-endpoint-001",
  "name": "ACME-WS-042",
  "surface": "ENDPOINT",
  "siteName": "Acme Corporation",
  "osType": "WINDOWS",
  "osName": "Windows 11 Enterprise",
  "osVersion": "23H2",
  "machineType": "WORKSTATION",
  "agentVersion": "24.1.2.345",
  "agentStatus": "ACTIVE",
  "isUpToDate": true,
  "externalIp": "203.0.113.10",
  "internalIp": "192.168.1.42",
  "domain": "acme.local",
  "lastLoggedInUser": "jsmith",
  "lastSeen": "2026-02-24T10:00:00.000Z",
  "encryptionStatus": "ENCRYPTED",
  "firewallStatus": "ENABLED"
}
```

**Network Discovery Item:**

```json
{
  "itemId": "inv-ranger-005",
  "name": "Unknown Device",
  "surface": "NETWORK_DISCOVERY",
  "siteName": "Acme Corporation",
  "deviceType": "Network Printer",
  "manufacturer": "HP",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "ipAddress": "192.168.1.200",
  "managed": false,
  "firstSeen": "2026-02-20T14:00:00.000Z",
  "lastSeen": "2026-02-24T09:30:00.000Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Item not found | Invalid itemId | Verify the ID with `list_inventory_items` |
| Invalid surface filter | Wrong surface value | Use ENDPOINT, CLOUD, IDENTITY, or NETWORK_DISCOVERY |
| Empty results | No matching assets | Widen filters or check scope |
| Authentication error | Invalid token | Verify Service User token is Account or Site level |
| Timeout | Query too broad | Add surface or site filters to reduce result set |

## Best Practices

1. **Always specify surface type** - Filter by ENDPOINT, CLOUD, IDENTITY, or NETWORK_DISCOVERY for focused results
2. **Monitor agent health** - Regularly check for INACTIVE or DISCONNECTED endpoints
3. **Track unmanaged devices** - Use NETWORK_DISCOVERY to find devices without agents
4. **Scope to clients** - Filter by siteName when reviewing a specific client's inventory
5. **Check agent versions** - Identify endpoints with outdated agents for upgrade scheduling
6. **Cross-reference with alerts** - Use inventory data to enrich alert investigations with asset context
7. **Paginate consistently** - Use offset-based pagination for large inventories
8. **Cache inventory data** - Asset data changes less frequently than alerts; cache for short periods
9. **Generate coverage reports** - Calculate agent deployment coverage per client for QBRs
10. **Identify shadow IT** - Network-discovered devices may reveal unauthorized equipment

## Related Skills

- [Alerts](../alerts/SKILL.md) - Alerts affecting inventory assets
- [Vulnerabilities](../vulnerabilities/SKILL.md) - Vulnerabilities on inventory endpoints
- [Misconfigurations](../misconfigurations/SKILL.md) - Misconfigurations on inventory resources
- [API Patterns](../api-patterns/SKILL.md) - MCP tools reference and REST API details
- [Purple AI](../purple-ai/SKILL.md) - Investigate threats on specific assets
