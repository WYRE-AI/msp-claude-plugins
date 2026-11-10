# Atera Plugin

Claude Code plugin for Atera RMM/PSA integration.

## Overview

This plugin provides Claude with deep knowledge of Atera RMM/PSA, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets
- **Agent Management** - Monitor and manage RMM agents, run PowerShell scripts
- **Customer Operations** - Customer CRUD operations and contact management
- **Alert Management** - View, acknowledge, and resolve alerts
- **Device Monitoring** - HTTP, SNMP, and TCP device monitors

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Atera once in Conduit (**Connections → Atera**, slug `atera`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |

### Obtaining API Credentials

1. **Log into Atera**
   - Navigate to [https://app.atera.com](https://app.atera.com)

2. **Generate an API Key**
   - Go to **Admin > API**
   - Click **Generate API Key**
   - Copy the generated key (it will only be shown once)

3. **API Key Permissions**
   - The API key inherits the permissions of the user who created it
   - Ensure your user has appropriate permissions for the operations you need

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http atera https://your-gateway-domain/v1/atera/mcp`. The gateway then holds the Atera credentials, not the client.

### Testing Your Connection

To check the credentials directly against Atera before you save them in Conduit, export them in your shell and run:

```bash
# Test connection
curl -s "https://app.atera.com/api/v3/customers" \
  -H "X-API-KEY: ${ATERA_API_KEY}" \
  -H "Accept: application/json" | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/atera/atera

# Use with Claude Code
claude --plugin .
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Service ticket management with filters, statuses, comments, work hours |
| `agents` | RMM agent management and PowerShell execution |
| `customers` | Customer and contact management |
| `alerts` | Alert monitoring, acknowledgment, and resolution |
| `devices` | HTTP, SNMP, and TCP device monitors |
| `api-patterns` | X-API-KEY auth, OData pagination, rate limiting |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket |
| `/search-agents` | Search for agents by customer or machine name |

## API Reference

- **Base URL**: `https://app.atera.com/api/v3`
- **Auth**: `X-API-KEY` header
- **Rate Limit**: 700 requests per minute
- **Docs**: [Atera API Documentation](https://app.atera.com/apidocs/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
