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

   Keep each network's `id`, `name`, and `productTypes`.

   **Site scope.** If `network_id` is given, skip the list above, which may not include the site on its first page, and read the network directly:

   ```
   execute_api { "capability_id": "getNetwork", "parameters": { "networkId": "<networkId>" } }
   ```

   Check that its `organizationId` matches the organization from step 1. If it does not, stop and say which organization the network belongs to. Then add `"networkIds": ["<networkId>"]` to the `parameters` of every call in steps 3–6, as the examples show. Every total and finding in the report is then for that site alone. Without `network_id`, leave `networkIds` out and the sweep covers the whole organization.

3. **Get device totals**

   ```
   execute_api { "capability_id": "getOrganizationDevicesStatusesOverview", "parameters": { "organizationId": "<orgId>", "networkIds": ["<networkId>"] } }
   ```

   Returns counts by status (online, alerting, offline, dormant) for the networks requested, or for the whole organization when `networkIds` is left out. This is a single summary, not a paged list, so use it for the headline numbers.

4. **List the devices that need attention**

   ```
   execute_api { "capability_id": "getOrganizationDevicesAvailabilities", "parameters": { "organizationId": "<orgId>", "networkIds": ["<networkId>"], "statuses": ["offline", "alerting", "dormant"], "perPage": 100 } }
   ```

   Each entry carries `serial`, `name`, `productType`, `status`, and the device's network. Group them by network and keep each device's `status`: a `dormant` device has been offline for an extended period and is labeled dormant, not offline, in the problem list and report.

5. **Check appliance uplinks**

   ```
   execute_api { "capability_id": "getOrganizationApplianceUplinkStatuses", "parameters": { "organizationId": "<orgId>", "networkIds": ["<networkId>"], "perPage": 100 } }
   ```

   Flag any uplink with status `failed`. The status list does not say which uplink is configured as primary; `wan1` is the default. If `wan1` is down while another uplink is `active`, report a likely failover and note that the configured primary was not checked. Report an uplink that is `not connected` as unconfirmed, even when `wan1` is `active`: it is normal on a single-circuit site, but it is also how a backup circuit with a pulled cable appears. Ask whether that circuit is intentionally unused before treating it as normal.

6. **Check site-to-site VPN**

   ```
   execute_api { "capability_id": "getOrganizationApplianceVpnStatuses", "parameters": { "organizationId": "<orgId>", "networkIds": ["<networkId>"], "perPage": 100 } }
   ```

   For each appliance network, read `deviceStatus` first. If the local MX is offline, every peer will read unreachable and the real finding is the appliance outage. Otherwise flag peers in `merakiVpnPeers` or `thirdPartyVpnPeers` whose `reachability` is `unreachable`.

7. **Optionally add alert counts**

   ```
   execute_api { "capability_id": "getOrganizationAssuranceAlertsOverviewByNetwork", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
   ```

   Adds active alert counts by severity per network. For a single-site sweep, add `"networkId": "<networkId>"` (this capability takes a single network) so the site's row is not lost past the first page. A successful result with no row for a network means that network has no active alerts: show 0. Only when `result.type` is `error` mark the Alerts column "unavailable" and say why.

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

- **Summary** — networks swept, device totals by status, appliances with a failed uplink or failover, appliances with a VPN peer down (organization-wide, or for the one site when `network_id` is given)
- **Per-site table:**

  | Site | Offline / alerting / dormant devices | Uplinks | VPN | Alerts | Flag |
  |------|--------------------------------------|---------|-----|--------|------|
  | Main Office | 0 / 1 / 0 (MR "Lobby AP" alerting) | wan1 active | 3/3 peers reachable | 2 warning | Watch |
  | Branch 2 | MX offline | — | appliance offline | 5 critical | Site down |

- **Problem devices** — name, serial, product type, status (`offline`, `alerting`, or `dormant`), network
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
