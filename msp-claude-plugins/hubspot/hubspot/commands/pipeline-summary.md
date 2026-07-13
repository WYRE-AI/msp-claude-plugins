---
description: Summarize the HubSpot deal pipeline - deals per stage, total value, and expected close dates
argument-hint: "[pipeline] [owner] [period]"
arguments: [pipeline, owner, period]
---

# HubSpot Pipeline Summary

Generate a summary of the HubSpot deal pipeline showing deals per stage, total and weighted values, and upcoming close dates. Provides a quick overview of sales health and revenue forecast.

## Prerequisites

- HubSpot MCP server connected with valid OAuth credentials
- MCP tools `hubspot_search_deals` and `hubspot_access_associations` available

## Steps

1. **Fetch all open deals** in the pipeline

   Call `hubspot_search_deals` with filters:
   - Exclude `closedwon` and `closedlost` stages
   - If a pipeline is specified, filter by `pipeline`
   - If an owner is specified, filter by `hubspot_owner_id`
   - If a period is specified, filter by `closedate` range
   - Set `limit=100` and paginate through all results

2. **Fetch closed-won deals** for the period (if period filter is set)

   Call `hubspot_search_deals` with `dealstage=closedwon` and the period filter to get won deals.

3. **Group deals by stage** and calculate metrics

   For each stage:
   - Count of deals
   - Total value (sum of amounts)
   - Weighted value (total * stage probability)
   - Average deal size
   - Nearest close date

4. **Calculate pipeline totals**

   - Total pipeline value
   - Total weighted forecast
   - Average deal size
   - Total deals
   - Won revenue (if period filter)

5. **Format and present the summary**

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| pipeline | string | No | default | Pipeline to summarize |
| owner | string | No | all | Filter by deal owner |
| period | string | No | all | Close date period (this_month, this_quarter, this_year, all) |

## Examples

### Full Pipeline Summary

```
/pipeline-summary
```

### This Quarter's Pipeline

```
/pipeline-summary --period this_quarter
```

### Specific Owner's Pipeline

```
/pipeline-summary --owner "Sarah Johnson"
```

### Combined Filters

```
/pipeline-summary --period this_month --owner "Sarah Johnson"
```

## Output

### Pipeline Overview

```
Sales Pipeline Summary
================================================================

Pipeline: Sales Pipeline
Period:   All Open Deals
Date:     2026-02-24

Stage Breakdown:
+-----------------------------+-------+-----------+-----------+---------+
| Stage                       | Deals | Total     | Weighted  | Avg     |
+-----------------------------+-------+-----------+-----------+---------+
| Appointment Scheduled (20%) | 4     | $18,500   | $3,700    | $4,625  |
| Qualified to Buy (40%)      | 3     | $22,000   | $8,800    | $7,333  |
| Presentation Scheduled (60%)| 2     | $13,000   | $7,800    | $6,500  |
| Decision Maker Bought-In(80)| 2     | $16,500   | $13,200   | $8,250  |
| Contract Sent (90%)         | 1     | $12,000   | $10,800   | $12,000 |
+-----------------------------+-------+-----------+-----------+---------+

Pipeline Totals:
  Total Deals:       12
  Total Value:       $82,000
  Weighted Forecast: $44,300
  Average Deal Size: $6,833
  Largest Deal:      Beta Inc - Network Upgrade ($12,000)
  Nearest Close:     2026-03-01 (Beta Inc - Network Upgrade)

Upcoming Closings (Next 30 Days):
  - Beta Inc - Network Upgrade: $12,000 (Contract Sent) - 2026-03-01
  - Gamma Tech - Endpoint Protection: $2,400 (Decision Maker) - 2026-03-15
  - Delta LLC - Annual Renewal: $8,500 (Contract Sent) - 2026-03-20

Quick Actions:
  - View deals: /search-deals --stage contractsent
  - Create deal: /create-deal --company "Company Name"
  - View stale deals: Ask about deals not updated in 30+ days
================================================================
```

### Period Summary (This Quarter)

```
Sales Pipeline Summary - Q1 2026
================================================================

Pipeline: Sales Pipeline
Period:   Q1 2026 (Jan 1 - Mar 31)

Closed Won This Quarter:
  Deals:   3
  Revenue: $15,200
  Avg:     $5,067

Still Open (Closing This Quarter):
  Deals:   4
  Value:   $28,500
  Weighted: $18,300

Forecast:
  Closed Revenue:   $15,200
  Weighted Open:    $18,300
  Total Forecast:   $33,500

================================================================
```

### Empty Pipeline

```
Sales Pipeline Summary
================================================================

Pipeline: Sales Pipeline
Period:   All Open Deals
Date:     2026-02-24

No open deals in the pipeline.

Suggestions:
  - Create a new deal: /create-deal --company "Company Name" --name "Deal Name" --amount 5000
  - Search for contacts to prospect: /search-contacts --lifecycle_stage lead
  - Review closed deals for renewal opportunities
================================================================
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to HubSpot MCP server

Check your MCP configuration and verify credentials at developers.hubspot.com
```

### Invalid Pipeline

```
Error: Pipeline "unknown_pipeline" not found

Available pipelines:
  - default (Sales Pipeline)

Note: Your HubSpot account may have additional pipelines.
Check HubSpot Settings > Objects > Deals > Pipelines.
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
| `hubspot_search_deals` | Fetch deals by stage, owner, and close date |
| `hubspot_retrieve_deal` | Get full deal details |
| `hubspot_access_associations` | Get associated companies for deal names |
| `hubspot_get_user_details` | Resolve owner names |

## Related Commands

- `/search-deals` - Search for specific deals
- `/create-deal` - Create a new deal
- `/lookup-company` - View a company's deals
- `/log-activity` - Log notes on deals
