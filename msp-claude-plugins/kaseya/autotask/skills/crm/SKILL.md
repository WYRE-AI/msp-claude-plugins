---
name: "Autotask CRM"
description: >
  Use this skill when working with Autotask CRM - companies, contacts,
  sites/locations, and opportunities. Essential for MSP account management,
  client onboarding, and relationship tracking in Autotask PSA.
when_to_use: >-
  When working with companies, contacts, sites/locations, and opportunities in Autotask CRM. Use
  when: autotask company, autotask contact, autotask account, autotask crm, company management,
  contact management, client onboarding, autotask site, or autotask location.
---

# Autotask CRM Management

## Overview

Autotask CRM manages the core entities that define your client relationships: companies (accounts), contacts, and sites. Proper CRM data is foundational - tickets, contracts, projects, and billing all depend on accurate company and contact information.

## Key Concepts

### Company (Account)

The primary entity representing a client organization.

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `companyName` | Official company name | Yes |
| `companyType` | Customer, Lead, Prospect, etc. | Yes |
| `phone` | Main phone number | No |
| `address1` | Street address | No |
| `city` | City | No |
| `state` | State/Province | No |
| `postalCode` | ZIP/Postal code | No |
| `country` | Country | No |
| `webAddress` | Website URL | No |
| `parentCompanyID` | Parent company for hierarchies | No |
| `ownerResourceID` | Account manager | No |
| `classification` | Classification category | No |

### Company Types

| ID | Type | Use Case |
|----|------|----------|
| 1 | Customer | Active paying clients |
| 2 | Lead | Potential new business |
| 3 | Prospect | Qualified leads |
| 4 | Dead | Churned/lost clients |
| 5 | Vendor | Suppliers and partners |
| 6 | Partner | Strategic partners |

### Contact

Individual people at a company.

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `companyID` | Associated company | Yes |
| `firstName` | First name | Yes |
| `lastName` | Last name | Yes |
| `emailAddress` | Primary email | No |
| `phone` | Direct phone | No |
| `mobilePhone` | Mobile number | No |
| `title` | Job title | No |
| `isActive` | Active status | Yes |
| `isPrimaryContact` | Primary contact flag | No |

### Site/Location

Physical locations for a company (for on-site service).

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `companyID` | Parent company | Yes |
| `name` | Site name | Yes |
| `address1` | Street address | No |
| `city` | City | No |
| `isActive` | Active status | Yes |
| `isPrimaryLocation` | Primary site flag | No |

## API Patterns

### Creating a Company

```http
POST /v1.0/Companies
Content-Type: application/json
```

```json
{
  "companyName": "Acme Corporation",
  "companyType": 1,
  "phone": "555-123-4567",
  "address1": "123 Main Street",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "United States",
  "webAddress": "https://acme.example.com",
  "ownerResourceID": 29744150
}
```

### Searching Companies

```http
GET /v1.0/Companies/query?search={"filter":[{"field":"companyName","op":"contains","value":"acme"}]}
```

#### Common Search Patterns

**Search by name:**
```json
{
  "filter": [
    {"field": "companyName", "op": "contains", "value": "acme"}
  ]
}
```

**Active customers only:**
```json
{
  "filter": [
    {"field": "companyType", "op": "eq", "value": 1},
    {"field": "isActive", "op": "eq", "value": true}
  ]
}
```

**Companies by account manager:**
```json
{
  "filter": [
    {"field": "ownerResourceID", "op": "eq", "value": 29744150}
  ]
}
```

### Updating a Company

```http
PATCH /v1.0/Companies
Content-Type: application/json
```

```json
{
  "id": 12345,
  "phone": "555-987-6543",
  "webAddress": "https://newsite.acme.com"
}
```

### Creating a Contact

```http
POST /v1.0/Contacts
Content-Type: application/json
```

```json
{
  "companyID": 12345,
  "firstName": "John",
  "lastName": "Smith",
  "emailAddress": "john.smith@acme.example.com",
  "phone": "555-123-4567",
  "mobilePhone": "555-987-6543",
  "title": "IT Director",
  "isActive": 1,
  "isPrimaryContact": true
}
```

### Searching Contacts

**Contacts for a company:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "isActive", "op": "eq", "value": 1}
  ]
}
```

**Search by email:**
```json
{
  "filter": [
    {"field": "emailAddress", "op": "eq", "value": "john.smith@acme.example.com"}
  ]
}
```

### Creating a Site

```http
POST /v1.0/CompanyLocations
Content-Type: application/json
```

```json
{
  "companyID": 12345,
  "name": "Main Office",
  "address1": "123 Main Street",
  "city": "Springfield",
  "state": "IL",
  "postalCode": "62701",
  "country": "United States",
  "isPrimaryLocation": true,
  "isActive": 1
}
```

## Common Workflows

### Client Onboarding

1. **Create company record**
   - Set company type to Customer
   - Assign account manager
   - Add billing information

2. **Create primary contact**
   - Mark as primary contact
   - Verify email address

3. **Create site(s)**
   - Add all service locations
   - Mark primary location

4. **Set up contract**
   - Associate with company
   - Define service levels

5. **Configure billing**
   - Payment terms
   - Tax information

### Contact Management

1. **Verify before creating**
   - Search for existing contact by email
   - Check for duplicates

2. **Maintain accuracy**
   - Update titles when employees change roles
   - Mark contacts inactive when they leave
   - Add new contacts as needed

3. **Track relationships**
   - Note who can authorize work
   - Track technical vs billing contacts

### Company Hierarchy

For MSPs managing parent/child company relationships:

1. **Create parent company first**
2. **Create child companies with parentCompanyID**
3. **Contracts can roll up to parent**
4. **Reporting aggregates by hierarchy**

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Duplicate company name | Check for existing company, use unique name |
| 400 | Invalid email format | Verify email address syntax |
| 404 | Company not found | Verify company ID exists |
| 409 | Contact already exists | Search for existing contact first |

### Validation Errors

**"CompanyName is required"** - Company name cannot be empty or null

**"Invalid companyType"** - Must use valid company type ID from picklist

**"Email already exists"** - Contact with this email already exists

## Best Practices

1. **Standardize naming** - Use consistent company name formats
2. **Verify before creating** - Always search first to prevent duplicates
3. **Maintain data quality** - Regular audits of contact information
4. **Use classifications** - Categorize companies for reporting
5. **Track account managers** - Assign ownerResourceID for accountability
6. **Keep contacts current** - Inactive former employees
7. **Document relationships** - Use notes for key account information

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Service tickets for companies
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements
- [Autotask Projects](../projects/SKILL.md) - Project management
