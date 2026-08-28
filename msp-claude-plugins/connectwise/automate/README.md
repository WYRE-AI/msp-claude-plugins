# ConnectWise Automate Plugin

Claude Code plugin for ConnectWise Automate (formerly LabTech) RMM integration.

## Overview

This plugin provides Claude with deep knowledge of ConnectWise Automate, enabling:

- **Computer Management** - Search, view, and manage endpoints across all clients
- **Script Execution** - Run scripts on computers with parameters and results tracking
- **Monitor Configuration** - Manage monitoring templates, thresholds, and assignments
- **Alert Handling** - View, acknowledge, and create tickets from alerts
- **Client Management** - Manage clients, locations, and group configurations

## Prerequisites

### API Credentials

You need ConnectWise Automate API credentials. There are two authentication methods:

#### Integrator Credentials (Recommended)
1. Log into the ConnectWise Automate Control Center
2. Navigate to System > Integrator
3. Create a new integrator or use existing credentials
4. Note the username and password

#### User Authentication with 2FA
1. Use your Automate user credentials
2. If 2FA is enabled, you'll need to provide the TOTP code or bypass key

### Environment Variables

Set the following environment variables:

```bash
# Option 1: Integrator credentials (recommended)
export CONNECTWISE_AUTOMATE_SERVER="your-automate-server.com"
export CONNECTWISE_AUTOMATE_USERNAME="integrator-username"
export CONNECTWISE_AUTOMATE_PASSWORD="integrator-password"

# Option 2: User credentials with 2FA
export CONNECTWISE_AUTOMATE_SERVER="your-automate-server.com"
export CONNECTWISE_AUTOMATE_USER="username"
export CONNECTWISE_AUTOMATE_PASS="password"
export CONNECTWISE_AUTOMATE_2FA="optional-2fa-key"
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CONNECTWISE_AUTOMATE_SERVER` | Yes | | Your Automate server hostname |
| `CONNECTWISE_AUTOMATE_USERNAME` | Yes (option 1) | | Integrator username |
| `CONNECTWISE_AUTOMATE_PASSWORD` | Yes (option 1) | | Integrator password |
| `CONNECTWISE_AUTOMATE_USER` | Yes (option 2) | | User login username |
| `CONNECTWISE_AUTOMATE_PASS` | Yes (option 2) | | User login password |
| `CONNECTWISE_AUTOMATE_2FA` | No | | TOTP bypass key for 2FA |
| `CONNECTWISE_AUTOMATE_MCP_URL` | No | `https://connectwise-automate-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `CONNECTWISE_AUTOMATE_MCP_URL` to your gateway's endpoint:

```
CONNECTWISE_AUTOMATE_MCP_URL=https://your-gateway-domain/v1/connectwise-automate/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → ConnectWise Automate → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CONNECTWISE_AUTOMATE_MCP_URL": "https://your-gateway-domain/v1/connectwise-automate/mcp"
  }
}
```

### API Base URL

```
https://{automate-server}/cwa/api/v1/
```

### Rate Limits

ConnectWise Automate enforces rate limits of approximately **60 requests per minute**. The plugin implements automatic retry with exponential backoff.

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. Skills and commands will be available automatically

## Available Skills

| Skill | Description |
|-------|-------------|
| `computers` | Computer listing, status monitoring, inventory, patches, antivirus |
| `clients` | Client CRUD operations, locations, settings, groups |
| `scripts` | Script listing, execution, parameters, results |
| `monitors` | Monitor types, thresholds, templates, assignments |
| `alerts` | Alert listing, acknowledgment, history, ticket creation |
| `api-patterns` | Authentication, pagination, filtering, error handling |

## Available Commands

| Command | Description |
|---------|-------------|
| `/list-computers` | List computers with filters (client, location, status, OS) |
| `/run-script` | Execute a script on an endpoint with parameters |

## Quick Start

### List Computers

```
/list-computers
/list-computers --client "Acme Corp"
/list-computers --status online --os windows
```

### Run a Script

```
/run-script "ACME-DC01" "Clear Temp Files"
/run-script "ACME-DC01" "Disk Cleanup" --params "days=30" --wait
```

## API Reference

### Base URL
```
https://{server}/cwa/api/v1/
```

### Authentication
The API uses token-based authentication obtained via integrator or user credentials.

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Computers` | GET | List all computers |
| `/Computers/{id}` | GET | Get computer details |
| `/Clients` | GET | List all clients |
| `/Clients/{id}` | GET | Get client details |
| `/Scripts` | GET | List available scripts |
| `/Scripts/Run` | POST | Execute a script |
| `/Monitors` | GET | List monitors |
| `/Alerts` | GET | List active alerts |

### Pagination

ConnectWise Automate uses offset-based pagination:

```http
GET /cwa/api/v1/Computers?page=1&pageSize=50
```

Parameters:
- `page`: Page number (1-based)
- `pageSize`: Items per page (max 1000, default 50)

### Filtering

Use OData-style filters:

```http
GET /cwa/api/v1/Computers?condition=Status = 'Online'
GET /cwa/api/v1/Computers?condition=Client.Name contains 'Acme'
```

## API Documentation

- [ConnectWise Developer Portal](https://developer.connectwise.com/)
- [ConnectWise Automate API Documentation](https://developer.connectwise.com/Products/ConnectWise_Automate)
- [REST API Reference](https://developer.connectwise.com/Products/ConnectWise_Automate/API_Reference)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## License

See [LICENSE](../../LICENSE) for details.
