---
description: Search HubSpot deals by name, stage, or company
argument-hint: "[query] [stage] [company] [min_amount] [max_amount]"
arguments: [query, stage, company, min_amount, max_amount]
---

# Search HubSpot Deals

Search for deals in HubSpot CRM by name, pipeline stage, company, or amount. Returns matching deals with pipeline position, value, and close date information.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `hubspot_search_deals`, `hubspot_retrieve_deal`, and `hubspot_search_companies` available

## Steps

1. **Build search filters** based on the user's parameters

   - If a query is provided, search `dealname` using `CONTAINS_TOKEN`
   - If a stage is provided, filter by `dealstage` using `EQ`
   - If a company is provided, first find the company ID with `hubspot_search_companies`, then use `hubspot_access_associations` to find deals, or filter by associated company
   - If amount filters are provided, add `GT`/`LT` filters on `amount`

2. **Execute the search** using `hubspot_search_deals`

   Call `hubspot_search_deals` with the constructed `filterGroups`, `limit=100`, sorted by `amount` descending.

3. **Enrich results** with company names if not already included

   For each deal, optionally call `hubspot_access_associations` to get the associated company name.

4. **Format and return results** with deal details

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| query | string | No | - | Deal name keyword search |
| stage | string | No | all | Pipeline stage filter |
| company | string | No | all | Company name filter |
| min_amount | number | No | - | Minimum deal amount |
| max_amount | number | No | - | Maximum deal amount |

## Examples

### Search by Deal Name

```
/search-deals "Managed Services"
```

### Search by Stage

```
/search-deals --stage proposalpending
```

### Search by Company

```
/search-deals --company "Acme Corp"
```

### Search High-Value Open Deals

```
/search-deals --min_amount 10000
```

### Combined Search

```
/search-deals "IT Services" --stage contractsent --min_amount 5000
```

## Output

### Standard Results

```
Found 5 deals matching criteria

+--------------------------------------------+-------------------+--------+-----------+------------+
| Deal Name                                  | Company           | Amount | Stage     | Close Date |
+--------------------------------------------+-------------------+--------+-----------+------------+
| Acme Corp - Managed IT Services            | Acme Corporation  | $5,000 | Proposal  | 2026-04-15 |
| Beta Inc - Network Upgrade                 | Beta Inc          | $12,000| Contract  | 2026-03-01 |
| Gamma Tech - Endpoint Protection           | Gamma Technologies| $2,400 | Qualified | 2026-05-01 |
| Delta LLC - Cloud Migration                | Delta LLC         | $8,500 | Proposal  | 2026-04-30 |
| Epsilon Corp - Backup Solution             | Epsilon Corp      | $1,800 | Discovery | 2026-06-15 |
+--------------------------------------------+-------------------+--------+-----------+------------+

Total Pipeline Value: $29,700
Weighted Forecast:    $15,540

Quick Actions:
  - Pipeline overview: /pipeline-summary
  - Create deal: /create-deal --company "Company Name"
```

### Single Result with Details

```
Found 1 deal matching "Acme Corp - Managed IT"

Deal: Acme Corp - Managed IT Services
================================================================
ID:              54321
Amount:          $5,000/month
Stage:           Proposal Pending (60% probability)
Pipeline:        Sales Pipeline
Close Date:      2026-04-15
Owner:           Sarah Johnson
Deal Type:       New Business
Created:         2026-01-10
Last Modified:   2026-02-20

Weighted Value:  $3,000
Annual Value:    $60,000

Associated Records:
  - Company: Acme Corporation (ID: 98765)
  - Contacts: John Smith (IT Director), Jane Doe (CFO)

Quick Actions:
  - Update stage: Ask to move deal to next stage
  - Log activity: /log-activity --deal "Acme Corp - Managed IT Services"
  - View company: /lookup-company "Acme Corporation"
================================================================
```

### No Results

```
No deals found matching criteria

Suggestions:
  - Check spelling of the deal name
  - Try a broader search (e.g., "Services" instead of "Managed IT Services")
  - Remove stage or amount filters to widen the search
  - Check all stages: /search-deals --company "Company Name"
  - View full pipeline: /pipeline-summary
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### Invalid Stage

```
Error: Invalid deal stage "unknown_stage"

Valid stages (default pipeline):
  - appointmentscheduled
  - qualifiedtobuy
  - presentationscheduled
  - decisionmakerboughtin
  - contractsent
  - closedwon
  - closedlost

Note: Your HubSpot account may have custom stages.
Use hubspot_list_deal_properties to check available values.
```

### Rate Limit

```
Error: Rate limit exceeded (429)

HubSpot allows 100 requests per 10 seconds.
Please wait a moment and try again.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `hubspot_search_deals` | Search deals by name, stage, and amount |
| `hubspot_retrieve_deal` | Get full deal details for single results |
| `hubspot_search_companies` | Resolve company name to ID for filtering |
| `hubspot_access_associations` | Get associated contacts and companies |

## Related Commands

- `/pipeline-summary` - Full pipeline overview with stage totals
- `/create-deal` - Create a new deal
- `/lookup-company` - View a company's deals and contacts
- `/log-activity` - Log a note or task on a deal
