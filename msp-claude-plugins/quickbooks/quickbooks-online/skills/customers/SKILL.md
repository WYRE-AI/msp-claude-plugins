---
name: "QuickBooks Online Customers"
description: >
  QuickBooks Online Customer entity: the parent/sub-customer (job) hierarchy,
  contact, address, billing and hierarchy fields, payment terms, balance and
  BalanceWithJobs tracking, sparse updates, deactivation, query syntax, error
  codes, and PSA cross-referencing patterns for MSP client records.
when_to_use: >-
  When creating, searching, updating, and managing MSP client records. Use when: quickbooks
  customer, qbo customer, quickbooks client, qbo client, customer lookup, customer management,
  quickbooks contact, client billing, or customer balance.
---

# QuickBooks Online Customer Management

## Overview

Customers are the foundational entity in QuickBooks Online for MSP billing workflows. Each managed services client maps to a QBO Customer record. Customers hold billing addresses, payment terms, outstanding balances, and serve as the parent reference for invoices, payments, and estimates. MSPs commonly use sub-customers to break down billing by service line (e.g., "Acme Corp:Managed Services", "Acme Corp:Project Work").

## Key Concepts

### Customer Hierarchy

QuickBooks Online supports a parent/sub-customer hierarchy for organizing billing:

```
Parent Customer: Acme Corporation
+-- Sub-Customer: Acme Corp:Managed Services
+-- Sub-Customer: Acme Corp:Project Work
+-- Sub-Customer: Acme Corp:Hardware
```

Sub-customers allow MSPs to track revenue and outstanding balances per service line while rolling up to a single client.

### Customer vs Job

In QBO, "Jobs" are implemented as sub-customers. A project or engagement for a client is represented as a sub-customer under the parent.

### Payment Terms

Payment terms control when invoices are due:

| Term | Description | Common MSP Usage |
|------|-------------|------------------|
| Due on receipt | Due immediately | Break-fix work |
| Net 15 | Due in 15 days | Small clients |
| Net 30 | Due in 30 days | Standard managed services |
| Net 45 | Due in 45 days | Enterprise clients |
| Net 60 | Due in 60 days | Government/education |

### Balance Tracking

QBO automatically tracks the customer balance (sum of all unpaid invoices minus unapplied payments). This is critical for MSP accounts receivable management.

### Key Fields

`DisplayName` is the only required field on create and must be unique across the
company file. `Balance` and `BalanceWithJobs` are read-only — the latter rolls up
sub-customers. Sub-customers are defined by `ParentRef.value` plus `Job: true`,
and `FullyQualifiedName` holds the colon-delimited path. `SyncToken` is required
on every update.

See [references/fields.md](references/fields.md) for the complete field reference.

## API Patterns

### Query Customers

```http
GET /v3/company/{realmId}/query?query=SELECT * FROM Customer WHERE DisplayName LIKE '%Acme%'&minorversion=73
Authorization: Bearer {access_token}
Accept: application/json
```

**curl example:**
```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Acme%25'&minorversion=73"
```

**Common Queries:**

```sql
-- All active customers
SELECT * FROM Customer WHERE Active = true ORDERBY DisplayName

-- Customers with outstanding balance
SELECT * FROM Customer WHERE Balance > '0' ORDERBY Balance DESC

-- Find by company name
SELECT * FROM Customer WHERE CompanyName LIKE '%Tech%'

-- Find by email
SELECT * FROM Customer WHERE PrimaryEmailAddr = 'billing@acmecorp.com'

-- Count all customers
SELECT COUNT(*) FROM Customer
```

### Get Single Customer

```http
GET /v3/company/{realmId}/customer/123?minorversion=73
Authorization: Bearer {access_token}
```

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/customer/123?minorversion=73"
```

### Create Customer

```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "DisplayName": "Acme Corporation",
  "CompanyName": "Acme Corporation",
  "GivenName": "John",
  "FamilyName": "Smith",
  "PrimaryPhone": {
    "FreeFormNumber": "555-123-4567"
  },
  "PrimaryEmailAddr": {
    "Address": "billing@acmecorp.com"
  },
  "BillAddr": {
    "Line1": "123 Main Street",
    "City": "Springfield",
    "CountrySubDivisionCode": "IL",
    "PostalCode": "62704"
  },
  "SalesTermRef": {
    "value": "3"
  },
  "PreferredDeliveryMethod": "Email",
  "Notes": "MSP managed services client. Contract: 36-month. Primary contact: John Smith."
}
```

```bash
curl -s -X POST \
  -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/customer?minorversion=73" \
  -d '{
    "DisplayName": "Acme Corporation",
    "CompanyName": "Acme Corporation",
    "PrimaryEmailAddr": { "Address": "billing@acmecorp.com" },
    "SalesTermRef": { "value": "3" }
  }'
```

### Update Customer (Sparse)

```http
POST /v3/company/{realmId}/customer?minorversion=73
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "Id": "123",
  "SyncToken": "2",
  "sparse": true,
  "PrimaryPhone": {
    "FreeFormNumber": "555-999-8888"
  },
  "Notes": "Updated billing contact: Jane Doe (555-999-8888)"
}
```

### Deactivate Customer

```json
{
  "Id": "123",
  "SyncToken": "2",
  "sparse": true,
  "Active": false
}
```

### Create Sub-Customer

```json
{
  "DisplayName": "Acme Corp:Managed Services",
  "CompanyName": "Acme Corporation",
  "ParentRef": {
    "value": "123"
  },
  "Job": true,
  "BillWithParent": true
}
```

## Common Workflows

### New MSP Client Onboarding

1. **Create parent customer** with billing info and payment terms
2. **Create sub-customers** for each service line (managed services, projects, hardware)
3. **Set payment terms** based on contract (typically Net 30)
4. **Configure email delivery** for automated invoice sending
5. **Link to PSA** using Notes or custom fields for cross-reference

See [references/examples.md](references/examples.md) for the full onboarding
implementation.

### Customer Balance Review

```javascript
async function getClientBalances() {
  const query = `SELECT Id, DisplayName, Balance, BalanceWithJobs
    FROM Customer
    WHERE Active = true AND Balance > '0'
    ORDERBY Balance DESC`;

  const response = await qboQuery(query);
  const customers = response.QueryResponse.Customer || [];

  return customers.map(c => ({
    id: c.Id,
    name: c.DisplayName,
    balance: c.Balance,
    balanceWithJobs: c.BalanceWithJobs
  }));
}
```

### Client Offboarding

```javascript
async function offboardClient(customerId) {
  // Get current customer with SyncToken
  const customer = await getCustomer(customerId);

  // Verify no outstanding balance
  if (customer.Balance > 0) {
    throw new Error(`Cannot offboard: outstanding balance of $${customer.Balance}`);
  }

  // Deactivate all sub-customers
  const subs = await qboQuery(
    `SELECT * FROM Customer WHERE ParentRef = '${customerId}'`
  );
  for (const sub of subs.QueryResponse.Customer || []) {
    await updateCustomer({
      Id: sub.Id,
      SyncToken: sub.SyncToken,
      sparse: true,
      Active: false
    });
  }

  // Deactivate parent
  await updateCustomer({
    Id: customer.Id,
    SyncToken: customer.SyncToken,
    sparse: true,
    Active: false,
    Notes: `${customer.Notes || ''}\nOffboarded: ${new Date().toISOString().split('T')[0]}`
  });
}
```

### PSA Cross-Reference Lookup

```javascript
async function findCustomerByPsaId(psaId) {
  // Search in Notes field for PSA ID reference
  const allCustomers = await queryAll('Customer', "Active = true");

  return allCustomers.find(c =>
    c.Notes && c.Notes.includes(`PSA ID: ${psaId}`)
  );
}
```

## Error Handling

- **6240 Duplicate Name** is the most common create failure. QBO enforces
  uniqueness on `DisplayName` across Customers, Vendors, and Employees, so the
  recovery path is to look up the existing record rather than retry with a
  variant name.
- **Customers cannot be deleted, only deactivated** (`Active: false` via a sparse
  update). Deactivating a parent does not cascade to sub-customers — deactivate
  each sub-customer explicitly.
- **Non-sparse updates overwrite omitted fields with null.** Always send
  `sparse: true` with the current `SyncToken` for partial updates.
- **There is no custom field for PSA IDs by default**, so cross-references live
  in `Notes`, which is not queryable with LIKE — fetch and filter client-side.

See [references/errors.md](references/errors.md) for the full error-code and
validation tables plus a recovery pattern.

## Best Practices

1. **Use DisplayName for uniqueness** - QBO enforces unique DisplayNames; include a qualifier if needed
2. **Set CompanyName separately** - CompanyName can differ from DisplayName and does not need to be unique
3. **Create sub-customers for service lines** - Track revenue per service type
4. **Set payment terms at creation** - Ensures invoices have correct due dates
5. **Use email delivery** - Set PreferredDeliveryMethod to "Email" for automated invoice sending
6. **Include billing address** - Required for mailed invoices and tax calculation
7. **Track PSA IDs in Notes** - Cross-reference QBO customers with PSA records
8. **Deactivate, don't delete** - Preserve transaction history by deactivating former clients
9. **Review balances regularly** - Use balance queries to monitor aged receivables
10. **Use sparse updates** - Only send changed fields with `sparse: true` to avoid overwriting data

See [references/api.md](references/api.md) for the complete endpoint reference.

## Related Skills

- [QBO Invoices](../invoices/SKILL.md) - Invoice management for customers
- [QBO Payments](../payments/SKILL.md) - Payment processing
- [QBO Reports](../reports/SKILL.md) - A/R Aging and balance reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
