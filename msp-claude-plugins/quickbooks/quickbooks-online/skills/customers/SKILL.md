---
name: "QuickBooks Online Customers"
description: >
  Use this skill when working with QuickBooks Online customers (clients) -
  creating, searching, updating, and managing MSP client records.
  Covers customer fields, sub-customers, billing addresses, payment terms,
  balance tracking, and cross-referencing with PSA platforms.
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

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Id` | string | System | Auto-generated unique identifier |
| `DisplayName` | string | Yes | Unique display name (customer-facing) |
| `CompanyName` | string | No | Legal company name |
| `GivenName` | string | No | Contact first name |
| `FamilyName` | string | No | Contact last name |
| `Active` | boolean | No | Whether customer is active (default: true) |
| `Balance` | decimal | Read-only | Outstanding balance |
| `BalanceWithJobs` | decimal | Read-only | Balance including sub-customers |
| `SyncToken` | string | Required for updates | Optimistic locking token |

### Contact Fields

| Field | Type | Description |
|-------|------|-------------|
| `PrimaryPhone.FreeFormNumber` | string | Primary phone number |
| `AlternatePhone.FreeFormNumber` | string | Alternate phone |
| `Mobile.FreeFormNumber` | string | Mobile phone |
| `Fax.FreeFormNumber` | string | Fax number |
| `PrimaryEmailAddr.Address` | string | Primary email (used for invoice delivery) |
| `WebAddr.URI` | string | Website URL |

### Address Fields

| Field | Type | Description |
|-------|------|-------------|
| `BillAddr.Line1` | string | Billing street address |
| `BillAddr.City` | string | Billing city |
| `BillAddr.CountrySubDivisionCode` | string | Billing state/province |
| `BillAddr.PostalCode` | string | Billing postal code |
| `BillAddr.Country` | string | Billing country |
| `ShipAddr` | object | Shipping address (same structure as BillAddr) |

### Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `SalesTermRef.value` | string | Payment terms ID (e.g., Net 30) |
| `PaymentMethodRef.value` | string | Default payment method ID |
| `CurrencyRef.value` | string | Currency code (e.g., "USD") |
| `PreferredDeliveryMethod` | string | "Print", "Email", or "None" |
| `Taxable` | boolean | Whether customer is taxable |

### Hierarchy Fields

| Field | Type | Description |
|-------|------|-------------|
| `ParentRef.value` | string | Parent customer ID (for sub-customers) |
| `Job` | boolean | Whether this is a job (sub-customer) |
| `Level` | integer | Depth in hierarchy (0 = top-level) |
| `FullyQualifiedName` | string | Full path (e.g., "Acme Corp:Managed Services") |

### Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `MetaData.CreateTime` | datetime | Creation timestamp |
| `MetaData.LastUpdatedTime` | datetime | Last update timestamp |

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

```javascript
async function onboardMspClient(clientData) {
  // Step 1: Create parent customer
  const customer = await createCustomer({
    DisplayName: clientData.companyName,
    CompanyName: clientData.companyName,
    GivenName: clientData.contactFirstName,
    FamilyName: clientData.contactLastName,
    PrimaryPhone: { FreeFormNumber: clientData.phone },
    PrimaryEmailAddr: { Address: clientData.billingEmail },
    BillAddr: {
      Line1: clientData.address,
      City: clientData.city,
      CountrySubDivisionCode: clientData.state,
      PostalCode: clientData.zip
    },
    SalesTermRef: { value: clientData.paymentTermId || '3' }, // Net 30
    PreferredDeliveryMethod: 'Email',
    Notes: `MSP client. Contract start: ${clientData.contractStart}. PSA ID: ${clientData.psaId}`
  });

  // Step 2: Create sub-customers for service lines
  const serviceLines = ['Managed Services', 'Project Work', 'Hardware'];
  for (const line of serviceLines) {
    await createCustomer({
      DisplayName: `${clientData.companyName}:${line}`,
      ParentRef: { value: customer.Id },
      Job: true,
      BillWithParent: true
    });
  }

  return customer;
}
```

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

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 6240 | Duplicate Name | Use a unique DisplayName |
| 610 | Object Not Found | Verify customer ID |
| 5010 | Stale Object | Re-fetch SyncToken and retry |
| 2050 | Invalid Reference | Check ParentRef or SalesTermRef values |
| 3200 | Auth Failed | Refresh access token |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| DisplayName required | Missing DisplayName | Add DisplayName to request |
| Duplicate DisplayName | Name already exists | Use unique name or append qualifier |
| Invalid ParentRef | Non-existent parent | Verify parent customer ID |
| Invalid SalesTermRef | Bad term ID | Query Terms entity for valid IDs |

### Error Recovery Pattern

```javascript
async function safeCreateCustomer(data) {
  try {
    return await createCustomer(data);
  } catch (error) {
    const fault = error.Fault;
    if (!fault) throw error;

    const errorCode = fault.Error?.[0]?.code;

    if (errorCode === '6240') {
      // Duplicate -- find existing customer
      const existing = await qboQuery(
        `SELECT * FROM Customer WHERE DisplayName = '${data.DisplayName}'`
      );
      return existing.QueryResponse.Customer?.[0];
    }

    if (errorCode === '5010') {
      // Stale SyncToken -- re-fetch and retry
      const fresh = await getCustomer(data.Id);
      data.SyncToken = fresh.SyncToken;
      return await updateCustomer(data);
    }

    throw error;
  }
}
```

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

## Endpoint Reference

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Create | POST | `/v3/company/{realmId}/customer` |
| Read | GET | `/v3/company/{realmId}/customer/{id}` |
| Update | POST | `/v3/company/{realmId}/customer` |
| Query | GET | `/v3/company/{realmId}/query?query=...` |

## Related Skills

- [QBO Invoices](../invoices/SKILL.md) - Invoice management for customers
- [QBO Payments](../payments/SKILL.md) - Payment processing
- [QBO Reports](../reports/SKILL.md) - A/R Aging and balance reports
- [QBO API Patterns](../api-patterns/SKILL.md) - API reference
