---
name: "Xero Contacts"
description: >
  Xero contacts (customers and suppliers): contact fields, addresses and
  phones, contact groups, status values and read-only balances, plus MSP
  client onboarding, offboarding, and PSA cross-referencing patterns.
when_to_use: >-
  When creating, searching, updating, or managing client organizations in Xero.
  Use when: xero contact, xero customer, xero supplier, xero client, xero vendor,
  contact lookup, contact management, customer management, or xero organization.
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

### Key Fields

`Name` is the only required field and must be unique. `AccountNumber` and
`ContactNumber` are free-text and are the natural place to store your PSA
client ID. `IsCustomer`/`IsSupplier` and the `Balances.*` totals are read-only
and derived from invoice history.

See [references/fields.md](references/fields.md) for the complete field reference,
including address, phone, and balance fields.

## API Patterns

Every request needs both `Authorization: Bearer ${ACCESS_TOKEN}` and
`xero-tenant-id: ${XERO_TENANT_ID}`. Xero-specific quirks:

- **Updates use POST, not PUT**, against `/Contacts/{ContactID}`, and the body
  must repeat the `ContactID`.
- **Filters go in a URL-encoded `where` clause** with doubled quotes around
  string literals, `&&` for AND, and `.Contains()` / `.StartsWith()` for
  partial name matching.
- **`/Contacts` is paginated** at 100 records per page — pass `page=N`.

```bash
# Search by name (partial match)
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains(%22Acme%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

See [references/api.md](references/api.md) for the full endpoint catalog and
create/update/archive/search examples.

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

## Gotchas

- **Contact names must be unique tenant-wide**, including archived contacts. A
  "Name must be unique" 400 often points at an archived record, so search
  before assuming the name is free.
- **POST to `/Contacts` upserts.** Including a `ContactID` in the body updates
  the existing contact rather than creating a new one.
- **Balances are only returned on the single-contact GET**, not consistently on
  list responses — fetch the contact directly when you need AR/AP totals.
- **Archived contacts still appear in filtered queries** unless you constrain
  on `ContactStatus=="ACTIVE"`.

See [references/errors.md](references/errors.md) for the complete error-code table.

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

## Related Skills

- [Xero Invoices](../invoices/SKILL.md) - Creating invoices for contacts
- [Xero Payments](../payments/SKILL.md) - Payment tracking by contact
- [Xero Reports](../reports/SKILL.md) - Aged receivables by contact
- [Xero API Patterns](../api-patterns/SKILL.md) - API reference
