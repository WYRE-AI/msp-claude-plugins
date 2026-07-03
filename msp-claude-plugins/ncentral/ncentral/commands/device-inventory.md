---
name: device-inventory
description: Inventory devices for an N-central customer or site with class, warranty, and monitor-health breakdown
argument-hint: "[org_unit_id] [filter_id] [limit]"
arguments:
  - name: org_unit_id
    description: Customer or site org unit ID to scope the inventory to. Omit to prompt for selection.
    required: false
  - name: filter_id
    description: Saved device filter ID to apply server-side (from ncentral_list_device_filters)
    required: false
  - name: limit
    description: Maximum devices to fetch
    required: false
    default: "1000"
---

# N-central Device Inventory

Produce a clean device inventory for a single N-central customer or site,
broken down by device class, with warranty/lifecycle risk and unhealthy
monitors called out at the top. This is the workflow MSP technicians run
before a QBR, a renewal, or a hardware-refresh conversation.

## Prerequisites

- N-central MCP server connected with valid `NCENTRAL_SERVER_URL` and `NCENTRAL_JWT`
- Tools: `ncentral_list_customers`, `ncentral_list_sites`, `ncentral_list_device_filters`, `ncentral_list_devices`, `ncentral_list_devices_by_org_unit`, `ncentral_get_device_lifecycle`, `ncentral_get_device_assets`

## Steps

1. **Resolve the org unit**

   If `org_unit_id` was not provided, call `ncentral_list_customers` and
   present the list for the user to pick from (offer sites via
   `ncentral_list_sites` if they want location-level scope). Do not proceed
   without an explicit org unit.

2. **Pick the listing strategy**

   If `filter_id` was provided, call `ncentral_list_devices` with that
   `filterId`. Otherwise call `ncentral_list_devices_by_org_unit` for the
   chosen org unit. If neither fits the user's question ("only Windows
   servers"), list filters with `ncentral_list_device_filters` first and
   offer a matching one.

3. **Page it fully**

   `pageNumber` is 1-based and `pageSize` caps at 1000. Walk pages until
   `totalPages` (or `limit`), and note if the inventory was truncated.

4. **Group and count**

   Bucket devices by device class (server, workstation, laptop, network
   device, printer, other) and by online/offline state. Surface the
   breakdown as a compact table at the top.

5. **Pull lifecycle for the long-lived gear**

   For servers and network devices, call `ncentral_get_device_lifecycle`.
   Flag: warranty expired, warranty expiring within 90 days, and devices
   with no lifecycle record at all (untracked hardware is a risk, not a
   pass). Skip workstations for this pass unless asked.

6. **Produce the output**

   Order: org-unit header, headline counts table, risk callouts (warranty,
   untracked, offline), full device list (compact - one row per device
   with name, class, make/model, OS, online state). Truncate over 500 rows
   and note the full count.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| org_unit_id | string | No | prompt | Customer or site to inventory |
| filter_id | string | No | none | Saved device filter to apply |
| limit | integer | No | 1000 | Max devices to fetch |

## Examples

```
/ncentral:device-inventory
```

```
/ncentral:device-inventory org_unit_id=123 limit=2000
```

```
/ncentral:device-inventory filter_id=17
```

## Related Commands

- `/ncentral:issue-sweep` - for the monitoring side of fleet health
- `/ncentral:task-status` - for automation outcomes on these devices
