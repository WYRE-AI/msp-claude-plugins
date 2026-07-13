---
name: "Sherweb API Patterns"
description: >
  Use this skill when working with the Sherweb API and MCP tools -
  OAuth 2.0 client credentials authentication, token management, API
  endpoints, subscription key header, rate limits, error codes, scopes,
  Accept-Language support, and best practices.
when_to_use: >-
  When working with OAuth 2.0 client credentials authentication, token management, API endpoints,
  subscription key header, rate limits, error codes, scopes, Accept-Language support. Use when:
  sherweb api, sherweb authentication, sherweb oauth, sherweb token, sherweb endpoint, sherweb
  rate limit, sherweb mcp, sherweb request, sherweb scope, sherweb subscription key, sherweb
  error, or sherweb connection.
---

# Sherweb API Patterns & MCP Tools

## Overview

The Sherweb Partner API provides programmatic access to distributor-level operations including customer management, subscription lifecycle, and billing data. The API uses OAuth 2.0 client credentials flow for authentication, requires a subscription key header for API management, and exposes two main scopes: distributor and service-provider. This skill covers authentication, endpoints, MCP tool usage, error handling, and best practices.

## Authentication

### OAuth 2.0 Client Credentials Flow

Sherweb uses the OAuth 2.0 client credentials grant for machine-to-machine authentication. No user interaction is required.

**Token Endpoint:**

```
POST https://api.sherweb.com/auth/oidc/connect/token
```

**Request Parameters:**

| Parameter | Value |
|-----------|-------|
| `grant_type` | `client_credentials` |
| `client_id` | Your Sherweb Client ID |
| `client_secret` | Your Sherweb Client Secret |
| `scope` | `distributor` or `service-provider` (see Scopes section) |

**Token Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Key details:**

- Tokens expire after **1 hour** (3600 seconds)
- Cache the token and reuse it until near expiry
- Request a new token 5 minutes before expiry to avoid gaps
- The token is sent as a Bearer token in the `Authorization` header

### Subscription Key

In addition to the Bearer token, every API request must include the API management subscription key:

| Header | Value | Description |
|--------|-------|-------------|
| `Ocp-Apim-Subscription-Key` | Your subscription key | API management gateway key |

This key is obtained from the Sherweb Partner Portal (cumulus.sherweb.com) under **Security > APIs**.

### Required Headers

Every API request must include:

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <access_token>` |
| `Ocp-Apim-Subscription-Key` | `<subscription_key>` |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

### Environment Variables

```bash
export SHERWEB_CLIENT_ID="your-client-id"
export SHERWEB_CLIENT_SECRET="your-client-secret"
export SHERWEB_SUBSCRIPTION_KEY="your-subscription-key"
export SHERWEB_MCP_URL="https://your-sherweb-mcp-url"
```

### Obtaining Credentials

1. Log into the Sherweb Partner Portal at [cumulus.sherweb.com](https://cumulus.sherweb.com)
2. Navigate to **Security > APIs**
3. Create a new API application or manage existing credentials
4. Note your Client ID, Client Secret, and Subscription Key
5. Store these securely -- the Client Secret is shown only once

## Scopes

Sherweb supports two API scopes that control the level of access:

| Scope | Description | Base URL |
|-------|-------------|----------|
| `distributor` | Full distributor-level access to all service providers and their customers | `https://api.sherweb.com/distributor/v1` |
| `service-provider` | Scoped to a single service provider (MSP) and their customers | `https://api.sherweb.com/service-provider/v1` |

### Scope Selection

- **Most MSPs use `service-provider` scope** - This gives access to your own customers and subscriptions
- **Distributor scope** is for organizations that manage multiple service providers (e.g., master agents, holding companies)
- The scope is specified when requesting the OAuth token, not per-request

## API Endpoints

### Base URLs

| Scope | Base URL |
|-------|----------|
| Distributor | `https://api.sherweb.com/distributor/v1` |
| Service Provider | `https://api.sherweb.com/service-provider/v1` |

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/customers` | GET | List customers |
| `/customers/{id}` | GET | Get customer details |
| `/customers/{id}/accounts-receivable` | GET | Customer AR data |
| `/subscriptions` | GET | List subscriptions |
| `/subscriptions/{id}` | GET | Get subscription details |
| `/subscriptions/{id}/quantity` | PATCH | Change subscription quantity |
| `/billing/periods` | GET | List billing periods |
| `/billing/periods/{id}/charges` | GET | Get payable charges |
| `/billing/invoices` | GET | List invoices |
| `/billing/invoices/{id}` | GET | Get invoice details |

## MCP Tool Reference

### Customer Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `sherweb_customers_list` | List and search customers | `page`, `pageSize`, `search` |
| `sherweb_customers_get` | Get a single customer | `customerId` (required) |
| `sherweb_customers_get_accounts_receivable` | Get customer AR data | `customerId` (required) |

### Subscription Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `sherweb_subscriptions_list` | List subscriptions with filters | `customerId`, `page`, `pageSize`, `status` |
| `sherweb_subscriptions_get` | Get a single subscription | `subscriptionId` (required) |
| `sherweb_subscriptions_change_quantity` | Modify seat count | `subscriptionId` (required), `quantity` (required) |

### Billing Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `sherweb_billing_get_billing_periods` | List billing periods | `page`, `pageSize` |
| `sherweb_billing_get_payable_charges` | Get charges for a period | `billingPeriodId` (required), `page`, `pageSize` |
| `sherweb_billing_get_charge_details` | Get charge breakdown | `chargeId` (required) |
| `sherweb_billing_get_invoices` | List invoices | `page`, `pageSize`, `status` |
| `sherweb_billing_get_invoice_details` | Get invoice details | `invoiceId` (required) |

## Pagination

### Page-Based Pagination

All list endpoints use 1-based page pagination:

| Parameter | Description | Default | Max |
|-----------|-------------|---------|-----|
| `page` | Page number (1-based) | 1 | - |
| `pageSize` | Results per page | 25 | 100 |

**Pagination Response Metadata:**

| Field | Description |
|-------|-------------|
| `page` | Current page number |
| `pageSize` | Number of results per page |
| `totalCount` | Total number of records |
| `totalPages` | Total number of pages |

### Iterating Through All Pages

1. Call the endpoint with `page=1` and `pageSize=100`
2. Check `totalPages` in the response
3. If more pages exist, increment `page` and call again
4. Continue until `page >= totalPages`
5. Collect results from each response

## Accept-Language Support

The Sherweb API supports localized responses via the `Accept-Language` header:

| Header | Values | Description |
|--------|--------|-------------|
| `Accept-Language` | `en`, `fr` | Response language (English or French) |

This is particularly useful since Sherweb is a Canadian company with bilingual support. Product names, descriptions, and error messages can be returned in either language.

## Token Caching

### Token Lifecycle

```
Request Token --> Cache Token --> Use Token (up to 1 hour) --> Refresh Token
                                        |
                              Refresh 5 min before expiry
```

**Caching strategy:**

1. Request a token on first API call
2. Store the token and its expiry time (`current_time + expires_in`)
3. Reuse the cached token for all subsequent requests
4. When the token is within 5 minutes of expiry, request a new one
5. Never request a new token for every API call -- this wastes quota and adds latency

## Rate Limits

### Rate Limit Details

| Metric | Limit |
|--------|-------|
| Requests per second | Varies by endpoint |
| Requests per minute | Varies by subscription tier |

When rate limited, the API returns a `429 Too Many Requests` response with:

| Header | Description |
|--------|-------------|
| `Retry-After` | Seconds to wait before retrying |

**Rate limit strategy:**

1. Implement exponential backoff on 429 responses
2. Respect the `Retry-After` header when present
3. Batch related operations to reduce total API calls
4. Use maximum `pageSize=100` to minimize pagination requests

## Error Handling

### HTTP Status Codes

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Process response |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Token expired or invalid; re-authenticate |
| 403 | Forbidden | Insufficient scope or permissions |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Conflicting operation (e.g., pending change) |
| 429 | Too Many Requests | Rate limited; wait and retry |
| 500 | Internal Server Error | Sherweb server issue; retry with backoff |
| 503 | Service Unavailable | Temporary outage; retry later |

### Common Error Responses

**Authentication Error (401):**

```json
{
  "error": "invalid_token",
  "error_description": "The access token has expired"
}
```

**Validation Error (400):**

```json
{
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}
```

**Rate Limit (429):**

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Retry after 30 seconds."
}
```

### Troubleshooting

1. **401 Unauthorized** - Token expired. Request a new token from the token endpoint
2. **403 Forbidden** - Wrong scope. Verify you requested the correct scope (distributor vs service-provider)
3. **Missing subscription key** - Ensure `Ocp-Apim-Subscription-Key` header is set
4. **Token request fails** - Verify Client ID and Client Secret are correct
5. **404 Not Found** - Verify the resource ID exists and you have access to it
6. **Test connectivity** - Call `GET /customers?pageSize=1` to verify authentication works

## Best Practices

1. **Cache tokens** - Reuse OAuth tokens for their full 1-hour lifetime; never request a new token per call
2. **Use maximum page size** - Set `pageSize=100` to minimize total API calls when fetching all records
3. **Filter server-side** - Use query parameters to narrow results rather than fetching everything
4. **Handle rate limits gracefully** - Implement exponential backoff with jitter on 429 responses
5. **Use the correct scope** - Most MSPs should use `service-provider` scope, not `distributor`
6. **Include subscription key** - Every request needs the `Ocp-Apim-Subscription-Key` header
7. **Set Accept-Language** - Include `Accept-Language: en` (or `fr`) for consistent response language
8. **Monitor token expiry** - Proactively refresh tokens before they expire to avoid 401 errors
9. **Log API errors** - Capture error responses for debugging and support cases
10. **Use HTTPS only** - All Sherweb API endpoints require TLS; never use HTTP

## Related Skills

- [Sherweb Billing](../billing/SKILL.md) - Billing charges and invoices
- [Sherweb Customers](../customers/SKILL.md) - Customer management
- [Sherweb Subscriptions](../subscriptions/SKILL.md) - Subscription lifecycle
