# Sherweb Plugin

Claude Code plugin for the Sherweb Partner API distribution platform integration.

## Overview

This plugin provides Claude with deep knowledge of Sherweb, enabling:

- **Customer Management** - List and manage customers in the Sherweb distributor platform
- **Subscription Lifecycle** - View subscriptions, change seat quantities, and monitor provisioning status
- **Distributor Billing** - Analyze payable charges, pricing breakdowns, deductions, fees, and taxes. Charges are fetched by explicit date range; there is no billing-period list and no invoice retrieval — see [GOVERNANCE.md](GOVERNANCE.md)
- **API Patterns** - OAuth 2.0 client credentials flow, subscription key authentication, rate limiting, and error handling

## Prerequisites

### API Credentials

Sherweb uses OAuth 2.0 client credentials for API authentication, plus an API management subscription key:

1. Log into the Sherweb Partner Portal at [cumulus.sherweb.com](https://cumulus.sherweb.com)
2. Navigate to **Security > APIs**
3. Create a new API application or manage existing credentials
4. Note your Client ID, Client Secret, and Subscription Key

### Environment Variables

```bash
export SHERWEB_CLIENT_ID="your-client-id"
export SHERWEB_CLIENT_SECRET="your-client-secret"
export SHERWEB_SUBSCRIPTION_KEY="your-subscription-key"
export SHERWEB_MCP_URL="https://your-sherweb-mcp-url"
```

## Installation

### Via MCP Gateway (Recommended)

Use the [MCP Gateway](https://conduit.wyre.ai) to connect -- configure your Sherweb credentials and you're done.

### Self-Hosted

Add to your Claude Desktop or Claude Code MCP config:

```json
{
  "mcpServers": {
    "sherweb": {
      "type": "http",
      "url": "${SHERWEB_MCP_URL}",
      "headers": {
        "X-Sherweb-Client-Id": "${SHERWEB_CLIENT_ID}",
        "X-Sherweb-Client-Secret": "${SHERWEB_CLIENT_SECRET}",
        "X-Sherweb-Subscription-Key": "${SHERWEB_SUBSCRIPTION_KEY}"
      }
    }
  }
}
```

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
- Use environment variables for all credentials
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
1. Verify `SHERWEB_CLIENT_ID` and `SHERWEB_CLIENT_SECRET` are correct
2. Check that the Subscription Key (`SHERWEB_SUBSCRIPTION_KEY`) is included
3. Verify credentials have not been revoked in the Partner Portal
4. Regenerate credentials at [cumulus.sherweb.com](https://cumulus.sherweb.com) > Security > APIs

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
