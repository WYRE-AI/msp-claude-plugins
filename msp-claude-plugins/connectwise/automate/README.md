# ConnectWise Automate Plugin

Claude Code plugin for ConnectWise Automate (formerly LabTech) RMM integration.

## Overview

This plugin provides Claude with deep knowledge of ConnectWise Automate, enabling:

- **Computer Management** - Search, view, and manage endpoints across all clients
- **Script Execution** - Run scripts on computers with parameters and results tracking
- **Monitor Configuration** - Manage monitoring templates, thresholds, and assignments
- **Alert Handling** - View and triage alerts (read-only; follow-up goes to a PSA ticket)
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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect ConnectWise Automate once in Conduit (**Connections → ConnectWise Automate**, slug `connectwise-automate`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Server URL |
| Client ID |
| Username |
| Password |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http connectwise-automate https://your-gateway-domain/v1/connectwise-automate/mcp`. The gateway then holds the ConnectWise Automate credentials, not the client.

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
| `alerts` | Read-only alert listing and triage by client and severity |
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
