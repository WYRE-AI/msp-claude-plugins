---
description: Locate a Meraki device by serial, name, or MAC across an organization, or find where a client MAC is connected
argument-hint: "<query> [org_id]"
arguments: [query, org_id]
---

# Meraki Find Device

Locate a Cisco Meraki device by serial number, name, or MAC address across an organization's inventory and networks. Returns the device's serial, model, product type, status, and the network it is assigned to. If a MAC belongs to a client (a laptop or phone) rather than a Meraki device, reports where that client was last seen instead.

## Prerequisites

- Meraki connected in Conduit (or Cisco's hosted server configured directly)
- `execute_api` available — it is admin-tier in Conduit, see `meraki-api-patterns`

## Steps

1. **Classify the query**

   - Serial: three groups of four characters, e.g. `Q2XX-XXXX-XXXX`
   - MAC: six hex octets, e.g. `aa:bb:cc:dd:ee:ff` (normalize dashes or bare hex to colon form)
   - Anything else: a device name or part of one

2. **Serial — try the exact lookup first**

   ```
   execute_api { "capability_id": "getDevice", "parameters": { "serial": "Q2XX-XXXX-XXXX" } }
   ```

   This needs no organization ID. A hit gives `name`, `model`, `mac`, `networkId`, `lanIp`, and firmware. A 404 means the device is not in any network the key can see: it may be claimed but unassigned, in another org, or mistyped. Resolve the org (step 3) and check inventory:

   ```
   execute_api { "capability_id": "getOrganizationInventoryDevice", "parameters": { "organizationId": "<orgId>", "serial": "Q2XX-XXXX-XXXX" } }
   ```

   An inventory entry whose `networkId` is null is claimed but unassigned.

3. **Resolve the organization (MAC and name searches, or serial fallback)**

   If `org_id` is given, use it. Otherwise list the organizations the key can see; use the only one, or list them and ask which to search.

   ```
   execute_api { "capability_id": "getOrganizations" }
   ```

4. **MAC — check Meraki hardware, then clients**

   Search inventory first; it covers claimed and unassigned devices.

   ```
   execute_api { "capability_id": "getOrganizationInventoryDevices", "parameters": { "organizationId": "<orgId>", "macs": ["aa:bb:cc:dd:ee:ff"], "perPage": 100 } }
   ```

   No match means the MAC is not a Meraki device. Treat it as a client and search for it:

   ```
   execute_api { "capability_id": "getOrganizationClientsSearch", "parameters": { "organizationId": "<orgId>", "mac": "aa:bb:cc:dd:ee:ff" } }
   ```

   Each record names the network the client was seen on, with its IP, VLAN, SSID or switch port, last-seen time, and `recentDeviceMac` (the AP or switch it last connected through). To name that AP or switch, look it up with `getOrganizationDevices` and `"mac": "<recentDeviceMac>"`.

5. **Name — search assigned devices**

   ```
   execute_api { "capability_id": "getOrganizationDevices", "parameters": { "organizationId": "<orgId>", "name": "HQ-Core", "perPage": 100 } }
   ```

   The `name` filter matches devices whose name contains the term. Inventory search does not match on name, so a named device that is unassigned will not show up here.

6. **Add live status and network names**

   For the matched serials, fetch availability in one call:

   ```
   execute_api { "capability_id": "getOrganizationDevicesAvailabilities", "parameters": { "organizationId": "<orgId>", "serials": ["Q2XX-XXXX-XXXX"] } }
   ```

   Resolve network names with `getNetwork` (one network) or `getOrganizationNetworks` (several).

7. **Present results**

   Show a table: name, serial, model, product type, status, network (or "unassigned"), MAC, LAN IP. For a client MAC, show network, IP, VLAN, SSID or switch port, connected-through device, and last seen. If a list came back with exactly `perPage` items, say there may be more matches and suggest a more specific query.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Serial (e.g. `Q2XX-XXXX-XXXX`), name, or MAC (e.g. `AA:BB:CC:DD:EE:FF`) |
| org_id | string | No | Organization ID; if omitted, resolved via `getOrganizations` |

## Examples

### Find by serial

```
/meraki-find-device Q2XX-XXXX-XXXX
```

### Find by MAC (device or client)

```
/meraki-find-device AA:BB:CC:DD:EE:FF
```

### Find by name in a specific org

```
/meraki-find-device HQ-Core-Switch 123456
```

## Error Handling

- **No results:** Check the query format and that the device is claimed to this org; a device claimed to an org the key cannot see will not appear anywhere
- **404 on `getDevice`:** The serial may be unassigned, in another org, or mistyped — fall back to the inventory lookup in step 2
- **Several orgs and no `org_id`:** List them and ask which to search
- **Authentication error (401):** The Dashboard API key in Conduit is invalid or revoked, or API access is disabled for the org — reconnect Meraki in Conduit
- **Rate limit (429):** The limit is 10 requests per second per organization and the hosted server backs off automatically; these lookups are single org-wide calls, so avoid per-network loops

## Related Commands

- `/meraki-network-health` - Full org/site health sweep
- `/meraki-firewall-review` - Review a network's MX firewall rules
