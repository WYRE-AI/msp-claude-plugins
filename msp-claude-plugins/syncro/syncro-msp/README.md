# Syncro MSP Plugin

Claude Code plugin for Syncro MSP integration.

## Overview

This plugin provides Claude with domain knowledge of Syncro MSP, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets
- **Customer Operations** - Customer and contact management
- **Asset Management** - Asset tracking and RMM integration
- **Invoice Management** - Invoice generation, payments, and billing

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "SYNCRO_SUBDOMAIN": "acmemsp",
    "SYNCRO_API_KEY": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "SYNCRO_SUBDOMAIN": "acmemsp",
    "SYNCRO_API_KEY": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SYNCRO_SUBDOMAIN` | Yes | | Your Syncro subdomain (from `https://{subdomain}.syncromsp.com`) |
| `SYNCRO_API_KEY` | Yes | | API key from Admin > API Tokens |
| `SYNCRO_MCP_URL` | No | `https://syncro-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `SYNCRO_MCP_URL` to your gateway's endpoint:

```
SYNCRO_MCP_URL=https://your-gateway-domain/v1/syncro/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → Syncro → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "SYNCRO_MCP_URL": "https://your-gateway-domain/v1/syncro/mcp"
  }
}
```

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

Once configured in Claude Code settings, test the connection:

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
| `tickets` | Service ticket management, statuses, timers |
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
