---
description: Asset inventory summary by surface type across managed environments
argument-hint: "[surface]"
arguments: [surface]
---

# SentinelOne Asset Inventory

Generate an asset inventory summary for managed client environments. Lists assets by surface type (endpoints, cloud resources, identities, network-discovered devices) with counts per client, health status, and coverage metrics. Useful for agent deployment tracking, QBR preparation, and unmanaged device identification.

## Prerequisites

- SentinelOne Purple MCP server connected with a valid Service User token
- MCP tools `list_inventory_items` and `search_inventory_items` available
- Token must be Account or Site level (NOT Global)

## Steps

1. **Fetch inventory items**

   Call `list_inventory_items` with the specified `surface` filter. Paginate through all results using `offset` and `limit`.

2. **Aggregate by client**

   Group inventory items by `siteName` (client) and count per client.

3. **Summarize by type/status**

   For endpoints: count by OS type, agent status, and machine type.
   For cloud: count by cloud provider and resource type.
   For identities: count by identity provider and MFA status.
   For network discovery: count by managed vs. unmanaged.

4. **Identify health issues**

   Flag disconnected agents, outdated agent versions, unmanaged devices, and accounts without MFA.

5. **Present inventory summary**

   Show totals, per-client breakdown, and health recommendations.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| surface | string | No | ENDPOINT | Surface type (ENDPOINT, CLOUD, IDENTITY, NETWORK_DISCOVERY) |

## Examples

### Endpoint Inventory

```
/asset-inventory
```

### Cloud Resource Inventory

```
/asset-inventory --surface CLOUD
```

### Identity Inventory

```
/asset-inventory --surface IDENTITY
```

### Network Discovery (Unmanaged Devices)

```
/asset-inventory --surface NETWORK_DISCOVERY
```

## Output

### Endpoint Inventory

```
SentinelOne Asset Inventory - Endpoints
================================================================
Generated: 2026-02-24
Surface:   ENDPOINT
Total:     847 endpoints

Agent Status:
+---------------+-------+
| Status        | Count |
+---------------+-------+
| ACTIVE        | 812   |
| INACTIVE      | 18    |
| DISCONNECTED  | 12    |
| PENDING       | 5     |
+---------------+-------+
Coverage: 95.9% active

OS Distribution:
+-------------------+-------+
| OS Type           | Count |
+-------------------+-------+
| Windows           | 623   |
| macOS             | 189   |
| Linux             | 35    |
+-------------------+-------+

Machine Types:
+-------------------+-------+
| Type              | Count |
+-------------------+-------+
| WORKSTATION       | 645   |
| SERVER            | 142   |
| VIRTUAL_MACHINE   | 55    |
| LAPTOP            | 5     |
+-------------------+-------+

Per-Client Breakdown:
+----------------------------+-------+--------+----------+--------------+
| Client                     | Total | Active | Inactive | Disconnected |
+----------------------------+-------+--------+----------+--------------+
| Acme Corporation           | 125   | 120    | 3        | 2            |
| TechStart Inc              | 80    | 78     | 1        | 1            |
| Global Services LLC        | 200   | 192    | 4        | 4            |
| Metro Industries           | 65    | 63     | 1        | 1            |
| Summit Financial           | 55    | 52     | 2        | 1            |
| Harbor Consulting          | 25    | 24     | 1        | 0            |
+----------------------------+-------+--------+----------+--------------+
(More clients with fewer endpoints omitted)

Health Issues:
  1. 18 INACTIVE agents - installed but not communicating
     Top affected: Global Services (4), Acme Corp (3)
  2. 12 DISCONNECTED agents - lost connection to console
     Top affected: Global Services (4), Acme Corp (2)
  3. 23 endpoints with outdated agent versions
     Recommendation: Schedule agent upgrades during next maintenance window

Recommended Actions:
  1. Investigate disconnected agents -- may indicate endpoints offline or decommissioned
  2. Reactivate inactive agents or remove decommissioned endpoints
  3. Schedule agent version upgrades for 23 outdated endpoints
  4. Check for unmanaged devices: /asset-inventory --surface NETWORK_DISCOVERY
================================================================
```

### Network Discovery Inventory

```
SentinelOne Asset Inventory - Network Discovery
================================================================
Generated: 2026-02-24
Surface:   NETWORK_DISCOVERY
Total:     312 discovered devices

Management Status:
+-------------------+-------+
| Status            | Count |
+-------------------+-------+
| Managed (Agent)   | 243   |
| Unmanaged         | 69    |
+-------------------+-------+
Coverage: 77.9% managed

Unmanaged Devices by Type:
+-------------------+-------+
| Device Type       | Count |
+-------------------+-------+
| Network Printer   | 18    |
| IoT Device        | 12    |
| Unknown           | 11    |
| Switch/Router     | 9     |
| IP Camera         | 8     |
| Workstation       | 6     |
| Server            | 5     |
+-------------------+-------+

Unmanaged Devices by Client:
+----------------------------+-------+
| Client                     | Count |
+----------------------------+-------+
| Acme Corporation           | 15    |
| Global Services LLC        | 12    |
| Metro Industries           | 10    |
| TechStart Inc              | 8     |
+----------------------------+-------+

Action Required:
  - 6 unmanaged WORKSTATIONS detected -- deploy SentinelOne agents
  - 5 unmanaged SERVERS detected -- deploy SentinelOne agents immediately
  - 11 UNKNOWN devices need identification and classification
  - Network devices (printers, IoT, cameras) should be segmented
================================================================
```

### Empty Inventory

```
SentinelOne Asset Inventory - Cloud
================================================================
Generated: 2026-02-24
Surface:   CLOUD

No cloud resources found in inventory.

Possible reasons:
  - Cloud connectors not configured in SentinelOne
  - No cloud workloads are monitored
  - Service User token may lack cloud inventory access

Suggestions:
  - Check SentinelOne Console > Cloud Security for connector status
  - Try a different surface: /asset-inventory --surface ENDPOINT
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to SentinelOne Purple MCP server

Check your MCP configuration and verify your Service User token.
Token must be Account or Site level (NOT Global).
```

### Authentication Error

```
Error: 401 Unauthorized

Your Service User token may be invalid or Global-level.
Regenerate at: SentinelOne Console > Policy & Settings > User Management > Service Users
```

### Timeout on Large Inventory

```
Warning: Inventory query timed out.

Partial results available for 500 of ~847 endpoints.
For large environments, the inventory may take multiple queries.

Suggestions:
  - Results shown above are partial
  - Retry to collect remaining data
  - Filter by specific client if needed
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `list_inventory_items` | Fetch inventory items by surface type |
| `search_inventory_items` | Search for specific assets by name, OS, or status |
| `get_inventory_item` | Get full details for specific assets |

## Use Cases

### Monthly Agent Health Check

```
/asset-inventory --surface ENDPOINT
```

### Unmanaged Device Audit

```
/asset-inventory --surface NETWORK_DISCOVERY
```

### Cloud Resource Visibility

```
/asset-inventory --surface CLOUD
```

### Identity Hygiene Review

```
/asset-inventory --surface IDENTITY
```

### QBR Coverage Report

Run all four surfaces for a comprehensive coverage report:
```
/asset-inventory --surface ENDPOINT
/asset-inventory --surface CLOUD
/asset-inventory --surface IDENTITY
/asset-inventory --surface NETWORK_DISCOVERY
```

## Related Commands

- `/alert-triage` - Check alerts affecting inventory assets
- `/vuln-report` - Check vulnerabilities on inventory endpoints
- `/posture-review` - Review misconfigurations on inventory resources
- `/hunt-threat` - Hunt for threats on specific endpoints
