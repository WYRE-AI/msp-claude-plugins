# Auvik Plugin

Claude Code plugin for the Auvik cloud-based network monitoring platform.

## Overview

This plugin gives Claude working knowledge of Auvik so MSP analysts can interrogate device inventories, triage alerts, audit network configurations, and plan capacity without leaving the chat. It talks to Auvik through [Conduit](https://conduit.wyre.ai), so no local SDK or proxy is required.

## What Is Auvik

Auvik is a SaaS network monitoring and management product used by MSPs to discover, map, monitor, and alert on customer network infrastructure - switches, routers, firewalls, access points, hypervisors, printers, and the interfaces and IP networks that connect them. It is multi-tenant by design; one set of credentials sees every client tenant the MSP manages.

## What This Plugin Does

- **Device Inventory** - Per-tenant device reports broken down by type, manage status, and lifecycle posture; flags unmanaged devices and hardware nearing end-of-life
- **Alert Triage** - Pulls open alerts, ranks them by severity and entity criticality, recommends dismissals for known-good noise, and pivots into device/interface context before action
- **Network Audit** - Walks a tenant's networks, interfaces, and configuration backups to flag drift, missing backups, and unusual config patterns
- **Tenant Overview** - A single-tenant snapshot - device count, open alerts, network footprint, and billing usage
- **Capacity Check** - Interface statistics over a window to find saturated links and recurring congestion

## Installation

Install via the [MSP Claude Plugins marketplace](https://github.com/wyre-technology/msp-claude-plugins):

```
/plugin marketplace add wyre-technology/msp-claude-plugins
/plugin install auvik
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/auvik/mcp`.

## Configuration

Set the following environment variables (or paste credentials into the gateway UI):

| Variable | Required | Description |
|----------|----------|-------------|
| `AUVIK_USERNAME` | Yes | Email address of the Auvik user the API key belongs to |
| `AUVIK_API_KEY` | Yes | API key issued from the Auvik portal under My Profile / API Keys |
| `AUVIK_REGION` | No | Region cluster the tenant lives in: `us1`, `us2`, `us3`, `us4`, `eu1`, `eu2`, `au1`, `ca1`. Omit to auto-detect. |

See the [Auvik API documentation](https://support.auvik.com/hc/en-us/sections/360002960071-Auvik-APIs) for instructions on issuing an API key and identifying your region.

## Available Commands

| Command | Description |
|---------|-------------|
| `/auvik:device-inventory` | List and summarize devices for a tenant, with type and lifecycle breakdown |
| `/auvik:alert-triage` | Prioritize open alerts and recommend dismissals for known noise |
| `/auvik:network-audit` | Audit network topology, interfaces, and saved configurations for a tenant |
| `/auvik:tenant-overview` | Single-tenant dashboard - devices, alerts, networks, billing usage |
| `/auvik:capacity-check` | Interface utilization scan; flags saturated links |

## Available Agents

| Agent | Use For |
|-------|---------|
| `network-analyst` | "What's wrong with this tenant's network?" - topology, performance, multi-signal triage |
| `alert-responder` | Inbound alert questions - severity, entity context, dismissal decisions |
| `capacity-planner` | Utilization, saturation, and headroom questions over time windows |

## Skills Bundled

- `devices` - Device taxonomy, manageStatus values, lifecycle and warranty fields
- `alerts` - Severity enum, status enum, dismissal semantics, common alert names
- `networks` - Network entity model, interface relationships
- `api-patterns` - JSON:API envelope, pagination, rate-limit behavior, v1 vs v2 device API

## Available Tools

Provided by the Auvik MCP server through the WYRE MCP Gateway:

### Service
- `auvik_status`, `auvik_navigate`

### Tenants
- `auvik_tenants_list`, `auvik_tenants_get`, `auvik_tenants_detail`

### Devices
- `auvik_devices_list`, `auvik_devices_get`, `auvik_devices_get_details`
- `auvik_devices_get_warranty`, `auvik_devices_get_lifecycle`

### Networks and Interfaces
- `auvik_networks_list`, `auvik_networks_get`
- `auvik_interfaces_list`

### Configurations
- `auvik_configurations_list`, `auvik_configurations_get`

### Entities (notes and audits)
- `auvik_entities_list_notes`, `auvik_entities_list_audits`

### Alerts
- `auvik_alerts_list`, `auvik_alerts_get`, `auvik_alerts_dismiss`

### Statistics
- `auvik_statistics_device`, `auvik_statistics_interface`
- `auvik_statistics_service`, `auvik_statistics_snmp_poller`

### Billing
- `auvik_billing_client_usage`, `auvik_billing_device_usage`

## Common Workflows

### Triage overnight alerts

```
/auvik:alert-triage
```

Lists open alerts across visible tenants ordered by severity, groups duplicate alerts per entity, and recommends dismissals for ones matching known noise patterns (link flap on an unmanaged port, scheduled reboots, etc.).

### Audit a tenant's network before a renewal

```
/auvik:network-audit tenant_id=<id>
```

Walks every network, lists devices and interfaces, pulls the most recent saved configurations, and flags devices with no configuration backup or stale backups (>30 days).

### Find devices nearing end-of-life

```
/auvik:device-inventory tenant_id=<id>
```

Lists all devices for the tenant, joins with lifecycle and warranty data, and surfaces anything past end-of-sale or end-of-support and anything out of warranty.

### Spot saturated WAN links

```
/auvik:capacity-check tenant_id=<id> window=7d
```

Pulls interface statistics over the window, flags any link with sustained utilization >70% or recurring saturation events.

## Troubleshooting

- **Region detection** - If calls return 404 or redirect loops, your tenant is in a different region cluster. Set `AUVIK_REGION` explicitly. The current clusters are `us1`, `us2`, `us3`, `us4`, `eu1`, `eu2`, `au1`, `ca1`.
- **Rate limits** - Auvik enforces per-key rate limits. If listings start returning 429, slow the pagination loop or narrow the query by tenant. The MCP server surfaces rate-limit errors as tool errors with a retryable status.
- **Dismiss vs resolve** - `auvik_alerts_dismiss` acknowledges and hides the alert in the UI. It does not fix the underlying condition. If the condition still holds when the alert next evaluates, a new alert will appear. Use dismissals only for confirmed noise.
- **v1 vs v2 device endpoints** - `auvik_devices_list` returns the lighter v1 device record. For lifecycle, warranty, and extended attributes use `auvik_devices_get_details`, `auvik_devices_get_lifecycle`, and `auvik_devices_get_warranty`.

## License

Apache-2.0

## Links

- [Auvik product](https://www.auvik.com/)
- [Auvik API docs](https://support.auvik.com/hc/en-us/sections/360002960071-Auvik-APIs)
- [Auvik support](https://support.auvik.com/)
