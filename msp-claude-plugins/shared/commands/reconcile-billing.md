---
description: Compare Pax8 subscriptions against Xero or QBO invoices to find billing gaps
argument-hint: "<company> <accounting> [period] [threshold]"
arguments: [company, accounting, period, threshold]
---

# Reconcile Billing

Compare active Pax8 subscriptions against Xero or QuickBooks Online invoices for a client (or all clients) to find unbilled subscriptions, quantity mismatches, and margin discrepancies.

## Prerequisites

- Pax8 API access configured (subscriptions and companies endpoints)
- At least one accounting platform configured:
  - **Xero**: API access with invoices and contacts scopes
  - **QuickBooks Online**: API access with invoice and customer read permissions

## Steps

1. **Resolve the billing period**
   - Parse the `--period` argument into a start and end date
   - `2026-02` becomes `2026-02-01` to `2026-02-28`
   - `last-month` calculates the previous calendar month from today
   - `last-quarter` calculates the previous three calendar months

2. **Pull Pax8 subscriptions**
   - If `--company` is a specific name: search Pax8 companies by name, get the company ID, then fetch active subscriptions for that company
   - If `--company` is "all": fetch all Pax8 companies, then fetch active subscriptions for each
   - For each subscription, resolve the product name via `/v1/products/{productId}`
   - Build a subscription ledger: company name, product name, quantity, unit price, monthly total

   ```bash
   # Get company ID
   curl -s "https://api.pax8.com/v1/companies?name=Acme" \
     -H "Authorization: Bearer $PAX8_TOKEN"

   # Get active subscriptions for company
   curl -s "https://api.pax8.com/v1/subscriptions?companyId={companyId}&status=Active&page=0&size=200" \
     -H "Authorization: Bearer $PAX8_TOKEN"

   # Resolve product name
   curl -s "https://api.pax8.com/v1/products/{productId}" \
     -H "Authorization: Bearer $PAX8_TOKEN"
   ```

3. **Pull invoices from the accounting platform**

   **If `--accounting xero`:**

   - Search Xero contacts by company name to get the ContactID
   - Fetch ACCREC invoices for that contact within the billing period
   - Extract line items with Description, Quantity, UnitAmount, LineAmount

   ```bash
   # Find contact
   curl -s "https://api.xero.com/api.xro/2.0/Contacts?where=Name==%22Acme%20Corporation%22" \
     -H "Authorization: Bearer $XERO_TOKEN" \
     -H "xero-tenant-id: $XERO_TENANT_ID"

   # Get invoices for period
   curl -s "https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID==guid(%22{contactId}%22)&&Type==%22ACCREC%22&&Date>=DateTime(2026,2,1)&&Date<=DateTime(2026,2,28)" \
     -H "Authorization: Bearer $XERO_TOKEN" \
     -H "xero-tenant-id: $XERO_TENANT_ID"
   ```

   **If `--accounting quickbooks`:**

   - Query QBO customers by display name to get the customer ID
   - Query invoices for that customer within the billing period
   - Extract line items with Description, Qty, UnitPrice, Amount

   ```bash
   # Find customer
   curl -s -H "Authorization: Bearer $QBO_TOKEN" \
     "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT * FROM Customer WHERE DisplayName = 'Acme Corporation'"

   # Get invoices for period
   curl -s -H "Authorization: Bearer $QBO_TOKEN" \
     "https://quickbooks.api.intuit.com/v3/company/$QBO_REALM_ID/query?query=SELECT * FROM Invoice WHERE CustomerRef = '{customerId}' AND TxnDate >= '2026-02-01' AND TxnDate <= '2026-02-28'"
   ```

4. **Match subscriptions to invoice line items**
   - For each Pax8 subscription, search the client's invoice line items for a match
   - Matching criteria (applied in order):
     1. Product name fuzzy match (contains, token match, abbreviation expansion)
     2. Quantity comparison (exact or within threshold)
     3. Amount comparison (within `--threshold` tolerance)
   - Record each subscription as: matched, unmatched (gap), or discrepancy

5. **Identify and classify findings**
   - **CRITICAL**: Active subscription with no matching invoice line (revenue leakage)
   - **HIGH**: Quantity mismatch greater than 10%
   - **MEDIUM**: Price discrepancy greater than `--threshold` percent
   - **LOW**: Name mismatch requiring manual confirmation
   - **INFO**: Cancelled Pax8 subscription still appearing on invoice

6. **Also check for cancelled subscriptions still being billed**
   - Fetch Pax8 subscriptions with `status=Cancelled` for the company
   - Check if any cancelled product names still appear on the invoice
   - Flag as INFO severity

7. **Output the reconciliation report**
   - Summary with totals: companies checked, subscriptions matched, gaps found by severity
   - Detailed findings grouped by severity
   - Estimated revenue impact for each gap
   - Suggested action for each finding

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| company | string | Yes | - | Company name or "all" |
| accounting | string | Yes | - | "xero" or "quickbooks" |
| period | string | No | last-month | Billing period (YYYY-MM, last-month, last-quarter) |
| threshold | string | No | 5 | Minimum discrepancy % to flag |

## Examples

### Single Company Against Xero

```
/reconcile-billing "Acme Corporation" --accounting xero
```

Pulls all active Pax8 subscriptions for Acme Corporation, fetches their February Xero invoices, matches each subscription to an invoice line item, and reports any gaps or discrepancies.

### Full Portfolio Against QuickBooks

```
/reconcile-billing "all" --accounting quickbooks
```

Iterates through every Pax8 company, fetches their QuickBooks invoices for last month, and produces a portfolio-wide reconciliation report. This may take several minutes for large client bases due to API pagination.

### Specific Period with Custom Threshold

```
/reconcile-billing "Acme Corporation" --accounting xero --period "2026-01" --threshold "3"
```

Reconciles January 2026 billing for Acme Corporation, flagging any discrepancies greater than 3%.

### Last Quarter Review

```
/reconcile-billing "all" --accounting quickbooks --period "last-quarter"
```

Reviews the last three months of billing across the full portfolio. Useful for quarterly business reviews.

## Output

```
═══════════════════════════════════════════════════════════════════
BILLING RECONCILIATION REPORT
Company: Acme Corporation
Period:  February 2026
Source:  Pax8 vs Xero
═══════════════════════════════════════════════════════════════════

SUMMARY
  Active Subscriptions: 6
  Matched:              4
  Gaps:                 2
    CRITICAL: 1  ($110.00/month leakage)
    HIGH:     1  ($30.00/month underbilled)

FINDINGS

  [CRITICAL] Unbilled Subscription
    Product:         Acronis Cyber Protect Cloud (500GB)
    Pax8:            1 unit @ $85.00/month (cost)
    Expected Sell:   1 unit @ $110.00/month
    Invoice:         NOT FOUND
    Impact:          $110.00/month revenue leakage
    Action:          Add to next invoice for Acme Corporation

  [HIGH] Quantity Mismatch
    Product:         SentinelOne Singularity Complete
    Pax8:            25 seats
    Invoice INV-0247: 20 seats @ $6.00 = $120.00
    Expected:        25 seats @ $6.00 = $150.00
    Difference:      5 seats unbilled (20% mismatch)
    Impact:          $30.00/month underbilled
    Action:          Update INV-0247 line 3 to 25 seats

MATCHED (No Issues)
  Microsoft 365 Business Premium  25 seats  $22.00  INV-0247 line 1
  Azure AD P1                     25 seats   $9.50  INV-0247 line 2
  Datto SaaS Protection            1 unit   $75.00  INV-0247 line 4
  Cloud Backup 500GB               1 unit  $150.00  INV-0247 line 5
═══════════════════════════════════════════════════════════════════
```

### All-Companies Output

When `--company all` is used, the report includes a portfolio summary at the top:

```
═══════════════════════════════════════════════════════════════════
BILLING RECONCILIATION REPORT -- PORTFOLIO
Period:  February 2026
Source:  Pax8 vs Xero
═══════════════════════════════════════════════════════════════════

PORTFOLIO SUMMARY
  Companies Checked:      12
  Total Subscriptions:    52
  Fully Matched:          45
  Total Gaps:              7
  Est. Monthly Leakage:   $697.50

  CRITICAL:  2 gaps across 2 companies
  HIGH:      2 gaps across 2 companies
  MEDIUM:    1 gap
  LOW:       1 gap
  INFO:      1 finding

TOP ISSUES BY REVENUE IMPACT
  1. Acme Corp - M365 Business Premium (unbilled)     $550.00/mo
  2. Gamma Industries - Acronis Backup (unbilled)      $110.00/mo
  3. Delta Corp - M365 Basic (5 seats short)            $45.00/mo

[Per-company details follow...]
═══════════════════════════════════════════════════════════════════
```

## Error Handling

### Company Not Found in Pax8

```
Company "Acme Corp" not found in Pax8.

Suggestions:
- Check the spelling and try again
- Search with a partial name: /reconcile-billing "Acme" --accounting xero
- List all Pax8 companies to find the correct name
```

### Company Not Found in Accounting Platform

```
Company "Acme Corporation" found in Pax8 (3 active subscriptions)
but no matching contact found in Xero.

This client may be entirely unbilled. This is a CRITICAL finding.

Suggestions:
- Check Xero contact name (may differ from Pax8 company name)
- Search Xero contacts manually for this client
- Create a Xero contact if this is a new client
```

### No Invoices in Period

```
Company "Acme Corporation" found in Xero (Contact ID: abc-123)
but no ACCREC invoices found for February 2026.

This client has 3 active Pax8 subscriptions totaling $697.50/month (cost).
All subscriptions are flagged as CRITICAL (unbilled).

Suggestions:
- Check if invoices use a different date range
- Verify the billing period: /reconcile-billing "Acme Corporation" --accounting xero --period "2026-01"
- Check if this client is billed annually
```

### Accounting Platform Not Configured

```
Xero API is not configured. Cannot perform reconciliation.

To set up Xero access:
- Configure XERO_CLIENT_ID and XERO_CLIENT_SECRET
- Complete OAuth2 authorization flow
- Set XERO_TENANT_ID for the target organization

Alternative: /reconcile-billing "Acme Corporation" --accounting quickbooks
```

## Related Commands

- `/pax8-subscriptions` -- List Pax8 subscriptions for a company
- `/xero-invoices` -- Search Xero invoices
- `/qbo-invoices` -- Search QuickBooks invoices
- `/correlate-incident` -- Cross-vendor incident correlation (similar cross-platform pattern)
