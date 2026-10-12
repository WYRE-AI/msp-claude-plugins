---
description: Sweep an organization's devices, appliance uplinks, and site-to-site VPN for a per-site health overview
argument-hint: "[org_id] [network_id]"
arguments: [org_id, network_id]
---

# Meraki Network Health

Run a read-only health sweep across a Cisco Meraki organization. Uses org-wide capabilities, so a whole org costs a handful of `execute_api` calls rather than one per device, and produces a per-site summary of device availability, WAN uplinks, and site-to-site VPN.

## Prerequisites

- Meraki connected in Conduit (or Cisco's hosted server configured directly)
- `execute_api` available — it is admin-tier in Conduit, see `meraki-api-patterns`

## Steps

1. **Resolve the organization**

   If `org_id` is given, use it. Otherwise list the organizations the key can see; use the only one, or list them and ask which to sweep.

   ```
   execute_api { "capability_id": "getOrganizations" }
   ```

2. **Enumerate networks**

   ```
   execute_api { "capability_id": "getOrganizationNetworks", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
   ```

   Keep each network's `id`, `name`, and `productTypes`. If `network_id` is given, keep only that network and pass `"networkIds": ["<networkId>"]` to every org-wide call below.

3. **Get org-wide device totals**

   ```
   execute_api { "capability_id": "getOrganizationDevicesStatusesOverview", "parameters": { "organizationId": "<orgId>" } }
   ```

   Returns counts by status (online, alerting, offline, dormant). This is a single summary, not a paged list, so use it for the headline numbers.

4. **List the devices that need attention**

   ```
   execute_api { "capability_id": "getOrganizationDevicesAvailabilities", "parameters": { "organizationId": "<orgId>", "statuses": ["offline", "alerting"], "perPage": 100 } }
   ```

   Each entry carries `serial`, `name`, `productType`, `status`, and the device's network. Group them by network.

5. **Check appliance uplinks**

   ```
   execute_api { "capability_id": "getOrganizationApplianceUplinkStatuses", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
   ```

   Flag any uplink with status `failed`, and any appliance whose primary uplink is not `active` while another one is (the site has failed over). An uplink that is `not connected` is normal on a single-circuit site.

6. **Check site-to-site VPN**

   ```
   execute_api { "capability_id": "getOrganizationApplianceVpnStatuses", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
   ```

   For each appliance network, read `deviceStatus` first. If the local MX is offline, every peer will read unreachable and the real finding is the appliance outage. Otherwise flag peers in `merakiVpnPeers` or `thirdPartyVpnPeers` whose `reachability` is `unreachable`.

7. **Optionally add alert counts**

   ```
   execute_api { "capability_id": "getOrganizationAssuranceAlertsOverviewByNetwork", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
   ```

   Adds active alert counts by severity per network. If the org returns an error or nothing for this capability, drop the column.

8. **Assemble the report**

   Join everything on network ID and build one row per site. Sites with a down appliance, failed uplink, or unreachable VPN peer go first.

## Pagination

`execute_api` returns one page per call. If any list comes back with exactly as many items as `perPage`, assume there is more and say the sweep is partial for that check. To cover a large org, narrow by `networkIds` or `productTypes` rather than raising the page size indefinitely.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| org_id | string | No | Organization ID; if omitted, resolved via `getOrganizations` |
| network_id | string | No | Limit the sweep to one network |

## Output

- **Org summary** — networks swept, device totals by status, appliances with a failed uplink or failover, appliances with a VPN peer down
- **Per-site table:**

  | Site | Offline / alerting devices | Uplinks | VPN | Alerts | Flag |
  |------|----------------------------|---------|-----|--------|------|
  | Main Office | 0 / 1 (MR "Lobby AP" alerting) | wan1 active | 3/3 peers reachable | 2 warning | Watch |
  | Branch 2 | MX offline | — | appliance offline | 5 critical | Site down |

- **Problem devices** — name, serial, product type, status, network
- **Coverage note** — any check that hit a full page and may be incomplete

## Examples

### Sweep the only (or chosen) org

```
/meraki-network-health
```

### Sweep a specific org

```
/meraki-network-health 123456
```

### Focus on one site

```
/meraki-network-health 123456 L_123456789012345678
```

## Error Handling

- **Several orgs and no `org_id`:** List them and ask which to sweep
- **Authentication error (401):** The Dashboard API key in Conduit is invalid or revoked, or API access is disabled for the org — reconnect Meraki in Conduit
- **Rate limit (429):** The limit is 10 requests per second per organization and the hosted server backs off automatically; the org-wide calls above keep a sweep well under it
- **Network has no appliance:** It will not appear in the uplink or VPN results; show those columns as "n/a"

## Related Commands

- `/meraki-find-device` - Locate a specific device across the org
- `/meraki-firewall-review` - Review a network's MX firewall rules
