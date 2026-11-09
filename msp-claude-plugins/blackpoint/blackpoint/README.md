# Blackpoint Cyber Plugin

Claude Code plugin for [Blackpoint Cyber](https://blackpointcyber.com) (the CompassOne portal) - managed detection and response for MSPs.

## What It Does

- **Detections** - List and drill into MDR detections
- **Assets** - Tenant-scoped asset inventory with relationship traversal
- **Vulnerabilities** - Scan results, dark-web exposure, external (internet-facing) vulns
- **Tenants** - Partner-tenant-asset hierarchy navigation

> Today's tool surface is read-only and covers four domains: tenants,
> assets, detections, and vulnerabilities. Stubs exist for alerts,
> cloud security, notifications, partners, threat intel, and tickets;
> those will be implemented in a later wave.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install blackpoint
```

The plugin connects through [Conduit](https://conduit.wyre.ai) at `https://conduit.wyre.ai/v1/blackpoint/mcp`. Your MCP client authenticates to Conduit with OAuth (it prompts you to sign in on first use); there are no environment variables or headers to configure on the client.

## Configuration

Connect Blackpoint once in the Conduit web UI (**Connections → Blackpoint**). Conduit stores these credentials and injects them on every request:

| Field | Required | Description |
|-------|----------|-------------|
| API Token | Yes | CompassOne portal Bearer token |
| Base URL | No | Override the CompassOne API base URL (leave blank for the default) |

## Skills

- `api-patterns` - Auth, partner-tenant-asset hierarchy, navigation, pagination
- `incident-response` - Primary investigation skill (detections + assets + vulnerabilities)

## Commands

- `/search-detections` - List recent detections, optionally scoped to a tenant

## Tools

Provided by the Blackpoint MCP server through the WYRE MCP Gateway:

### Navigation
- `blackpoint_navigate`, `blackpoint_back`, `blackpoint_status`

### Tenants
- `blackpoint_tenants_list`, `blackpoint_tenants_get`

### Assets
- `blackpoint_assets_list`, `blackpoint_assets_get`
- `blackpoint_assets_search`, `blackpoint_assets_relationships`

### Detections
- `blackpoint_detections_list`, `blackpoint_detections_get`

### Vulnerabilities
- `blackpoint_vulnerabilities_list`
- `blackpoint_vulnerabilities_scans_list`
- `blackpoint_vulnerabilities_darkweb_list`
- `blackpoint_vulnerabilities_external_list`

## License

Apache-2.0
