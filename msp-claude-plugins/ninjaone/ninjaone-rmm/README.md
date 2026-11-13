# NinjaOne (NinjaRMM) Plugin

Claude Code plugin for NinjaOne Remote Monitoring and Management.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins --plugin ninjaone-rmm
```

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect NinjaOne once in Conduit (**Connections → NinjaOne**, slug `ninjaone`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Client ID |
| Client Secret |
| Region |

Get the credentials from **Administration > Apps > API** in NinjaOne.

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http ninjaone https://your-gateway-domain/v1/ninjaone/mcp`. The gateway then holds the NinjaOne credentials, not the client.

## Skills

| Skill | Description |
|-------|-------------|
| `ninjaone-rmm:devices` | Device management, services, inventory, maintenance |
| `ninjaone-rmm:organizations` | Organization and location management |
| `ninjaone-rmm:alerts` | Alert monitoring and management |
| `ninjaone-rmm:tickets` | Ticketing: forms, statuses, priority vs severity, create/update |
| `ninjaone-rmm:custom-fields` | Device and organization custom fields |
| `ninjaone-rmm:api-patterns` | Authentication and API patterns |

## Commands

| Command | Description |
|---------|-------------|
| `/ninjaone-search-devices` | Search devices across organizations |
| `/ninjaone-device-info` | Get detailed device information |
| `/ninjaone-list-alerts` | List active alerts |
| `/ninjaone-create-ticket` | Create a new ticket |

## API Reference

- **Base URLs**: `app.ninjarmm.com` (US), `us2.ninjarmm.com` (US2), `eu.ninjarmm.com` (EU), `oc.ninjarmm.com` (OC), `ca.ninjarmm.com` (CA), `fed.ninjarmm.com` (FED)
- **Authentication**: OAuth 2.0 with Bearer token
- **Rate Limits**: Varies by endpoint
- **Documentation**: [NinjaOne Public API](https://app.ninjarmm.com/apidocs/)

## Examples

### Search for offline devices
```
/ninjaone-search-devices "offline servers"
```

### Get device details
```
/ninjaone-device-info 12345
```

### List critical alerts
```
/ninjaone-list-alerts --priority critical
```

## Related

- [MCP Server](https://github.com/WYRE-AI/ninjaone-mcp) - Full API access via MCP
- [Node Library](https://github.com/asachs01/node-ninjaone) - TypeScript client library
