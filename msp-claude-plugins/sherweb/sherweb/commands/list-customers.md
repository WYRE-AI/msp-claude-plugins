---
description: List all customers under the Sherweb service provider account
argument-hint: "[search] [status] [show_ar]"
arguments: [search, status, show_ar]
---

# List Sherweb Customers

List all customers under your Sherweb service provider account. Optionally search by name, filter by status, and include accounts receivable data.

## Prerequisites

- Sherweb MCP server connected with valid credentials
- MCP tools `sherweb_customers_list` and optionally `sherweb_customers_get_accounts_receivable` available

## Steps

1. **Fetch customers** from Sherweb

   Call `sherweb_customers_list` with:
   - `search` set to the search term (if provided)
   - `pageSize=100` for maximum results per page
   - Paginate through all pages to get the complete list

2. **Filter by status** if a status filter was specified (not "all")

   Filter the results to only include customers matching the requested status

3. **Enrich with accounts receivable** if `show_ar` is true

   For each customer, call `sherweb_customers_get_accounts_receivable` with the `customerId` to get outstanding balance and aging data

4. **Format and return** the customer list with details

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | - | Search term for customer name (partial match) |
| status | string | No | all | Status filter (Active, Suspended, Inactive, all) |
| show_ar | boolean | No | false | Include accounts receivable data |

## Examples

### List All Customers

```
/list-customers
```

### Search by Name

```
/list-customers --search "Acme"
```

### Filter by Status

```
/list-customers --status Active
```

### Include Accounts Receivable

```
/list-customers --show_ar true
```

### Combined Filters

```
/list-customers --status Active --show_ar true --search "Corp"
```

## Output

### Customer List

```
Sherweb Customers
================================================================

Total Customers: 47 (42 Active, 3 Suspended, 2 Inactive)

+------------------------------+----------+----------------+------------------+
| Customer                     | Status   | External ID    | Created          |
+------------------------------+----------+----------------+------------------+
| Acme Corporation             | Active   | PSA-12345      | 2024-03-15       |
| Beta Industries              | Active   | PSA-12346      | 2024-04-01       |
| Gamma Solutions              | Active   | PSA-12347      | 2024-06-10       |
| Delta Corp                   | Active   | PSA-12348      | 2024-07-22       |
| Epsilon LLC                  | Suspended| PSA-12349      | 2024-08-05       |
| Zeta Group                   | Inactive | -              | 2024-09-18       |
| ...                          | ...      | ...            | ...              |
+------------------------------+----------+----------------+------------------+

Quick Actions:
  - View subscriptions: /subscription-status --customer "<name>"
  - View billing: /billing-summary --customer "<name>"

================================================================
```

### With Accounts Receivable

```
Sherweb Customers (with Accounts Receivable)
================================================================

Total Customers: 47

+------------------------------+----------+-----------+---------+---------+---------+
| Customer                     | Status   | Balance   | Current | 30-Day  | 60-Day+ |
+------------------------------+----------+-----------+---------+---------+---------+
| Acme Corporation             | Active   | $1,247.50 |  $847.50|  $400.00|    $0.00|
| Beta Industries              | Active   | $620.00   |  $620.00|    $0.00|    $0.00|
| Gamma Solutions              | Active   | $0.00     |    $0.00|    $0.00|    $0.00|
| Delta Corp                   | Active   | $3,450.00 |$1,200.00|$1,500.00|  $750.00|
| Epsilon LLC                  | Suspended| $2,100.00 |    $0.00|    $0.00|$2,100.00|
+------------------------------+----------+-----------+---------+---------+---------+

Accounts Receivable Summary:
  Total Outstanding: $7,417.50
  Current:           $2,667.50
  30-Day Overdue:    $1,900.00
  60-Day+ Overdue:   $2,850.00

Attention Required:
  - Delta Corp: $750.00 in 60+ day aging bucket
  - Epsilon LLC: $2,100.00 in 90+ day aging bucket (SUSPENDED)

================================================================
```

### Search Results

```
Sherweb Customers - Search: "Acme"
================================================================

Found: 2 matches

+------------------------------+----------+----------------+------------------+
| Customer                     | Status   | External ID    | Created          |
+------------------------------+----------+----------------+------------------+
| Acme Corporation             | Active   | PSA-12345      | 2024-03-15       |
| Acme Subsidiary Inc          | Active   | PSA-12380      | 2025-01-10       |
+------------------------------+----------+----------------+------------------+

================================================================
```

### No Customers Found

```
No customers found matching your criteria.

Suggestions:
  - Check spelling of the search term
  - Try a shorter or different search term
  - Remove status filter to see all customers
  - Verify your Sherweb service provider account has customers
```

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

Please wait a moment and try again. The Sherweb API enforces rate limits per subscription tier.
```

## MCP Tools Used

| Tool | Purpose |
|------|---------|
| `sherweb_customers_list` | List and search customers |
| `sherweb_customers_get_accounts_receivable` | Get AR data per customer (when show_ar=true) |

## Related Commands

- `/subscription-status` - Check subscriptions for a specific customer
- `/billing-summary` - View billing charges for a period
- `/change-quantity` - Modify subscription seat counts
