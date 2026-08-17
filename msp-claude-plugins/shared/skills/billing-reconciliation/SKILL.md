---
name: Cross-Vendor Billing Reconciliation
description: >
  Reconciling cloud marketplace subscriptions (Pax8) against accounting
  invoices (Xero, QuickBooks Online): the matching strategy, billing gaps,
  unbilled subscriptions, and margin discrepancy analysis.
when_to_use: >-
  When comparing marketplace subscription data against issued invoices to
  find revenue leakage. Use when: billing reconciliation, reconcile
  subscriptions, unbilled subscriptions, billing gap analysis, margin
  analysis, subscription vs invoice comparison, pax8 xero reconciliation, or
  pax8 quickbooks reconciliation.
---

# Cross-Vendor Billing Reconciliation

## Overview

MSPs purchase cloud subscriptions through distributors like Pax8 and resell them to clients, billing through an accounting platform such as Xero or QuickBooks Online. Revenue leakage occurs when active subscriptions are not reflected on client invoices -- a common problem as seat counts change, new products are provisioned, or billing staff miss updates. This skill teaches Claude how to systematically compare Pax8 subscription data against accounting invoices to identify billing gaps, quantity mismatches, price discrepancies, and margin erosion.

The reconciliation answers one fundamental question: **"Is every active Pax8 subscription being billed to the correct client at the correct quantity and price?"**

## Anti-triggers

This is a shared skill: it owns the *comparison across two platforms*.
Anything that lives inside one platform belongs to that platform's skill.

- **Reading subscriptions or marketplace charges** — use
  `pax8-subscriptions`, `pax8-invoices`, `sherweb-subscriptions`, or
  `sherweb-billing`.
- **Reading or creating an accounting invoice** — use
  `qbo-invoices`, `qbo-reports`, `xero-invoices`, or
  `xero-reports`.
- **Chasing an invoice the client has not paid** — that is collections
  against a single system, not a reconciliation; use `qbo-reports`
  or `xero-reports` for the aged-receivables view.
- **Recovering the gap once it is found** — this skill identifies unbilled
  and mispriced subscriptions. Issuing the corrected invoice is a write
  against the accounting platform, and changing a seat count is a write
  against the marketplace. Hand off; do not let one analysis run make both
  kinds of change.

## Reconciliation Workflow

### Step 1: Pull Active Pax8 Subscriptions with Pricing

Fetch all active subscriptions from Pax8, grouped by company. Each subscription includes product name, quantity (seat count), unit price, billing term, and status.

```http
GET /v1/subscriptions?status=Active&page=0&size=200
Authorization: Bearer YOUR_TOKEN
```

For a specific company:

```http
GET /v1/subscriptions?companyId={companyId}&status=Active&page=0&size=200
```

**Key fields to extract per subscription:**

- `companyId` -- resolve to company name via `/v1/companies/{companyId}`
- `productId` -- resolve to product name via `/v1/products/{productId}`
- `quantity` -- number of seats/licenses
- `price` -- unit price (your cost from Pax8)
- `billingTerm` -- Monthly or Annual
- `startDate` / `endDate` -- subscription period
- `status` -- confirm Active

**Build a subscription ledger:**

```
Pax8 Subscription Ledger
────────────────────────────────────────────────
Company          Product                    Qty  Unit Price  Monthly Total
Acme Corp        M365 Business Premium       25     $17.10       $427.50
Acme Corp        Azure AD P1                 25      $7.50       $187.50
Acme Corp        Acronis Backup 500GB         1     $85.00        $85.00
Beta LLC         M365 Business Basic         10      $7.20        $72.00
Beta LLC         SentinelOne Complete        15     $4.00         $60.00
────────────────────────────────────────────────
```

### Step 2: Pull Recent Invoices from Accounting Platform

#### Xero

Fetch sales invoices (ACCREC) for the billing period:

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Type==%22ACCREC%22&&Date>=DateTime(2026,2,1)&&Date<=DateTime(2026,2,28)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

For a specific contact (client):

```bash
curl -s -X GET "https://api.xero.com/api.xro/2.0/Invoices?where=Contact.ContactID==guid(%22${CONTACT_ID}%22)&&Type==%22ACCREC%22&&Date>=DateTime(2026,2,1)" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "xero-tenant-id: ${XERO_TENANT_ID}" \
  -H "Accept: application/json"
```

**Key fields:** `Contact.Name`, `LineItems[].Description`, `LineItems[].Quantity`, `LineItems[].UnitAmount`, `LineItems[].LineAmount`, `Invoice.Status`, `Invoice.Date`

#### QuickBooks Online

Query invoices for the billing period:

```sql
SELECT * FROM Invoice WHERE TxnDate >= '2026-02-01' AND TxnDate <= '2026-02-28' ORDERBY TxnDate DESC
```

For a specific customer:

```sql
SELECT * FROM Invoice WHERE CustomerRef = '123' AND TxnDate >= '2026-02-01'
```

**Key fields:** `CustomerRef.name`, `Line[].Description`, `Line[].SalesItemLineDetail.Qty`, `Line[].SalesItemLineDetail.UnitPrice`, `Line[].Amount`, `Balance`, `TxnDate`

### Step 3: Match Subscriptions to Invoice Line Items

For each active Pax8 subscription, search the corresponding client's invoices for a matching line item. Matching uses a combination of product name, quantity, and amount (see Matching Strategy below).

**Matching priority:**

1. Company name match (Pax8 company to Xero contact / QBO customer)
2. Product name fuzzy match (subscription product to invoice line description)
3. Quantity comparison
4. Amount comparison (within tolerance)

### Step 4: Identify Gaps -- Active Subscriptions with No Matching Invoice Line

Any active Pax8 subscription that cannot be matched to an invoice line item is a **billing gap**. These represent potential revenue leakage.

**Flag as CRITICAL:**
- Active subscription exists in Pax8
- No invoice line found in the accounting platform for this product/client combination in the billing period
- Estimated monthly revenue loss = quantity x sell price

### Step 5: Identify Discrepancies -- Quantity Mismatches, Price Differences, Margin Erosion

When a match is found but the numbers do not align:

- **Quantity mismatch**: Pax8 shows 25 seats but invoice shows 20 seats (5 seats unbilled)
- **Price discrepancy**: Unit price on invoice does not maintain expected margin over Pax8 cost
- **Total mismatch**: Line amount does not equal quantity x unit price (possible manual override)

**Calculate margin:**

```
Margin % = ((Sell Price - Pax8 Cost) / Sell Price) x 100

Example:
  Pax8 cost:  $17.10/seat
  Invoice:    $22.00/seat
  Margin:     22.3%

  If target margin is 25%, flag as MEDIUM (margin erosion)
```

### Step 6: Generate Reconciliation Report with Severity Indicators

Compile all findings into a structured report grouped by severity.

## Matching Strategy

Matching Pax8 subscriptions to accounting line items is the core challenge. Product names are rarely identical across systems because MSPs abbreviate, customize, or bundle products on invoices.

### Product Name Fuzzy Matching

| Pax8 Product Name | Possible Invoice Line Description |
|---|---|
| Microsoft 365 Business Premium | M365 Bus Premium, Microsoft 365 BP, M365 Business Premium Licenses |
| Microsoft 365 Business Basic | M365 Basic, Microsoft 365 BB, O365 Business Basic |
| SentinelOne Singularity Complete | SentinelOne, S1 Complete, Endpoint Protection |
| Acronis Cyber Protect Cloud | Acronis Backup, Cloud Backup, Acronis BDR |
| Microsoft Azure AD P1 | Azure AD Premium, Entra ID P1, AAD P1 |
| Datto SaaS Protection | Datto Backupify, SaaS Backup, M365 Email Backup |

**Matching rules (apply in order):**

1. **Exact contains** -- Invoice description contains the full Pax8 product name (case-insensitive)
2. **Key token match** -- Core product tokens match (e.g., "365" + "Premium" or "SentinelOne" + "Complete")
3. **Abbreviation expansion** -- Common MSP abbreviations: M365 = Microsoft 365, O365 = Office 365, S1 = SentinelOne, BDR = Backup and Disaster Recovery
4. **Manual mapping table** -- MSP-maintained table of Pax8 product to invoice line description mappings (recommended for accuracy)

### Company Name Matching

The company name is the cross-vendor correlation key:

1. **Exact match** -- Pax8 company name equals Xero contact name / QBO customer display name
2. **Contains match** -- Partial match (e.g., "Acme" matches "Acme Corporation" or "Acme Corp")
3. **DBA / trading name** -- Check Xero `Contact.Name` and `Contact.FirstName`/`Contact.LastName`, or QBO `Customer.CompanyName` vs `Customer.DisplayName`
4. **Ask user** -- If no match or multiple matches, present options and confirm

### Amount Comparison with Tolerance

Invoice amounts may differ slightly from Pax8 amounts due to rounding, tax handling, or currency conversion:

- **Tolerance**: +/-5% of expected amount
- **Expected sell amount**: `Pax8 quantity x sell price` (where sell price = Pax8 cost + margin)
- **Exact match**: Within $0.01 difference
- **Close match**: Within 5% difference (flag as INFO)
- **Discrepancy**: Greater than 5% difference (flag based on severity)

### Quantity Comparison

Quantity should match exactly between Pax8 subscription and invoice line item:

- **Exact match**: Quantities are equal
- **Minor discrepancy** (<=10%): May indicate recent seat change not yet reflected
- **Major discrepancy** (>10%): Flag as HIGH severity

## Vendor Field Mappings

The company name is the cross-vendor correlation key; `price` on a Pax8
subscription is your **cost**, while the accounting platforms' unit price is the
**sell** price — the two are never the same field.

See [references/field-mappings.md](references/field-mappings.md) for the complete Pax8/Xero/QBO field correspondence table and the API call to use at each reconciliation step.

## Gap Categories

Each finding is assigned a severity level to help MSPs prioritize action:

| Severity | Category | Description | Example |
|----------|----------|-------------|---------|
| **CRITICAL** | Unbilled Subscription | Active Pax8 subscription with no corresponding invoice line item. Direct revenue leakage. | M365 Business Premium (25 seats) active in Pax8, no line item on Acme Corp's February invoice |
| **HIGH** | Quantity Mismatch >10% | Seat count on invoice differs from Pax8 by more than 10%. Significant overbilling or underbilling. | Pax8 shows 25 seats, invoice shows 20 seats (5 unbilled = $110/month lost) |
| **MEDIUM** | Price Discrepancy >5% | Unit sell price does not maintain target margin over Pax8 cost. Margin erosion. | Pax8 cost $17.10, invoice price $18.00 (5.3% margin vs 25% target) |
| **LOW** | Naming Mismatch | Product matched by amount/quantity but name does not align. Needs manual review to confirm correct mapping. | Pax8: "Microsoft 365 Business Premium", Invoice: "Cloud Email Licenses" |
| **INFO** | Cancelled Still Billed | Pax8 subscription is Cancelled or PendingCancel but invoice line item still exists. Client may be overbilled. | SentinelOne cancelled in Pax8 on Feb 10, still on February invoice |

### Severity Response Guide

| Severity | Action | Timeline |
|----------|--------|----------|
| CRITICAL | Create missing invoice line or investigate why unbilled | Same day |
| HIGH | Verify correct quantity and adjust invoice | Within 2 business days |
| MEDIUM | Review pricing structure and adjust if needed | Within 1 week |
| LOW | Confirm product mapping is correct, update mapping table | Next billing cycle |
| INFO | Remove cancelled product from invoice template | Next billing cycle |

## Report Format

Group findings by severity, lead with the CRITICAL total in estimated monthly
revenue leakage, and cite the invoice number and line number for every matched
discrepancy so the fix is actionable without a second lookup.

See [references/report-format.md](references/report-format.md) for the full report template.

## Common MSP Billing Patterns

Understanding how MSPs typically structure their billing helps with matching:

### Monthly Recurring (Most Common)

- One invoice per client per month
- Line items for each service: managed services flat fee, per-seat licenses, backup, security
- Pax8 subscriptions on Monthly billing term map directly to monthly invoice lines
- Quantity = seat count, billed every month

### Annual Commitment (Billed Monthly)

- Pax8 subscription has Annual billing term with monthly price
- Invoice still generated monthly with monthly unit price
- Watch for: Annual subscriptions where client is billed monthly but Pax8 charges annually (cash flow mismatch)

### Annual Commitment (Billed Annually)

- Single annual invoice for the full commitment
- Invoice amount = monthly price x quantity x 12
- Reconciliation must account for the annual multiplier
- Only one invoice per year to match against

### Usage-Based

- Pax8 usage summaries (`/v1/subscriptions/{id}/usage-summaries`) provide actual consumption
- Invoice amount varies month to month based on usage
- Match by checking usage summary `currentCharges` against invoice line amount
- Common for: Azure consumption, per-GB backup, telephony minutes

### Per-Device / Per-User

- Quantity represents number of devices or users
- Common for: RMM agents, endpoint security, email filtering
- Quantity changes frequently as devices are added/removed
- Most prone to quantity mismatch gaps

### Bundled Services

- MSP bundles multiple Pax8 subscriptions into a single invoice line (e.g., "Managed Services Bundle - $85/user")
- Individual Pax8 subscriptions cannot be matched 1:1 to invoice lines
- Reconciliation strategy: Sum all Pax8 subscription costs for the client, compare against the bundled line amount
- Flag if total Pax8 cost exceeds bundle sell price (negative margin)

## Graceful Degradation

Each data source is optional. The reconciliation should always produce a report, even with partial data:

| Missing Source | Impact | Handling |
|---------------|--------|----------|
| Xero unavailable | Cannot compare against Xero invoices | Use QBO if available, otherwise report Pax8 subscription ledger only |
| QBO unavailable | Cannot compare against QBO invoices | Use Xero if available, otherwise report Pax8 subscription ledger only |
| Both accounting platforms unavailable | No invoice data to compare | Output Pax8 subscription ledger as a standalone cost report |
| Pax8 unavailable | No subscription data | Cannot perform reconciliation -- inform user |
| Company not found in accounting | No invoices for that client | Flag as CRITICAL -- client may be entirely unbilled |
| Product name cannot be matched | Cannot confirm invoice line | Flag as LOW -- needs manual mapping review |

## Related Skills

- [Pax8 Subscriptions](../../../pax8/pax8/skills/subscriptions/SKILL.md) -- Subscription lifecycle and API patterns
- [Pax8 Invoices](../../../pax8/pax8/skills/invoices/SKILL.md) -- Pax8 billing data
- [Xero Invoices](../../../xero/xero/skills/invoices/SKILL.md) -- Xero invoice management
- [Xero Contacts](../../../xero/xero/skills/contacts/SKILL.md) -- Xero contact/client lookup
- [QBO Invoices](../../../quickbooks/quickbooks-online/skills/invoices/SKILL.md) -- QuickBooks invoice management
- [QBO Customers](../../../quickbooks/quickbooks-online/skills/customers/SKILL.md) -- QuickBooks customer lookup
- [Incident Correlation](../incident-correlation/SKILL.md) -- Cross-vendor correlation patterns
