---
description: Find a customer in QuickBooks Online by name or other criteria
argument-hint: "<name> [status] [with_balance]"
arguments: [name, status, with_balance]
---

# Search QuickBooks Online Customers

Find a customer in QuickBooks Online by name, with optional filters for status and balance.

## Prerequisites

- Valid QBO OAuth2 token (`QBO_ACCESS_TOKEN`)
- Company ID configured (`QBO_REALM_ID`)
- User must have customer read permissions via OAuth scope

## Steps

1. **Parse search parameters**
   - Extract customer name query
   - Set status filter (active/inactive/all)
   - Set balance filter

2. **Build query**
   - Construct Intuit query with LIKE operator
   - Apply Active filter if specified
   - Apply Balance filter if specified
   - Order by DisplayName

3. **Execute search**
   - Query QBO API
   - Paginate if more than 1000 results

4. **Format and return results**
   - Display customer details
   - Include balance information
   - Provide quick action links

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | Yes | - | Customer name (partial match via LIKE) |
| status | string | No | active | Status filter (active/inactive/all) |
| with_balance | boolean | No | false | Only show customers with balance > 0 |

## Examples

### Basic Search

```
/search-customers "Acme"
```

### Search with Balance Filter

```
/search-customers "Acme" --with_balance true
```

### Search All Statuses

```
/search-customers "Corp" --status all
```

### Search Inactive Customers

```
/search-customers "Old Client" --status inactive
```

## API Calls

### Search by Name (Active)

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Acme%25'%20AND%20Active%20%3D%20true%20ORDERBY%20DisplayName&minorversion=73"
```

### Search with Balance

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Acme%25'%20AND%20Balance%20%3E%20'0'%20ORDERBY%20Balance%20DESC&minorversion=73"
```

### Search All (No Status Filter)

```bash
curl -s -H "Authorization: Bearer $QBO_ACCESS_TOKEN" \
  -H "Accept: application/json" \
  "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT%20*%20FROM%20Customer%20WHERE%20DisplayName%20LIKE%20'%25Corp%25'%20ORDERBY%20DisplayName&minorversion=73"
```

## Output

### Single Match

```
Found 1 customer matching "Acme Corporation"

Customer: Acme Corporation
================================================================
ID:              123
Company:         Acme Corporation
Contact:         John Smith
Email:           billing@acmecorp.com
Phone:           555-123-4567

Billing Address:
  123 Main Street
  Springfield, IL 62704

Payment Terms:   Net 30
Delivery Method: Email

Balance:         $2,500.00
Balance (w/jobs): $3,700.00

Sub-Customers:
  - Acme Corp:Managed Services (Balance: $2,500.00)
  - Acme Corp:Project Work (Balance: $1,200.00)
  - Acme Corp:Hardware (Balance: $0.00)

Created: 2024-06-15
Updated: 2026-02-10

Quick Actions:
  - Create invoice: /create-invoice --customer "Acme Corporation"
  - Get balance: /get-balance --customer "Acme Corporation"
  - View expenses: /expense-summary --customer "Acme Corporation"
================================================================
```

### Multiple Matches

```
Found 4 customers matching "Acme"

+---------------------------+------------------+--------+-----------+----------+
| Name                      | Contact          | Status | Balance   | Terms    |
+---------------------------+------------------+--------+-----------+----------+
| Acme Corporation          | John Smith       | Active | $2,500.00 | Net 30   |
| Acme Corp:Managed Svcs    | (sub-customer)   | Active | $2,500.00 | Net 30   |
| Acme Corp:Project Work    | (sub-customer)   | Active | $1,200.00 | Net 30   |
| Acme East Division        | Jane Doe         | Active | $800.00   | Net 30   |
+---------------------------+------------------+--------+-----------+----------+

Total outstanding: $7,000.00

Select a customer for details:
  /search-customers "Acme Corporation"
  /search-customers "Acme East"
```

### No Results

```
No customers found matching "XYZ Company"

Suggestions:
  - Check spelling of the customer name
  - Try a partial name match (e.g., "XYZ")
  - Include inactive customers: --status all
  - Try different keywords

Example searches:
  /search-customers "XYZ"
  /search-customers "Company" --status all
```

### With Balance Filter

```
/search-customers "Acme" --with_balance true

Found 2 customers matching "Acme" with outstanding balance

+---------------------------+--------+-----------+----------+
| Name                      | Status | Balance   | Overdue  |
+---------------------------+--------+-----------+----------+
| Acme Corporation          | Active | $2,500.00 | No       |
| Acme East Division        | Active | $800.00   | Yes (45d)|
+---------------------------+--------+-----------+----------+

Total outstanding: $3,300.00

Quick Actions:
  - View all balances: /get-balance
  - Create invoice: /create-invoice --customer "Acme Corporation"
```

### Inactive Customers

```
/search-customers "Old Client" --status inactive

Found 1 inactive customer matching "Old Client"

Customer: Old Client Inc (INACTIVE)
================================================================
ID:              500
Company:         Old Client Inc
Status:          Inactive

Balance:         $0.00

Notes:
Client offboarded 2025-06-15. All invoices paid in full.

WARNING: This customer is inactive. Reactivate before creating new invoices.
================================================================
```

## Status Values

| Value | Description | QBO Query |
|-------|-------------|-----------|
| active | Active customers (default) | `Active = true` |
| inactive | Deactivated customers | `Active = false` |
| all | All customers | No Active filter |

## Error Handling

### No Results

```
No customers found matching "xyz"

Suggestions:
  - Check spelling of the customer name
  - Try a shorter search term
  - Include all statuses: --status all

Example:
  /search-customers "xyz" --status all
```

### Invalid Status

```
Invalid status: "deleted"

Valid statuses:
  - active (default)
  - inactive
  - all

Example:
  /search-customers "Acme" --status inactive
```

### API Error

```
Error connecting to QuickBooks Online API

Possible causes:
  - Expired access token (check QBO_ACCESS_TOKEN)
  - Invalid realm ID (check QBO_REALM_ID)
  - Network connectivity issue

Resolution:
  1. Refresh the access token
  2. Verify environment variables
  3. Retry the command
```

## Use Cases

### Pre-Invoice Lookup

Before creating an invoice, verify the customer exists and check their balance:
```
/search-customers "Acme"
```

### Collections Research

Find customers with outstanding balances:
```
/search-customers "Acme" --with_balance true
```

### Client Audit

Review all customers including inactive:
```
/search-customers "" --status all
```

### Verify Customer Before Onboarding

Check if a customer already exists before creating a new one:
```
/search-customers "New Client Name"
```

## Related Commands

- `/create-invoice` - Create an invoice for a found customer
- `/get-balance` - View outstanding balances across all clients
- `/expense-summary` - View expenses allocated to a customer
