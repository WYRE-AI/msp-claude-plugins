# Syncro MSP Plugin

Claude Code plugin for Syncro MSP integration.

## Overview

This plugin provides Claude with domain knowledge of Syncro MSP, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets
- **Customer Operations** - Customer and contact management
- **Asset Management** - Asset tracking and RMM integration
- **Invoice Management** - Invoice generation, payments, and billing

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Syncro once in Conduit (**Connections → Syncro (API connector)**, slug `syncro`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Key |
| Subdomain |

`syncro` is Syncro's API connector, which serves the `syncro_*` tools this plugin documents. Conduit steers new sign-ins to Syncro's hosted MCP (`syncro-official`), whose tools are different.

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http syncro https://your-gateway-domain/v1/syncro/mcp`. The gateway then holds the Syncro credentials, not the client.

### Obtaining API Credentials

1. **Log into Syncro**
   - Navigate to your Syncro instance at `https://your-subdomain.syncromsp.com`

2. **Generate an API Token**
   - Go to **Admin > API Tokens**
   - Click **Create Token**
   - Give your token a descriptive name (e.g., "Claude Code Integration")
   - Copy the generated API key (it will only be shown once)

3. **Find Your Subdomain**
   - Your subdomain is the first part of your Syncro URL
   - Example: If your URL is `https://acmemsp.syncromsp.com`, your subdomain is `acmemsp`

### Testing Your Connection

To check the credentials directly against Syncro before you save them in Conduit, export them in your shell and run:

```bash
# Test connection (env vars injected by Claude Code)
curl -s "https://${SYNCRO_SUBDOMAIN}.syncromsp.com/api/v1/me?api_key=${SYNCRO_API_KEY}" | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/syncro/syncro-msp

# Use with Claude Code
claude --plugin .
```

## Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Service ticket management, statuses, comments |
| `customers` | Customer and contact management |
| `assets` | Asset tracking and RMM integration |
| `invoices` | Invoice generation and payments |
| `api-patterns` | Syncro API authentication, pagination, rate limits |

## Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket |
| `/search-tickets` | Search for tickets by criteria |

## API Reference

- **Base URL**: `https://{subdomain}.syncromsp.com/api/v1`
- **Auth**: API key passed as query parameter `api_key`
- **Rate Limit**: 180 requests per minute
- **Docs**: [Syncro API Documentation](https://api-docs.syncromsp.com/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
