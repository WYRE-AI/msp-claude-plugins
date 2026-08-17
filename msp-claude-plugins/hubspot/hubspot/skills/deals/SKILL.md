---
name: "HubSpot Deals"
description: >
  HubSpot deal records and sales pipelines: deal fields, default and custom
  pipeline stages, deal amount conventions (MRR vs. TCV), forecast categories
  and weighted forecasting, and associating deals with contacts and companies.
when_to_use: >-
  When searching, creating, updating, or reporting on deal records and pipelines in HubSpot CRM. Use
  when: hubspot deal, hubspot pipeline, hubspot opportunity, hubspot sale, hubspot revenue, deal
  search hubspot, deal management hubspot, hubspot forecast, hubspot deal stage, sales pipeline
  hubspot, or hubspot close date.
---

# HubSpot Deal & Pipeline Management

## Overview

Deals in HubSpot represent sales opportunities -- potential or active revenue from clients. For MSPs, deals track managed services agreements, project engagements, hardware sales, or any revenue opportunity moving through the sales process. Each deal belongs to a pipeline (e.g., "Sales Pipeline" or "Renewals") and progresses through stages (e.g., "Discovery", "Proposal", "Closed Won"). Deals are associated with contacts and companies to provide full context on who is involved and which client the revenue belongs to.

## Anti-triggers

- **Building or pricing the quote behind the deal** — a deal records *that* an
  opportunity exists and what it is worth; the line items, catalog, and margin
  live in `salesbuildr-quotes` or `connectwise-cpq-quotes`.
- **Sending the customer something to sign** — use `pandadoc-documents`.
- **Billing a won deal** — moving a deal to Closed Won invoices nobody; use
  `xero-invoices` or `qbo-invoices`.
- **Salesbuildr opportunities** — a different vendor's pipeline object with
  identical vocabulary; use `salesbuildr-opportunities`.

## MCP Tools

### Available Tools

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `hubspot_retrieve_deal` | Get a single deal by ID | `dealId` (required) |
| `hubspot_create_deal` | Create a new deal | `dealname` (required), `amount`, `dealstage`, `pipeline` |
| `hubspot_update_deal` | Update an existing deal | `dealId` (required), property fields to update |
| `hubspot_list_deal_properties` | List all available deal properties | None |
| `hubspot_search_deals` | Search deals by criteria | `filterGroups`, `sorts`, `limit`, `after` |

### Search Deals

Call `hubspot_search_deals` with filter groups to find deals:

**Search by deal name:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "dealname",
          "operator": "CONTAINS_TOKEN",
          "value": "Managed Services"
        }
      ]
    }
  ],
  "limit": 100
}
```

**Search by deal stage:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "dealstage",
          "operator": "EQ",
          "value": "proposalpendinng"
        }
      ]
    }
  ],
  "sorts": [
    {
      "propertyName": "amount",
      "direction": "DESCENDING"
    }
  ],
  "limit": 100
}
```

**Search by close date range (upcoming closings):**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "closedate",
          "operator": "GTE",
          "value": "2026-02-01"
        },
        {
          "propertyName": "closedate",
          "operator": "LTE",
          "value": "2026-03-31"
        }
      ]
    }
  ],
  "limit": 100
}
```

**Search for high-value open deals:**

```json
{
  "filterGroups": [
    {
      "filters": [
        {
          "propertyName": "amount",
          "operator": "GT",
          "value": "10000"
        },
        {
          "propertyName": "dealstage",
          "operator": "NOT_IN",
          "values": ["closedwon", "closedlost"]
        }
      ]
    }
  ],
  "sorts": [
    {
      "propertyName": "amount",
      "direction": "DESCENDING"
    }
  ],
  "limit": 100
}
```

### Create a Deal

Call `hubspot_create_deal` with the deal's properties:

**Example: Create a managed services deal:**
- `dealname`: `Acme Corp - Managed IT Services`
- `amount`: `5000`
- `dealstage`: `appointmentscheduled`
- `pipeline`: `default`
- `closedate`: `2026-04-15`
- `hubspot_owner_id`: `67890`

### Update a Deal

Call `hubspot_update_deal` with the `dealId` and the properties to change:

**Example: Move deal to next stage:**
- `dealId`: `54321`
- `dealstage`: `proposalpending`
- `amount`: `6000`

### Retrieve a Deal

Call `hubspot_retrieve_deal` with the `dealId`:

**Example:**
- `hubspot_retrieve_deal` with `dealId=54321`

## Key Concepts

### Default Pipeline Stages

HubSpot's default sales pipeline includes these stages (your account may have custom stages):

| Stage ID | Display Name | Probability | MSP Context |
|----------|-------------|-------------|-------------|
| `appointmentscheduled` | Appointment Scheduled | 20% | Discovery call booked |
| `qualifiedtobuy` | Qualified to Buy | 40% | Budget and authority confirmed |
| `presentationscheduled` | Presentation Scheduled | 60% | Demo or proposal meeting set |
| `decisionmakerboughtin` | Decision Maker Bought-In | 80% | Key stakeholder agrees |
| `contractsent` | Contract Sent | 90% | MSA or SOW sent for signature |
| `closedwon` | Closed Won | 100% | Deal signed, revenue booked |
| `closedlost` | Closed Lost | 0% | Deal did not close |

### Multiple Pipelines

HubSpot supports multiple pipelines for different deal types. Common MSP pipelines:

| Pipeline | Use Case |
|----------|----------|
| Sales Pipeline | New client acquisition |
| Renewals | Annual contract renewals |
| Projects | One-time project engagements |
| Hardware | Hardware procurement deals |

### Deal Amount

The `amount` field represents the deal's monetary value. For MSPs:

- **Monthly recurring deals** - Set amount to the monthly recurring revenue (MRR)
- **Annual contracts** - Set amount to the total contract value (TCV)
- **One-time projects** - Set amount to the project fee
- Be consistent within each pipeline to enable accurate forecasting

### Forecast Categories

Deals can be categorized for forecasting:

| Category | Description |
|----------|-------------|
| `omit` | Excluded from forecast |
| `pipeline` | In pipeline, not yet committed |
| `bestCase` | Best case scenario |
| `commit` | Committed, high confidence |
| `closed` | Closed won |

## Field Reference

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `dealname` | string | Deal name |
| `amount` | number | Deal amount (currency) |
| `dealstage` | enumeration | Current pipeline stage |
| `pipeline` | enumeration | Pipeline the deal belongs to |
| `closedate` | date | Expected or actual close date |
| `hubspot_owner_id` | number | Assigned owner (user ID) |
| `dealtype` | enumeration | Deal type (newbusiness, existingbusiness) |
| `description` | string | Deal description |
| `createdate` | datetime | Record creation date |
| `lastmodifieddate` | datetime | Last modification date |
| `notes_last_updated` | datetime | Last note timestamp |
| `hs_deal_stage_probability` | number | Stage-based close probability |
| `hs_forecast_amount` | number | Weighted forecast amount |
| `hs_forecast_probability` | number | Forecast probability |
| `hs_closed_amount` | number | Actual closed amount |
| `hs_is_closed` | boolean | Whether the deal is closed |
| `hs_is_closed_won` | boolean | Whether the deal is closed won |
| `num_associated_contacts` | number | Associated contacts count |
| `hs_num_associated_company` | number | Associated companies count |

## Common Workflows

### Search Deals by Stage

1. Call `hubspot_search_deals` with a filter on `dealstage`
2. Sort by `amount` descending to see highest-value deals first
3. Review associated companies and contacts for context

### Update Deal Stage

1. Call `hubspot_retrieve_deal` to confirm current stage and details
2. Call `hubspot_update_deal` with the new `dealstage` value
3. Optionally update `amount` if the deal value has changed
4. Call `hubspot_create_note` to document why the stage changed

### Pipeline Overview

1. Call `hubspot_search_deals` with a filter excluding `closedwon` and `closedlost` stages
2. Group results by `dealstage`
3. For each stage, calculate:
   - Number of deals
   - Total value
   - Average deal size
   - Weighted value (total * stage probability)
4. Sum weighted values for pipeline forecast

### Revenue Forecast

1. Call `hubspot_search_deals` with filters:
   - `dealstage` NOT IN `closedlost`
   - `closedate` within the forecast period
2. For closed-won deals, use actual `amount`
3. For open deals, calculate weighted amount: `amount * hs_deal_stage_probability`
4. Sum for total forecasted revenue

### Create a Deal with Company Association

1. **Find the company** - Call `hubspot_search_companies` with the company name
2. **Find the contact** - Call `hubspot_search_contacts` for the decision-maker
3. **Create the deal** - Call `hubspot_create_deal` with deal name, amount, stage, and close date
4. **Associate with company** - Call `hubspot_create_association` from deal to company
5. **Associate with contact** - Call `hubspot_create_association` from deal to contact
6. **Log creation note** - Call `hubspot_create_note` to document the deal context

### Stale Deal Review

1. Call `hubspot_search_deals` with filters:
   - `dealstage` NOT IN `closedwon`, `closedlost`
   - `lastmodifieddate` less than 30 days ago
2. For each stale deal, note the owner, company, and amount
3. Create tasks for deal owners to follow up

## Response Examples

**Single Deal:**

```json
{
  "id": "54321",
  "properties": {
    "dealname": "Acme Corp - Managed IT Services",
    "amount": "5000",
    "dealstage": "proposalpending",
    "pipeline": "default",
    "closedate": "2026-04-15T00:00:00.000Z",
    "hubspot_owner_id": "67890",
    "dealtype": "newbusiness",
    "hs_deal_stage_probability": "0.6",
    "createdate": "2026-01-10T09:00:00.000Z",
    "lastmodifieddate": "2026-02-20T11:30:00.000Z"
  },
  "createdAt": "2026-01-10T09:00:00.000Z",
  "updatedAt": "2026-02-20T11:30:00.000Z"
}
```

**Search Results:**

```json
{
  "total": 15,
  "results": [
    {
      "id": "54321",
      "properties": {
        "dealname": "Acme Corp - Managed IT Services",
        "amount": "5000",
        "dealstage": "proposalpending",
        "closedate": "2026-04-15T00:00:00.000Z"
      }
    },
    {
      "id": "54322",
      "properties": {
        "dealname": "Beta Inc - Network Upgrade",
        "amount": "12000",
        "dealstage": "contractsent",
        "closedate": "2026-03-01T00:00:00.000Z"
      }
    }
  ],
  "paging": {
    "next": {
      "after": "54322"
    }
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| Deal not found | Invalid deal ID | Verify the ID with `hubspot_search_deals` |
| Invalid deal stage | Stage ID not valid for the pipeline | Use `hubspot_list_deal_properties` to check valid stages |
| Invalid pipeline | Pipeline ID not recognized | Check your HubSpot account for available pipelines |
| Invalid close date | Date format incorrect | Use ISO 8601 format (YYYY-MM-DD) |
| Rate limited | Too many requests | Wait 10 seconds and retry |

## Best Practices

1. **Name deals consistently** - Use format "Company Name - Service Type" for easy identification
2. **Always set close date** - Forecast accuracy depends on close dates being realistic and updated
3. **Associate with company and contact** - Every deal should be linked to both for full context
4. **Update stages promptly** - Move deals through stages as conversations progress
5. **Track deal type** - Distinguish new business from existing business for accurate reporting
6. **Review stale deals** - Regularly check for deals that have not been updated recently
7. **Assign owners** - Every deal should have a `hubspot_owner_id` for accountability
8. **Separate pipelines** - Use distinct pipelines for different deal types (new sales, renewals, projects)

## Related Skills

- [HubSpot API Patterns](../api-patterns/SKILL.md) - MCP tools reference and connection info
- [HubSpot Contacts](../contacts/SKILL.md) - Contacts associated with deals
- [HubSpot Companies](../companies/SKILL.md) - Companies associated with deals
- [HubSpot Tickets](../tickets/SKILL.md) - Support tickets (may relate to deal delivery)
- [HubSpot Activities](../activities/SKILL.md) - Notes, tasks, and engagement tracking on deals
