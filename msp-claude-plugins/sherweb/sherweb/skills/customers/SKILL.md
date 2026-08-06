---
name: "Sherweb Customers"
description: >
  Sherweb customer records: the distributor > service provider > customer
  hierarchy and its API scoping consequences, customer lifecycle stages, core
  address and contact fields, accounts-receivable data with aging buckets, and
  cross-referencing customers with PSA, subscription, and billing data.
when_to_use: >-
  When looking up Sherweb customers, their details, or their accounts-receivable
  standing. Use when: sherweb customer, sherweb client, sherweb organization, sherweb
  account, sherweb customer list, sherweb customer details, sherweb accounts
  receivable, sherweb hierarchy, sherweb service provider, or sherweb distributor.
---

# Sherweb Customer Management

## Overview

Customers in Sherweb represent the end-client organizations managed by a service provider (MSP) through the Sherweb distribution platform. Sherweb uses a three-tier hierarchy: **Distributor** (Sherweb) > **Service Provider** (your MSP) > **Customer** (your clients). Every subscription, billing charge, and provisioning action is scoped to a specific customer. Understanding this hierarchy is essential for correct API usage and data interpretation.

## Anti-triggers

- **The same client in the other CSP marketplace** — use
  `pax8-companies`; Sherweb and Pax8 customer IDs are unrelated, so
  matching is by name or domain, never by ID.
- **The client record of record** — a Sherweb customer exists to hang
  licence purchases off. Contracts, contacts, and service history live in
  the PSA; use `autotask-crm`, `connectwise-psa-companies`, or
  `halopsa-clients`.
- **The Microsoft tenant behind the licences** — a Sherweb customer is a
  billing entity, not a tenant. Use `cipp-tenants` or `m365-users`.
- **The client's documentation record** — use `hudu-companies`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `sherweb_customers_list` | List all customers under the service provider | `page`, `pageSize`, `search` |
| `sherweb_customers_get` | Get detailed information about a specific customer | `customerId` (required) |
| `sherweb_customers_accounts_receivable` | Get accounts receivable data for a customer | `customerId` (required) |

### List Customers

Call `sherweb_customers_list` with optional parameters:

- **Search by name:** Set `search` to a customer name or partial name
- **Paginate:** Set `page` (1-based) and `pageSize` (default 25)

**Example: List all customers:**
- `sherweb_customers_list` with `pageSize=100`

**Example: Search for a customer:**
- `sherweb_customers_list` with `search=Acme`

### Get Customer Details

Call `sherweb_customers_get` with the `customerId` parameter.

**Example:**
- `sherweb_customers_get` with `customerId=cust-abc-123`

### Get Accounts Receivable

Call `sherweb_customers_accounts_receivable` with the `customerId` parameter to view outstanding balances and payment history.

**Example:**
- `sherweb_customers_accounts_receivable` with `customerId=cust-abc-123`

## Key Concepts

### Distribution Hierarchy

Sherweb operates a three-tier distribution model:

```
Sherweb (Distributor)
  |
  +-- Your MSP (Service Provider)
  |     |
  |     +-- Customer A (End Client)
  |     +-- Customer B (End Client)
  |     +-- Customer C (End Client)
  |
  +-- Another MSP (Service Provider)
        |
        +-- Customer D (End Client)
        +-- Customer E (End Client)
```

**Key points:**

- **Distributor** - Sherweb aggregates vendor products and provides them to service providers
- **Service Provider** - Your MSP account, authenticated via the API. All API calls are scoped to your service provider account
- **Customer** - Your end clients. Each customer has their own subscriptions, billing, and configuration
- API credentials are tied to the **Service Provider** level; you can only see your own customers

### Customer Lifecycle

| Stage | Description | Typical Actions |
|-------|-------------|-----------------|
| Creation | New client added to Sherweb | Set up customer record with name, address, contact info |
| Active | Customer with active subscriptions | Manage subscriptions, monitor billing |
| Suspended | Customer account temporarily paused | Investigate payment or compliance issues |
| Inactive | No active subscriptions remaining | Review for reactivation or cleanup |

### Accounts Receivable

Accounts receivable data shows the financial relationship between the service provider and the customer within Sherweb's platform:

| Concept | Description |
|---------|-------------|
| Outstanding Balance | Total amount owed by the customer |
| Credit Limit | Maximum credit extended to the customer |
| Payment Terms | Net 30, Net 60, or custom payment terms |
| Last Payment | Date and amount of the most recent payment |
| Aging Buckets | Breakdown of outstanding amounts by age (current, 30d, 60d, 90d+) |

## Field Reference

### Core Customer Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Customer unique identifier |
| `name` | string | Customer display name |
| `externalId` | string | External reference ID (for PSA integration) |
| `status` | string | Customer status (Active, Suspended, Inactive) |
| `createdDate` | datetime | When the customer was created |
| `modifiedDate` | datetime | Last modification timestamp |

### Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `address.street` | string | Street address |
| `address.city` | string | City |
| `address.stateOrProvince` | string | State or province |
| `address.postalCode` | string | Postal/ZIP code |
| `address.country` | string | Country code (e.g., "US", "CA") |

### Contact Fields

| Field | Type | Description |
|-------|------|-------------|
| `primaryContact.firstName` | string | Primary contact first name |
| `primaryContact.lastName` | string | Primary contact last name |
| `primaryContact.email` | string | Primary contact email |
| `primaryContact.phone` | string | Primary contact phone |

### Accounts Receivable Fields

| Field | Type | Description |
|-------|------|-------------|
| `outstandingBalance` | decimal | Total amount currently owed |
| `creditLimit` | decimal | Maximum credit allowed |
| `currentAmount` | decimal | Charges in the current period |
| `thirtyDayAmount` | decimal | Charges 1-30 days overdue |
| `sixtyDayAmount` | decimal | Charges 31-60 days overdue |
| `ninetyPlusDayAmount` | decimal | Charges 61+ days overdue |
| `lastPaymentDate` | date | Date of most recent payment |
| `lastPaymentAmount` | decimal | Amount of most recent payment |

## Common Workflows

### List All Customers

1. Call `sherweb_customers_list` with `pageSize=100`
2. If `totalPages > 1`, paginate through remaining pages
3. Collect all customer records with IDs, names, and statuses

### Find a Customer by Name

1. Call `sherweb_customers_list` with `search` set to the customer name
2. Review matching results
3. Note the `id` for use in subsequent API calls

### Customer Onboarding Verification

1. Search for the newly created customer with `sherweb_customers_list`
2. Call `sherweb_customers_get` with the `customerId` to verify all details are correct
3. Verify subscriptions are provisioned with `sherweb_subscriptions_list` filtered by `customerId`
4. Check billing data appears correctly in the next billing period

### Accounts Receivable Review

1. Call `sherweb_customers_list` to get all customers
2. For each customer, call `sherweb_customers_accounts_receivable`
3. Flag customers with amounts in 60-day or 90-day aging buckets
4. Generate a collections priority report sorted by overdue amount

### Customer Portfolio Report

1. Fetch all customers with `sherweb_customers_list` (paginate through all pages)
2. For each customer, optionally fetch subscription data to get active subscription count
3. Build a report: customer name, status, subscription count, outstanding balance
4. Identify inactive customers for cleanup and high-balance customers for review

### Cross-Reference with PSA

1. List all Sherweb customers
2. Match each customer's `externalId` to your PSA system's company records
3. Flag customers without an `externalId` as needing PSA linkage
4. Verify names and addresses match between systems

## Response Examples

**Customer:**

```json
{
  "id": "cust-abc-123",
  "name": "Acme Corporation",
  "externalId": "PSA-12345",
  "status": "Active",
  "address": {
    "street": "123 Main St",
    "city": "Montreal",
    "stateOrProvince": "QC",
    "postalCode": "H2X 1Y4",
    "country": "CA"
  },
  "primaryContact": {
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane.smith@acme.com",
    "phone": "514-555-1234"
  },
  "createdDate": "2024-03-15T10:30:00.000Z",
  "modifiedDate": "2026-01-20T14:15:00.000Z"
}
```

**Accounts Receivable:**

```json
{
  "customerId": "cust-abc-123",
  "customerName": "Acme Corporation",
  "outstandingBalance": 1247.50,
  "creditLimit": 10000.00,
  "currentAmount": 847.50,
  "thirtyDayAmount": 400.00,
  "sixtyDayAmount": 0.00,
  "ninetyPlusDayAmount": 0.00,
  "lastPaymentDate": "2026-02-15",
  "lastPaymentAmount": 2100.00
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Customer not found | Invalid `customerId` | Verify the customer ID with `sherweb_customers_list` |
| No results | Customer name mismatch | Try a shorter or different search term |
| Authentication error | Expired or invalid token | Re-authenticate using OAuth 2.0 client credentials flow |
| Permission denied | Customer belongs to another service provider | Verify you are querying your own customers |

## Best Practices

1. **Set external IDs** - Link Sherweb customers to your PSA records for easy cross-referencing
2. **Monitor accounts receivable** - Review aging buckets monthly to catch overdue payments early
3. **Audit customer list** - Quarterly review inactive customers for cleanup or reactivation
4. **Standardize naming** - Use consistent naming conventions across Sherweb and your PSA
5. **Track customer status** - Monitor for suspended customers that may need intervention
6. **Cache customer data** - Customer details change infrequently; cache for short periods to reduce API calls
7. **Verify contact info** - Keep primary contact information current for billing and support communication
8. **Use search for lookups** - The `search` parameter is more efficient than fetching all customers and filtering locally

## Related Skills

- [Sherweb API Patterns](../api-patterns/SKILL.md) - Authentication, endpoints, and rate limits
- [Sherweb Billing](../billing/SKILL.md) - Payable charges per customer (no invoice retrieval)
- [Sherweb Subscriptions](../subscriptions/SKILL.md) - Subscription management per customer
