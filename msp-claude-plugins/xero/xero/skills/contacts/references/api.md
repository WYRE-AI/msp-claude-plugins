# Xero Contacts API Reference

## Endpoints

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

## List Contacts

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

## Get Single Contact

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Contacts/${CONTACT_ID}" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

## Create Contact

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

## Update Contact

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

## Archive Contact

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

## Search Contacts

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
