---
description: Aggregate license counts and costs across all Pax8 client companies
argument-hint: "[vendor] [company] [show_optimization]"
arguments: [vendor, company, show_optimization]
---

# Pax8 License Summary

Generate an aggregated license summary across all client companies. Shows per-client license counts, costs, and identifies optimization opportunities such as unused licenses, cost savings from annual commitments, and consolidation recommendations.

## Prerequisites

- Pax8 MCP server connected with a valid MCP token
- MCP tools `pax8-list-companies`, `pax8-list-subscriptions`, `pax8-get-product-by-uuid`, and `pax8-get-product-pricing-by-uuid` available

## Steps

1. **Fetch all companies**

   Call `pax8-list-companies` with `size=200`, `sort=name`, `order=asc`. Paginate through all pages if needed.

2. **For each company, fetch active subscriptions**

   Call `pax8-list-subscriptions` with `companyId` set to the company UUID, `status=Active`, and `size=200`. Paginate if needed.

3. **Resolve product names** for each unique product ID

   Call `pax8-get-product-by-uuid` with `productId` for each unique product found across all subscriptions. Cache results to avoid duplicate lookups.

4. **Optionally fetch pricing** for margin analysis

   Call `pax8-get-product-pricing-by-uuid` with `productId` to get `partnerBuyPrice` and `suggestedRetailPrice`.

5. **Aggregate data** by company, product, and vendor

6. **Analyze for optimization opportunities**
   - Monthly subscriptions that could save money on annual terms
   - Companies with very low seat counts (potential consolidation)
   - Upcoming renewals that need review
   - Products with high per-seat costs relative to alternatives

7. **Format and return** the comprehensive summary

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| vendor | string | No | all | Filter by vendor name |
| company | string | No | all | Filter to specific company |
| show_optimization | boolean | No | true | Show optimization recommendations |

## Examples

### Full License Summary

```
/license-summary
```

### Microsoft Only

```
/license-summary --vendor Microsoft
```

### Single Company

```
/license-summary --company "Acme Corp"
```

### Without Optimization

```
/license-summary --show_optimization false
```

## Output

### Full Summary

```
Pax8 License Summary
================================================================
Generated: 2026-02-23
Companies: 47
Active Subscriptions: 312
Total Monthly Cost: $48,275.00

Top 10 Companies by Monthly Spend:
+----------------------------+-------+--------+----------+-------------+
| Company                    | Subs  | Seats  | Monthly  | % of Total  |
+----------------------------+-------+--------+----------+-------------+
| Enterprise Holdings        | 14    | 450    | $9,850.00| 20.4%       |
| Acme Corporation           | 8     | 125    | $4,275.00| 8.9%        |
| TechStart Inc              | 6     | 80     | $2,940.00| 6.1%        |
| Global Services LLC        | 9     | 200    | $2,800.00| 5.8%        |
| Metro Industries           | 5     | 65     | $1,950.00| 4.0%        |
| Riverside Dental           | 4     | 30     | $1,200.00| 2.5%        |
| Summit Financial           | 7     | 55     | $1,150.00| 2.4%        |
| Harbor Consulting          | 3     | 25     | $890.00  | 1.8%        |
| Lakewood Partners          | 4     | 35     | $780.00  | 1.6%        |
| Cedar Grove Realty          | 3     | 20     | $650.00  | 1.3%        |
+----------------------------+-------+--------+----------+-------------+
(37 more companies...)

License Breakdown by Vendor:
+----------------------------+--------+--------+----------+-------------+
| Vendor                     | Subs   | Seats  | Monthly  | % of Total  |
+----------------------------+--------+--------+----------+-------------+
| Microsoft                  | 185    | 2,450  | $32,100  | 66.5%       |
| SentinelOne                | 42     | 1,800  | $8,100   | 16.8%       |
| Acronis                    | 35     | 15TB   | $4,200   | 8.7%        |
| Keeper Security            | 28     | 950    | $2,375   | 4.9%        |
| Other                      | 22     | varies | $1,500   | 3.1%        |
+----------------------------+--------+--------+----------+-------------+

Top Products by Total Seats:
+--------------------------------------------+--------+----------+-----------+
| Product                                    | Seats  | Companies| Monthly   |
+--------------------------------------------+--------+----------+-----------+
| Microsoft 365 Business Premium             | 850    | 32       | $14,535   |
| Microsoft 365 Business Basic               | 420    | 28       | $2,268    |
| SentinelOne Singularity Control            | 1,200  | 38       | $5,400    |
| Microsoft 365 Business Standard            | 380    | 18       | $4,788    |
| Keeper Business                            | 650    | 25       | $1,950    |
+--------------------------------------------+--------+----------+-----------+

================================================================
```

### Optimization Recommendations

```
Optimization Opportunities
================================================================

1. ANNUAL COMMITMENT SAVINGS
   12 subscriptions on Monthly billing could save by switching to Annual:

   +----------------------------+-----------------------------+------+--------+---------+
   | Company                    | Product                     | Qty  | Save/mo| Save/yr |
   +----------------------------+-----------------------------+------+--------+---------+
   | Acme Corporation           | Microsoft Defender          | 25   | $45.00 | $540    |
   | TechStart Inc              | M365 Business Premium       | 30   | $54.00 | $648    |
   | Global Services LLC        | Microsoft Defender          | 50   | $90.00 | $1,080  |
   | Metro Industries           | Keeper Business             | 40   | $24.00 | $288    |
   +----------------------------+-----------------------------+------+--------+---------+
   Potential Total Savings: $3,816/year

2. LOW SEAT COUNT SUBSCRIPTIONS
   These subscriptions have very few seats and may be unused:

   +----------------------------+-----------------------------+------+---------+
   | Company                    | Product                     | Qty  | Monthly |
   +----------------------------+-----------------------------+------+---------+
   | Harbor Consulting          | Exchange Online Plan 2      | 1    | $7.20   |
   | Lakewood Partners          | Microsoft Teams Essentials  | 2    | $7.20   |
   | Cedar Grove Realty          | Acronis Cyber Protect       | 1    | $12.00  |
   +----------------------------+-----------------------------+------+---------+
   Action: Verify these licenses are in use. Cancel if unused.

3. UPCOMING RENEWALS (next 30 days)
   Review these subscriptions before auto-renewal:

   +----------------------------+-----------------------------+------+-----------+----------+
   | Company                    | Product                     | Qty  | Monthly   | Renews   |
   +----------------------------+-----------------------------+------+-----------+----------+
   | Enterprise Holdings        | M365 E3                     | 200  | $6,300.00 | 2026-03-15|
   | TechStart Inc              | SentinelOne Control         | 80   | $360.00   | 2026-03-20|
   +----------------------------+-----------------------------+------+-----------+----------+
   Action: Review seat counts and pricing before renewal.

4. PRODUCT CONSOLIDATION
   Multiple companies have overlapping security products:

   - 5 companies have both Microsoft Defender AND SentinelOne
     Consider standardizing on one endpoint security platform.

   - 3 companies have Exchange Online Plan 1 + Microsoft 365 (which includes Exchange)
     Exchange Online may be redundant if M365 licenses are sufficient.

Total Potential Monthly Savings: $543.00
Total Potential Annual Savings: $6,516.00

================================================================
```

### No Data

```
No active subscriptions found across any companies.

Possible reasons:
  - No companies exist in your Pax8 account
  - All subscriptions have been cancelled
  - MCP token may not have subscription access

Suggestions:
  - Verify companies exist in Pax8 portal
  - Check MCP token permissions
  - Place your first order: /create-order
```

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Pax8 MCP server

Check your MCP configuration and regenerate the token at app.pax8.com/integrations/mcp
```

### Rate Limit During Aggregation

```
Warning: Rate limit reached during data collection.

Partial results available for 23 of 47 companies.
Retry in 60 seconds to complete the summary.

Tip: The license-summary command makes multiple MCP tool calls.
For large partner accounts (100+ companies), this may take several minutes.
```

### Timeout

```
Warning: Data collection timed out.

Partial results collected for 35 of 47 companies.
This typically happens with large partner accounts.

Suggestions:
  - Filter by vendor: /license-summary --vendor Microsoft
  - Filter by company: /license-summary --company "Acme Corp"
  - Try again during off-peak hours
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pax8-list-companies` | Get all companies (paginated) |
| `pax8-list-subscriptions` | Get subscriptions per company |
| `pax8-get-product-by-uuid` | Resolve product names and details |
| `pax8-get-product-pricing-by-uuid` | Get pricing for margin analysis |

## Use Cases

### Monthly Business Review

Generate a comprehensive license summary for your monthly business review:
```
/license-summary
```

### Client QBR Preparation

Prepare license data for a quarterly business review with a specific client:
```
/license-summary --company "Acme Corp"
```

### Vendor Negotiation

Aggregate all licenses for a vendor to negotiate volume pricing:
```
/license-summary --vendor Microsoft
```

### Cost Optimization Sprint

Find immediate savings opportunities across your client base:
```
/license-summary --show_optimization true
```

## Related Commands

- `/search-products` - Find products in the catalog
- `/subscription-status` - Drill into a specific company's subscriptions
- `/create-order` - Place orders for new licenses
