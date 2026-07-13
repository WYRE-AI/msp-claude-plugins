---
description: Check subscription status for a company in Pax8
argument-hint: "<company> [status] [product]"
arguments: [company, status, product]
---

# Check Pax8 Subscription Status

View subscription status and details for a specific company. Shows active licenses, seat counts, billing terms, and renewal dates.

## Prerequisites

- Pax8 MCP server connected with a valid MCP token
- MCP tools `pax8-list-companies`, `pax8-list-subscriptions`, `pax8-get-subscription-by-uuid`, and `pax8-get-product-by-uuid` available

## Steps

1. **Resolve company** - Find the company by name or ID

   - If a name was provided, call `pax8-list-companies` with `company_name` set to the search term
   - If a UUID was provided, call `pax8-get-company-by-uuid` with `uuid`

2. **Fetch subscriptions** for the company

   Call `pax8-list-subscriptions` with:
   - `companyId` set to the resolved company UUID
   - `status` set to the requested filter (e.g., `Active`) -- omit if "all" was requested
   - `size=200` for maximum results per page

3. **Enrich with product names** by looking up product details

   For each unique `productId` in the results, call `pax8-get-product-by-uuid` with `productId` to get the product name

4. **Format and return results** with subscription details

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string | Yes | - | Company name or UUID |
| status | string | No | Active | Status filter (Active, Cancelled, PendingManual, PendingCancel, all) |
| product | string | No | - | Product name filter (partial match) |

## Examples

### Check All Active Subscriptions

```
/subscription-status --company "Acme Corp"
```

### Check Specific Product

```
/subscription-status --company "Acme Corp" --product "Microsoft 365"
```

### Check All Statuses

```
/subscription-status --company "Acme Corp" --status all
```

### Check Pending Subscriptions

```
/subscription-status --company "Acme Corp" --status PendingManual
```

### Check by Company ID

```
/subscription-status --company "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

## Output

### Active Subscriptions

```
Subscription Status for: Acme Corporation
================================================================

Active Subscriptions: 6
Total Monthly Cost: $2,847.50

+--------------------------------------------+------+----------+--------+-----------+------------+
| Product                                    | Qty  | Term     | Price  | Monthly   | Renewal    |
+--------------------------------------------+------+----------+--------+-----------+------------+
| Microsoft 365 Business Premium             | 25   | Annual   | $17.10 | $427.50   | 2026-05-31 |
| Microsoft 365 Business Basic               | 10   | Annual   | $5.40  | $54.00    | 2026-05-31 |
| Exchange Online Plan 1                     | 5    | Monthly  | $3.60  | $18.00    | -          |
| Microsoft Defender for Business            | 25   | Monthly  | $2.70  | $67.50    | -          |
| SentinelOne Singularity Control            | 40   | Annual   | $4.50  | $180.00   | 2026-08-15 |
| Acronis Cyber Protect Cloud                | 500  | Monthly  | $4.20  | $2,100.00 | -          |
+--------------------------------------------+------+----------+--------+-----------+------------+

Upcoming Renewals (next 30 days):
  None

Quick Actions:
  - Modify seats: Adjust quantity on any subscription above
  - View history: Check subscription change history
  - Place order: /create-order --company "Acme Corporation"
================================================================
```

### All Statuses

```
Subscription Status for: Acme Corporation (All Statuses)
================================================================

+--------------------------------------------+------+-------------------+-----------+
| Product                                    | Qty  | Status            | Monthly   |
+--------------------------------------------+------+-------------------+-----------+
| Microsoft 365 Business Premium             | 25   | Active            | $427.50   |
| Microsoft 365 Business Basic               | 10   | Active            | $54.00    |
| Exchange Online Plan 1                     | 5    | Active            | $18.00    |
| Microsoft Defender for Business            | 25   | Active            | $67.50    |
| SentinelOne Singularity Control            | 40   | Active            | $180.00   |
| Acronis Cyber Protect Cloud                | 500  | Active            | $2,100.00 |
| Dropbox Business Advanced                  | 15   | Cancelled         | -         |
| Webroot SecureAnywhere                     | 30   | Cancelled         | -         |
| Azure Reserved Instance                    | 1    | PendingManual     | TBD       |
+--------------------------------------------+------+-------------------+-----------+

Summary:
  Active: 6 subscriptions ($2,847.50/month)
  Cancelled: 2 subscriptions
  Pending: 1 subscription

================================================================
```

### Company Not Found

```
Company not found: "Unknown Corp"

Suggestions:
  - Check spelling of the company name
  - Try a partial name match
  - Use the company UUID directly
  - Verify the company exists in Pax8
```

## Subscription States Reference

| State | Description |
|-------|-------------|
| Active | Live and billing |
| Cancelled | Terminated |
| PendingManual | Awaiting vendor provisioning |
| PendingAutomated | Auto-provisioning in progress |
| PendingCancel | Cancellation in progress |
| WaitingForDetails | Needs more information |
| Trial | Free trial active |
| Converted | Trial converted to paid |
| PendingActivation | Activation pending |
| Activated | Recently activated |

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Pax8 MCP server

Check your MCP configuration and regenerate the token at app.pax8.com/integrations/mcp
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
The Pax8 API allows 1000 requests per minute.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `pax8-list-companies` | Find company by name |
| `pax8-get-company-by-uuid` | Get company by UUID |
| `pax8-list-subscriptions` | List subscriptions with filters |
| `pax8-get-product-by-uuid` | Resolve product names |

## Related Commands

- `/search-products` - Find products to add to a company
- `/create-order` - Place a new order for a company
- `/license-summary` - View licenses across all companies
