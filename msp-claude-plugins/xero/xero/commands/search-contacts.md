---
description: Find a contact in Xero by name, email, or account number
argument-hint: "<query> [type] [status]"
arguments: [query, type, status]
---

# Search Xero Contacts

Find a contact (customer or supplier) in Xero by name, email, or account number.

## Prerequisites

- Valid Xero OAuth2 credentials configured (`XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`)
- Xero tenant ID configured (`XERO_TENANT_ID`)
- OAuth scope `accounting.contacts` or `accounting.contacts.read` granted

## Steps

1. **Authenticate with Xero**

   ```bash
   ACCESS_TOKEN=$(curl -s -X POST https://identity.xero.com/connect/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -u "${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}" \
     -d "grant_type=client_credentials&scope=accounting.contacts.read" \
     | jq -r '.access_token')
   ```

2. **Build search query**
   - Determine if query is a name, email, or account number
   - Construct the appropriate where clause

   ```bash
   # Search by name (default)
   WHERE="Name.Contains(%22${QUERY}%22)"

   # Search by email
   WHERE="EmailAddress==%22${QUERY}%22"

   # Search by account number
   WHERE="AccountNumber==%22${QUERY}%22"
   ```

3. **Execute search**

   ```bash
   curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=${WHERE}&order=Name%20ASC" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "xero-tenant-id: ${XERO_TENANT_ID}" \
     -H "Accept: application/json"
   ```

4. **Apply additional filters**
   - Filter by type (customer/supplier) based on IsCustomer/IsSupplier flags
   - Filter by ContactStatus

5. **Format and return results**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | Yes | - | Search term (name, email, or account number) |
| type | string | No | all | Filter: customer, supplier, or all |
| status | string | No | active | Filter: active, archived, or all |

## Examples

### Search by Name

```
/search-contacts "Acme"
```

### Search by Email

```
/search-contacts "billing@acme.com"
```

### Search by Account Number

```
/search-contacts "ACME001"
```

### Search Customers Only

```
/search-contacts "Corp" --type customer
```

### Search All Including Archived

```
/search-contacts "Old Client" --status all
```

### Search Suppliers

```
/search-contacts "Microsoft" --type supplier
```

## Output

### Single Match

```
Found 1 contact matching "Acme Corp"

Contact: Acme Corp
================================================================
Contact ID:     abc12345-6789-0abc-def0-123456789abc
Account Number: ACME001
Contact Number: MSP-001
Email:          billing@acme.com
Status:         ACTIVE
Type:           Customer

Address (Street):
  123 Main Street
  Springfield, IL 62704
  US

Phone:          (217) 555-0123

Financial Summary:
  Outstanding AR: $2,500.00
  Overdue AR:     $0.00

Quick Actions:
  - Create invoice: /create-invoice "Acme Corp" --description "..." --amount ...
  - Payment status: /payment-status "Acme Corp"
  - View in Xero: https://go.xero.com/Contacts/...
================================================================
```

### Multiple Matches

```
Found 3 contacts matching "Acme"

+------------------------+------------+--------+----------+-------------+-----------+
| Name                   | Account #  | Status | Type     | Outstanding | Overdue   |
+------------------------+------------+--------+----------+-------------+-----------+
| Acme Corp              | ACME001    | Active | Customer | $2,500.00   | $0.00     |
| Acme East Division     | ACME002    | Active | Customer | $1,200.00   | $1,200.00 |
| Acme Supplies Inc      | -          | Active | Supplier | $450.00     | $0.00     |
+------------------------+------------+--------+----------+-------------+-----------+

Select a contact:
  /search-contacts "Acme Corp"
  /search-contacts "ACME001"
```

### No Results

```
No contacts found matching "Xyz Company"

Suggestions:
  - Check spelling of the name
  - Try a partial match: /search-contacts "Xyz"
  - Search all statuses: /search-contacts "Xyz" --status all
  - Search by email: /search-contacts "xyz@email.com"

Create a new contact in Xero if this is a new client.
```

### Archived Contact

```
Found 1 contact matching "Old Client" (archived)

Contact: Old Client Inc (ARCHIVED)
================================================================
Contact ID:     def12345-6789-0abc-def0-123456789abc
Account Number: OLD001
Status:         ARCHIVED
Type:           Customer

Financial Summary:
  Outstanding AR: $0.00

WARNING: This contact is archived. Reactivate in Xero before
creating new invoices.
================================================================
```

## Advanced Search Patterns

### Search with Where Clause (curl)

```bash
# Name contains
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.Contains(%22Acme%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Name starts with
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name.StartsWith(%22Acme%22)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Exact name match
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=Name==%22Acme%20Corp%22" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Active customers with outstanding balance
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts?where=ContactStatus==%22ACTIVE%22&&IsCustomer==true" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"

# Recently modified contacts
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "If-Modified-Since: 2026-02-01T00:00:00" \
  -H "Accept: application/json"
```

## Error Handling

### Authentication Failed

```
Error: OAuth2 token request failed

Possible causes:
  - Invalid XERO_CLIENT_ID or XERO_CLIENT_SECRET
  - Custom Connection not authorized

Resolution:
  - Verify credentials in Xero Developer Portal
  - Re-authorize the Custom Connection
```

### Rate Limited

```
Error: Rate limit exceeded (429)

Resolution:
  - Wait 60 seconds and retry
  - Reduce request frequency
```

### Invalid Where Clause

```
Error: Invalid filter expression

Possible causes:
  - Special characters in search query not URL-encoded
  - Invalid operator in where clause

Resolution:
  - URL-encode the where parameter value
  - Use valid operators: ==, !=, .Contains(), .StartsWith()
```

## Use Cases

### Pre-Invoice Lookup

Before creating an invoice, verify the contact exists:

```
/search-contacts "Acme Corp"
/create-invoice "Acme Corp" --description "Managed Services - March 2026" --amount 2500.00
```

### Client Audit

Review all MSP clients and their outstanding balances:

```
/search-contacts "" --type customer
```

### Vendor Lookup

Find a vendor before recording a bill payment:

```
/search-contacts "Microsoft" --type supplier
```

### Find by PSA Reference

Look up a client using the account number from your PSA:

```
/search-contacts "ACME001"
```

## Related Commands

- `/create-invoice` - Create an invoice for a found contact
- `/payment-status` - Check outstanding balances for a contact
- `/reconciliation-summary` - Verify billing completeness
