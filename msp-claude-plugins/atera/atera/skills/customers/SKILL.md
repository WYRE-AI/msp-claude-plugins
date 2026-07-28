---
name: "Atera Customers"
description: >
  Atera customers and contacts: customer records and fields, contact
  management, custom fields, and customer lifecycle operations.
when_to_use: >-
  When creating, updating, searching, or managing Atera customer and contact
  records. Use when: atera customer, atera client, customer management,
  atera contact, customer record, create customer atera, update customer
  atera, customer lookup, or contact lookup atera.
---

# Atera Customer Management

## Overview

Customers in Atera represent the organizations you provide IT services to. Each customer can have multiple contacts (end users), agents (managed devices), contracts, and associated tickets. Proper customer management is essential for organized service delivery.

## Customer Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `CustomerID` | int | System | Auto-generated unique identifier |
| `CustomerName` | string | Yes | Company name |
| `BusinessNumber` | string | No | Tax ID or business registration |
| `Domain` | string | No | Primary email domain |
| `Address` | string | No | Street address |
| `City` | string | No | City name |
| `State` | string | No | State/province |
| `Country` | string | No | Country name |
| `ZipCodeStr` | string | No | Postal/ZIP code |
| `Phone` | string | No | Main phone number |
| `Fax` | string | No | Fax number |
| `Notes` | string | No | Internal notes |
| `Website` | string | No | Company website URL |

### Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `CreatedOn` | datetime | Customer creation date |
| `LastModified` | datetime | Last modification date |

## Contact Fields

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `EndUserID` | int | System | Auto-generated unique identifier |
| `CustomerID` | int | Yes | Parent customer ID |
| `CustomerName` | string | System | Parent customer name |
| `FirstName` | string | No | Contact first name |
| `LastName` | string | No | Contact last name |
| `Email` | string | Yes | Email address (unique) |
| `Phone` | string | No | Phone number |
| `JobTitle` | string | No | Job title/position |
| `IsContactPerson` | boolean | No | Primary contact flag |
| `InIgnoreMode` | boolean | No | Ignore emails from contact |
| `CreatedOn` | datetime | System | Contact creation date |

## API Patterns

### List All Customers (Paginated)

```http
GET /api/v3/customers?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "Domain": "acme.com",
      "Address": "123 Main Street",
      "City": "New York",
      "State": "NY",
      "Country": "United States",
      "ZipCodeStr": "10001",
      "Phone": "555-123-4567",
      "Website": "https://www.acme.com",
      "CreatedOn": "2023-01-15T10:00:00Z"
    }
  ],
  "totalItems": 150,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 3
}
```

### Get Customer by ID

```http
GET /api/v3/customers/{customerId}
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "CustomerID": 12345,
  "CustomerName": "Acme Corporation",
  "BusinessNumber": "12-3456789",
  "Domain": "acme.com",
  "Address": "123 Main Street",
  "City": "New York",
  "State": "NY",
  "Country": "United States",
  "ZipCodeStr": "10001",
  "Phone": "555-123-4567",
  "Fax": "555-123-4568",
  "Website": "https://www.acme.com",
  "Notes": "Enterprise customer - 24/7 support",
  "CreatedOn": "2023-01-15T10:00:00Z",
  "LastModified": "2024-02-01T14:30:00Z"
}
```

### Create Customer

```http
POST /api/v3/customers
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerName": "New Company Inc",
  "Domain": "newcompany.com",
  "Address": "456 Oak Avenue",
  "City": "Chicago",
  "State": "IL",
  "Country": "United States",
  "ZipCodeStr": "60601",
  "Phone": "555-987-6543",
  "Website": "https://www.newcompany.com",
  "Notes": "Referred by Acme Corporation"
}
```

**Response:**
```json
{
  "ActionID": 67890,
  "CustomerID": 67890,
  "CustomerName": "New Company Inc"
}
```

### Update Customer

```http
POST /api/v3/customers/{customerId}
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Phone": "555-987-6544",
  "Notes": "Updated contact information",
  "Address": "789 New Street"
}
```

### Delete Customer

```http
DELETE /api/v3/customers/{customerId}
X-API-KEY: {api_key}
```

**Warning:** Deleting a customer removes all associated data including contacts, agents, and tickets.

## Contact Management

### List All Contacts (Paginated)

```http
GET /api/v3/contacts?page=1&itemsInPage=50
X-API-KEY: {api_key}
```

**Response:**
```json
{
  "items": [
    {
      "EndUserID": 67890,
      "CustomerID": 12345,
      "CustomerName": "Acme Corporation",
      "FirstName": "John",
      "LastName": "Smith",
      "Email": "john.smith@acme.com",
      "Phone": "555-123-4567 x101",
      "JobTitle": "IT Manager",
      "IsContactPerson": true,
      "CreatedOn": "2023-01-20T09:00:00Z"
    }
  ],
  "totalItems": 500,
  "page": 1,
  "itemsInPage": 50,
  "totalPages": 10
}
```

### Get Contact by ID

```http
GET /api/v3/contacts/{contactId}
X-API-KEY: {api_key}
```

### Create Contact

```http
POST /api/v3/contacts
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "CustomerID": 12345,
  "FirstName": "Jane",
  "LastName": "Doe",
  "Email": "jane.doe@acme.com",
  "Phone": "555-123-4567 x102",
  "JobTitle": "CFO",
  "IsContactPerson": false
}
```

**Response:**
```json
{
  "ActionID": 77777,
  "EndUserID": 77777
}
```

### Update Contact

```http
POST /api/v3/contacts/{contactId}
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "Phone": "555-123-4567 x103",
  "JobTitle": "COO",
  "IsContactPerson": true
}
```

### Delete Contact

```http
DELETE /api/v3/contacts/{contactId}
X-API-KEY: {api_key}
```

## Custom Values

Atera supports custom fields for customers and contacts.

### Get Custom Values

```http
GET /api/v3/customvalues/customer/{customerId}
X-API-KEY: {api_key}
```

### Set Custom Value

```http
POST /api/v3/customvalues/customer/{customerId}
X-API-KEY: {api_key}
Content-Type: application/json
```

```json
{
  "FieldName": "ContractType",
  "Value": "Managed Services"
}
```

### Delete Custom Value

```http
DELETE /api/v3/customvalues/customer/{customerId}/{fieldName}
X-API-KEY: {api_key}
```

## Common Workflows

### New Customer Onboarding

1. **Create customer record** - Add company information
2. **Add primary contact** - Create main point of contact
3. **Set custom fields** - Add contract type, billing info
4. **Deploy agents** - Install on managed devices
5. **Configure alerts** - Set up monitoring profiles

### Customer Search Flow

1. **Search by name** - Query customers endpoint
2. **Filter results** - Match by domain or other criteria
3. **Get details** - Retrieve full customer record
4. **List contacts** - Get associated contacts

### Customer Deactivation

1. **Review active tickets** - Close or transfer
2. **Remove agents** - Delete from managed devices
3. **Archive data** - Export if needed for records
4. **Delete customer** - Remove from system

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid customer ID | Verify customer exists |
| 400 | Email already exists | Contact email must be unique |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Verify permissions |
| 404 | Customer not found | Confirm customer ID |
| 429 | Rate limited | Wait and retry (700 req/min) |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Name required | Missing CustomerName | Add customer name |
| Email required | Missing contact email | Add email address |
| Invalid email | Malformed email address | Fix email format |
| Duplicate email | Email exists for another contact | Use unique email |

## Best Practices

1. **Use consistent naming** - Follow naming conventions
2. **Complete all fields** - Better data = better reporting
3. **Set primary contact** - Mark IsContactPerson for main contact
4. **Use custom fields** - Track contract and billing info
5. **Keep data current** - Update when information changes
6. **Audit regularly** - Review and clean stale records
7. **Link domains** - Associate email domains for routing

## Data Relationships

```
Customer (CustomerID)
    │
    ├── Contacts (EndUserID)
    │       └── Tickets (as EndUser)
    │
    ├── Agents (AgentID)
    │       └── Alerts
    │
    ├── Contracts (ContractID)
    │
    └── Custom Values
```

## Related Skills

- [Atera Tickets](../tickets/SKILL.md) - Customer ticket management
- [Atera Agents](../agents/SKILL.md) - Customer device management
- [Atera Contracts](../api-patterns/SKILL.md) - Service agreements
- [Atera API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
