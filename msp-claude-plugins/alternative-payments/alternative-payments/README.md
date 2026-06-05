# Alternative Payments Plugin

Claude Code plugin for the [Alternative Payments](https://www.alternativepayments.io/)
B2B payments platform integration.

## Overview

This plugin provides Claude with deep knowledge of Alternative Payments, enabling:

- **Customer Management** - List, retrieve, create, and archive customers and manage their users
- **Invoicing** - Create and manage invoices with line items, and generate hosted payment links and PDFs
- **Hosted Payment Requests** - Create standalone hosted payment links the customer chooses to pay
- **Transactions** - Read and filter individual payment records
- **Payouts** - List payouts and reconcile the transactions that compose them
- **Reconciliation** - Match transactions to invoices and customers and trace deposits

## Capability Posture: Read + Safe Writes

This integration exposes a **read + safe-write** surface. It deliberately does
**not** implement direct payment creation (`POST /payments`), which would charge a
card or bank account. **Money movement is out of scope.** To collect from a
customer, the plugin generates a hosted payment link or payment request — a URL
the customer chooses to pay. No command or agent in this plugin charges a card.

## Prerequisites

### API Credentials

Alternative Payments uses **OAuth 2.0 client-credentials**. Generate an API key
in the Partner Dashboard:

1. Log into the Alternative Payments Partner Dashboard
2. Create an API key — you will receive a **Client ID** and **Client Secret**
3. Note whether the key is for the **production** or **demo** environment

The client credentials are exchanged for a short-lived bearer token at
`POST /oauth/token` (HTTP Basic auth, body `grant_type=client_credentials`). See
the [API Patterns](skills/api-patterns/SKILL.md) skill for the full token flow.

### Environment Variables

Set the following environment variables:

```bash
export AP_CLIENT_ID="your-client-id"
export AP_CLIENT_SECRET="your-client-secret"
export AP_ENVIRONMENT="production"   # or "demo"
```

| Variable | Description |
|----------|-------------|
| `AP_CLIENT_ID` | OAuth2 client id from the Partner Dashboard |
| `AP_CLIENT_SECRET` | OAuth2 client secret |
| `AP_ENVIRONMENT` | `production` or `demo` (selects the base URL) |

### Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://public-api.alternativepayments.io` |
| Demo | `https://public-api.demo.alternativepayments.io` |

## Available Skills

| Skill | Description |
|-------|-------------|
| `customers` | Customer and customer-user management (list, get, create, archive) |
| `invoicing` | Invoices with line items, hosted payment links/PDFs, and payment requests |
| `payments` | Read-only transactions and payouts, and payout reconciliation |
| `api-patterns` | OAuth2 auth, cursor pagination, rate limiting, and the capability posture |

## Available Agents

| Agent | Description |
|-------|-------------|
| `payment-reconciler` | Reconciles payouts, matches transactions to invoices, surfaces overdue receivables, and flags failed/declined transactions — read-only, never charges |

## Available Commands

| Command | Description |
|---------|-------------|
| `/list-overdue-invoices` | List open/overdue invoices and optionally generate hosted payment links |
| `/reconcile-payout` | Reconcile a payout's transactions against invoices and customers |

## Destructive Operations

Three operations are destructive and **require confirmation before running**:

| Operation | Endpoint | Effect |
|-----------|----------|--------|
| Archive customer | `DELETE /customers/{id}` | Archives a customer (hidden from default lists) |
| Archive invoice | `DELETE /invoices/{id}` | Archives an invoice |
| Delete webhook | `DELETE /webhooks/{id}` | Removes a webhook subscription |

Always confirm with the operator before performing any of these.

## Quick Start

### List Overdue Invoices

```
/list-overdue-invoices
```

### Generate Payment Links for Overdue Invoices

```
/list-overdue-invoices --with_links true
```

### Reconcile a Payout

```
/reconcile-payout po_2026_06_15
```

## Security Considerations

### OAuth2 Credentials

- Never commit client secrets to version control
- Use environment variables for all credentials
- Rotate client secrets periodically via the Partner Dashboard
- Use the minimum required scopes (`payments:read`, and `payments:write` only when creating or archiving)

### Financial Data

- Treat all customer, invoice, transaction, and payout data as sensitive
- Restrict API access to authorized personnel only
- Confirm destructive operations (archive customer/invoice, delete webhook) before running
- This integration cannot move money — collection happens via hosted links the customer chooses to pay

## API Rate Limits

Alternative Payments enforces a rate limit of **5 requests per second** per API
key. On `429`, back off and respect the `Retry-After` header. Use a token-bucket
limiter to stay under the cap proactively, and paginate large lists with cursors
(`limit` + `after`/`cursor`, looping on `has_more` / `next_cursor`).

## Troubleshooting

### Authentication Errors

If you see "401 Unauthorized":
1. Verify `AP_CLIENT_ID` and `AP_CLIENT_SECRET` are set correctly
2. Confirm `AP_ENVIRONMENT` matches the environment the credentials belong to
3. Re-mint the bearer token — tokens are short-lived and may have expired or been revoked

### Rate Limiting

If you see "429 Too Many Requests":
1. Stay under 5 requests/second
2. Respect the `Retry-After` header
3. Use cursor pagination for large data sets

### Validation Errors

If you see "400 Bad Request" or "422" with validation errors:
1. Check required fields (e.g. invoices need `customer_id`, `currency`, `due_date`, and a non-empty `line_items[]`; payment requests need `amount`, `currency`, `redirect_url`)
2. Verify referenced entities (customers, invoices) exist
3. Review the `errors` array in the response body for specific field errors

## API Documentation

- [Alternative Payments](https://www.alternativepayments.io/)

## Contributing

See the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

All contributions require a PRD in the `prd/` directory before implementation.

## Changelog

### 1.0.0

- Initial release
- 4 skills: customers, invoicing, payments, api-patterns
- 1 agent: payment-reconciler
- 2 commands: list-overdue-invoices, reconcile-payout
- Read + safe-write posture: no direct payment creation; collection via hosted links
