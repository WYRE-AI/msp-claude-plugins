---
name: "HaloPSA Clients"
description: >
  Use this skill when working with HaloPSA clients - creating, updating,
  searching, or managing customer relationships. Covers client fields,
  sites/locations, contacts, client types, and onboarding workflows.
  Essential for MSP account managers handling CRM in HaloPSA.
when_to_use: >-
  When creating, updating, searching, or managing customer relationships. Use when: halopsa
  client, halo client, halopsa customer, halo customer, client management halopsa, create client
  halopsa, halopsa site, halopsa location, halopsa contact, client onboarding halo, or halopsa
  crm.
---

# HaloPSA Client Management

## Overview

Clients (customers) are the foundation of HaloPSA. All tickets, contracts, assets, and invoices are associated with clients. Proper client data management is critical for accurate service delivery and billing.

## Key Concepts

### Client

The primary entity representing a customer organization.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `name` | string(255) | Yes | Official company name |
| `client_to_invoice` | int | No | Parent company for billing |
| `toplevel_id` | int | No | Top-level parent in hierarchy |
| `inactive` | bool | No | Active/inactive status |
| `main_site_id` | int | No | Primary site reference |

### Client Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emailaddress` | string | No | Primary email |
| `phonenumber` | string | No | Main phone |
| `website` | string | No | Website URL |
| `accountmanager_id` | int | No | Assigned account manager |

### Client Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `colour` | string | No | Client color code (hex) |
| `notes` | text | No | Internal notes |
| `taxcode` | string | No | Tax identifier |
| `currency_code` | string | No | Billing currency |
| `payment_terms` | int | No | Payment terms (days) |

## Client Types

HaloPSA supports client classification through custom fields and categories. Common patterns:

| Type | Description | Use Case |
|------|-------------|----------|
| Customer | Active paying client | Full service |
| Prospect | Potential customer | Sales pipeline |
| Lead | Marketing qualified | Pre-sales |
| Partner | Strategic partner | Collaboration |
| Vendor | Supplier | Procurement |

## Sites (Locations)

Sites represent physical locations for a client.

### Site Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `client_id` | int | Yes | Parent client |
| `name` | string(255) | Yes | Site name |
| `line1` | string | No | Address line 1 |
| `line2` | string | No | Address line 2 |
| `line3` | string | No | Address line 3 |
| `line4` | string | No | City |
| `postcode` | string | No | Postal/ZIP code |
| `country` | string | No | Country |
| `phonenumber` | string | No | Site phone |
| `main_site` | bool | No | Is primary site |
| `inactive` | bool | No | Active status |

## Contacts (Users)

Contacts (also called Users in HaloPSA) are individuals at a client organization.

### Contact Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Unique identifier |
| `client_id` | int | Yes | Associated client |
| `site_id` | int | No | Associated site |
| `name` | string(255) | Yes | Full name |
| `firstname` | string | No | First name |
| `surname` | string | No | Last name |
| `emailaddress` | string | No | Email address |
| `phonenumber` | string | No | Direct phone |
| `mobilenumber` | string | No | Mobile phone |
| `jobtitle` | string | No | Job title |
| `inactive` | bool | No | Active status |
| `isimportantcontact` | bool | No | VIP flag |

## API Patterns

### Creating a Client

```http
POST /api/Client
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "name": "Acme Corporation",
    "emailaddress": "info@acme.example.com",
    "phonenumber": "555-123-4567",
    "website": "https://acme.example.com",
    "notes": "Enterprise client, premium support tier",
    "accountmanager_id": 101
  }
]
```

### Response

```json
{
  "clients": [
    {
      "id": 123,
      "name": "Acme Corporation",
      "emailaddress": "info@acme.example.com",
      "phonenumber": "555-123-4567",
      "inactive": false
    }
  ]
}
```

### Searching Clients

**Search by name:**
```http
GET /api/Client?search=acme
```

**Active clients only:**
```http
GET /api/Client?inactive=false
```

**By account manager:**
```http
GET /api/Client?accountmanager_id=101
```

**Paginated with sorting:**
```http
GET /api/Client?page_no=1&page_size=50&order=name&orderdesc=false
```

### Getting a Single Client

```http
GET /api/Client/123
```

**With additional details:**
```http
GET /api/Client/123?includesites=true&includeusers=true
```

### Updating a Client

```http
POST /api/Client
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "id": 123,
    "phonenumber": "555-987-6543",
    "website": "https://newsite.acme.example.com",
    "accountmanager_id": 102
  }
]
```

### Creating a Site

```http
POST /api/Site
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "client_id": 123,
    "name": "Acme HQ",
    "line1": "123 Main Street",
    "line2": "Suite 500",
    "line4": "Springfield",
    "postcode": "62701",
    "country": "United States",
    "phonenumber": "555-123-4567",
    "main_site": true
  }
]
```

### Creating a Contact (User)

```http
POST /api/Users
Authorization: Bearer {token}
Content-Type: application/json
```

```json
[
  {
    "client_id": 123,
    "site_id": 456,
    "name": "John Smith",
    "firstname": "John",
    "surname": "Smith",
    "emailaddress": "john.smith@acme.example.com",
    "phonenumber": "555-123-4568",
    "mobilenumber": "555-987-6543",
    "jobtitle": "IT Director",
    "isimportantcontact": true
  }
]
```

### Searching Contacts

**Contacts for a client:**
```http
GET /api/Users?client_id=123
```

**Search by email:**
```http
GET /api/Users?search=john.smith@acme.example.com
```

**Active contacts only:**
```http
GET /api/Users?inactive=false&client_id=123
```

## Client Hierarchy

HaloPSA supports parent-child client relationships:

### Setting Up Hierarchy

```json
[
  {
    "id": 124,
    "name": "Acme West Branch",
    "client_to_invoice": 123,
    "toplevel_id": 123
  }
]
```

### Hierarchy Use Cases

- **Franchise operations** - Parent company, individual locations
- **Multi-site organizations** - Headquarters with branch offices
- **Billing consolidation** - Invoice parent, service children

## Common Workflows

### Client Onboarding

1. **Create client record**
   - Set name and contact information
   - Assign account manager
   - Configure billing settings

2. **Create primary site**
   - Add main location address
   - Set as main_site

3. **Create primary contact**
   - Add key stakeholder
   - Set as important contact
   - Verify email address

4. **Set up contract**
   - Link to client
   - Define service levels
   - Configure billing

5. **Deploy assets** (if applicable)
   - Link devices to client
   - Associate with site

### Contact Management

```javascript
async function onboardContact(clientId, contactData) {
  // 1. Check for existing contact by email
  const existing = await searchUsers({
    client_id: clientId,
    search: contactData.emailaddress
  });

  if (existing.length > 0) {
    console.log('Contact already exists:', existing[0].id);
    return existing[0];
  }

  // 2. Create new contact
  const contact = await createUser({
    client_id: clientId,
    ...contactData
  });

  // 3. Send welcome email (if configured)
  if (contactData.send_welcome) {
    await sendWelcomeEmail(contact.id);
  }

  return contact;
}
```

### Client Deactivation

When a client churns:

1. **Mark client inactive**
   ```json
   [{ "id": 123, "inactive": true }]
   ```

2. **Close open tickets**
   - Resolve or cancel pending tickets
   - Document reason

3. **End contracts**
   - Update contract end dates
   - Process final billing

4. **Update assets**
   - Return or reassign devices
   - Update RMM status

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Name is required | Client must have a name |
| 400 | Invalid client_id | Parent client doesn't exist |
| 400 | Duplicate email | Contact email already in use |
| 404 | Client not found | Verify client ID |
| 409 | Cannot delete - has related records | Deactivate instead |

### Validation Patterns

```javascript
function validateClient(client) {
  const errors = [];

  if (!client.name || client.name.trim() === '') {
    errors.push('Client name is required');
  }

  if (client.emailaddress && !isValidEmail(client.emailaddress)) {
    errors.push('Invalid email format');
  }

  if (client.website && !isValidUrl(client.website)) {
    errors.push('Invalid website URL');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Best Practices

1. **Standardize naming** - Use consistent company name formats
2. **Verify before creating** - Always search first to prevent duplicates
3. **Maintain data quality** - Regular audits of contact information
4. **Use classifications** - Categorize clients for reporting
5. **Track account managers** - Assign for accountability
6. **Keep contacts current** - Deactivate departed employees
7. **Document relationships** - Use notes for key account information
8. **Set up hierarchy correctly** - Proper parent-child for billing

## Data Quality Queries

### Find clients without contacts
```http
GET /api/Client?hasusers=false&inactive=false
```

### Find contacts without email
```http
GET /api/Users?emailaddress=null&inactive=false
```

### Find duplicate client names
```javascript
async function findDuplicateClients() {
  const clients = await fetchAllClients();
  const names = {};
  const duplicates = [];

  clients.forEach(client => {
    const normalized = client.name.toLowerCase().trim();
    if (names[normalized]) {
      duplicates.push({
        name: client.name,
        ids: [names[normalized], client.id]
      });
    } else {
      names[normalized] = client.id;
    }
  });

  return duplicates;
}
```

## Related Skills

- [HaloPSA Tickets](../tickets/SKILL.md) - Service tickets for clients
- [HaloPSA Contracts](../contracts/SKILL.md) - Service agreements
- [HaloPSA Assets](../assets/SKILL.md) - Client assets
- [HaloPSA API Patterns](../api-patterns/SKILL.md) - Authentication and queries
