---
name: "Autotask Expenses"
description: >
  Autotask expense report and expense item structure - the report/item parent-child
  relationship, approval status workflow, expense categories, payment types, and the
  billable vs reimbursable distinction for MSP operational expenses.
when_to_use: >-
  When creating expense reports, adding line items, searching reports by status or submitter, or
  managing expense approval workflows. Use when: autotask expense, expense report, expense item,
  reimbursement, mileage, travel expense, receipt, expense approval, billable expense, expense
  category, create expense, or submit expense.
---

# Autotask Expense Report Management

## Overview

Expense reports track out-of-pocket costs incurred by technicians and staff during service delivery. Unlike time entries (which track labor hours), expense reports capture material costs like mileage, meals, equipment purchases, and travel expenses. Each report contains one or more expense items, and follows an approval workflow before reimbursement or client billing.

## Anti-triggers

- **A cost charged to the customer on a ticket** — that is a ticket
  charge, a different entity on a different approval path; use
  `autotask-ticket-notes-attachments`.
- **Labour hours rather than out-of-pocket cost** — use
  `autotask-time-entries`.
- **Whether an approved expense reached an invoice** — use
  `autotask-billing`.

## Key Concepts

### Expense Report vs Expense Item

| Entity | Purpose | Relationship |
|--------|---------|-------------|
| **Expense Report** | Container/header for a group of expenses | Parent - groups items by period or purpose |
| **Expense Item** | Individual expense line item | Child - belongs to exactly one report |

### Approval Status Codes

| Status ID | Name | Description |
|-----------|------|-------------|
| **1** | New | Report created, not yet submitted |
| **2** | Submitted | Sent for manager approval |
| **3** | Approved | Manager approved, ready for processing |
| **4** | Paid | Reimbursement processed |
| **5** | Rejected | Manager rejected, needs correction |
| **6** | InReview | Under review by approver |

### Approval Workflow

```
NEW (1) ──────────> SUBMITTED (2) ──────────> IN REVIEW (6)
                                                   │
                                       ┌───────────┴───────────┐
                                       ▼                       ▼
                                 APPROVED (3)            REJECTED (5)
                                       │                       │
                                       ▼                       ▼
                                   PAID (4)              Back to NEW
```

## Field Reference

### Expense Report Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `name` | string | No | Report name (e.g., "Feb 2026 Travel") |
| `description` | string | No | Report description |
| `submitterId` | int | Yes | Resource ID of the person submitting |
| `weekEndingDate` | date | No | Week ending date (YYYY-MM-DD) |
| `status` | int | System | Current approval status (1-6) |

### Expense Item Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expenseReportId` | int | Yes | Parent expense report ID |
| `description` | string | Yes | Line item description |
| `expenseDate` | date | Yes | Date expense was incurred (YYYY-MM-DD) |
| `expenseCategory` | int | Yes | Expense category picklist ID |
| `amount` | decimal | Yes | Expense amount |
| `companyId` | int | No | Associated company ID (0 for internal) |
| `paymentType` | int | No | Payment type picklist ID |
| `isBillableToCompany` | boolean | No | Whether billable to client |
| `isReimbursable` | boolean | No | Whether reimbursable to employee |
| `haveReceipt` | boolean | No | Whether receipt is attached |

### Expense Categories (Common)

Use `autotask_get_field_info` with entity `ExpenseItem` to get the full picklist for your instance. Common categories include:

| Category | Typical Use |
|----------|-------------|
| Mileage | Driving to client sites |
| Meals | Client meetings, travel meals |
| Lodging | Overnight travel |
| Airfare | Flight costs |
| Parking/Tolls | On-site parking fees |
| Equipment | Small equipment purchases |
| Supplies | Office or project supplies |
| Other | Miscellaneous expenses |

### Payment Types (Common)

| Type | Description |
|------|-------------|
| Cash | Out-of-pocket cash payment |
| Personal Credit Card | Employee's own card |
| Company Credit Card | Corporate card (usually not reimbursable) |
| Check | Payment by check |

## MCP Tool Reference

### Create an Expense Report

```
Tool: autotask_create_expense_report
Args: {
  "submitterId": 29744150,
  "name": "Feb 2026 Client Travel",
  "description": "Travel expenses for on-site visits",
  "weekEndingDate": "2026-02-28"
}
```

**Notes:**
- `submitterId` is the only required field
- `name` defaults to auto-generated if omitted
- `weekEndingDate` helps organize reports by period

### Add an Expense Item

```
Tool: autotask_create_expense_item
Args: {
  "expenseReportId": 12345,
  "description": "Mileage to Contoso Ltd - server migration",
  "expenseDate": "2026-02-15",
  "expenseCategory": 1,
  "amount": 45.50,
  "companyId": 67890,
  "isBillableToCompany": true,
  "isReimbursable": true,
  "haveReceipt": false
}
```

**Required fields:** `expenseReportId`, `description`, `expenseDate`, `expenseCategory`, `amount`

### Search Expense Reports

```
Tool: autotask_search_expense_reports
Args: {
  "submitterId": 29744150,
  "status": 1,
  "pageSize": 25
}
```

**Filters:**
- `submitterId` - Filter by who submitted
- `status` - Filter by approval status (1=New, 2=Submitted, 3=Approved, 4=Paid, 5=Rejected, 6=InReview)
- `pageSize` - Results per page (default 25, max 100)

### Get an Expense Report

```
Tool: autotask_get_expense_report
Args: { "reportId": 12345 }
```

## Common Workflows

### Submit Expenses for a Client Visit

1. **Create the report:**
```
autotask_create_expense_report: {
  "submitterId": <your_resource_id>,
  "name": "Client Visit - Contoso Ltd",
  "weekEndingDate": "2026-02-28"
}
```

2. **Add mileage:**
```
autotask_create_expense_item: {
  "expenseReportId": <report_id>,
  "description": "Round trip to Contoso - 45 miles @ $0.67/mi",
  "expenseDate": "2026-02-15",
  "expenseCategory": <mileage_category_id>,
  "amount": 30.15,
  "companyId": <contoso_company_id>,
  "isBillableToCompany": true,
  "isReimbursable": true
}
```

3. **Add parking:**
```
autotask_create_expense_item: {
  "expenseReportId": <report_id>,
  "description": "Parking at Contoso office",
  "expenseDate": "2026-02-15",
  "expenseCategory": <parking_category_id>,
  "amount": 12.00,
  "companyId": <contoso_company_id>,
  "isBillableToCompany": true,
  "isReimbursable": true,
  "haveReceipt": true
}
```

### Review Pending Expense Reports

```
autotask_search_expense_reports: { "status": 2 }
```

Returns all submitted reports awaiting approval.

### Track Employee Expenses

```
autotask_search_expense_reports: {
  "submitterId": 29744150,
  "status": 1
}
```

Returns draft reports for a specific employee.

## Billable vs Reimbursable

| Scenario | Billable | Reimbursable | Example |
|----------|----------|-------------|---------|
| Client site mileage | Yes | Yes | Driving to customer office |
| Company card purchase | Yes | No | Equipment on company card |
| Internal travel | No | Yes | Conference attendance |
| Company event | No | No | Team lunch on company card |

**Key distinction:**
- **Billable** (`isBillableToCompany`) = Charge to the client's account
- **Reimbursable** (`isReimbursable`) = Pay back the employee

## Discovering Picklist Values

To find valid expense category and payment type IDs for your instance:

```
Tool: autotask_get_field_info
Args: { "entity": "ExpenseItem", "field": "expenseCategory" }
```

```
Tool: autotask_get_field_info
Args: { "entity": "ExpenseItem", "field": "paymentType" }
```

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Invalid expenseCategory | Wrong picklist ID | Use `autotask_get_field_info` to get valid IDs |
| Invalid paymentType | Wrong picklist ID | Use `autotask_get_field_info` to get valid IDs |
| ExpenseReportId required | Missing parent report | Create a report first, then add items |
| Invalid submitterId | Resource not found | Verify with `autotask_search_resources` |
| Cannot modify approved report | Report already approved | Only NEW/REJECTED reports can be edited |

## Best Practices

1. **Name reports descriptively** - Include period and purpose (e.g., "Mar 2026 - Contoso Migration")
2. **One report per period** - Group by week or month for easier approval
3. **Always set companyId** - Even for internal expenses, set to 0 so billing is clear
4. **Mark receipts accurately** - `haveReceipt` helps auditing; attach receipts in Autotask UI
5. **Use billable flags** - Set `isBillableToCompany` for client-recoverable costs
6. **Discover picklists first** - Use `autotask_get_field_info` before creating items to get valid category/payment IDs
7. **Submit promptly** - Don't let expense reports age; submit weekly

## Related Skills

- [Autotask Time Entries](../time-entries/SKILL.md) - Time tracking and billing
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements and billing rules
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
- [Autotask CRM](../crm/SKILL.md) - Company and contact management
