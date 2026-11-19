# Xero Plugin

Claude Code plugin for the Xero accounting platform integration.

## Overview

This plugin provides Claude with deep knowledge of Xero, enabling:

- **Contact Management** - Find and manage customers, suppliers, and client organizations
- **Invoice Management** - Create, search, and manage sales invoices (ACCREC) and bills (ACCPAY)
- **Payment Tracking** - Record payments, track outstanding balances, and reconcile accounts
- **Chart of Accounts** - Navigate and manage the chart of accounts for proper GL coding
- **Financial Reporting** - Generate P&L, Balance Sheet, Aged Receivables, Aged Payables, and Trial Balance reports

## Prerequisites

### API Credentials

You need a Xero Custom Connection (OAuth2 machine-to-machine):

1. Log into the [Xero Developer Portal](https://developer.xero.com/app/manage)
2. Click **New app** and select **Custom connection**
3. Give it a name (e.g., "MSP Claude Integration") and agree to terms
4. Under **Configuration**, add the required scopes: `accounting.transactions`, `accounting.contacts`, `accounting.reports.read`, `accounting.settings`
5. Under **OAuth 2.0 credentials**, copy the **Client ID** and generate a **Client Secret**
6. Connect the app to your Xero organization and authorize it
7. Note your **Tenant ID** from the organization connection

### Environment Variables

Set the following environment variables:

```bash
export XERO_CLIENT_ID="your-client-id"
export XERO_CLIENT_SECRET="your-client-secret"
export XERO_TENANT_ID="your-tenant-id"
```

## Installation

```
/plugin install xero --marketplace WYRE-AI/msp-claude-plugins
```

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. Optionally install the official MCP server for direct API access: `npm install -g @xeroapi/xero-mcp-server`

**Note:** The official Xero MCP server (`@xeroapi/xero-mcp-server` v0.0.14) provides raw API access. This plugin adds MSP-specific skills, workflows, and commands on top of that foundation.

## Available Skills

| Skill | Description |
|-------|-------------|
| `contacts` | Customer and supplier contact management |
| `invoices` | Sales invoice (ACCREC) and bill (ACCPAY) management |
| `payments` | Payment recording, tracking, and allocation |
| `accounts` | Chart of accounts navigation and GL coding |
| `reports` | Financial reporting (P&L, Balance Sheet, Aged Receivables/Payables) |
| `api-patterns` | Xero API patterns, OAuth2 auth, and best practices |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-invoice` | Create a sales invoice for a managed services client |
| `/search-contacts` | Find a contact by name, email, or account number |
| `/payment-status` | Check payment status and outstanding balances for a client |
| `/reconciliation-summary` | Verify all MSP clients have been billed for the current period |

## Quick Start

### Create an Invoice

```
/create-invoice "Acme Corp" --description "Monthly Managed Services - March 2026" --amount 2500.00
```

### Search for a Contact

```
/search-contacts "Acme"
```

### Check Payment Status

```
/payment-status "Acme Corp"
```

### Run Reconciliation Summary

```
/reconciliation-summary --period "2026-03"
```

## Security Considerations

### OAuth2 Credentials

- Never commit client secrets to version control
- Use environment variables for all credentials
- Rotate client secrets periodically via the Xero Developer Portal
- Use minimum required OAuth scopes
- Custom Connections are limited to a single organization

### Financial Data

- All financial data access is logged
- Restrict API access to authorized personnel only
- Review API access logs regularly
- Be cautious with payment and invoice creation operations

## API Rate Limits

Xero enforces rate limits:

- 60 API calls per minute per app
- 5,000 API calls per day per app

The plugin handles rate limiting with exponential backoff. Plan bulk operations accordingly.

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `XERO_CLIENT_ID` and `XERO_CLIENT_SECRET` are set correctly
2. Ensure the Custom Connection is still authorized in the Xero Developer Portal
3. Check that OAuth scopes include the required permissions
4. Confirm the access token has not expired (tokens last 30 minutes)

### Tenant ID Errors

If you see "403 Forbidden" or "Tenant not found":
1. Verify `XERO_TENANT_ID` matches the connected organization
2. Ensure the Custom Connection is authorized for that organization
3. Re-authorize the connection in the Xero Developer Portal if needed

### Rate Limiting

If you see "429 Too Many Requests":
1. Wait for the rate limit window to reset (1 minute)
2. Reduce the frequency of requests
3. Use pagination for large data sets
4. Check the `Retry-After` header for the wait duration

### Validation Errors

If you see "400 Bad Request" with validation errors:
1. Check required fields (ContactID for invoices, AccountCode for line items)
2. Verify date formats use `YYYY-MM-DDT00:00:00`
3. Ensure referenced entities (contacts, accounts) exist
4. Review the error array in the response body for specific field errors

## API Documentation

- [Xero API Reference](https://developer.xero.com/documentation/api/accounting/overview)
- [Xero Developer Portal](https://developer.xero.com/)
- [Xero OAuth2 Documentation](https://developer.xero.com/documentation/guides/oauth2/custom-connections)
- [Xero MCP Server](https://www.npmjs.com/package/@xeroapi/xero-mcp-server)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-23)

- Initial release
- 6 skills: contacts, invoices, payments, accounts, reports, api-patterns
- 4 commands: create-invoice, search-contacts, payment-status, reconciliation-summary
