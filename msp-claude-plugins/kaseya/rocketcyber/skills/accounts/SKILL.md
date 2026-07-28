---
name: "RocketCyber Accounts"
description: >
  RocketCyber's provider/customer account hierarchy: sub-account navigation,
  account CRUD operations, account settings, security policy configuration,
  and multi-tenant MSP patterns.
when_to_use: >-
  When working with RocketCyber accounts. Use when: rocketcyber account, rocketcyber customer,
  rocketcyber provider, rocketcyber tenant, rocketcyber organization, account hierarchy
  rocketcyber, rocketcyber sub-account, or rocketcyber client.
---

# RocketCyber Account Management

## Overview

RocketCyber uses a hierarchical account model designed for MSPs. The provider account (your MSP) contains multiple customer sub-accounts, each representing a managed client. All API operations can be scoped to a specific customer account using the `accountId` parameter.

Understanding the account hierarchy is essential for:

- **Scoping API queries** to specific customers
- **Managing security policies** per customer
- **Reporting** at both provider and customer levels
- **Agent deployment** to the correct customer account

## Key Concepts

### Account Hierarchy

```
┌─────────────────────────────────────┐
│  Provider Account (MSP)             │
│  - API key is scoped here           │
│  - Provider-level reporting         │
│  - Global security policies         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Customer Account: Acme Corp  │  │
│  │  - accountId: 12345          │  │
│  │  - Agents, Incidents, Apps   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Customer Account: Beta LLC   │  │
│  │  - accountId: 12346          │  │
│  │  - Agents, Incidents, Apps   │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Customer Account: Gamma Inc  │  │
│  │  - accountId: 12347          │  │
│  │  - Agents, Incidents, Apps   │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Account Types

| Type | Description |
|------|-------------|
| **Provider** | The MSP's top-level account; owns the API key |
| **Customer** | A managed client account under the provider |

### Account Status

| Status | Description |
|--------|-------------|
| **Active** | Account is fully operational |
| **Inactive** | Account is disabled or suspended (verify against API docs) |

## Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique account identifier |
| `name` | string | Account display name |
| `type` | string | Account type: provider, customer |
| `status` | string | Account status: active, inactive (verify against API docs) |
| `parentId` | integer | Provider account ID (for customer accounts, verify against API docs) |
| `createdAt` | datetime | When the account was created (verify against API docs) |
| `agentCount` | integer | Number of deployed agents (verify against API docs) |
| `settings` | object | Account-level configuration (verify against API docs) |

> **Note:** Field names are inferred from the Celerium PowerShell wrapper. Verify exact field names against RocketCyber API responses.

## API Patterns

### List All Accounts

```bash
# All customer accounts under the provider
curl -s "https://api-${ROCKETCYBER_REGION:-us}.rocketcyber.com/v3/accounts" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "data": [
    {
      "id": 12345,
      "name": "Acme Corporation",
      "type": "customer",
      "status": "active"
    },
    {
      "id": 12346,
      "name": "Beta LLC",
      "type": "customer",
      "status": "active"
    }
  ],
  "totalCount": 45,
  "page": 1,
  "limit": 50
}
```

### Get Account by ID

```bash
# Single account details
curl -s "https://api-us.rocketcyber.com/v3/accounts/12345" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}"
```

**Response (verify against API docs):**
```json
{
  "id": 12345,
  "name": "Acme Corporation",
  "type": "customer",
  "status": "active",
  "createdAt": "2024-03-15T10:00:00Z",
  "agentCount": 47
}
```

### Search Accounts by Name

The API may not support direct name search. To find an account by name:

```bash
# List all accounts and filter client-side
curl -s "https://api-us.rocketcyber.com/v3/accounts?limit=500" \
  -H "Authorization: Bearer ${ROCKETCYBER_API_KEY}" \
  | jq '.data[] | select(.name | test("acme"; "i"))'
```

## Common Workflows

### Account Inventory

1. **List all accounts** to get the full customer roster
2. **For each account**, query agent count and incident count
3. **Identify accounts** with no agents (coverage gaps)
4. **Flag accounts** with high incident counts for review

### New Customer Setup

1. **Create the customer account** in the RocketCyber web console (verify if API supports account creation)
2. **Note the account ID** from the response or web UI
3. **Deploy agents** to all customer endpoints using the account-specific installer
4. **Verify agent check-in** by querying `/agents?accountId={id}`
5. **Configure security policies** as needed for the customer

### Account-Level Security Posture

For a given customer account:

1. Query `/accounts/{id}` for account details
2. Query `/agents?accountId={id}` for agent deployment status
3. Query `/incidents?accountId={id}&status=open` for active threats
4. Query `/apps?accountId={id}` for application inventory
5. Aggregate into a security posture score or report

### Provider-Level Dashboard

1. List all accounts
2. For each account, collect:
   - Total agents (online vs offline)
   - Open incidents by severity
   - Recent incidents in the last 24 hours
3. Sort accounts by risk (most open critical/high incidents first)
4. Flag accounts with offline agents or unreviewed incidents

## Error Handling

### Common Errors

| Scenario | HTTP Code | Resolution |
|----------|-----------|------------|
| Invalid API key | 401 | Verify key in Provider Settings > API |
| Account not found | 404 | Verify account ID; account may have been removed |
| No accounts returned | 200 (empty) | Provider account may not have any customers yet |
| Rate limited | 429 | Back off 30 seconds, retry |

### Account Not Found

```
Account not found: ID 99999

The account may have been removed or the ID is incorrect.
List all accounts with GET /v3/accounts to find valid account IDs.
```

## Related Skills

- [api-patterns](../api-patterns/SKILL.md) - Authentication, pagination, error handling
- [incidents](../incidents/SKILL.md) - Incidents scoped to accounts
- [agents](../agents/SKILL.md) - Agents deployed per account
- [apps](../apps/SKILL.md) - Applications inventoried per account
