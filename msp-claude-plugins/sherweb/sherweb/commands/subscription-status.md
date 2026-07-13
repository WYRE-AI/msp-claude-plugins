---
description: Check subscription details and quantities for a Sherweb customer
argument-hint: "<customer> [status]"
arguments: [customer, status]
---

# Check Sherweb Subscription Status

View subscription status and details for a specific customer. Shows active licenses, seat counts, billing cycles, and renewal dates.

## Prerequisites

- Sherweb MCP server connected with valid credentials
- MCP tools `sherweb_customers_list`, `sherweb_subscriptions_list`, and `sherweb_subscriptions_get` available

## Steps

1. **Resolve customer** - Find the customer by name or ID

   - If a name was provided, call `sherweb_customers_list` with `search` set to the customer name
   - If an ID was provided, call `sherweb_customers_get` with `customerId`

2. **Fetch subscriptions** for the customer

   Call `sherweb_subscriptions_list` with:
   - `customerId` set to the resolved customer ID
   - `status` set to the requested filter (e.g., `Active`) -- omit if "all" was requested
   - `pageSize=100` for maximum results per page

3. **Format and return results** with subscription details

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| customer | string | Yes | - | Customer name or ID |
| status | string | No | Active | Status filter (Active, Suspended, Cancelled, Provisioning, all) |

## Examples

### Check All Active Subscriptions

```
/subscription-status --customer "Acme Corp"
```

### Check All Statuses

```
/subscription-status --customer "Acme Corp" --status all
```

### Check Suspended Subscriptions

```
/subscription-status --customer "Acme Corp" --status Suspended
```

### Check by Customer ID

```
/subscription-status --customer "cust-abc-123"
```

### Check Cancelled Subscriptions

```
/subscription-status --customer "Acme Corp" --status Cancelled
```

## Output

### Active Subscriptions

```
Subscription Status for: Acme Corporation
================================================================

Active Subscriptions: 6

+--------------------------------------------+------+----------+-----------+------------+
| Product                                    | Qty  | Cycle    | Status    | Renewal    |
+--------------------------------------------+------+----------+-----------+------------+
| Microsoft 365 Business Premium             | 25   | Monthly  | Active    | 2026-04-01 |
| Microsoft 365 Business Basic               | 10   | Monthly  | Active    | 2026-04-01 |
| Exchange Online Plan 1                     | 5    | Monthly  | Active    | 2026-04-01 |
| Microsoft Defender for Business            | 25   | Monthly  | Active    | 2026-04-01 |
| SentinelOne Singularity Control            | 40   | Yearly   | Active    | 2026-08-15 |
| Acronis Cyber Protect Cloud                | 500  | Monthly  | Active    | 2026-04-01 |
+--------------------------------------------+------+----------+-----------+------------+

Upcoming Renewals (next 30 days):
  - Microsoft 365 Business Premium (25 seats) - renews 2026-04-01
  - Microsoft 365 Business Basic (10 seats) - renews 2026-04-01
  - Exchange Online Plan 1 (5 seats) - renews 2026-04-01
  - Microsoft Defender for Business (25 seats) - renews 2026-04-01
  - Acronis Cyber Protect Cloud (500 units) - renews 2026-04-01

Quick Actions:
  - Change seats: /change-quantity --customer "Acme Corporation" --subscription "<id>" --quantity <n>
  - View billing: /billing-summary --customer "Acme Corporation"

================================================================
```

### All Statuses

```
Subscription Status for: Acme Corporation (All Statuses)
================================================================

+--------------------------------------------+------+----------+-------------------+
| Product                                    | Qty  | Cycle    | Status            |
+--------------------------------------------+------+----------+-------------------+
| Microsoft 365 Business Premium             | 25   | Monthly  | Active            |
| Microsoft 365 Business Basic               | 10   | Monthly  | Active            |
| Exchange Online Plan 1                     | 5    | Monthly  | Active            |
| Microsoft Defender for Business            | 25   | Monthly  | Active            |
| SentinelOne Singularity Control            | 40   | Yearly   | Active            |
| Acronis Cyber Protect Cloud                | 500  | Monthly  | Active            |
| Dropbox Business Advanced                  | 15   | Monthly  | Cancelled         |
| Webroot SecureAnywhere                     | 30   | Monthly  | Cancelled         |
| Azure Reserved Instance                    | 1    | Yearly   | Provisioning      |
+--------------------------------------------+------+----------+-------------------+

Summary:
  Active: 6 subscriptions
  Cancelled: 2 subscriptions
  Provisioning: 1 subscription

================================================================
```

### Customer Not Found

```
Customer not found: "Unknown Corp"

Suggestions:
  - Check spelling of the customer name
  - Try a partial name match
  - Use the customer ID directly
  - List all customers: /list-customers
```

## Subscription States Reference

| State | Description |
|-------|-------------|
| Active | Live, provisioned, and billing |
| Suspended | Temporarily paused |
| Cancelled | Terminated |
| Provisioning | Initial setup in progress |
| PendingChange | Modification in progress |
| PendingCancellation | Cancellation in progress |
| Failed | Provisioning or modification failed |

## Error Handling

### MCP Connection Error

```
Error: Unable to connect to Sherweb MCP server

Check your MCP configuration and verify credentials at cumulus.sherweb.com > Security > APIs
```

### Authentication Error

```
Error: Authentication failed (401)

Your Sherweb OAuth token may have expired. Verify your Client ID and Client Secret.
```

### Rate Limit

```
Error: Rate limit exceeded (429)

Please wait a moment and try again.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `sherweb_customers_list` | Find customer by name |
| `sherweb_customers_get` | Get customer by ID |
| `sherweb_subscriptions_list` | List subscriptions with filters |

## Related Commands

- `/list-customers` - List all customers to find customer names/IDs
- `/billing-summary` - View billing charges for a customer
- `/change-quantity` - Modify subscription seat counts
