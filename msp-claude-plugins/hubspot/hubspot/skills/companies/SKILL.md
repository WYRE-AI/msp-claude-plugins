---
name: "HubSpot Companies"
description: >
  HubSpot company records: core fields, industry classification values,
  lifecycle stages, domain-based deduplication and automatic contact-company
  matching, and cross-referencing associated contacts, deals, and tickets.
when_to_use: >-
  When searching, creating, updating, or auditing company records in HubSpot CRM. Use when:
  hubspot company, hubspot organization, hubspot client, hubspot account, company search hubspot,
  company management hubspot, hubspot domain, hubspot industry, client management hubspot, or
  company audit hubspot.
---

# HubSpot Company Management

## Overview

Companies in HubSpot represent organizations -- MSP clients, prospects, vendors, or partners. Companies are a central entity in the CRM that ties together contacts (the people who work there), deals (sales opportunities), and tickets (support requests). For MSPs, companies typically represent managed clients, each with associated contacts, service agreements, and support history. HubSpot can automatically associate contacts with companies based on email domain matching.

## Conduit connector

Conduit's `hubspot` connector is HubSpot's own hosted MCP server (`https://mcp.hubspot.com/anthropic/v1/mcp`, OAuth). Its CRM tools are generic over object type, so every call names the `objectType`:

| Tool | Call shape |
|------|-----------|
| `search_crm_objects` | `objectType`, optional `query` (free text), `filterGroups` (property `filters` and `associatedWith` association filters), `properties`, `sorts`, `limit` (max 200), `offset` |
| `get_crm_objects` | `objectType`, `objectIds` (1-100), `properties` |
| `manage_crm_objects` | `createRequest.objects[]` or `updateRequest.objects[]` (each with `objectType`, `properties`, optional `associations`, and `objectId` for updates), plus `confirmationStatus` (`CONFIRMED` only after the user approved the exact change) |
| `search_properties` / `get_properties` | Discover property names and enumeration values for an `objectType` |
| `search_owners` | Resolve `hubspot_owner_id` values to people |

Parameter names in the tables below (such as `contactId` or `after`) describe the HubSpot fields involved; send them in the call shapes above. See `hubspot-api-patterns` for the full tool list.

## Anti-triggers

- **A named person at the organization** — use `hubspot-contacts`.
- **The revenue opportunity with that organization** — amount, stage, and
  close date live on a deal, not the company; use `hubspot-deals`.
- **The organization as a billing entity** — HubSpot companies hold no AR
  balance; use `xero-contacts` or `qbo-customers`.
- **Companies seen visiting the website but not yet in the CRM** — use
  `warmly-visitor-intelligence`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `get_crm_objects` (`objectType: "companies"`) | Get a single company by ID | `companyId` (required) |
| `manage_crm_objects` (`createRequest`, `objectType: "companies"`) | Create a new company | `name` (required), `domain`, `industry`, `phone` |
| `manage_crm_objects` (`updateRequest`, `objectType: "companies"`) | Update an existing company | `companyId` (required), property fields to update |
| `search_properties` (`objectType: "companies"`) | List all available company properties | None |
| `search_crm_objects` (`objectType: "companies"`) | Search companies by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Search Companies

Call `search_crm_objects` (`objectType: "companies"`) with filter groups to find companies:

**Search by name:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "name",
          "operator": "CONTAINS_TOKEN",
          "value": "Acme"
        }
      ]
    }
  ],
  "limit": 100
}
```

**Search by domain:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "domain",
          "operator": "EQ",
          "value": "acmecorp.com"
        }
      ]
    }
  ]
}
```

**Search by industry:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "industry",
          "operator": "EQ",
          "value": "INFORMATION_TECHNOLOGY_AND_SERVICES"
        }
      ]
    }
  ],
  "sorts": [
    {
      "propertyName": "name",
      "direction": "ASCENDING"
    }
  ],
  "limit": 100
}
```

**Search by lifecycle stage (find all customers):**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "lifecyclestage",
          "operator": "EQ",
          "value": "customer"
        }
      ]
    }
  ],
  "limit": 100
}
```

### Create a Company

Call `manage_crm_objects` (`createRequest`, `objectType: "companies"`) with the company's properties:

**Example: Create a new managed client:**
- `name`: `Acme Corporation`
- `domain`: `acmecorp.com`
- `industry`: `INFORMATION_TECHNOLOGY_AND_SERVICES`
- `phone`: `555-123-4567`
- `city`: `Springfield`
- `state`: `Illinois`
- `country`: `United States`
- `numberofemployees`: `150`
- `annualrevenue`: `25000000`
- `lifecyclestage`: `customer`

### Update a Company

Call `manage_crm_objects` (`updateRequest`, `objectType: "companies"`) with the `companyId` and the properties to change:

**Example: Update lifecycle stage and employee count:**
- `companyId`: `98765`
- `lifecyclestage`: `customer`
- `numberofemployees`: `175`

### Retrieve a Company

Call `get_crm_objects` (`objectType: "companies"`) with the `companyId`:

**Example:**
- `get_crm_objects` (`objectType: "companies"`) with `companyId=98765`

## Key Concepts

### Company vs. Contact

In HubSpot's model:

- **Company** - The organization (e.g., "Acme Corporation")
- **Contact** - Individual people at the organization (e.g., "John Smith, IT Director")

A company can have many contacts. HubSpot automatically associates contacts with companies based on email domain (e.g., anyone with `@acmecorp.com` is associated with the company that has `domain=acmecorp.com`).

### Company Lifecycle Stages

Companies share lifecycle stages with contacts:

| Stage | Description | MSP Context |
|-------|-------------|-------------|
| `subscriber` | Signed up for updates | Company on mailing list |
| `lead` | Expressed interest | Requested an MSP consultation |
| `marketingqualifiedlead` | Marketing qualified | Meets ideal client profile |
| `salesqualifiedlead` | Sales qualified | Budget, authority, need confirmed |
| `opportunity` | Active opportunity | Proposal sent or in negotiation |
| `customer` | Paying customer | Under managed services agreement |
| `evangelist` | Advocate | Actively refers new business |
| `other` | Custom stage | Does not fit standard stages |

### Domain-Based Deduplication

HubSpot uses the `domain` property to prevent duplicate company records. When creating a company, always set the domain -- HubSpot will warn if a company with that domain already exists.

## Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Company name |
| `domain` | string | Primary website domain (e.g., `acmecorp.com`) |
| `industry` | enumeration | Industry classification |
| `phone` | string | Phone number |
| `address` | string | Street address |
| `address2` | string | Address line 2 |
| `city` | string | City |
| `state` | string | State or region |
| `zip` | string | Postal code |
| `country` | string | Country |
| `website` | string | Company website URL |
| `numberofemployees` | number | Employee count |
| `annualrevenue` | number | Annual revenue |
| `lifecyclestage` | enumeration | Lifecycle stage |
| `hubspot_owner_id` | number | Assigned owner (user ID) |
| `description` | string | Company description |
| `founded_year` | string | Year founded |
| `type` | enumeration | Company type (Prospect, Partner, Reseller, Vendor, Other) |
| `createdate` | datetime | Record creation date |
| `lastmodifieddate` | datetime | Last modification date |
| `notes_last_updated` | datetime | Last note timestamp |
| `num_associated_contacts` | number | Number of associated contacts |
| `num_associated_deals` | number | Number of associated deals |
| `hs_num_open_deals` | number | Number of open deals |
| `total_revenue` | number | Total revenue from closed deals |

### Industry Values

Common industry values for MSP clients:

| Value | Display Name |
|-------|-------------|
| `ACCOUNTING` | Accounting |
| `CONSTRUCTION` | Construction |
| `EDUCATION_MANAGEMENT` | Education Management |
| `FINANCIAL_SERVICES` | Financial Services |
| `HEALTH_WELLNESS_AND_FITNESS` | Health, Wellness and Fitness |
| `HOSPITAL_HEALTH_CARE` | Hospital & Health Care |
| `INFORMATION_TECHNOLOGY_AND_SERVICES` | Information Technology and Services |
| `INSURANCE` | Insurance |
| `LAW_PRACTICE` | Law Practice |
| `MANUFACTURING` | Manufacturing |
| `NONPROFIT_ORGANIZATION_MANAGEMENT` | Nonprofit Organization Management |
| `REAL_ESTATE` | Real Estate |
| `RETAIL` | Retail |

## Common Workflows

### Find a Company by Name or Domain

1. Call `search_crm_objects` (`objectType: "companies"`) with a filter on `name` using `CONTAINS_TOKEN` or on `domain` using `EQ`
2. Review the results and note the `id` for further operations
3. If not found by name, try searching by domain

### Create a New Managed Client

1. **Check for duplicates** - Search by domain first using `search_crm_objects` (`objectType: "companies"`)
2. **Create the company** - Call `manage_crm_objects` (`createRequest`, `objectType: "companies"`) with name, domain, industry, address, employee count, and `lifecyclestage=customer`
3. **Create contacts** - Add the primary contact using `manage_crm_objects` (`createRequest`, `objectType: "contacts"`)
4. **Associate contacts** - Call `manage_crm_objects` (`updateRequest` with `associations`) to link contacts to the company
5. **Log setup note** - Call `manage_crm_objects` (`createRequest`, `objectType: "notes"`) to document the onboarding

### Company Audit Report

1. Call `search_crm_objects` (`objectType: "companies"`) with `lifecyclestage=customer` and `limit=100`
2. Paginate through all results using the `after` cursor
3. For each company, call `search_crm_objects` (`associatedWith` filter) to get associated contacts and deals
4. Build a report with company name, domain, industry, employee count, contact count, open deal count, and last activity date
5. Flag companies with no contacts, no recent activity, or missing domain

### Look Up Company with Associated Records

1. Search for the company by name or domain
2. Call `search_crm_objects` with `objectType: "contacts"` and an `associatedWith` filter `{ objectType: "companies", operator: "EQUAL", objectIdValues: [<companyId>] }` to get contacts
3. Call `search_crm_objects` with `objectType: "deals"` and an `associatedWith` filter on the same record to get deals
4. Call `search_crm_objects` with `objectType: "tickets"` and an `associatedWith` filter on the same record to get tickets
5. Present a complete company profile with all associated records

### Client Portfolio Review

1. Call `search_crm_objects` (`objectType: "companies"`) with `lifecyclestage=customer`, sorted by `annualrevenue` descending
2. For each company, note revenue, industry, and employee count
3. Calculate total portfolio revenue and average company size
4. Identify growth opportunities (companies with no open deals)

## Response Examples

**Single Company:**

```json
{
  "id": "98765",
  "properties": {
    "name": "Acme Corporation",
    "domain": "acmecorp.com",
    "industry": "INFORMATION_TECHNOLOGY_AND_SERVICES",
    "phone": "555-123-4567",
    "city": "Springfield",
    "state": "Illinois",
    "country": "United States",
    "numberofemployees": "150",
    "annualrevenue": "25000000",
    "lifecyclestage": "customer",
    "hubspot_owner_id": "67890",
    "createdate": "2025-03-10T08:00:00.000Z",
    "lastmodifieddate": "2026-02-15T16:30:00.000Z",
    "num_associated_contacts": "12",
    "num_associated_deals": "3"
  },
  "createdAt": "2025-03-10T08:00:00.000Z",
  "updatedAt": "2026-02-15T16:30:00.000Z"
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Company not found | Invalid company ID | Verify the ID with `search_crm_objects` (`objectType: "companies"`) |
| Duplicate domain | Company with this domain already exists | Search by domain first to find the existing record |
| Invalid property | Property name not recognized | Use `search_properties` (`objectType: "companies"`) to check available properties |
| Invalid industry | Industry value not valid | Use `search_properties` (`objectType: "companies"`) to see allowed industry values |
| Rate limited | Too many requests | Wait 10 seconds and retry |

## Best Practices

1. **Always set domain** - The domain field enables automatic contact-company association and deduplication
2. **Use lifecycle stages** - Track companies through your MSP's sales pipeline
3. **Set industry** - Categorize companies by industry for better segmentation and reporting
4. **Assign owners** - Set `hubspot_owner_id` to assign an account manager to each client
5. **Track employee count and revenue** - Keep these fields updated for client sizing and prioritization
6. **Associate all contacts** - Ensure every contact at a client company is linked to the company record
7. **Audit quarterly** - Review company records for completeness and accuracy
8. **Use company type** - Set the `type` field (Prospect, Partner, Vendor, etc.) for clear categorization
9. **Standardize naming** - Use consistent company naming conventions across HubSpot and your PSA

## Related Skills

- [HubSpot API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [HubSpot Contacts](../contacts/SKILL.md) - Contacts associated with companies
- [HubSpot Deals](../deals/SKILL.md) - Deals associated with companies
- [HubSpot Tickets](../tickets/SKILL.md) - Support tickets for companies
- [HubSpot Activities](../activities/SKILL.md) - Notes, tasks, and engagement tracking
