# Datto RMM MCP Server

MCP server for Datto RMM, enabling Claude to interact with your Datto RMM account.

## Features

- **Device Management**: List, search, and get details for devices
- **Alert Management**: View and resolve alerts
- **Site Management**: List and view site details
- **Quick Jobs**: Run quick jobs on devices
- **Audit Data**: Retrieve software, hardware, OS, network, and disk audit data

## Installation

### Via MCP Gateway (Recommended)

This server is designed to work with the [MCP Gateway](https://github.com/WYRE-AI/mcp-gateway) which handles authentication and credential management.

### Local Development

```bash
npm install
npm run build
npm start
```

## Configuration

The server accepts credentials via environment variables:

| Variable | Description |
|----------|-------------|
| `DATTO_API_KEY` | Your Datto RMM API key |
| `DATTO_API_SECRET` | Your Datto RMM API secret |
| `DATTO_PLATFORM` | API platform (default: `concord-api`) |

When used with the MCP Gateway, credentials are injected via `X_API_KEY` and `X_API_SECRET` environment variables.

## Available Tools

| Tool | Description |
|------|-------------|
| `datto_list_devices` | List devices with optional filters |
| `datto_get_device` | Get device details |
| `datto_list_alerts` | List open alerts |
| `datto_resolve_alert` | Resolve an alert |
| `datto_list_sites` | List all sites |
| `datto_get_site` | Get site details |
| `datto_run_quickjob` | Run a quick job on a device |
| `datto_get_device_audit` | Get audit data for a device |

## Docker

```bash
docker build -t datto-rmm-mcp .
docker run -e DATTO_API_KEY=xxx -e DATTO_API_SECRET=xxx datto-rmm-mcp
```

## License

Apache-2.0
