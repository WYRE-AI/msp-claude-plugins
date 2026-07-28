---
name: "Syncro Customers"
description: >
  Syncro MSP customers: customer fields, contacts, sites and locations, and
  customer create, update, and search operations.
when_to_use: >-
  When creating, updating, or searching Syncro customer and contact records.
  Use when: syncro customer, syncro client, syncro contact, customer
  management syncro, contact management syncro, client onboarding syncro,
  syncro site, syncro location, or customer search syncro.
---

# Syncro MSP Customer Management

## Overview

Syncro customers are the foundation of your service delivery. Every ticket, asset, invoice, and contract is associated with a customer. This skill covers comprehensive customer management including CRUD operations, contact management, and site/location handling.

## Key Concepts

### Customer

The primary entity representing a client organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `business_name` | string | Yes | Official company name |
| `firstname` | string | No | Primary contact first name |
| `lastname` | string | No | Primary contact last name |
| `email` | string | No | Primary email address |
| `phone` | string | No | Main phone number |
| `mobile` | string | No | Mobile phone |
| `address` | string | No | Street address |
| `address_2` | string | No | Address line 2 |
| `city` | string | No | City |
| `state` | string | No | State/Province |
| `zip` | string | No | ZIP/Postal code |
| `notes` | text | No | Internal notes |
| `referred_by` | string | No | Referral source |
| `tax_rate` | decimal | No | Tax rate percentage |

### Contact

Individual people at a customer organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | integer | System | Unique identifier |
| `customer_id` | integer | Yes | Associated customer |
| `name` | string | Yes | Full name |
| `email` | string | No | Email address |
| `phone` | string | No | Phone number |
| `mobile` | string | No | Mobile number |
| `title` | string | No | Job title |
| `notes` | text | No | Notes about contact |

### Customer Types

Syncro supports flexible customer categorization:

| Type | Use Case |
|------|----------|
| Business | Standard commercial clients |
| Residential | Home users |
| Government | Government agencies |
| Non-Profit | Non-profit organizations |

## API Patterns

### Creating a Customer

```http
POST /api/v1/customers
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

```json
{
  "business_name": "Acme Corporation",
  "firstname": "John",
  "lastname": "Smith",
  "email": "john.smith@acme.example.com",
  "phone": "555-123-4567",
  "address": "123 Main Street",
  "city": "Springfield",
  "state": "IL",
  "zip": "62701",
  "notes": "Referred by ABC Company"
}
```

### Searching Customers

**Search by name:**
```http
GET /api/v1/customers?query=acme
```

**List all customers with pagination:**
```http
GET /api/v1/customers?page=1
```

**Filter by email:**
```http
GET /api/v1/customers?email=john.smith@acme.example.com
```

### Getting Customer Details

```http
GET /api/v1/customers/{id}
```

**Response includes:**
- Customer information
- Associated contacts
- Recent tickets
- Assets summary
- Invoice history

### Updating a Customer

```http
PUT /api/v1/customers/{id}
Content-Type: application/json
```

```json
{
  "phone": "555-987-6543",
  "notes": "Updated contact information per request"
}
```

### Creating a Contact

```http
POST /api/v1/contacts
Content-Type: application/json
```

```json
{
  "customer_id": 12345,
  "name": "Jane Doe",
  "email": "jane.doe@acme.example.com",
  "phone": "555-123-4568",
  "title": "IT Manager",
  "notes": "Primary technical contact"
}
```

### Searching Contacts

**Contacts for a customer:**
```http
GET /api/v1/contacts?customer_id=12345
```

**Search by email:**
```http
GET /api/v1/contacts?email=jane.doe@acme.example.com
```

### Updating a Contact

```http
PUT /api/v1/contacts/{id}
Content-Type: application/json
```

```json
{
  "title": "IT Director",
  "phone": "555-123-4569"
}
```

### Deleting a Contact

```http
DELETE /api/v1/contacts/{id}
```

## Common Workflows

### Client Onboarding

1. **Create customer record**
   - Enter business information
   - Set tax rate if applicable
   - Add referral source for tracking

2. **Create primary contact**
   - Add decision maker/main contact
   - Include email for communications
   - Note any preferences

3. **Add additional contacts**
   - Technical contacts
   - Billing contacts
   - Other stakeholders

4. **Set up assets**
   - Deploy RMM agent
   - Import existing inventory

5. **Create contract/agreement**
   - Define service terms
   - Set billing schedule

### Contact Management

1. **Verify before creating**
   - Search for existing contact by email
   - Check for duplicates

2. **Maintain accuracy**
   - Update titles when roles change
   - Archive contacts who leave
   - Add new contacts as needed

3. **Track relationships**
   - Note who can authorize work
   - Track technical vs billing contacts

### Customer Merge/Cleanup

When you discover duplicate customers:

1. **Identify the primary record** to keep
2. **Document assets** on both records
3. **Move tickets** to primary customer
4. **Update contacts** to point to primary
5. **Archive or delete** duplicate

## Response Examples

### Customer Object

```json
{
  "customer": {
    "id": 12345,
    "business_name": "Acme Corporation",
    "firstname": "John",
    "lastname": "Smith",
    "email": "john.smith@acme.example.com",
    "phone": "555-123-4567",
    "address": "123 Main Street",
    "city": "Springfield",
    "state": "IL",
    "zip": "62701",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-02-10T14:22:00Z"
  }
}
```

### Contact Object

```json
{
  "contact": {
    "id": 67890,
    "customer_id": 12345,
    "name": "Jane Doe",
    "email": "jane.doe@acme.example.com",
    "phone": "555-123-4568",
    "mobile": "555-987-6543",
    "title": "IT Manager",
    "notes": "Primary technical contact",
    "created_at": "2024-01-15T11:00:00Z"
  }
}
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid parameters | Check field values |
| 401 | Unauthorized | Verify API key |
| 404 | Customer not found | Confirm customer ID |
| 422 | Validation failed | Check required fields |
| 429 | Rate limited | Wait and retry |

### Validation Errors

**"business_name is required"** - Customer must have a name

**"Invalid email format"** - Check email address syntax

**"customer_id required"** - Contact must belong to a customer

## Best Practices

1. **Standardize naming** - Use consistent company name formats
2. **Verify before creating** - Always search first to prevent duplicates
3. **Complete profiles** - Fill in as much information as possible
4. **Keep contacts current** - Update when staff changes
5. **Use notes effectively** - Document important relationship details
6. **Track referrals** - Helps with marketing analysis
7. **Set appropriate tax rates** - Prevents billing errors
8. **Regular data cleanup** - Audit for duplicates periodically

## Related Skills

- [Syncro Tickets](../tickets/SKILL.md) - Service tickets for customers
- [Syncro Assets](../assets/SKILL.md) - Asset management
- [Syncro Invoices](../invoices/SKILL.md) - Customer billing
- [Syncro API Patterns](../api-patterns/SKILL.md) - Authentication and pagination
