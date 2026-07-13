---
name: "Pax8 Companies"
description: >
  Use this skill when working with Pax8 companies (MSP clients) -
  searching, retrieving, and managing client records in the
  Pax8 marketplace. Covers company fields, contact management, billing
  settings, and cross-referencing with subscriptions and orders.
when_to_use: >-
  When searching, retrieving, and managing client records in the Pax8 marketplace. Use when: pax8
  company, pax8 client, pax8 organization, pax8 customer, company lookup pax8, company management
  pax8, pax8 contact, or client management pax8.
---

# Pax8 Companies Management

## Overview

Companies in Pax8 represent the MSP's client organizations. Each company is associated with subscriptions, orders, invoices, and contacts. When an MSP provisions cloud software through Pax8, it is always tied to a specific company record. Companies are the foundational entity for all marketplace operations -- products are ordered for companies, subscriptions belong to companies, and invoices are generated per company.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `pax8-list-companies` | List and search companies | `page`, `size`, `sort` (name/city/country/stateOrProvince/postalCode), `order` (asc/desc), `company_name`, `status` (active/inactive/deleted) |
| `pax8-get-company-by-uuid` | Get a single company by ID | `uuid` (required) |

### List Companies

Call `pax8-list-companies` with optional parameters:

- **Search by name:** Set `company_name` to a company name (or partial name)
- **Filter by status:** Set `status` to `active`, `inactive`, or `deleted`
- **Sort results:** Set `sort` to a field name (e.g., `name`) and `order` to `asc` or `desc`
- **Paginate:** Set `page` (0-based) and `size` (up to 200)

**Example: Find all active companies sorted by name:**
- `pax8-list-companies` with `status=active`, `sort=name`, `order=asc`, `size=200`

**Example: Search for a company by name:**
- `pax8-list-companies` with `company_name=Acme`

### Get a Single Company

Call `pax8-get-company-by-uuid` with the `uuid` parameter set to the company's UUID.

**Example:**
- `pax8-get-company-by-uuid` with `uuid=a1b2c3d4-e5f6-7890-abcd-ef1234567890`

## Key Concepts

### Company Lifecycle

Companies in Pax8 follow a straightforward lifecycle:

| Stage | Description | Typical Actions |
|-------|-------------|-----------------|
| Creation | New client added to Pax8 | Set name, address, billing preferences |
| Active | Client with active subscriptions | Order products, manage licenses |
| Inactive | No active subscriptions | Review for reactivation or cleanup |

### Company vs. Partner

In Pax8's model:

- **Partner** - Your MSP organization (the authenticated user)
- **Company** - Your MSP's clients (the end customers you manage)

All company operations are scoped to your partner account.

### Billing Configuration

Companies have billing-related settings that control how Pax8 invoices are handled:

| Setting | Description |
|---------|-------------|
| `billOnBehalfOfEnabled` | Whether the MSP bills the client directly through Pax8 |
| `selfServiceAllowed` | Whether the client can self-manage subscriptions |
| `orderApprovalRequired` | Whether orders require MSP approval before provisioning |

## Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | System | Auto-generated unique identifier |
| `name` | string | Yes | Company name |
| `phone` | string | No | Phone number |
| `website` | string | No | Company website URL |
| `status` | string | System | Company status |
| `externalId` | string | No | External reference ID (for PSA integration) |
| `billOnBehalfOfEnabled` | boolean | No | Bill-on-behalf-of setting |
| `selfServiceAllowed` | boolean | No | Self-service access |
| `orderApprovalRequired` | boolean | No | Require order approval |
| `createdDate` | datetime | System | Creation timestamp |

### Address Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address.street` | string | No | Street address |
| `address.city` | string | No | City |
| `address.stateOrProvince` | string | No | State or province |
| `address.postalCode` | string | No | Postal/ZIP code |
| `address.country` | string | No | Country code (e.g., "US") |

### Contact Fields

Contacts are managed as a sub-resource of companies:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | System | Contact unique identifier |
| `firstName` | string | Yes | First name |
| `lastName` | string | Yes | Last name |
| `email` | string | Yes | Email address |
| `phone` | string | No | Phone number |
| `types` | array | No | Contact types (e.g., "Admin", "Billing", "Technical") |

## Common Workflows

### Find a Company by Name

1. Call `pax8-list-companies` with `company_name` set to the search term
2. Review the results in the `content` array
3. If the company is found, note its `id` (UUID) for use in other tools

### Get a Company's Full Details

1. Call `pax8-get-company-by-uuid` with the company's `uuid`
2. The response includes name, address, billing settings, and creation date

### New Client Onboarding in Pax8

1. **Find or create company** - Use `pax8-list-companies` to check if the company already exists
2. **Note the company UUID** for subsequent operations
3. **Place initial orders** - Use `pax8-list-products` to find products, then order through the Pax8 portal
4. **Verify subscriptions** - Use `pax8-list-subscriptions` with the `companyId` to confirm provisioning

### Cross-Reference with PSA

Use the `externalId` field to match Pax8 companies with PSA records:

1. Call `pax8-list-companies` to get all companies
2. Match each company's `externalId` to your PSA system's company IDs
3. Flag companies without an `externalId` as needing PSA linkage

### Company Audit Report

1. Call `pax8-list-companies` with `size=200` to get all companies (paginate if needed)
2. For each company, call `pax8-list-subscriptions` with `companyId` and `status=Active` to get active subscription count
3. Build a report with company name, external ID, location, subscription count, and billing settings

## Response Examples

**Single Company:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Acme Corporation",
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "stateOrProvince": "IL",
    "postalCode": "62704",
    "country": "US"
  },
  "phone": "555-123-4567",
  "website": "https://www.acme.com",
  "status": "Active",
  "externalId": "PSA-12345",
  "billOnBehalfOfEnabled": false,
  "selfServiceAllowed": false,
  "orderApprovalRequired": false,
  "createdDate": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Company not found | Invalid UUID | Verify the company UUID with `pax8-list-companies` |
| Invalid status filter | Wrong status value | Use `active`, `inactive`, or `deleted` |
| No results | Company name mismatch | Try a shorter or different search term |

## Best Practices

1. **Set external IDs** - Always link Pax8 companies to your PSA records using `externalId`
2. **Create contacts** - Add admin, billing, and technical contacts for each company
3. **Enable order approval** - Use `orderApprovalRequired` for new clients until trust is established
4. **Audit regularly** - Review company list quarterly for inactive or orphaned records
5. **Standardize naming** - Use consistent company naming conventions across Pax8 and your PSA
6. **Use pagination** - Always paginate when listing companies; do not assume small result sets
7. **Cache company lists** - Company data changes infrequently; cache for short periods
8. **Validate before creating** - Search for existing companies before creating duplicates
9. **Track billing config** - Document which companies have bill-on-behalf-of enabled
10. **Sync with PSA** - Regularly verify that Pax8 companies match your PSA company records

## Related Skills

- [Pax8 API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [Pax8 Subscriptions](../subscriptions/SKILL.md) - Subscription management per company
- [Pax8 Orders](../orders/SKILL.md) - Ordering products for companies
- [Pax8 Invoices](../invoices/SKILL.md) - Company billing and invoices
- [Pax8 Products](../products/SKILL.md) - Product catalog
