# Cisco Meraki Plugin

Claude Code plugin for the Cisco Meraki cloud-managed networking platform. It teaches Claude to use Cisco's first-party hosted Meraki MCP server, which serves the read operations of the Meraki Dashboard API v1.

## Overview

Cisco's hosted server exposes two tools. `semantic_search` finds the Dashboard API capability that answers a question, and `execute_api` runs it. This plugin gives Claude the workflows and capability knowledge to use them well:

- **Organization & inventory** - organizations, networks, claimed and unassigned hardware, end-of-life exposure
- **Device health** - org-wide availability and status, uplinks, loss and latency, availability history
- **Clients** - find a client by MAC across an organization, inspect clients and their policies on a network
- **Wireless (MR)** - SSIDs, SSID firewall rules, RF profiles, failed connections
- **Switching (MS)** - port configuration, live port statuses, packet counters and errors
- **Security appliance (MX)** - L3, L7 and inbound firewall rules, port forwarding, site-to-site VPN status, security events
- **Sensors (MT) and cellular gateways (MG)** - latest sensor readings, cellular uplink status
- **Change log, licensing and firmware** - configuration changes, license state, firmware upgrade status

The hosted server is **beta and read-only**. It cannot reboot devices, change configuration, delete anything, or run live tools such as ping or cable test. For any change, the plugin reads the current state and writes out the exact change for a human to make in the Meraki Dashboard.

## Prerequisites

### Dashboard API key

The server authenticates with a Meraki Dashboard API key. Cisco does not offer OAuth for it.

1. Sign in to the [Meraki Dashboard](https://dashboard.meraki.com) as the admin whose access the key should carry
2. Go to **Organization > API & Webhooks** and create an API key
3. Copy the key immediately; it is shown only once

The key inherits the permissions of the dashboard admin who created it. Create it from a **read-only organization admin**, and grant that admin only the organizations the plugin should see.

### Supported dashboards

Meraki.com dashboards only. The China cloud, Federal, GovCloud and other localized dashboards are not supported by Cisco's hosted server.

## Installation

### Via Conduit (recommended)

Connect Meraki in [Conduit](https://conduit.wyre.ai): paste the Dashboard API key into the Meraki connection form once. Conduit forwards it to Cisco as `Authorization: Bearer`, so nothing is stored on technicians' machines and the plugin needs no configuration. There is no organization setting; the org scope is whatever the key can see.

Through Conduit the tools appear as `meraki__semantic_search` and `meraki__execute_api`. Conduit classifies `semantic_search` as read tier and `execute_api` as **admin tier**, because one tool name can run any capability. Members without an admin-tier Meraki grant see only `semantic_search`, which searches the capability catalog and returns no customer data. Grant admin tier on Meraki to the people and agents who need Meraki data.

### Direct to Cisco's hosted server

Without Conduit, point your MCP client at Cisco's server and supply the key from your environment (see `.env.example`):

```json
{
  "mcpServers": {
    "meraki": {
      "type": "http",
      "url": "https://mcp.meraki.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MERAKI_DASHBOARD_API_KEY}"
      }
    }
  }
}
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | The two hosted tools, the getOrganizations to getOrganizationNetworks to capability flow, parameters, single-page results, rate limits, Conduit access tiers, errors, and a table of verified capability IDs |
| `devices` | Device inventory, availability and status by serial, uplink addresses, and lifecycle review |
| `troubleshooting` | Read-only diagnostics: uplink loss and latency, port statuses and errors, wireless failures, event and change logs |
| `security-appliance` | MX firewall rule, port forwarding and site-to-site VPN review |

## Available Commands

| Command | Description |
|---------|-------------|
| `/meraki-network-health` | Org or site health sweep across device availability, appliance uplinks and VPN status |
| `/meraki-find-device` | Locate a device by serial, name or MAC across an organization |
| `/meraki-firewall-review` | Pull and summarize a network's firewall rules and flag overly permissive ones |

## Available Agents

| Agent | Description |
|-------|-------------|
| `meraki-network-auditor` | Read-only subagent that sweeps an organization and reports offline or alerting devices, VPN peers down, overly permissive firewall rules, and weak or open SSIDs |

## Quick Start

### Sweep Network Health

```
/meraki-network-health 123456
```

### Find a Device

```
/meraki-find-device Q2XX-XXXX-XXXX
```

### Review Firewall Rules

```
/meraki-firewall-review L_123456789012345678
```

## Meraki Model Primer

Meraki organizes everything as **organizations -> networks -> devices**:

- An **organization** is the top-level tenant that holds licensing, admins and inventory.
- A **network** is a site or logical grouping. Networks have product types (`appliance`, `switch`, `wireless`, `camera`, `sensor`, `cellularGateway`, `systemsManager`).
- A **device** is identified by its immutable **serial number** (e.g. `Q2XX-XXXX-XXXX`). Devices are claimed into an org's inventory, then assigned to a network.

Product lines you will encounter:

| Line | Product | Example capability IDs |
|------|---------|------------------------|
| **MX** | Security appliance / SD-WAN | `getOrganizationApplianceVpnStatuses`, `getNetworkApplianceFirewallL3FirewallRules` |
| **MS** | Switch | `getOrganizationSwitchPortsStatusesBySwitch`, `getDeviceSwitchPortsStatuses` |
| **MR** | Wireless access point | `getNetworkWirelessSsids`, `getNetworkWirelessRfProfiles` |
| **MV** | Smart camera | `getOrganizationCameraOnboardingStatuses`, `getNetworkCameraSchedules` |
| **MG** | Cellular gateway | `getOrganizationCellularGatewayUplinkStatuses` |
| **MT** | Environmental sensor | `getOrganizationSensorReadingsLatest` |

## Security Considerations

### Read-only by design

Cisco's hosted server is read-only and rejects state-changing operations; write capabilities do not exist in its catalog. Read-only does not mean harmless: the key can read client hostnames and MACs, firewall rules, VPN topology and admin lists for every organization its admin can see. Use a key from a read-only org admin scoped to the organizations you need.

### Credential handling

- Never commit API keys. Through Conduit the key is pasted once into the connection form and never reaches technicians' machines.
- Rotate keys periodically in the Meraki Dashboard and replace the key in Conduit.
- Review the organization's Dashboard change log and API request history regularly.

### IP restrictions

Cisco states that the hosted server does not currently enforce your organization's Dashboard API IP restrictions, so an API IP allowlist is not a control on this path. Cisco's hosted egress IPs are `158.115.141.245`, `158.115.141.238`, `158.115.141.209`, `158.115.133.170`, `158.115.133.139` and `158.115.133.156`. Organizations whose policy requires IP allowlisting should not use this connection; Conduit offers no self-hosted Meraki route.

## Troubleshooting

### Authentication Errors (401)

"Authentication failed." or HTTP 401 means the key is invalid, revoked or expired. Create a new key under Organization > API & Webhooks and replace it in Conduit's Meraki connection (or in `MERAKI_DASHBOARD_API_KEY` for direct use).

### Permission Errors (403)

The key's dashboard admin cannot see that organization or network. Use an organization returned by `getOrganizations`, or use a key from an admin with access.

### Empty Organization List

`getOrganizations` returns nothing when the key's admin has no organization on Meraki.com. Confirm the key belongs to an admin of the customer's organization and that the organization is not on an unsupported dashboard.

### `execute_api` Is Missing

Your Conduit grant for Meraki is below admin tier, so only `semantic_search` is visible. Ask your Conduit org admin for an admin-tier Meraki grant.

### Unsupported Dashboards

China cloud, Federal, GovCloud and localized dashboards cannot be reached through Cisco's hosted server, with or without Conduit.

### Rate Limits

Meraki allows 10 requests per second per organization, shared with every other API consumer of that organization. The hosted server backs off and retries automatically. If calls still fail, wait, then prefer org-wide capabilities over per-device loops.

## API Documentation

- [Cisco Meraki MCP Server](https://developer.cisco.com/meraki/api-v1/mcp-server/)
- [Meraki Dashboard API v1 Reference](https://developer.cisco.com/meraki/api-v1/)
- [Meraki Developer Hub](https://developer.cisco.com/meraki/)
- [Meraki Documentation](https://documentation.meraki.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.2.0

- Switched to Cisco's first-party hosted Meraki MCP server (`semantic_search` and `execute_api`), which Conduit now routes to
- Rewrote skills, commands and the auditor agent around capability discovery and read-only capability IDs
- Removed: the sidecar's 27-tool catalog and its raw passthrough, all write workflows (reboot, remove, network, client policy, SSID, switch port and firewall updates), live tools, the default organization ID setting, and the base-URL override for regional clouds

### 0.1.0

- Initial release
- 4 skills: api-patterns, devices, troubleshooting, security-appliance
- 3 commands: meraki-network-health, meraki-find-device, meraki-firewall-review
- 1 agent: meraki-network-auditor
