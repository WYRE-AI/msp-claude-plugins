# Xero Invoice Workflow Examples

## Generate Monthly MSP Invoices in a Batch

```javascript
async function generateMonthlyInvoices(clients, billingMonth) {
  const invoices = clients.map(client => ({
    Type: 'ACCREC',
    Contact: { ContactID: client.xeroContactId },
    Date: `${billingMonth}-01T00:00:00`,
    DueDate: `${billingMonth}-28T00:00:00`,
    Reference: `${billingMonth} Managed Services`,
    LineAmountTypes: 'Exclusive',
    LineItems: client.services.map(service => ({
      Description: `${service.name} - ${billingMonth}`,
      Quantity: service.quantity,
      UnitAmount: service.unitPrice,
      AccountCode: service.accountCode || '200'
    })),
    Status: 'DRAFT'
  }));

  const token = await auth.getToken();
  const response = await fetch(
    'https://api.xero.com/api.xro/2.0/Invoices?summarizeErrors=false',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'xero-tenant-id': process.env.XERO_TENANT_ID,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ Invoices: invoices })
    }
  );

  return await response.json();
}
```

## Invoice with Tracking Categories

Use tracking categories for department or project reporting:

```json
{
  "Type": "ACCREC",
  "Contact": { "ContactID": "abc-123" },
  "LineItems": [
    {
      "Description": "Managed Services - March 2026",
      "Quantity": 1,
      "UnitAmount": 2500.00,
      "AccountCode": "200",
      "Tracking": [
        {
          "Name": "Department",
          "Option": "Managed Services"
        },
        {
          "Name": "Region",
          "Option": "East"
        }
      ]
    }
  ]
}
```

## Find Unbilled Clients

```javascript
async function findUnbilledClients(billingMonth) {
  const allContacts = await fetchActiveCustomers();
  const invoices = await fetchInvoicesByDateRange(
    `${billingMonth}-01`,
    `${billingMonth}-28`
  );

  const billedContactIds = new Set(
    invoices
      .filter(inv => inv.Type === 'ACCREC')
      .map(inv => inv.Contact.ContactID)
  );

  return allContacts.filter(
    contact => !billedContactIds.has(contact.ContactID)
  );
}
```

## Validation Error Recovery Pattern

```javascript
async function safeCreateInvoice(invoiceData) {
  const result = await createInvoice(invoiceData);
  const invoice = result.Invoices?.[0];

  if (invoice?.HasErrors) {
    const errors = invoice.ValidationErrors.map(e => e.Message);
    console.error('Invoice validation failed:', errors);

    // Common recovery: invalid account code
    if (errors.some(e => e.includes('Account code'))) {
      console.log('Check chart of accounts for valid codes.');
    }

    // Common recovery: duplicate invoice number
    if (errors.some(e => e.includes('already used'))) {
      delete invoiceData.InvoiceNumber;
      return await createInvoice(invoiceData);
    }

    throw new Error(`Validation errors: ${errors.join('; ')}`);
  }

  return invoice;
}
```
