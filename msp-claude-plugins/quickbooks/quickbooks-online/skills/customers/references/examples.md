# QuickBooks Online Customer Workflow Examples

## New MSP Client Onboarding

Creates the parent customer, then a sub-customer per service line.

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
