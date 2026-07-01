---
name: meraki-find-device
description: Locate a Meraki device by serial, name, or MAC across an organization's networks
arguments:
  - name: query
    description: Search term (serial, device name, or MAC address)
    required: true
  - name: org_id
    description: Organization ID to search (falls back to MERAKI_ORG_ID if omitted)
    required: false
---

# Meraki Find Device

Locate a Cisco Meraki device by serial number, name, or MAC address across an organization's inventory and networks. Returns the device's serial, model, product type, status, and the network it is assigned to.

## Prerequisites

- Meraki MCP server connected with a valid Dashboard API key
- MCP tools `meraki_organizations_list`, `meraki_organizations_inventory_list`, `meraki_networks_list`, `meraki_devices_get`, and `meraki_raw_request` available

## Steps

1. **Resolve the organization**

   If `org_id` is provided, use it. Otherwise use `MERAKI_ORG_ID`, or call `meraki_organizations_list` and select the single org (or ask the user if several exist).

2. **Classify the query**

   - Looks like a serial (`Q2XX-XXXX-XXXX`)? Try `meraki_devices_get` with it directly for a fast exact match.
   - Looks like a MAC (`aa:bb:cc:dd:ee:ff`)? Match against the `mac` field.
   - Otherwise treat it as a name substring.

3. **Search the org inventory**

   Call `meraki_organizations_inventory_list` -- this is the authoritative pool of every claimed device (including unassigned ones). Filter entries whose `serial`, `mac`, or `name` matches the query. Inventory tells you the network assignment (or that the device is unassigned).

4. **Enrich the match**

   For each match, call `meraki_devices_get` by serial to get full detail (name, model, `networkId`, `lanIp`, firmware, tags). Resolve the network name via `meraki_networks_list` if needed. Optionally fetch live status with `meraki_raw_request` GET `/organizations/{organizationId}/devices/statuses`.

5. **Present results**

   Show matches in a table: name, serial, model, product type, status, network (or "unassigned"), and MAC/LAN IP. If multiple match, list all. If none, suggest checking the query format or confirming the device is claimed to this org.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Serial (e.g. `Q2XX-XXXX-XXXX`), name, or MAC (e.g. `AA:BB:CC:DD:EE:FF`) |
| org_id | string | No | Organization ID; falls back to `MERAKI_ORG_ID` |

## Examples

### Find by serial

```
/meraki-find-device --query "Q2XX-XXXX-XXXX"
```

### Find by MAC

```
/meraki-find-device --query "AA:BB:CC:DD:EE:FF"
```

### Find by name in a specific org

```
/meraki-find-device --query "HQ-Core-Switch" --org_id "123456"
```

## Error Handling

- **No Results:** Verify the query; confirm the device is claimed to this org via `meraki_organizations_inventory_list`; a device claimed to a different org will not appear
- **Device Not Found on direct get (404):** The serial may be valid but claimed elsewhere, or mistyped -- fall back to the inventory search
- **Authentication Error (401):** Verify `MERAKI_API_KEY` and Dashboard API access
- **Rate Limit (429):** Honor `Retry-After`; the org inventory call is a single request, so prefer it over per-network device loops

## Related Commands

- `/meraki-network-health` - Full org/site health sweep
- `/meraki-firewall-review` - Review a network's L3 firewall rules
