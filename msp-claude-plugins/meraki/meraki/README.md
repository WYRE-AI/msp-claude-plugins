# Cisco Meraki Plugin

Claude Code plugin for the Cisco Meraki cloud-managed networking platform, powered by the Meraki Dashboard API v1.

## Overview

This plugin provides Claude with deep knowledge of Cisco Meraki, enabling:

- **Organization & Inventory Management** - List organizations, inspect settings, and review device inventory (claimed, unassigned, and licensed hardware)
- **Network Management** - List, inspect, update, and delete networks; understand the organization -> network -> device hierarchy
- **Device Lifecycle** - Inventory devices by serial across MX, MS, MR, MV, MG, and MT product lines; reboot and remove devices
- **Client Visibility** - List and inspect clients on a network, review and update per-client policies (allow/block/group policy)
- **Wireless (MR)** - Review and update SSIDs, inspect RF profiles
- **Switching (MS)** - List and configure switch ports, review live port statuses
- **Security Appliance (MX)** - Review and update L3 firewall rules, check site-to-site VPN status
- **Live Troubleshooting** - Reach live tools (ping, cable test, throughput), sensor/camera data, and licensing via the `meraki_raw_request` passthrough to any Dashboard API v1 endpoint
- **API Integration** - Meraki Dashboard API v1 patterns: gateway header auth, Link-header cursor pagination, rate limiting, and the read-only safety model

## Prerequisites

### API Credentials

Meraki authenticates via an API key scoped to your Dashboard account:

1. Log into the [Meraki Dashboard](https://dashboard.meraki.com)
2. Navigate to **Organization > Settings > Dashboard API access**
3. Enable API access, then go to **My Profile** (top-right) and **Generate API key**
4. Copy the key immediately -- it is shown only once

The API key inherits the permissions of the Dashboard account that generated it. Use a dedicated service account with least-privilege org access for automation.

### Environment Variables

```bash
export MERAKI_API_KEY="your-api-key"
export MERAKI_ORG_ID="123456"   # optional default org
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MERAKI_API_KEY` | Yes | | Dashboard API key from Organization > Settings > Dashboard API access |
| `MERAKI_ORG_ID` | No | | Default organization ID -- lets tools skip the org-selection step when you manage a single org |
| `MERAKI_BASE_URL` | No | `https://api.meraki.com/api/v1` | API base URL -- override for regional clouds (China: `https://api.meraki.cn/api/v1`) |
| `MERAKI_MCP_URL` | No | `https://mcp.wyre.ai/v1/meraki/mcp` | MCP server URL -- override to use a self-hosted gateway |

The MCP server defaults to `READ_ONLY_MODE=true`. In read-only mode, curated write tools are still exposed but destructive operations require an explicit `confirm_destructive_action=true` flag. See the `api-patterns` skill for details.

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/wyre-technology/mcp-gateway), set `MERAKI_MCP_URL` to your gateway's endpoint:

```
MERAKI_MCP_URL=https://your-gateway-domain/v1/meraki/mcp
```

**Setting env vars in Claude.ai:** Go to your org -> Settings -> Integrations -> Meraki -> Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "MERAKI_MCP_URL": "https://your-gateway-domain/v1/meraki/mcp"
  }
}
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://mcp.wyre.ai) to connect -- paste your Dashboard API key (and optional default org ID), and you're done.

### Self-Hosted (Docker)

Run the Meraki MCP server via Docker with the MCP Gateway self-hosted option. See the [MCP Gateway documentation](https://mcp.wyre.ai) for setup instructions.

### Claude Code CLI

Set the environment variables and connect through the gateway:

```bash
export MERAKI_API_KEY="your-api-key"
export MERAKI_ORG_ID="123456"
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Gateway header auth, the full 27-tool catalog, Link-header pagination, rate limiting, the read-only / confirm_destructive_action model, the `meraki_raw_request` escape hatch, and error handling |
| `devices` | Device inventory and lifecycle -- list/get by serial, reboot, remove, and uplink/status via `meraki_raw_request` |
| `troubleshooting` | Live-tools workflows (ping, cable test, throughput) via `meraki_raw_request`, plus reboots and uplink checks |
| `security-appliance` | MX appliance L3 firewall rule review/update and site-to-site VPN status |

## Available Commands

| Command | Description |
|---------|-------------|
| `/meraki-network-health` | Org/site health sweep across networks, devices, and appliance VPN status |
| `/meraki-find-device` | Locate a device by serial, name, or MAC across an organization's networks |
| `/meraki-firewall-review` | Pull and summarize a network's L3 firewall rules and flag overly-permissive rules |

## Available Agents

| Agent | Description |
|-------|-------------|
| `meraki-network-auditor` | Read-only subagent that sweeps org -> networks -> devices/appliances and reports offline/alerting devices, VPN-down appliances, overly-permissive firewall rules, and weak/open SSIDs |

## Quick Start

### Sweep Network Health

```
/meraki-network-health --org_id "123456"
```

### Find a Device

```
/meraki-find-device --query "Q2XX-XXXX-XXXX"
```

### Review Firewall Rules

```
/meraki-firewall-review --network_id "L_123456789012345678"
```

## Meraki Model Primer

Meraki organizes everything as **organizations -> networks -> devices**:

- An **organization** is the top-level tenant that holds licensing, admins, and inventory.
- A **network** is a site or logical grouping. Networks have product types (`appliance`, `switch`, `wireless`, `camera`, `sensor`, `cellularGateway`, `systemsManager`).
- A **device** is identified by its immutable **serial number** (e.g. `Q2XX-XXXX-XXXX`), not an internal ID. Devices are claimed into an org's inventory, then assigned to a network.

Product lines you will encounter:

| Line | Product | Typical tools |
|------|---------|---------------|
| **MX** | Security appliance / SD-WAN | firewall L3, site-to-site VPN |
| **MS** | Switch | switch ports, port statuses |
| **MR** | Wireless access point | SSIDs, RF profiles |
| **MV** | Smart camera | via `meraki_raw_request` (camera endpoints) |
| **MG** | Cellular gateway | via `meraki_raw_request` |
| **MT** | Environmental sensor | via `meraki_raw_request` (sensor endpoints) |

## Security Considerations

### Credential Handling

- Never commit API keys to version control
- Use environment variables for all credentials
- Rotate API keys periodically via the Meraki Dashboard (My Profile)
- Use a least-privilege service account rather than a full-org admin key
- Review Dashboard API access and change logs regularly

### Write & Destructive Operations

- The MCP server runs `READ_ONLY_MODE=true` by default
- Destructive tools (`meraki_networks_delete`, `meraki_devices_remove`) require `confirm_destructive_action=true`
- Firewall (`meraki_appliance_firewall_l3_update`) and SSID (`meraki_wireless_ssids_update`) changes are high-impact -- always review the current state first and confirm intent before writing

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `MERAKI_API_KEY` is set correctly and API access is enabled at Organization > Settings > Dashboard API access
2. Check that the API key has not been revoked or regenerated
3. Confirm the account has admin access to the target organization

### Permission Errors

If you see "403 Forbidden":
1. The API key's Dashboard account lacks access to that org, network, or resource
2. Some org-wide endpoints require full organization admin rights

### Regional Cloud Mismatch

If you get empty results or auth failures for a China-based org:
1. Set `MERAKI_BASE_URL=https://api.meraki.cn/api/v1`
2. The China cloud is fully isolated from the global cloud with separate keys

### Rate Limits

Meraki enforces a ~10 requests/second per-organization limit:
1. HTTP 429 responses include a `Retry-After` header -- honor it
2. Space out requests and use `perPage` pagination
3. Prefer org-wide aggregate endpoints over per-device loops where available

## API Documentation

- [Meraki Dashboard API v1 Reference](https://developer.cisco.com/meraki/api-v1/)
- [Meraki Developer Hub](https://developer.cisco.com/meraki/)
- [Meraki Documentation](https://documentation.meraki.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0

- Initial release
- 4 skills: api-patterns, devices, troubleshooting, security-appliance
- 3 commands: meraki-network-health, meraki-find-device, meraki-firewall-review
- 1 agent: meraki-network-auditor
