# Domotz Plugin

Claude Code plugin for the Domotz network monitoring and management platform.

## Overview

This plugin provides Claude with deep knowledge of Domotz, enabling:

- **Agent & Site Management** - Monitor Domotz agents/collectors and site health
- **Device Inventory** - List and inspect devices, uptime, and online/offline history across monitored networks
- **Alert Coverage** - Read alert profiles and per-device bindings to audit monitoring coverage
- **Network Observation** - Topology, IP conflicts, collector interfaces, and SNMP metrics with history
- **Power Control** - Read PDU/smart-outlet state and switch outlets on, off, or cycle — the one destructive tool in this integration
- **API Integration** - Domotz Public API patterns, authentication, and error handling

The Domotz MCP server is read-only apart from outlet power control. It
cannot trigger a network scan, run a speed test, probe TCP ports, query
fired alerts, or change any Domotz configuration.

## Prerequisites

### API Credentials

Domotz authenticates via an API key:

1. Log into the [Domotz Portal](https://portal.domotz.com)
2. Navigate to **User Menu > API Keys**
3. Generate a new API key

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Domotz once in Conduit (**Connections → Domotz**, slug `domotz`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| Region |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http domotz https://your-gateway-domain/v1/domotz/mcp`. The gateway then holds the Domotz credentials, not the client.

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- paste your API key and select your region, and you're done.

### Claude Code CLI

This plugin does not ship its own `.mcp.json`. Install the `wyre-gateway` plugin (or any workflow pack), which connects Claude Code to Conduit at `https://conduit.wyre.ai/v1/mcp`, then connect Domotz in the Conduit web UI (`/connect/domotz`). Conduit stores the credentials and injects them on every request, so there are no environment variables to set.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Authentication, the 21-tool catalog, agent-scoped calls, rate limiting, error handling |
| `agents` | Domotz agents/collectors, sites, and collector health |
| `devices` | Device inventory, status, uptime, event history, and inventory metadata |
| `alerts` | Alert profiles and per-device bindings — configuration only, not fired alerts |
| `network` | Topology, IP conflicts, collector interfaces, and SNMP variables and sensors |
| `power` | PDU/smart-outlet state and outlet control, with its approval discipline |

## Available Commands

| Command | Description |
|---------|-------------|
| `/device-lookup` | Find a device by name, IP address, or MAC address |
| `/site-overview` | Overview of a site's device health and network faults |
| `/device-inventory` | List all devices at a site |

## Quick Start

### Find a Device

```
/device-lookup --query "192.168.1.1"
```

### Site Health Overview

```
/site-overview --agent_id "12345"
```

### List All Devices at a Site

```
/device-inventory --agent_id "12345"
```

## Security Considerations

### Credential Handling

- Never commit API keys to version control
- Use environment variables for all credentials
- Rotate API keys periodically via the Domotz Portal
- Use the minimum scope necessary for your use case
- Monitor API usage in the Domotz audit log

### HTTP Transport Security

If using the MCP server over HTTP transport, ensure:
- TLS termination via a reverse proxy
- Restrict access to trusted networks
- Use authentication at the proxy layer

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `DOMOTZ_API_KEY` is set correctly
2. Check that the API key has not been revoked
3. Verify `DOMOTZ_REGION` matches your account's region
4. Regenerate credentials at Domotz Portal > User Menu > API Keys

### Region Mismatch

If you see unexpected errors or empty responses:
1. Confirm your region -- US accounts use `us-east-1`, EU accounts use `eu-central-1`
2. The API endpoint differs by region (`api-us-east-1-cell-1.domotz.com` vs `api-eu-central-1-cell-1.domotz.com`)

### Rate Limits

Domotz enforces API rate limits:
1. Space out requests when iterating over agents — every device call needs an `agent_id`, so a fleet report is one call per site
2. No tool accepts page/limit arguments; scope by `agent_id` rather than trying to shrink a response
3. If rate limited (HTTP 429), wait before retrying

### Connection Issues

If the MCP server fails to connect:
1. Verify network connectivity to `https://conduit.wyre.ai`
2. Check that your API credentials are valid
3. Ensure the MCP Gateway service is running

## API Documentation

- [Domotz Public API Documentation](https://portal.domotz.com/developers/)
- [Domotz Knowledge Base](https://help.domotz.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.2.6

- Rewrote every skill and command against the tool names the server
  actually registers
- Removed the `eyes` skill and the `/network-scan` and `/alert-status`
  commands — the Eyes sensor surface, the scan trigger, and the
  fired-alert feed do not exist on this server
- Added the `power` skill covering `domotz_power_outlets_list` and
  `domotz_power_outlet_control`, which no skill previously mentioned

### 0.1.0 (2026-03-27)

- Initial release
- 6 skills: api-patterns, agents, devices, alerts, network, eyes
- 5 commands: device-lookup, network-scan, alert-status, site-overview, device-inventory
