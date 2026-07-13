---
name: "HubSpot Contacts"
description: >
  Use this skill when working with HubSpot contacts - searching, creating,
  updating, and managing contact records in HubSpot CRM. Covers contact
  fields, lifecycle stages, lead status, search patterns, and associating
  contacts with companies and deals.
when_to_use: >-
  When searching, creating, updating, and managing contact records in HubSpot CRM. Use when:
  hubspot contact, hubspot lead, hubspot person, hubspot email lookup, contact search hubspot,
  contact management hubspot, hubspot prospect, client contact hubspot, hubspot lifecycle, or lead
  management hubspot.
---

# HubSpot Contact Management

## Overview

Contacts in HubSpot represent individual people -- clients, prospects, vendors, or any person your MSP interacts with. Contacts are the foundational entity in HubSpot CRM. They can be associated with companies, deals, tickets, and activities to build a complete picture of every relationship. For MSPs, contacts typically represent client employees, decision-makers, technical contacts, and billing contacts at managed companies.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_contact` | Get a single contact by ID | `contactId` (required) |
| `hubspot_create_contact` | Create a new contact | `email` (required), `firstname`, `lastname`, `phone`, `company` |
| `hubspot_update_contact` | Update an existing contact | `contactId` (required), property fields to update |
| `hubspot_list_contacts` | List contacts with pagination | `limit`, `after` (cursor) |
| `hubspot_list_contact_properties` | List all available contact properties | None |
| `hubspot_search_contacts` | Search contacts by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Search Contacts

Call `hubspot_search_contacts` with filter groups to find contacts:

**Search by email domain (find all contacts at a company):**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "email",
          "operator": "CONTAINS_TOKEN",
          "value": "acmecorp.com"
        }
      ]
    }
  ],
  "limit": 100
}
```

**Search by name:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "firstname",
          "operator": "EQ",
          "value": "John"
        },
        {
          "propertyName": "lastname",
          "operator": "EQ",
          "value": "Smith"
        }
      ]
    }
  ]
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
  "sorts": [
    {
      "propertyName": "lastname",
      "direction": "ASCENDING"
    }
  ],
  "limit": 100
}
```

### Create a Contact

Call `hubspot_create_contact` with the contact's properties:

**Example: Create a new client contact:**
- `email`: `jane.doe@acmecorp.com`
- `firstname`: `Jane`
- `lastname`: `Doe`
- `phone`: `555-987-6543`
- `company`: `Acme Corporation`
- `jobtitle`: `IT Director`
- `lifecyclestage`: `customer`

### Update a Contact

Call `hubspot_update_contact` with the `contactId` and the properties to change:

**Example: Update lifecycle stage and lead status:**
- `contactId`: `12345`
- `lifecyclestage`: `customer`
- `hs_lead_status`: `CONNECTED`

### Retrieve a Contact

Call `hubspot_retrieve_contact` with the `contactId`:

**Example:**
- `hubspot_retrieve_contact` with `contactId=12345`

## Key Concepts

### Lifecycle Stages

Lifecycle stages track where a contact is in your MSP's sales and service process:

| Stage | Description | MSP Context |
|-------|-------------|-------------|
| `subscriber` | Signed up for updates | Newsletter subscriber |
| `lead` | Expressed interest | Downloaded a whitepaper or filled out a form |
| `marketingqualifiedlead` | Marketing qualified | Meets marketing criteria for outreach |
| `salesqualifiedlead` | Sales qualified | Confirmed interest in MSP services |
| `opportunity` | Active opportunity | In an active sales conversation |
| `customer` | Paying customer | Signed MSP agreement, receiving services |
| `evangelist` | Advocate | Actively refers new business |
| `other` | Custom stage | Does not fit standard stages |

### Lead Status

Lead status tracks the disposition of sales outreach:

| Status | Description |
|--------|-------------|
| `NEW` | New lead, not yet contacted |
| `OPEN` | Open lead, in active outreach |
| `IN_PROGRESS` | Engaged in conversation |
| `OPEN_DEAL` | Deal created, in pipeline |
| `UNQUALIFIED` | Does not meet qualification criteria |
| `ATTEMPTED_TO_CONTACT` | Outreach attempted, no response |
| `CONNECTED` | Connected, conversation initiated |
| `BAD_TIMING` | Interested but not ready |

### Contact Owner

The `hubspot_owner_id` property assigns a contact to a specific user in your HubSpot account. For MSPs, this is typically the account manager or sales rep responsible for the relationship.

## Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Email address (primary identifier) |
| `firstname` | string | First name |
| `lastname` | string | Last name |
| `phone` | string | Phone number |
| `mobilephone` | string | Mobile phone number |
| `company` | string | Company name (text field) |
| `jobtitle` | string | Job title |
| `address` | string | Street address |
| `city` | string | City |
| `state` | string | State or region |
| `zip` | string | Postal code |
| `country` | string | Country |
| `website` | string | Personal website |
| `lifecyclestage` | enumeration | Lifecycle stage |
| `hs_lead_status` | enumeration | Lead status |
| `hubspot_owner_id` | number | Assigned owner (user ID) |
| `createdate` | datetime | Record creation date |
| `lastmodifieddate` | datetime | Last modification date |
| `notes_last_updated` | datetime | Last note timestamp |
| `num_associated_deals` | number | Number of associated deals |
| `hs_email_last_send_date` | datetime | Last email sent |
| `hs_email_last_open_date` | datetime | Last email opened |

### MSP-Relevant Custom Fields

Many MSPs add custom properties for contacts. Common examples:

| Field | Type | Description |
|-------|------|-------------|
| `preferred_contact_method` | enumeration | Email, phone, or text |
| `technical_skill_level` | enumeration | Basic, intermediate, advanced |
| `decision_maker` | boolean | Is this person a decision-maker |
| `primary_contact` | boolean | Primary contact for the company |

## Common Workflows

### Find a Contact by Email

1. Call `hubspot_search_contacts` with a filter on `email` using `EQ` operator
2. If not found, try `CONTAINS_TOKEN` for partial domain matching
3. Review the results and note the `id` for further operations

### Find All Contacts at a Company

1. Call `hubspot_search_contacts` with a filter on `email` using `CONTAINS_TOKEN` with the company's email domain
2. Alternatively, use `hubspot_access_associations` on the company object to get associated contacts
3. For each contact, review role and lifecycle stage

### Create a New Client Contact

1. **Check for duplicates** - Search by email first using `hubspot_search_contacts`
2. **Create the contact** - Call `hubspot_create_contact` with email, name, phone, company, job title, and `lifecyclestage=customer`
3. **Associate with company** - Call `hubspot_create_association` to link the contact to the company record
4. **Log onboarding note** - Call `hubspot_create_note` to document the new contact setup

### Update Contact After Sales Conversion

1. Call `hubspot_update_contact` with:
   - `lifecyclestage`: `customer`
   - `hs_lead_status`: `CONNECTED`
2. Call `hubspot_create_note` to log the conversion details
3. Call `hubspot_create_task` to create onboarding follow-up tasks

### Contact Audit for a Client Company

1. Find the company with `hubspot_search_companies`
2. Call `hubspot_access_associations` to get all contacts associated with the company
3. Retrieve each contact with `hubspot_retrieve_contact`
4. Build a report with name, email, job title, lifecycle stage, and last activity date
5. Flag contacts without email addresses or with stale last activity dates

## Response Examples

**Single Contact:**

```json
{
  "id": "12345",
  "properties": {
    "email": "john.smith@acmecorp.com",
    "firstname": "John",
    "lastname": "Smith",
    "phone": "555-123-4567",
    "company": "Acme Corporation",
    "jobtitle": "IT Director",
    "lifecyclestage": "customer",
    "hs_lead_status": "CONNECTED",
    "hubspot_owner_id": "67890",
    "createdate": "2025-06-15T10:30:00.000Z",
    "lastmodifieddate": "2026-02-10T14:15:00.000Z"
  },
  "createdAt": "2025-06-15T10:30:00.000Z",
  "updatedAt": "2026-02-10T14:15:00.000Z"
}
```

**Search Results:**

```json
{
  "total": 3,
  "results": [
    {
      "id": "12345",
      "properties": {
        "email": "john.smith@acmecorp.com",
        "firstname": "John",
        "lastname": "Smith",
        "company": "Acme Corporation"
      }
    },
    {
      "id": "12346",
      "properties": {
        "email": "jane.doe@acmecorp.com",
        "firstname": "Jane",
        "lastname": "Doe",
        "company": "Acme Corporation"
      }
    }
  ]
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Contact not found | Invalid contact ID | Verify the ID with `hubspot_search_contacts` |
| Duplicate email | Contact with this email already exists | Search for existing contact first |
| Invalid property | Property name not recognized | Use `hubspot_list_contact_properties` to check available properties |
| Invalid lifecycle stage | Stage value not valid | Use one of: subscriber, lead, marketingqualifiedlead, salesqualifiedlead, opportunity, customer, evangelist, other |
| Rate limited | Too many requests | Wait 10 seconds and retry |

## Best Practices

1. **Always search before creating** - Check for existing contacts by email to avoid duplicates
2. **Use lifecycle stages consistently** - Define clear criteria for each stage in your MSP's process
3. **Associate contacts with companies** - Always link contacts to their company record for full context
4. **Track lead status** - Update lead status as sales conversations progress
5. **Assign owners** - Set `hubspot_owner_id` so team members know who manages each relationship
6. **Log activities** - Create notes and tasks on contacts to maintain a complete activity history
7. **Use email domain search** - Find all contacts at a client by searching for the email domain
8. **Audit regularly** - Review contacts quarterly for stale records and missing information
9. **Standardize job titles** - Use consistent job title formats for better reporting
10. **Respect data privacy** - PHI properties are excluded from MCP responses by design

## Related Skills

- [HubSpot API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [HubSpot Companies](../companies/SKILL.md) - Company management and associations
- [HubSpot Deals](../deals/SKILL.md) - Deals associated with contacts
- [HubSpot Tickets](../tickets/SKILL.md) - Support tickets for contacts
- [HubSpot Activities](../activities/SKILL.md) - Notes, tasks, and engagement tracking
