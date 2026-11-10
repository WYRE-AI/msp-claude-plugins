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

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect HaloPSA once in Conduit (**Connections → HaloPSA**, slug `halopsa`); Conduit stores the credentials and injects them on every request. Then add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client (or install the `wyre-gateway` plugin); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Client ID |
| Client Secret |
| Tenant |

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http halopsa https://your-gateway-domain/v1/halopsa/mcp`. The gateway then holds the HaloPSA credentials, not the client.

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

To check the credentials directly against HaloPSA before you save them in Conduit, export them in your shell and run:

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
