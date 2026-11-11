# Sherweb Plugin

Claude Code plugin for the Sherweb Partner API distribution platform integration.

## Overview

This plugin provides Claude with deep knowledge of Sherweb, enabling:

- **Customer Management** - List and manage customers in the Sherweb distributor platform
- **Subscription Lifecycle** - View subscriptions, change seat quantities, and monitor provisioning status
- **Distributor Billing** - Analyze payable charges, pricing breakdowns, deductions, fees, and taxes. Charges are fetched by explicit date range; there is no billing-period list and no invoice retrieval — see [GOVERNANCE.md](GOVERNANCE.md)
- **API Patterns** - OAuth 2.0 client credentials flow, subscription key authentication, rate limiting, and error handling

## Configuration

### Connect through Conduit

This plugin ships no `.mcp.json` and reads no environment variables. Connect Sherweb once in Conduit at `https://conduit.wyre.ai/connect/sherweb` (**Connections → Sherweb**, slug `sherweb`); Conduit stores the credentials and injects them on every request. Then install the `wyre-gateway` plugin (or add the unified connector `https://conduit.wyre.ai/v1/mcp` to your MCP client); your client signs in to Conduit with OAuth.

| Conduit connection field |
|---|
| Client ID |
| Client Secret |
| Subscription Key |

Conduit requests an OAuth token from Sherweb with these credentials when you save the connection, so bad credentials are rejected there.

### Obtaining API Credentials

Sherweb uses OAuth 2.0 client credentials for API authentication, plus an API management subscription key:

1. Log into the Sherweb Partner Portal at [cumulus.sherweb.com](https://cumulus.sherweb.com)
2. Navigate to **Security > APIs**
3. Create a new API application or manage existing credentials
4. Note your Client ID, Client Secret, and Subscription Key

## Self-Hosted Gateway

There is no per-plugin URL setting, and setting an environment variable does not register an MCP server. To use your own gateway instead of Conduit, register it as an MCP server in your client, for example `claude mcp add --transport http sherweb https://your-gateway-domain/v1/sherweb/mcp`. The gateway then holds the Sherweb credentials, not the client. In that case install only this plugin (`/plugin install sherweb@msp-claude-plugins`) and skip `wyre-gateway` and the Conduit connection.

## Installation

```
/plugin marketplace add WYRE-AI/msp-claude-plugins
/plugin install wyre-gateway@msp-claude-plugins
/plugin install sherweb@msp-claude-plugins
```

Then connect Sherweb in Conduit (see **Connect through Conduit**). The plugin adds skills and commands; the tools come from the Conduit connector.

> **Note:** This plugin adds MSP-specific skills, commands, and workflow knowledge on top of the Sherweb Partner API.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | Sherweb API authentication, OAuth 2.0, endpoints, rate limiting, and best practices |
| `billing` | Distributor billing: payable charges by date range, pricing breakdown, deductions, fees, taxes |
| `customers` | Customer management and the distributor > service provider > customer hierarchy |
| `subscriptions` | Subscription lifecycle, quantity changes, and license management |

## Available Commands

| Command | Description |
|---------|-------------|
| `/billing-summary` | View payable charges for a billing date range with pricing breakdown |
| `/list-customers` | List all customers under the service provider account |
| `/subscription-status` | Check subscription details and quantities for a customer |
| `/change-quantity` | Change subscription seat/license quantity |

## Quick Start

### List Your Customers

```
/list-customers
```

### Check Subscription Status

```
/subscription-status --customer "Acme Corp"
```

### View Billing Summary

```
/billing-summary
```

### Change Seat Quantity

```
/change-quantity --customer "Acme Corp" --subscription "Microsoft 365 Business Premium" --quantity 30
```

## Security Considerations

### Credentials

- Never commit Client ID, Client Secret, or Subscription Key to version control
- Keep the credentials in the Conduit connection, not in local files or environment variables
- The Client Secret is shown only once when generated -- store it securely
- Rotate credentials periodically via the Sherweb Partner Portal
- Monitor for unexpected API activity

### OAuth Tokens

- Access tokens expire after 1 hour
- The MCP server handles token lifecycle automatically
- Tokens are scoped to your service provider account

## API Rate Limits

Sherweb enforces rate limits per subscription tier. When rate limited:

- The API returns HTTP 429 with a `Retry-After` header
- Wait the specified duration before retrying
- Use pagination (`pageSize=100`) to minimize total API calls

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Open the Sherweb connection in Conduit (`https://conduit.wyre.ai/connect/sherweb`) and check the Client ID and Client Secret
2. Check that the Subscription Key on the same connection is filled in and current
3. Verify credentials have not been revoked in the Partner Portal
4. Regenerate credentials at [cumulus.sherweb.com](https://cumulus.sherweb.com) > Security > APIs, then update the Conduit connection

### Forbidden (403)

If you see "403 Forbidden":
1. Verify you are using the correct scope (service-provider vs distributor)
2. Check that your API application has the required permissions
3. Ensure you are accessing your own customers, not another service provider's

### Rate Limiting

If you see "429 Too Many Requests":
1. Check the `Retry-After` header for wait duration
2. Reduce the frequency of requests
3. Use maximum page size to reduce total calls

## API Documentation

- [Sherweb Developer Portal](https://developers.sherweb.com)
- [Sherweb Partner Portal](https://cumulus.sherweb.com)
- [Sherweb API Reference](https://developers.sherweb.com/api-reference)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-03-10)

- Initial release
- 4 skills: api-patterns, billing, customers, subscriptions
- 4 commands: billing-summary, list-customers, subscription-status, change-quantity
