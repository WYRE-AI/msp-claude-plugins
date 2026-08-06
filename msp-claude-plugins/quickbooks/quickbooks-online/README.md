# QuickBooks Online Plugin

Claude Code plugin for the QuickBooks Online (Intuit) accounting platform integration.

## Overview

This plugin provides Claude with deep knowledge of QuickBooks Online, enabling:

- **Customer Management** - Search, create, and manage MSP client records
- **Invoice Management** - Create and track invoices for managed services
- **Payment Tracking** - Record and reconcile client payments
- **Expense Management** - Track purchases and per-client costs
- **Financial Reporting** - Generate P&L, Balance Sheet, A/R Aging, and other reports

> **Note:** Intuit publishes an official `quickbooks-online-mcp-server` (early preview, sandbox only). This plugin complements that server by providing MSP-specific skills, commands, and accounting workflows on top of the QuickBooks Online v3 API.

## Prerequisites

### API Credentials

You need OAuth2 credentials from the Intuit Developer Portal:

1. Go to [developer.intuit.com](https://developer.intuit.com) and sign in
2. Navigate to **My Apps** and click **Create an app**
3. Select **QuickBooks Online and Payments**
4. Copy the **Client ID** and **Client Secret** from the Keys & credentials tab
5. Set your Redirect URI (e.g., `http://localhost:3000/callback`)
6. Complete the OAuth2 authorization flow to obtain access and refresh tokens
7. Note your **Realm ID** (Company ID) from the URL after connecting

### OAuth2 Token Management

QuickBooks Online uses OAuth2 with short-lived access tokens:

| Token | Lifetime | Notes |
|-------|----------|-------|
| Access Token | 60 minutes | Must be refreshed before expiry |
| Refresh Token | 100 days | Use to obtain new access tokens |

Use the official `intuit-oauth` npm package or `node-quickbooks` SDK to handle token refresh automatically.

### Environment Variables

Set the following environment variables:

```bash
export QBO_CLIENT_ID="your-client-id"
export QBO_CLIENT_SECRET="your-client-secret"
export QBO_REALM_ID="your-company-id"
export QBO_ACCESS_TOKEN="your-access-token"
export QBO_REFRESH_TOKEN="your-refresh-token"
export QBO_ENVIRONMENT="production"  # or "sandbox"
```

## Installation

1. Clone this plugin to your Claude plugins directory
2. Configure environment variables
3. For automated token refresh, install the SDK: `npm install node-quickbooks`

## MCP Tool Surface

The connector registers **133 tools**. Names follow
`qbo_<domain>_<operation>`. Most are generated from a per-entity config
rather than hand-written, so an entity either has an operation or it does
not — there is no near-miss spelling to guess at. Notably **invoices and
customers have no `_update`**, and `qbo_tax_codes_*`, `qbo_tax_rates_*` and
`qbo_company_info_*` are read-only.

Before granting access, read [GOVERNANCE.md](GOVERNANCE.md): Conduit
classifies only four of these tools, so everything else currently enforces
at tier `admin` — including every report.

| Domain | Operations | Tools |
|---|---|---|
| Discovery | Domain listing and credential status | `qbo_navigate`, `qbo_status` |
| `qbo_customers_*` | list, get, create, and search customers | `qbo_customers_list`, `qbo_customers_get`, `qbo_customers_create`, `qbo_customers_search` |
| `qbo_invoices_*` | list, get, create invoices and send them by email | `qbo_invoices_get`, `qbo_invoices_create`, `qbo_invoices_list`, `qbo_invoices_send` |
| `qbo_payments_*` | list, get, and create payments linked to invoices | `qbo_payments_list`, `qbo_payments_get`, `qbo_payments_create` |
| `qbo_vendors_*` | list, get, create, update, and search vendors | `qbo_vendors_list`, `qbo_vendors_get`, `qbo_vendors_create`, `qbo_vendors_update`, `qbo_vendors_search` |
| `qbo_items_*` | list, get, create, update, and search products and services | `qbo_items_list`, `qbo_items_get`, `qbo_items_create`, `qbo_items_update`, `qbo_items_search` |
| `qbo_accounts_*` | list, get, create, update, and search accounts | `qbo_accounts_list`, `qbo_accounts_get`, `qbo_accounts_create`, `qbo_accounts_update`, `qbo_accounts_search` |
| `qbo_journal_entries_*` | list, get, create, update double-entry debit/credit transactions | `qbo_journal_entries_list`, `qbo_journal_entries_get`, `qbo_journal_entries_create`, `qbo_journal_entries_update` |
| `qbo_bills_*` | list, get, create, update, and search vendor bills (accounts payable) | `qbo_bills_list`, `qbo_bills_get`, `qbo_bills_create`, `qbo_bills_update`, `qbo_bills_search` |
| `qbo_bill_payments_*` | list, get, create, and update payments against bills | `qbo_bill_payments_list`, `qbo_bill_payments_get`, `qbo_bill_payments_create`, `qbo_bill_payments_update` |
| `qbo_vendor_credits_*` | list, get, create, and update credits from vendors | `qbo_vendor_credits_list`, `qbo_vendor_credits_get`, `qbo_vendor_credits_create`, `qbo_vendor_credits_update` |
| `qbo_purchases_*` | list, get, create, update purchases paid at point of sale | `qbo_purchases_list`, `qbo_purchases_get`, `qbo_purchases_create`, `qbo_purchases_update` |
| `qbo_purchase_orders_*` | list, get, create, update non-posting POs to vendors | `qbo_purchase_orders_list`, `qbo_purchase_orders_get`, `qbo_purchase_orders_create`, `qbo_purchase_orders_update` |
| `qbo_estimates_*` | list, get, create, update quotes/proposals to customers | `qbo_estimates_list`, `qbo_estimates_get`, `qbo_estimates_create`, `qbo_estimates_update` |
| `qbo_sales_receipts_*` | list, get, create, update paid-at-sale customer transactions | `qbo_sales_receipts_list`, `qbo_sales_receipts_get`, `qbo_sales_receipts_create`, `qbo_sales_receipts_update` |
| `qbo_credit_memos_*` | list, get, create, update customer credits | `qbo_credit_memos_list`, `qbo_credit_memos_get`, `qbo_credit_memos_create`, `qbo_credit_memos_update` |
| `qbo_refund_receipts_*` | list, get, create, update cash refunds to customers | `qbo_refund_receipts_list`, `qbo_refund_receipts_get`, `qbo_refund_receipts_create`, `qbo_refund_receipts_update` |
| `qbo_deposits_*` | list, get, create, update deposits aggregating receipts | `qbo_deposits_list`, `qbo_deposits_get`, `qbo_deposits_create`, `qbo_deposits_update` |
| `qbo_transfers_*` | list, get, create, update bank-to-bank transfers | `qbo_transfers_list`, `qbo_transfers_get`, `qbo_transfers_create`, `qbo_transfers_update` |
| `qbo_time_activities_*` | list, get, create, update billable employee/vendor time | `qbo_time_activities_list`, `qbo_time_activities_get`, `qbo_time_activities_create`, `qbo_time_activities_update` |
| `qbo_classes_*` | list, get, create, update transaction classifications | `qbo_classes_list`, `qbo_classes_get`, `qbo_classes_create`, `qbo_classes_update`, `qbo_classes_search` |
| `qbo_departments_*` | list, get, create, update business locations/divisions | `qbo_departments_list`, `qbo_departments_get`, `qbo_departments_create`, `qbo_departments_update`, `qbo_departments_search` |
| `qbo_terms_*` | list, get, create, update terms like Net 30 | `qbo_terms_list`, `qbo_terms_get`, `qbo_terms_create`, `qbo_terms_update`, `qbo_terms_search` |
| `qbo_payment_methods_*` | list, get, create, update payment method choices | `qbo_payment_methods_list`, `qbo_payment_methods_get`, `qbo_payment_methods_create`, `qbo_payment_methods_update`, `qbo_payment_methods_search` |
| `qbo_tax_codes_*` | list, get, and search (read-only) | `qbo_tax_codes_list`, `qbo_tax_codes_get`, `qbo_tax_codes_search` |
| `qbo_tax_rates_*` | list, get, and search (read-only) | `qbo_tax_rates_list`, `qbo_tax_rates_get`, `qbo_tax_rates_search` |
| `qbo_employees_*` | list, get, create, update, and search employees | `qbo_employees_list`, `qbo_employees_get`, `qbo_employees_create`, `qbo_employees_update`, `qbo_employees_search` |
| `qbo_company_info_*` | get this QBO realm's company profile (read-only) | `qbo_company_info_list`, `qbo_company_info_get` |
| `qbo_attachables_*` | list, get, create, update attachment metadata, and upload files on transactions | `qbo_attachables_list`, `qbo_attachables_get`, `qbo_attachables_create`, `qbo_attachables_update`, `qbo_attachables_upload` |
| `qbo_expenses_*` | List and view purchases and bills (legacy naming, kept for compatibility) | `qbo_expenses_list_purchases`, `qbo_expenses_list_bills`, `qbo_expenses_get_purchase`, `qbo_expenses_get_bill` |
| `qbo_reports_*` | Financial reports | `qbo_reports_profit_and_loss`, `qbo_reports_balance_sheet`, `qbo_reports_aged_receivables`, `qbo_reports_aged_payables`, `qbo_reports_customer_sales`, `qbo_reports_cash_flow`, `qbo_reports_trial_balance`, `qbo_reports_general_ledger`, `qbo_reports_customer_balance`, `qbo_reports_vendor_expenses` |

Two behaviours are worth knowing before an agent calls anything here:

- `qbo_customers_list` and `qbo_invoices_list` **elicit** when called with
  no arguments — they prompt for a search term or date range rather than
  returning the whole book. Pass explicit pagination arguments when you
  want a deterministic sweep.
- Every `_update` is a sparse update requiring both the record `Id` and
  its current `SyncToken`, which must be read immediately beforehand.

## Available Skills

| Skill | Description |
|-------|-------------|
| `api-patterns` | QuickBooks Online API patterns, OAuth2, query language, and best practices |
| `customers` | Customer (client) management for MSP accounts |
| `invoices` | Invoice creation and management for managed services |
| `expenses` | Purchase and expense tracking per client |
| `payments` | Payment recording, application, and reconciliation |
| `reports` | Financial reports -- P&L, Balance Sheet, A/R Aging, and more |

## Available Commands

| Command | Description |
|---------|-------------|
| `/create-invoice` | Create an invoice for a client's managed services |
| `/search-customers` | Find a customer by name or other criteria |
| `/get-balance` | View outstanding balances across all MSP clients |
| `/expense-summary` | Summarize expenses by client, vendor, or date range |

## Quick Start

### Search for a Customer

```
/search-customers "Acme"
```

### Create an Invoice

```
/create-invoice --customer "Acme Corp" --line "Monthly IT Services" --amount 2500
```

### Get Outstanding Balances

```
/get-balance
```

### View Expense Summary

```
/expense-summary --from 2026-01-01 --to 2026-01-31
```

## Security Considerations

### Token Security

- Never commit OAuth tokens or client secrets to version control
- Use environment variables or a secure vault for all credentials
- Implement automatic token refresh to avoid manual re-authorization
- Rotate client secrets periodically via the Intuit Developer Portal
- Access tokens expire after 60 minutes; always use refresh tokens

### API Permissions

- OAuth scopes control what your app can access (e.g., `com.intuit.quickbooks.accounting`)
- Use the minimum required scopes for your workflows
- Review connected apps regularly in the Intuit Developer Portal

## API Rate Limits

QuickBooks Online enforces the following rate limits:

| Metric | Limit |
|--------|-------|
| Requests per minute | 500 |
| Concurrent requests | 40 |
| Requests per second per user | 10 |

The plugin handles rate limiting with exponential backoff. If you hit limits, reduce request frequency and batch operations where possible.

## Troubleshooting

### Authentication Errors

If you see "AuthenticationFailed" or 401 errors:
1. Verify `QBO_ACCESS_TOKEN` is current (tokens expire after 60 minutes)
2. Use the refresh token to obtain a new access token
3. Confirm `QBO_CLIENT_ID` and `QBO_CLIENT_SECRET` are correct
4. Check that OAuth scopes include `com.intuit.quickbooks.accounting`

### Invalid Realm ID

If you see "Invalid Company ID" or entity-not-found errors:
1. Verify `QBO_REALM_ID` matches your QuickBooks company
2. The Realm ID is the numeric ID shown in the QBO URL after login
3. Ensure the OAuth token was issued for this specific company

### Rate Limiting

If you see 429 or "ThrottleExceeded" errors:
1. Wait at least 60 seconds before retrying
2. Reduce request frequency to stay under 500/minute
3. Batch queries using the Intuit query language instead of individual lookups

### Sandbox vs Production

If data looks wrong or requests fail unexpectedly:
1. Check `QBO_ENVIRONMENT` -- ensure you are hitting the correct base URL
2. Sandbox: `https://sandbox-quickbooks.api.intuit.com/v3/company/{realmId}/`
3. Production: `https://quickbooks.api.intuit.com/v3/company/{realmId}/`

## API Documentation

- [QuickBooks Online API Reference](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [Intuit OAuth2 Documentation](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization)
- [Intuit Developer Portal](https://developer.intuit.com)
- [node-quickbooks SDK](https://www.npmjs.com/package/node-quickbooks)
- [intuit-oauth SDK](https://www.npmjs.com/package/intuit-oauth)
- [QuickBooks Online MCP Server (early preview)](https://github.com/anthropics/quickbooks-online-mcp-server)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 0.1.0 (2026-02-23)

- Initial release
- 6 skills: api-patterns, customers, invoices, expenses, payments, reports
- 4 commands: create-invoice, search-customers, get-balance, expense-summary
