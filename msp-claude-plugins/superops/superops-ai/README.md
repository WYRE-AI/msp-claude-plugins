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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect SuperOps once in Conduit (**Connections → SuperOps**, slug `superops`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| API Token |
| Subdomain |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http superops https://your-gateway-domain/v1/superops/mcp`. The gateway then holds the SuperOps credentials, not the client.

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

To check the credentials directly against SuperOps before you save them in Conduit, export them in your shell and run:

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
