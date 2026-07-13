---
description: Sweep an organization's networks, devices, and appliance VPN status for a site-health overview
argument-hint: "[org_id] [network_id]"
arguments: [org_id, network_id]
---

# Meraki Network Health

Run a read-only health sweep across a Cisco Meraki organization. Enumerates networks, checks device online/offline status, and reports appliance site-to-site VPN health so you get a single-pass picture of every site.

## Prerequisites

- Meraki MCP server connected with a valid Dashboard API key
- MCP tools `meraki_organizations_list`, `meraki_networks_list`, `meraki_devices_list`, `meraki_appliance_vpn_status_get`, and `meraki_raw_request` available

## Steps

1. **Resolve the organization**

   If `org_id` is provided, use it. Otherwise, if `MERAKI_ORG_ID` is set, use that. Otherwise call `meraki_organizations_list` and, if there is exactly one org, use it; if there are several, list them and ask which to sweep.

2. **Enumerate networks**

   Call `meraki_networks_list` for the org. If `network_id` is provided, scope to just that network. Page through results using the `Link`-header cursor (`startingAfter`) until all networks are collected.

3. **Pull device status efficiently**

   Call `meraki_raw_request` GET `/organizations/{organizationId}/devices/statuses` to get every device's status (`online`, `offline`, `alerting`, `dormant`) in one org-wide call rather than looping per device. Map each device to its network.

4. **Check appliance VPN**

   For each network whose product types include `appliance`, call `meraki_appliance_vpn_status_get`. Record the VPN mode (hub/spoke), local `deviceStatus`, and any peers with `reachability: unreachable`.

5. **Assemble the report**

   For each network, show: network name, device counts by status, any offline/alerting devices (name, model, serial), and VPN health (mode + unreachable peers). Roll up an org-level summary at the top.

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| org_id | string | No | Organization ID; falls back to `MERAKI_ORG_ID` |
| network_id | string | No | Limit the sweep to one network |

## Output

- **Org summary** -- total networks, total devices, count offline/alerting, count of appliances with a VPN peer down
- **Per-network detail** -- device status breakdown, offline/alerting devices, and VPN status
- **Priority flags** -- networks with a down appliance or unreachable VPN peer listed first

## Examples

### Sweep the default org

```
/meraki-network-health
```

### Sweep a specific org

```
/meraki-network-health --org_id "123456"
```

### Focus on one site

```
/meraki-network-health --org_id "123456" --network_id "L_123456789012345678"
```

## Error Handling

- **No org specified and multiple found:** List orgs and ask the user to pick
- **Authentication Error (401):** Verify `MERAKI_API_KEY` and that Dashboard API access is enabled
- **Rate Limit (429):** Sweeps hit the ~10 req/s per-org cap on large orgs; honor `Retry-After` and prefer the org-wide statuses endpoint over per-device calls
- **Network has no appliance:** Skip the VPN check for networks without an `appliance` product type

## Related Commands

- `/meraki-find-device` - Locate a specific device across the org
- `/meraki-firewall-review` - Review a network's L3 firewall rules
