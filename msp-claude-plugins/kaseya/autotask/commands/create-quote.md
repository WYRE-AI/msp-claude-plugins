---
description: Create a new Autotask quote with line items for products, services, and service bundles
argument-hint: "<company> [name] [items]"
arguments: [company, name, items]
---

# Create Autotask Quote

## Prerequisites

- Autotask MCP server connected and authenticated
- API user has access to quote entities and product catalog

## Steps

### Step 1: Find the Company

```
Tool: autotask_search_companies
Args: { "searchTerm": "$company" }
```

If multiple matches, present options and ask user to select.

### Step 2: Find the Contact (Optional)

```
Tool: autotask_search_contacts
Args: { "companyId": <company_id> }
```

### Step 3: Create the Quote

```
Tool: autotask_create_quote
Args: {
  "companyId": <company_id>,
  "contactId": <contact_id>,
  "name": "$name",
  "effectiveDate": "<today>",
  "expirationDate": "<30_days_from_today>"
}
```

### Step 4: Look Up Catalog Items

For each item the user wants to add:

**Products:**
```
Tool: autotask_search_products
Args: { "searchTerm": "<product_name>" }
```

**Services:**
```
Tool: autotask_search_services
Args: { "searchTerm": "<service_name>" }
```

**Service Bundles:**
```
Tool: autotask_search_service_bundles
Args: { "searchTerm": "<bundle_name>" }
```

### Step 5: Add Line Items

For each resolved item:

```
Tool: autotask_create_quote_item
Args: {
  "quoteId": <quote_id>,
  "productID": <product_id>,
  "quantity": <qty>,
  "unitPrice": <price>,
  "unitCost": <cost>
}
```

Or for services:
```
Tool: autotask_create_quote_item
Args: {
  "quoteId": <quote_id>,
  "serviceID": <service_id>,
  "quantity": <qty>
}
```

### Step 6: Review the Quote

```
Tool: autotask_search_quote_items
Args: { "quoteId": <quote_id> }
```

Display all line items with pricing summary.

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string | Yes | - | Company name or numeric ID |
| name | string | No | Auto-generated | Quote title |
| items | string | No | - | Items to include (natural language) |

## Examples

### Basic quote
```
/create-quote company="Contoso Ltd" name="Q1 Network Refresh"
```

### Quote with items
```
/create-quote company="Contoso" name="Firewall Upgrade" items="5x FortiGate 60F, 1x installation service"
```

### Quote by company ID
```
/create-quote company=67890 name="Managed Services Proposal"
```

## Output

```
Quote Created:
  ID:          55555
  Name:        Q1 Network Refresh
  Company:     Contoso Ltd
  Contact:     John Smith
  Effective:   2026-03-01
  Expires:     2026-03-31

Line Items:
  #  Item                        Qty    Unit Price    Total
  1  FortiGate 60F               5      $1,299.00     $6,495.00
  2  Managed Endpoint Protection  25     $45.00        $1,125.00
  3  Extended Warranty (optional)  1     $499.00       $499.00
  ──────────────────────────────────────────────────────────────
  Subtotal:                                            $7,620.00
  Optional:                                            $499.00
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Company not found | Verify company name spelling, try partial search |
| Product/service not found | Check product catalog with autotask_search_products |
| Multiple company matches | Show matches, ask user to select or use ID |
| Missing companyId | Company parameter is required |

## Related Commands

- [check-pricing](/commands/check-pricing) - Check product/service pricing before quoting
- [search-products](/commands/search-products) - Browse the product catalog
- [lookup-company](/commands/lookup-company) - Find company details
- [lookup-contact](/commands/lookup-contact) - Find contact for the quote
