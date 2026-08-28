# SuperOps.ai Plugin

Claude Code plugin for SuperOps.ai PSA/RMM integration.

## Overview

This plugin provides Claude with deep knowledge of SuperOps.ai, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets
- **Asset Management** - Query assets, run scripts, monitor patches
- **Client Operations** - Client and site management
- **Alert Handling** - Monitor, acknowledge, and resolve alerts
- **Runbook Execution** - Execute automation scripts on assets

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "SUPEROPS_SUBDOMAIN": "acmemsp",
    "SUPEROPS_API_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "SUPEROPS_SUBDOMAIN": "acmemsp",
    "SUPEROPS_API_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPEROPS_SUBDOMAIN` | Yes | | Your SuperOps company subdomain |
| `SUPEROPS_API_TOKEN` | Yes | | Bearer token from Settings > Integrations > API |
| `SUPEROPS_API_URL` | No | `https://api.superops.ai/graphql` | API URL (US). Use `https://euapi.superops.ai/graphql` for EU |
| `SUPEROPS_MCP_URL` | No | `https://superops-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `SUPEROPS_MCP_URL` to your gateway's endpoint:

```
SUPEROPS_MCP_URL=https://your-gateway-domain/v1/superops/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → SuperOps → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "SUPEROPS_MCP_URL": "https://your-gateway-domain/v1/superops/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into SuperOps.ai**
   - Navigate to your SuperOps instance

2. **Generate an API Token**
   - Go to **Settings > Integrations > API**
   - Click **Generate Token** or **Create New Token**
   - Give your token a descriptive name (e.g., "Claude Code Integration")
   - Copy the generated token (it will only be shown once)

3. **Find Your Subdomain**
   - Your subdomain is your company identifier in SuperOps
   - This is typically your company name or a custom identifier

4. **Determine Your API Region**
   - **US Region**: `https://api.superops.ai/graphql`
   - **EU Region**: `https://euapi.superops.ai/graphql`

### Testing Your Connection

Once configured in Claude Code settings, test the connection (env vars injected by Claude Code):

```bash
# Test connection (GraphQL query)
curl -X POST "https://api.superops.ai/graphql" \
  -H "Authorization: Bearer ${SUPEROPS_API_TOKEN}" \
  -H "CustomerSubDomain: ${SUPEROPS_SUBDOMAIN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ clients { edges { node { id name } } } }"}' | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/superops/superops-ai

# Use with Claude Code
claude --plugin .
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Service ticket management and workflows |
| `assets` | Asset inventory and management |
| `clients` | Client and site management |
| `alerts` | Alert monitoring and resolution |
| `runbooks` | Script and runbook execution |
| `api-patterns` | Common SuperOps.ai GraphQL patterns |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket |
| `/list-assets` | List and filter assets |

## API Reference

- **Base URL**: `https://api.superops.ai/graphql` (US) or `https://euapi.superops.ai/graphql` (EU)
- **Auth**: Bearer token + `CustomerSubDomain` header
- **Rate Limit**: 800 requests per minute
- **Docs**: [SuperOps.ai API Documentation](https://developer.superops.ai/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
