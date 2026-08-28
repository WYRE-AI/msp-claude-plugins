# HaloPSA Plugin

Claude Code plugin for HaloPSA integration.

## Overview

This plugin provides Claude with deep knowledge of HaloPSA, enabling:

- **Ticket Management** - Create, search, update, and manage service tickets with actions and attachments
- **Client Operations** - Client CRUD, sites, and contacts management
- **Asset Tracking** - Asset management and device tracking
- **Contract Management** - Service agreements, billing, and recurring items
- **API Patterns** - OAuth 2.0 Client Credentials flow, pagination, rate limiting

## Configuration

### Claude Code Settings (Recommended)

Add your credentials to `~/.claude/settings.json` (user scope, encrypted on macOS):

```json
{
  "env": {
    "HALOPSA_TENANT": "acmemsp",
    "HALOPSA_CLIENT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "HALOPSA_CLIENT_SECRET": "your-client-secret"
  }
}
```

For project-specific configuration, use `.claude/settings.local.json` (gitignored):

```json
{
  "env": {
    "HALOPSA_TENANT": "acmemsp",
    "HALOPSA_CLIENT_ID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "HALOPSA_CLIENT_SECRET": "your-client-secret"
  }
}
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HALOPSA_TENANT` | Yes | | Your HaloPSA tenant name (from `https://{tenant}.halopsa.com`) |
| `HALOPSA_CLIENT_ID` | Yes | | OAuth 2.0 Client ID |
| `HALOPSA_CLIENT_SECRET` | Yes | | OAuth 2.0 Client Secret |
| `HALOPSA_AUTH_SERVER` | No | `https://{tenant}.halopsa.com/auth` | Auth server URL |
| `HALOPSA_MCP_URL` | No | `https://halopsa-mcp.wyre.workers.dev/mcp` | MCP server URL — override to use a self-hosted gateway |

## Self-Hosted Gateway

If you run the [mcp-gateway](https://github.com/WYRE-AI/mcp-gateway), set `HALOPSA_MCP_URL` to your gateway's endpoint:

```
HALOPSA_MCP_URL=https://your-gateway-domain/v1/halopsa/mcp
```

**Setting env vars in Claude.ai:** Go to your org → Settings → Integrations → HaloPSA → Configure and add the variable.

**Setting env vars in Claude Code:** Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "HALOPSA_MCP_URL": "https://your-gateway-domain/v1/halopsa/mcp"
  }
}
```

### Obtaining API Credentials

1. **Log into HaloPSA**
   - Navigate to your HaloPSA instance at `https://your-tenant.halopsa.com`

2. **Create an API Application**
   - Go to **Configuration > Integrations > HaloPSA API**
   - Click **View Applications**
   - Click **New** to create a new application
   - Configure the application:
     - **Name**: Claude Code Integration
     - **Grant Type**: Client Credentials
     - **Permissions**: Select the permissions your integration needs
   - Save and note the **Client ID** and **Client Secret**

3. **Find Your Tenant Name**
   - Your tenant is the first part of your HaloPSA URL
   - Example: If your URL is `https://acmemsp.halopsa.com`, your tenant is `acmemsp`

### OAuth Token Retrieval

HaloPSA uses OAuth 2.0 Client Credentials flow. Here's how to obtain a token:

```bash
# Get access token
curl -X POST "https://${HALOPSA_TENANT}.halopsa.com/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=${HALOPSA_CLIENT_ID}" \
  -d "client_secret=${HALOPSA_CLIENT_SECRET}" \
  -d "scope=all"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Testing Your Connection

Once configured in Claude Code settings, test the connection (env vars injected by Claude Code):

```bash
# Get token
TOKEN=$(curl -s -X POST "https://${HALOPSA_TENANT}.halopsa.com/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=${HALOPSA_CLIENT_ID}&client_secret=${HALOPSA_CLIENT_SECRET}&scope=all" \
  | jq -r '.access_token')

# Test API call
curl -s "https://${HALOPSA_TENANT}.halopsa.com/api/Tickets?count=1" \
  -H "Authorization: Bearer ${TOKEN}" | jq
```

## Installation

```bash
# Clone the repository
git clone https://github.com/WYRE-AI/msp-claude-plugins.git

# Navigate to plugin
cd msp-claude-plugins/halopsa/halopsa

# Use with Claude Code
claude --plugin .
```

## Available Skills

| Skill | Description |
|-------|-------------|
| `tickets` | Ticket management, actions, and attachments |
| `clients` | Client CRUD, sites, and contacts |
| `assets` | Asset tracking and device management |
| `contracts` | Contract management and billing |
| `api-patterns` | OAuth 2.0 authentication, pagination, rate limiting |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-ticket` | Create a new service ticket |
| `/search-tickets` | Search for tickets by criteria |

## API Reference

- **Base URL**: `https://{tenant}.halopsa.com/api`
- **Auth**: OAuth 2.0 Client Credentials
- **Rate Limit**: 500 requests per 3 minutes
- **Docs**: [HaloPSA API Documentation](https://halopsa.com/apidocs/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.
