---
description: Use this skill when working with Autotask expense reports - creating reports, adding expense items, searching by status or submitter, and tracking reimbursable and billable expenses
argument-hint: "<action> [details]"
arguments: [action, details]
---

# Autotask Expense Management

## Prerequisites

- Autotask MCP server connected and authenticated
- API user has access to expense report entities

## Steps

### Action: create-report

Create a new expense report for a resource.

1. **Find the submitter resource** (if name provided):
```
Tool: autotask_search_resources
Args: { "searchTerm": "<submitter_name>" }
```

2. **Create the expense report:**
```
Tool: autotask_create_expense_report
Args: {
  "submitterId": <resource_id>,
  "name": "<report_name>",
  "description": "<description>",
  "weekEndingDate": "<YYYY-MM-DD>"
}
```

3. Confirm report created and display the report ID for adding items.

### Action: add-item

Add an expense line item to an existing report.

1. **Get expense category picklist** (if category name provided):
```
Tool: autotask_get_field_info
Args: { "entity": "ExpenseItem", "field": "expenseCategory" }
```

2. **Find company** (if billable to a client):
```
Tool: autotask_search_companies
Args: { "searchTerm": "<company_name>" }
```

3. **Create the expense item:**
```
Tool: autotask_create_expense_item
Args: {
  "expenseReportId": <report_id>,
  "description": "<description>",
  "expenseDate": "<YYYY-MM-DD>",
  "expenseCategory": <category_id>,
  "amount": <amount>,
  "companyId": <company_id_or_0>,
  "isBillableToCompany": <true/false>,
  "isReimbursable": <true/false>,
  "haveReceipt": <true/false>
}
```

### Action: search

Search for expense reports by submitter or status.

```
Tool: autotask_search_expense_reports
Args: {
  "submitterId": <resource_id>,
  "status": <1-6>,
  "pageSize": 25
}
```

Status codes: 1=New, 2=Submitted, 3=Approved, 4=Paid, 5=Rejected, 6=InReview

### Action: get

Retrieve a specific expense report by ID.

```
Tool: autotask_get_expense_report
Args: { "reportId": <report_id> }
```

## Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| action | string | Yes | create-report, add-item, search, or get |
| details | string | No | Context-dependent details for the action |

## Examples

### Create an expense report
```
/expenses action="create-report" details="Feb 2026 travel expenses for Aaron Sachs"
```

### Add mileage to a report
```
/expenses action="add-item" details="Report 12345 - 45 miles to Contoso Ltd at $0.67/mi = $30.15, billable"
```

### Search submitted reports
```
/expenses action="search" details="status=submitted"
```

### Get a specific report
```
/expenses action="get" details="report ID 12345"
```

## Output

```
Expense Report Created:
  ID:          12345
  Name:        Feb 2026 Travel
  Submitter:   Aaron Sachs
  Status:      New
  Week Ending: 2026-02-28

Items:
  1. Mileage to Contoso Ltd     $30.15  (Billable, Reimbursable)
  2. Parking - Contoso office    $12.00  (Billable, Reimbursable)
  ─────────────────────────────────────
  Total:                         $42.15
```

## Error Handling

| Error | Resolution |
|-------|------------|
| Submitter not found | Verify resource name with autotask_search_resources |
| Invalid expense category | Use autotask_get_field_info to get valid picklist IDs |
| Report not found | Verify report ID with autotask_search_expense_reports |
| Cannot modify approved report | Only NEW or REJECTED reports can be edited |

## Related Commands

- [time-entry](/commands/time-entry) - Log time against tickets or projects
- [lookup-company](/commands/lookup-company) - Find company for billable expenses
- [check-contract](/commands/check-contract) - Verify contract includes expense billing
