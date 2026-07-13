---
description: Inventory devices for an Auvik tenant with type, manage status, and lifecycle breakdown
argument-hint: "[tenant_id] [limit]"
arguments: [tenant_id, limit]
---

# Auvik Device Inventory

Produce a clean device inventory for a single Auvik tenant, broken down by device type and manage status, with lifecycle and warranty risk called out at the top. This is the workflow MSP analysts run before a QBR, a renewal, or any conversation about hardware refresh.

## Prerequisites

- Auvik MCP server connected with a valid `AUVIK_USERNAME` and `AUVIK_API_KEY`
- Tools: `auvik_tenants_list`, `auvik_devices_list`, `auvik_devices_get_details`, `auvik_devices_get_lifecycle`, `auvik_devices_get_warranty`

## Steps

1. **Resolve the tenant**

   If `tenant_id` was not provided, call `auvik_tenants_list` and present the user the list of tenants to pick from. Do not proceed without an explicit tenant.

2. **Pull the device list**

   Call `auvik_devices_list` scoped to the tenant, paginating up to `limit`. The v1 list response gives you `deviceType`, `deviceName`, `manageStatus`, `onlineStatus`, `make`, and `model` for each device - enough for the headline breakdown.

3. **Group and count**

   Bucket devices by `deviceType` (router, switch, firewall, accessPoint, server, workstation, printer, hypervisor, etc.) and by `manageStatus` (`managed`, `unmanaged`, `unknown`). Surface the breakdown as a single compact table at the top of the report.

4. **Pull lifecycle and warranty for the long-lived gear**

   For devices in the infrastructure tiers (router, switch, firewall, accessPoint, server, hypervisor), call `auvik_devices_get_lifecycle` and `auvik_devices_get_warranty`. Skip workstations and printers for this pass; their lifecycle data is rarely populated.

5. **Flag the risk items**

   Surface separately:
   - Devices past end-of-sale or end-of-support per the lifecycle response
   - Devices out of warranty or with warranty expiring within 90 days
   - Devices with `manageStatus = unmanaged` in the infrastructure tier (these are gaps - Auvik sees them but is not managing them)
   - Devices with `onlineStatus = offline` or `unreachable`

6. **Produce the output**

   Order: tenant header, headline counts table, risk callouts, full device list (compact - one row per device with name, type, make/model, manageStatus, onlineStatus). Keep the full list under 500 rows; if the tenant is larger, truncate and note the count.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| tenant_id | string | No | prompt | Tenant to inventory |
| limit | integer | No | 500 | Max devices to fetch |

## Examples

```
/auvik:device-inventory
```

```
/auvik:device-inventory tenant_id=12345 limit=1000
```

## Related Commands

- `/auvik:tenant-overview` - For a higher-level snapshot before drilling in
- `/auvik:network-audit` - For the configuration/topology side of the inventory
