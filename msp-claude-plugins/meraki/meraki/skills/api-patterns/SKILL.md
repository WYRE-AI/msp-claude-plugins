---
name: "Meraki API Patterns"
description: >
  How to work with Cisco's hosted Meraki MCP server: its two tools
  (semantic_search and execute_api), the getOrganizations to
  getOrganizationNetworks to capability flow, passing parameters, single-page
  results, the per-organization rate limit, Conduit access tiers, error
  handling, and a table of verified read-only Dashboard API capability IDs.
when_to_use: >-
  At the start of any Meraki task, and whenever you need to find the right
  capability, call execute_api with the right parameters, judge whether a
  result is complete, or recover from an execute_api error. Load this before
  the other Meraki skills when you do not already know the capability_id.
---

# Meraki API Patterns

## What the server is

Meraki is served by Cisco's first-party hosted MCP server (`https://mcp.meraki.com/mcp`). It exposes the read operations of the Meraki Dashboard API v1 as *capabilities* behind two tools, `semantic_search` and `execute_api`. A `capability_id` is the Dashboard API operationId, such as `getOrganizationDevicesAvailabilities`.

- **Beta.** Cisco may change tool schemas and the set of supported capabilities.
- **Read-only.** Only GET capabilities exist. Reboots, configuration changes, deletes and live tools (ping, cable test, throughput test) are not available. When asked for a change, read the current state, then write out the exact change for a human to make in the Meraki Dashboard.
- **Meraki.com dashboards only.** The China cloud, Federal, GovCloud and other localized dashboards are not supported.
- **Hierarchy.** Organization, then network, then device. A device is identified by its serial (`Q2XX-XXXX-XXXX`), never by its name.

## How it is reached through Conduit

- An MSP admin connects Meraki once in Conduit (`https://conduit.wyre.ai`) by pasting a Dashboard API key, created under Organization → API & Webhooks. Conduit sends the key to Cisco as `Authorization: Bearer`. The plugin holds no credentials.
- There is no organization setting. The org scope is whatever the key's dashboard admin can see, so always start from `getOrganizations`.
- Through Conduit the tools are namespaced with the vendor slug: `meraki__semantic_search` and `meraki__execute_api`. Your client may add its own prefix, such as `mcp__<connector>__`. This plugin calls them `semantic_search` and `execute_api`.
- **Access tiers.** `semantic_search` is read tier. Conduit classifies `execute_api` as admin tier, because a single tool name can dispatch to any capability. A member without an admin-tier grant for Meraki sees only `semantic_search`, which searches the capability catalog and returns no customer data. If `execute_api` is missing from your tool list, ask your Conduit org admin for an admin-tier Meraki grant.

## The two tools

### `semantic_search`

| Input | Type | Notes |
|---|---|---|
| `query` | string, required | Natural-language description of the data you need |
| `top_k` | integer, optional | Results to return. Default 5, range 1–20 |

It returns ranked `results[]`, each with:

| Field | Meaning |
|---|---|
| `capability_id` | The ID to pass to `execute_api` |
| `intent` | One-line summary of what the capability returns |
| `product_scope` | `common`, `wireless`, `switch`, `appliance`, `camera`, `sensor`, `cellularGateway`, `sm`, ... |
| `risk_tier` | `safe`, `elevated`, `destructive` or `unknown` |
| `tags` | Free-form tags from the API spec |
| `required_parameters[]` | `{name, location, required, type, description}`. `location` is `path` or `query` |

Each result also carries a resource link, `meraki://capabilities/<capability_id>`. It holds the complete parameter list (optional filters, allowed ranges and defaults) and the API key scopes the capability needs. Read it before using an optional parameter. Through Conduit, resource URIs carry the vendor prefix, so read `meraki+meraki://capabilities/<capability_id>`.

### `execute_api`

| Input | Type | Notes |
|---|---|---|
| `capability_id` | string, required | From `semantic_search`, or one of the two direct-call IDs below |
| `parameters` | object or null, optional | Path and query values together, keyed by parameter name |

The result is an object under `result`:

- Success: `type: "success"`, `capability_id`, `product`, and `data` holding the Dashboard API response.
- Failure: `type: "error"`, `error` (summary), `recovery_suggestion` (next step), `capability_id`.

A failure comes back as a normal tool result, not a protocol error, so check `result.type` before you use `data`. The API key is never a tool argument.

## The canonical flow

1. **Find the organization.** Call `getOrganizations` directly, no search needed. Use `id` and `name`; confirm the right org with the user when there are several.
2. **Find networks.** Call `getOrganizationNetworks` directly with the `organizationId`. Use `id`, `name`, `productTypes` and `timeZone`.
3. **Find the capability.** Call `semantic_search` with a specific query. Prefer a result scoped to the organization (needs `organizationId`) over one you would have to loop per network or per device.
4. **Execute.** Call `execute_api` with the chosen `capability_id`, every `required_parameters` entry, and any optional filters you confirmed in the resource link.

```text
execute_api { "capability_id": "getOrganizations" }
execute_api { "capability_id": "getOrganizationNetworks", "parameters": { "organizationId": "<orgId>", "perPage": 100 } }
semantic_search { "query": "switch ports with errors or CRC drops on a switch", "top_k": 5 }
execute_api { "capability_id": "getDeviceSwitchPortsStatuses", "parameters": { "serial": "Q2XX-XXXX-XXXX" } }
```

When a capability in the table below fits, call it directly and skip step 3.

## Writing good `semantic_search` queries

Name the object, the scope and the kind of data: status, history, configuration or rules. Use Meraki vocabulary where you know it.

| Good | Too vague |
|---|---|
| "devices offline in my org" | "devices" |
| "switch port status history" | "switches" |
| "recent config changes" | "changes" |
| "site-to-site VPN statuses across organization" | "vpn" |
| "SSID L3 firewall rules for a wireless network" | "meraki stuff" |

Never send a single-word query. If the results miss, rephrase with API terms ("availabilities", "uplink loss and latency", "change log", "inbound firewall rules") or raise `top_k` to 10. Check `product_scope` matches the hardware you are asking about.

## Parameters

- Put every value, path or query, in the one `parameters` object keyed by name: `{ "organizationId": "123", "perPage": 100 }`.
- Array filters take JSON arrays: `{ "organizationId": "123", "networkIds": ["L_123"], "productTypes": ["switch"] }`.
- Use the exact names from `required_parameters` or the resource. The server rejects unknown names ("Unsupported parameters") and wrong types ("does not match its documented schema").
- Some capabilities need more than one identifier. `getDeviceLossAndLatencyHistory` needs `serial` and `ip`, the destination it probes (for example `8.8.8.8`). `getNetworkWirelessSsidFirewallL3FirewallRules` needs `networkId` and `number`, the SSID slot 0–14.

## Pagination

`execute_api` returns one page per call.

- Pass a bounded `perPage` where the capability supports it.
- Narrow with filters (`networkIds`, `serials`, `productTypes`, `statuses`, `timespan`, `t0`/`t1`) instead of trying to read everything.
- Do not pass `total_pages`; the server rejects it. Leave the cursor parameters `startingAfter` and `endingBefore` unset; Meraki documents them as not for client use.
- Never present one page as the complete dataset. When a page comes back full, say the results may be partial and offer to narrow the filter.

## Rate limit

Meraki allows 10 requests per second per organization, shared with every other API consumer of that organization. The hosted server retries rate-limited calls with exponential backoff, so do not add your own retry loop. Prefer one org-wide capability over a loop of per-device calls, and make calls one after another rather than in parallel against the same organization.

## Errors

| What you see | Cause | What to do |
|---|---|---|
| "Authentication failed." or HTTP 401 | Key invalid, revoked or expired | The Conduit admin replaces the key in Conduit's Meraki connection |
| HTTP 403 or a permissions error | The key's dashboard admin cannot see that org or network | Use an org from `getOrganizations`, or ask for a key whose admin has access |
| `getOrganizations` returns an empty list | The key's admin has no organization on Meraki.com | Check the key belongs to an admin of the customer's org, and that the org is not on an unsupported dashboard |
| "Capability not found: X" | Misspelled or guessed ID, or a write operation, which does not exist here | Re-run `semantic_search` with a more specific query. Never guess IDs |
| "Missing required parameters" | A required parameter was left out | Add the names listed in `recovery_suggestion` |
| "Unsupported parameters" or "does not match its documented schema" | Wrong parameter name or type | Read the capability resource and correct it |
| Rate-limit error after retries | Organization budget exhausted | Wait, then retry with a narrower or org-wide request |
| `execute_api` is not in your tool list | No admin-tier Meraki grant in Conduit | Ask the Conduit org admin |

A customer on the China cloud, Federal, GovCloud or another localized dashboard cannot be reached through this server. Say so rather than retrying.

## High-value capabilities

All are read-only and were returned by Cisco's live `semantic_search`. Required parameters are listed; check the resource for optional filters.

| Domain | `capability_id` | Required |
|---|---|---|
| Org & inventory | `getOrganizations` | none |
| | `getOrganizationNetworks` | `organizationId` |
| | `getOrganizationDevices` | `organizationId` |
| | `getOrganizationInventoryDevices` | `organizationId` |
| | `getOrganizationInventoryDevicesEoxOverview` | `organizationId` |
| Devices | `getOrganizationDevicesAvailabilities` | `organizationId` |
| | `getOrganizationDevicesStatusesOverview` | `organizationId` |
| | `getOrganizationDevicesAvailabilitiesChangeHistory` | `organizationId` |
| | `getDevice` | `serial` |
| | `getOrganizationDevicesUplinksLossAndLatency` | `organizationId` |
| | `getDeviceLossAndLatencyHistory` | `serial`, `ip` |
| Clients | `getOrganizationClientsSearch` | `organizationId`, `mac` |
| | `getNetworkClients` | `networkId` |
| | `getNetworkClient` | `networkId`, `clientId` |
| | `getNetworkClientPolicy` | `networkId`, `clientId` |
| Wireless | `getNetworkWirelessSsids` | `networkId` |
| | `getNetworkWirelessSsidFirewallL3FirewallRules` | `networkId`, `number` |
| | `getNetworkWirelessRfProfiles` | `networkId` |
| | `getNetworkWirelessFailedConnections` | `networkId` |
| | `getOrganizationWirelessDevicesPacketLossByNetwork` | `organizationId` |
| Switch | `getOrganizationSwitchPortsStatusesBySwitch` | `organizationId` |
| | `getOrganizationSwitchPortsBySwitch` | `organizationId` |
| | `getDeviceSwitchPortsStatuses` | `serial` |
| | `getDeviceSwitchPortsStatusesPackets` | `serial` |
| Appliance | `getOrganizationApplianceUplinkStatuses` | `organizationId` |
| | `getOrganizationApplianceVpnStatuses` | `organizationId` |
| | `getNetworkApplianceFirewallL3FirewallRules` | `networkId` |
| | `getNetworkApplianceFirewallL7FirewallRules` | `networkId` |
| | `getNetworkApplianceFirewallInboundFirewallRules` | `networkId` |
| | `getNetworkApplianceFirewallPortForwardingRules` | `networkId` |
| | `getNetworkApplianceSecurityEvents` | `networkId` |
| Sensors & cellular | `getOrganizationSensorReadingsLatest` | `organizationId` |
| | `getOrganizationCellularGatewayUplinkStatuses` | `organizationId` |
| | `getOrganizationDevicesCellularUplinksBandsByDevice` | `organizationId` |
| Change log, licensing, firmware | `getOrganizationConfigurationChanges` | `organizationId` |
| | `getNetworkEvents` | `networkId` |
| | `getOrganizationLicensesOverview` | `organizationId` |
| | `getOrganizationFirmwareUpgrades` | `organizationId` |
| | `getOrganizationFirmwareUpgradesByDevice` | `organizationId` |

To list the devices in one network, call `getOrganizationDevices` with a `networkIds` filter.

## Related skills

- `meraki-devices`: inventory, status and lifecycle by serial
- `meraki-troubleshooting`: uplink, loss/latency, port and wireless diagnostics
- `meraki-security-appliance`: MX firewall, port forwarding and VPN review
