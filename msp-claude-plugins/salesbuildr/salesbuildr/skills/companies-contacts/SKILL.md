---
name: "SalesBuildr Companies & Contacts"
description: >
  Salesbuildr companies and contacts: company search, contact filtering by
  company, and contact creation with its required fields.
when_to_use: >-
  When looking up a Salesbuildr customer or creating a contact. Use when:
  salesbuildr company, salesbuildr companies, salesbuildr contact,
  salesbuildr contacts, salesbuildr customer, search company salesbuildr, or
  create contact salesbuildr.
---

# Salesbuildr Companies & Contacts

## Overview

Companies and contacts are the foundation of the Salesbuildr CRM. Companies represent organizations (customers, prospects), while contacts are individuals associated with companies.

## Anti-triggers

- **The same organization in the CRM of record** — use `hubspot-companies` or
  `hubspot-contacts`.
- **The organization as a billing entity** — Salesbuildr holds no AR balance
  or payment method; use `xero-contacts`, `qbo-customers`, or
  `alternative-payments-customers`.
- **What the company has been quoted or is in the pipeline for** — use
  `salesbuildr-quotes` or `salesbuildr-opportunities`.

## Companies

### Search Companies

```
GET /companies?search=<term>&from=0&size=25
```

Parameters:
- `search` - Search term for company name
- `from` - Pagination offset
- `size` - Results per page (max 100)

### Get Company by ID

```
GET /companies/{id}
```

Returns full company details including address, phone, and metadata.

## Contacts

### Search Contacts

```
GET /contacts?search=<term>&company_id=<id>&from=0&size=25
```

Parameters:
- `search` - Search by name or email
- `company_id` - Filter contacts to a specific company
- `from` - Pagination offset
- `size` - Results per page (max 100)

### Get Contact by ID

```
GET /contacts/{id}
```

### Create Contact

```
POST /contacts

{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@example.com",
  "company_id": 12345,
  "phone": "555-0100"
}
```

Required fields: `first_name`, `last_name`, `company_id`

## Common Workflows

### Find a Customer's Contacts

1. Search companies: `GET /companies?search=acme`
2. Get company ID from results
3. Search contacts for that company: `GET /contacts?company_id=12345`

### Create a New Contact for Quoting

1. Find the company: `GET /companies?search=company name`
2. Verify company exists and get ID
3. Create contact: `POST /contacts` with company_id
