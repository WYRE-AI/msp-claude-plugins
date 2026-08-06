# Pax8 Plugin

Claude Code plugin for the Pax8 cloud marketplace platform integration.

## Overview

This plugin provides Claude with deep knowledge of Pax8, enabling:

- **Company Management** - Manage MSP client companies within the Pax8 marketplace
- **Product Catalog** - Search and browse the cloud software catalog (Microsoft 365, Azure, security tools, backup, etc.)
- **Subscription Lifecycle** - Provision, modify, and cancel cloud subscriptions for clients
- **Order Management** - Place orders for new products and track provisioning status
- **Invoice & Billing** - Reconcile Pax8 invoices with client billing

## Prerequisites

### MCP Token

Pax8 provides a first-party hosted MCP server. You need a single MCP token:

1. Log into the Pax8 Partner Portal at [app.pax8.com](https://app.pax8.com)
2. Navigate to **Integrations > MCP** (or visit [app.pax8.com/integrations/mcp](https://app.pax8.com/integrations/mcp))
3. Generate an MCP token
4. Set the token as an environment variable

### Environment Variables

```bash
export PAX8_MCP_TOKEN="your-mcp-token"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect — just paste your MCP token and you're done.

### Self-Hosted (Claude Desktop)

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "pax8": {
      "command": "npx",
      "args": [
        "-y", "mcp-remote",
        "https://mcp.pax8.com/v1/mcp",
        "--header", "x-pax8-mcp-token:YOUR_TOKEN"
      ]
    }
  }
}
```

> **Note:** Pax8 hosts their own MCP server at `https://mcp.pax8.com/v1/mcp`. This plugin adds MSP-specific skills, commands, and workflow knowledge on top of Pax8's official server.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Pax8 API authentication, pagination, error handling, and best practices |
| `companies` | Company (client) management in the Pax8 marketplace |
| `products` | Cloud product catalog search and pricing |
| `subscriptions` | Subscription lifecycle management (provision, modify, cancel) |
| `orders` | Order creation, tracking, and provisioning status |
| `invoices` | Invoice retrieval, billing reconciliation, and usage summaries |

## Available Commands

| Command | Description |
|---------|-------------|
| `/search-products` | Search the Pax8 product catalog by name or vendor |
| `/subscription-status` | Check subscription status for a company |
| `/create-order` | Place an order for a product subscription |
| `/license-summary` | Aggregate license counts and costs across all clients |

## Quick Start

### Search for a Product

```
/search-products "Microsoft 365 Business Premium"
```

### Check Subscription Status

```
/subscription-status --company "Acme Corp"
```

### Place an Order

```
/create-order --company "Acme Corp" --product "Microsoft 365 Business Premium" --quantity 25
```

### Generate License Summary

```
/license-summary
```

## Security Considerations

### MCP Token

- Never commit MCP tokens to version control
- Use environment variables for all credentials
- Rotate tokens periodically via the Pax8 Partner Portal
- Monitor for unexpected API activity in the portal

## API Rate Limits

Pax8 enforces rate limits:

- 1000 successful calls per minute

The plugin automatically handles rate limiting with exponential backoff.

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `PAX8_MCP_TOKEN` is set correctly
2. Check that the token has not been revoked in the Pax8 portal
3. Generate a new token at [app.pax8.com/integrations/mcp](https://app.pax8.com/integrations/mcp)

### Rate Limiting

If you see "429 Too Many Requests":
1. Wait for the rate limit window to reset (1 minute)
2. Reduce the frequency of requests
3. Use pagination to reduce total call count

## API Documentation

- [Pax8 MCP Server Docs](https://devx.pax8.com/docs/mcp-server)
- [Pax8 MCP Setup Guide (Claude)](https://devx.pax8.com/docs/pax8-mcp-server-setup-guide-claude)
- [Pax8 API Documentation](https://devx.pax8.com/reference)
- [Pax8 Partner Portal](https://app.pax8.com)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.2.0 (2026-02-23)

- Switched to Pax8's official hosted MCP server (`https://mcp.pax8.com/v1/mcp`)
- Auth simplified from OAuth2 client_id/client_secret to single MCP token
- Updated all documentation and connection instructions

### 0.1.0 (2026-02-23)

- Initial release
- 6 skills: api-patterns, companies, products, subscriptions, orders, invoices
- 4 commands: search-products, subscription-status, create-order, license-summary
