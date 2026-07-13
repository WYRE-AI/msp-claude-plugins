---
name: "Xero Contacts"
description: >
  Use this skill when working with Xero contacts (customers/suppliers) -
  creating, searching, updating, and managing client organizations.
  Covers contact fields, contact groups, MSP client management,
  billing address handling, and cross-referencing with PSA systems.
when_to_use: >-
  When creating, searching, updating, and managing client organizations. Use when: xero contact,
  xero customer, xero supplier, xero client, xero vendor, contact lookup, contact management,
  customer management, or xero organization.
---

# Xero Contacts Management

## Overview

Contacts are the foundational entity in Xero, representing customers (clients you invoice), suppliers (vendors you pay), or both. Every invoice, payment, credit note, and bank transaction is linked to a contact. For MSPs, contacts typically represent managed services clients, hardware vendors, software suppliers, and subcontractors.

## Core Concepts

### Contact Types

Xero contacts can be customers, suppliers, or both. The type is determined by usage rather than a fixed field:

| Role | Description | MSP Example |
|------|-------------|-------------|
| Customer | Contacts you create sales invoices (ACCREC) for | Managed services clients |
| Supplier | Contacts you receive bills (ACCPAY) from | Software vendors, ISPs |
| Customer & Supplier | Both roles | Partner MSPs, distributors |

### Contact Status

| Status | Description |
|--------|-------------|
| `ACTIVE` | Active contact (default) |
| `ARCHIVED` | Archived contact (hidden from lists) |
| `GDPR_REQUEST` | GDPR deletion requested |

### Contact Groups

Contacts can be organized into groups for reporting and filtering:

| Group | MSP Use Case |
|-------|-------------|
| Managed Services | Clients on monthly contracts |
| Break-Fix | Ad-hoc support clients |
| Vendors | Hardware and software suppliers |
| Partners | Co-managed or referral partners |

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ContactID` | string (UUID) | System | Auto-generated unique identifier |
| `Name` | string | Yes | Contact/company name (must be unique) |
| `ContactNumber` | string | No | Your reference number for this contact |
| `AccountNumber` | string | No | Account number in your system |
| `ContactStatus` | string | No | ACTIVE, ARCHIVED, or GDPR_REQUEST |
| `EmailAddress` | string | No | Primary email address |
| `FirstName` | string | No | First name (for individual contacts) |
| `LastName` | string | No | Last name (for individual contacts) |
| `BankAccountDetails` | string | No | Bank account information |
| `TaxNumber` | string | No | Tax identification number |
| `AccountsReceivableTaxType` | string | No | Default tax type for sales |
| `AccountsPayableTaxType` | string | No | Default tax type for purchases |
| `DefaultCurrency` | string | No | Default currency code (e.g., USD, AUD) |
| `IsSupplier` | boolean | Read-only | Has supplier invoices |
| `IsCustomer` | boolean | Read-only | Has customer invoices |

### Address Fields

Contacts support two address types: `POBOX` (mailing) and `STREET` (physical):

| Field | Type | Description |
|-------|------|-------------|
| `AddressType` | string | POBOX or STREET |
| `AddressLine1` | string | Street address line 1 |
| `AddressLine2` | string | Street address line 2 |
| `AddressLine3` | string | Street address line 3 |
| `AddressLine4` | string | Street address line 4 |
| `City` | string | City |
| `Region` | string | State/province/region |
| `PostalCode` | string | Postal/zip code |
| `Country` | string | Country |
| `AttentionTo` | string | Attention to name |

### Phone Fields

Contacts support four phone types: `DEFAULT`, `DDI`, `MOBILE`, `FAX`:

| Field | Type | Description |
|-------|------|-------------|
| `PhoneType` | string | DEFAULT, DDI, MOBILE, or FAX |
| `PhoneNumber` | string | Phone number |
| `PhoneAreaCode` | string | Area code |
| `PhoneCountryCode` | string | Country code |

### Financial Summary Fields (Read-Only)

| Field | Type | Description |
|-------|------|-------------|
| `Balances.AccountsReceivable.Outstanding` | decimal | Total outstanding AR |
| `Balances.AccountsReceivable.Overdue` | decimal | Total overdue AR |
| `Balances.AccountsPayable.Outstanding` | decimal | Total outstanding AP |
| `Balances.AccountsPayable.Overdue` | decimal | Total overdue AP |
| `UpdatedDateUTC` | datetime | Last modification timestamp |

## API Patterns

### List Contacts

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**With Filters:**

```bash
# Search by name (partial match)
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains(%22Acme%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Active customers only
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=ContactStatus==%22ACTIVE%22&&IsCustomer==true" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# With pagination
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?page=1" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Get Single Contact

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts/${CONTACT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

### Create Contact

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Contacts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Acme Corp",
    "ContactNumber": "MSP-001",
    "AccountNumber": "ACME001",
    "EmailAddress": "billing@acme.com",
    "Addresses": [
      {
        "AddressType": "STREET",
        "AddressLine1": "123 Main Street",
        "City": "Springfield",
        "Region": "IL",
        "PostalCode": "62704",
        "Country": "US"
      },
      {
        "AddressType": "POBOX",
        "AddressLine1": "PO Box 456",
        "City": "Springfield",
        "Region": "IL",
        "PostalCode": "62704",
        "Country": "US"
      }
    ],
    "Phones": [
      {
        "PhoneType": "DEFAULT",
        "PhoneNumber": "555-0123",
        "PhoneAreaCode": "217"
      }
    ],
    "DefaultCurrency": "USD"
  }'
```

### Update Contact

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Contacts/${CONTACT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "ContactID": "'${CONTACT_ID}'",
    "EmailAddress": "newemail@acme.com",
    "Phones": [
      {
        "PhoneType": "DEFAULT",
        "PhoneNumber": "555-9999",
        "PhoneAreaCode": "217"
      }
    ]
  }'
```

### Archive Contact

```bash
curl -s -X POST "https://api.xero.com/api.xro/2.0/Contacts/${CONTACT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "ContactID": "'${CONTACT_ID}'",
    "ContactStatus": "ARCHIVED"
  }'
```

### Search Contacts

```bash
# Search by name
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.StartsWith(%22Acme%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Search by email
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=EmailAddress==%22billing@acme.com%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Search by account number
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=AccountNumber==%22ACME001%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Common Workflows

### MSP Client Onboarding

1. **Create contact** with company details and billing address
2. **Set account number** using your PSA or internal reference
3. **Add to contact group** (e.g., "Managed Services")
4. **Set default currency** if multi-currency
5. **Create first invoice** for onboarding or first month

```javascript
async function onboardMspClient(clientData) {
  const token = await auth.getToken();

  const contact = await createContact(token, {
    Name: clientData.companyName,
    ContactNumber: clientData.psaId,
    AccountNumber: clientData.accountCode,
    EmailAddress: clientData.billingEmail,
    Addresses: [
      {
        AddressType: 'STREET',
        AddressLine1: clientData.address,
        City: clientData.city,
        Region: clientData.state,
        PostalCode: clientData.zip,
        Country: clientData.country
      }
    ],
    Phones: [
      {
        PhoneType: 'DEFAULT',
        PhoneNumber: clientData.phone
      }
    ],
    DefaultCurrency: clientData.currency || 'USD'
  });

  return contact;
}
```

### Client Offboarding

1. **Verify all invoices are paid** - Check outstanding balances
2. **Create final invoice** if needed for remaining services
3. **Archive the contact** - Do not delete for audit trail

```javascript
async function offboardClient(contactId) {
  const token = await auth.getToken();

  // Check outstanding balance
  const contact = await getContact(token, contactId);
  const outstanding = contact.Balances?.AccountsReceivable?.Outstanding || 0;

  if (outstanding > 0) {
    console.log(`WARNING: ${contact.Name} has $${outstanding} outstanding.`);
    return { status: 'blocked', reason: 'outstanding_balance', amount: outstanding };
  }

  // Archive the contact
  await updateContact(token, contactId, { ContactStatus: 'ARCHIVED' });
  return { status: 'archived', contact: contact.Name };
}
```

### PSA Cross-Reference

Use the `ContactNumber` field to store your PSA system's client ID:

```javascript
async function findByPsaId(psaId) {
  const token = await auth.getToken();
  const where = encodeURIComponent(`ContactNumber=="${psaId}"`);
  const response = await fetch(
    `https://api.xero.com/api.xro/2.0/Contacts?where=${where}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'xero-tenant-id': process.env.XERO_TENANT_ID,
        'Accept': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.Contacts?.[0] || null;
}
```

### Bulk Contact Report

```javascript
async function generateClientReport() {
  const contacts = await fetchAllContacts();

  return contacts
    .filter(c => c.IsCustomer && c.ContactStatus === 'ACTIVE')
    .map(contact => ({
      name: contact.Name,
      accountNumber: contact.AccountNumber,
      email: contact.EmailAddress,
      outstanding: contact.Balances?.AccountsReceivable?.Outstanding || 0,
      overdue: contact.Balances?.AccountsReceivable?.Overdue || 0,
      city: contact.Addresses?.find(a => a.AddressType === 'STREET')?.City
    }))
    .sort((a, b) => b.overdue - a.overdue);
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name must be unique | Use a different contact name |
| 400 | Name is required | Provide Name field |
| 401 | Unauthorized | Refresh access token |
| 403 | Forbidden | Check tenant ID and OAuth scopes |
| 404 | Contact not found | Verify ContactID |
| 429 | Rate limit exceeded | Wait and retry |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name must be unique | Duplicate contact name | Use unique name or find existing |
| Name is required | Missing Name field | Add Name to request body |
| Invalid email | Malformed email address | Fix email format |
| Invalid phone | Malformed phone number | Fix phone format |

### Error Recovery Pattern

```javascript
async function safeCreateContact(data) {
  try {
    return await createContact(data);
  } catch (error) {
    if (error.message?.includes('must be unique')) {
      // Contact exists - find and return it
      const existing = await searchContactByName(data.Name);
      return existing;
    }

    if (error.status === 401) {
      // Token expired - refresh and retry
      await auth.refreshToken();
      return await createContact(data);
    }

    throw error;
  }
}
```

## Endpoint Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/Contacts` | GET | List contacts (paginated, filterable) |
| `/Contacts` | POST | Create or update contacts |
| `/Contacts/{ContactID}` | GET | Get single contact |
| `/Contacts/{ContactID}` | POST | Update a contact |
| `/Contacts/{ContactID}/Attachments` | GET | List contact attachments |
| `/ContactGroups` | GET | List contact groups |
| `/ContactGroups` | POST | Create contact group |
| `/ContactGroups/{GroupID}/Contacts` | PUT | Add contacts to group |
| `/ContactGroups/{GroupID}/Contacts/{ContactID}` | DELETE | Remove contact from group |

## Best Practices

1. **Use unique names** - Xero requires unique contact names; include location if needed
2. **Set AccountNumber** - Map to your PSA client ID for cross-referencing
3. **Use ContactNumber** - Store PSA or internal reference numbers
4. **Include billing email** - Required for emailing invoices directly from Xero
5. **Add both addresses** - STREET for physical, POBOX for mailing/billing
6. **Use contact groups** - Organize clients by service tier or type
7. **Archive, don't delete** - Preserve historical data and audit trail
8. **Set default currency** - Important for international MSP clients
9. **Check balances before archiving** - Ensure no outstanding amounts
10. **Paginate contact lists** - Use page parameter for more than 100 contacts

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Creating invoices for contacts
- [Xero Payments](../payments/SKILL.md) - Payment tracking by contact
- [Xero Reports](../reports/SKILL.md) - Aged receivables by contact
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
