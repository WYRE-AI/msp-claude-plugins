# NinjaOne (NinjaRMM) Plugin

Claude Code plugin for NinjaOne Remote Monitoring and Management.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins --plugin ninjaone-rmm
```

## Configuration

Set these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NINJAONE_CLIENT_ID` | Yes | | OAuth 2.0 Client ID |
| `NINJAONE_CLIENT_SECRET` | Yes | | OAuth 2.0 Client Secret |
| `NINJAONE_REGION` | Yes | | Region: `us`, `eu`, or `oc` |
| `NINJAONE_MCP_URL` | No | `https://ninjaone-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

Get credentials from **Administration > Apps > API** in NinjaOne.

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `NINJAONE_MCP_URL` to your gateway's endpoint:

```
NINJAONE_MCP_URL=https://your-gateway-domain/v1/ninjaone/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → NinjaOne → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "NINJAONE_MCP_URL": "https://your-gateway-domain/v1/ninjaone/mcp"
  }
}
```

## Skills

| Skill | Description |
|-------|-------------|
| `ninjaone-rmm:devices` | Device management, services, inventory, maintenance |
| `ninjaone-rmm:organizations` | Organization and location management |
| `ninjaone-rmm:alerts` | Alert monitoring and management |
| `ninjaone-rmm:tickets` | Ticketing operations |
| `ninjaone-rmm:api-patterns` | Authentication and API patterns |

## Commands

| Command | Description |
|---------|-------------|
| `/ninjaone-search-devices` | Search devices across organizations |
| `/ninjaone-device-info` | Get detailed device information |
| `/ninjaone-list-alerts` | List active alerts |
| `/ninjaone-create-ticket` | Create a new ticket |

## API Reference

- **Base URLs**: `app.ninjarmm.com` (US), `eu.ninjarmm.com` (EU), `oc.ninjarmm.com` (OC)
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
