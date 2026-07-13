---
name: "Autotask Time Entries"
description: >
  Use this skill when working with Autotask time entries - logging work hours,
  billing calculations, approval workflows, utilization tracking, and budget
  validation. Covers time entry fields, billing rates, approval statuses,
  contract limits, and integration with tickets and projects.
  Essential for MSP technicians tracking billable and non-billable work.
when_to_use: >-
  When logging work hours, billing calculations, approval workflows, utilization tracking, and
  budget validation. Use when: autotask time entry, log time, time tracking, billable hours, time
  entry approval, billing rate, utilization rate, time billing, work log, timesheet, hours worked,
  submit timesheet, or approve time.
---

# Autotask Time Entry Management

## Overview

Time entries are the foundation of MSP billing and resource utilization tracking. Every hour logged against tickets, projects, and contracts flows through the time entry system. This skill covers comprehensive time management including billing calculations, approval workflows, budget validation, and utilization analytics.

## Approval Status Codes

Based on the Autotask API, these are the time entry approval statuses:

| Status ID | Name | Description | Business Logic |
|-----------|------|-------------|----------------|
| **0** | DRAFT | Entry created but not submitted | Editable by resource |
| **1** | SUBMITTED | Submitted for approval | Locked, awaiting manager review |
| **2** | APPROVED | Manager approved entry | Included in billing cycle |
| **3** | REJECTED | Manager rejected entry | Returned for correction |

### Approval Workflow

```
DRAFT (0) ────────────────> SUBMITTED (1)
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
              APPROVED (2)            REJECTED (3)
                    │                       │
                    ▼                       ▼
          Billing Cycle              Back to DRAFT
```

**Workflow Rules:**
- Resources can edit DRAFT entries freely
- SUBMITTED entries are locked until approved/rejected
- REJECTED entries return to editable state
- APPROVED entries are included in next billing cycle
- Only designated approvers can change status from SUBMITTED

## Complete Time Entry Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `ticketID` | int | Conditional | Associated ticket (required if no projectID) |
| `projectID` | int | Conditional | Associated project (required if no ticketID) |
| `taskID` | int | No | Associated project task |
| `resourceID` | int | Yes | Technician logging time |
| `dateWorked` | date | Yes | Date work was performed |

### Time Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hoursWorked` | decimal | Yes | Total hours (rounded to quarter-hour) |
| `hoursToBill` | decimal | No | Billable hours (may differ from worked) |
| `startDateTime` | datetime | No | Work start time |
| `endDateTime` | datetime | No | Work end time |
| `offsetHours` | decimal | No | Offset from actual time |

### Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isBillable` | boolean | No | Whether time is billable |
| `billingCodeID` | int | No | Billing category code |
| `contractID` | int | No | Associated contract |
| `contractServiceID` | int | No | Specific service on contract |
| `contractServiceBundleID` | int | No | Service bundle reference |
| `roleID` | int | No | Role for rate determination |

### Rate Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billingRate` | decimal | No | Hourly billing rate |
| `internalCost` | decimal | No | Internal cost rate |
| `billingAmount` | decimal | System | Calculated billing total |
| `costAmount` | decimal | System | Calculated cost total |

### Approval Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approvalStatus` | int | No | Current approval state (0-3) |
| `approvedByResourceID` | int | System | Who approved the entry |
| `approvedDateTime` | datetime | System | When entry was approved |

### Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `summaryNotes` | text | Recommended | Work summary for client |
| `internalNotes` | text | No | Internal notes (not billed) |
| `nonBillableReason` | text | Conditional | Required if marking non-billable |

## Billing Calculations

### Rate Hierarchy

Billing rates are determined in this order:
1. **Contract Rate** - Specific rate defined in contract
2. **Resource Rate** - Rate assigned to technician
3. **Role Rate** - Rate based on assigned role
4. **Default Rate** - System default rate

```javascript
function getBillingRate(timeEntry, context) {
  // Priority 1: Contract rate
  if (context.contractInfo?.hourlyRate) {
    return context.contractInfo.hourlyRate;
  }

  // Priority 2: Resource-specific rate
  if (context.billingRates?.[timeEntry.resourceID]) {
    return context.billingRates[timeEntry.resourceID];
  }

  // Priority 3: Role-based rate
  if (context.billingRates?.[`role_${timeEntry.roleID}`]) {
    return context.billingRates[`role_${timeEntry.roleID}`];
  }

  // Priority 4: Default rate
  return context.defaultRate || 0;
}
```

### Billing Amount Calculation

```javascript
function calculateBilling(timeEntry, context) {
  const hours = timeEntry.hoursWorked || 0;
  const isBillable = determineBillability(timeEntry, context);

  if (!isBillable) {
    return { isBillable: false, billingAmount: 0 };
  }

  const billingRate = getBillingRate(timeEntry, context);
  const billingAmount = hours * billingRate;

  // Calculate internal cost
  const costRate = getInternalCostRate(timeEntry, context);
  const costAmount = hours * costRate;

  // Calculate profit metrics
  const markup = costRate > 0 ? ((billingRate - costRate) / costRate) * 100 : 0;
  const profitAmount = billingAmount - costAmount;

  return {
    isBillable,
    billingRate,
    billingAmount: Math.round(billingAmount * 100) / 100,
    costRate,
    costAmount: Math.round(costAmount * 100) / 100,
    markup: Math.round(markup * 100) / 100,
    profitAmount: Math.round(profitAmount * 100) / 100
  };
}
```

### Billability Determination

Time entries are evaluated for billability based on:

| Condition | Billable? | Reason |
|-----------|-----------|--------|
| Explicit `isBillable: true` | Yes | Manually marked billable |
| Explicit `isBillable: false` | No | Manually marked non-billable |
| Billing code marked non-billable | No | Billing code override |
| Contract excludes T&M | No | Contract terms |
| Ticket or project work | Yes | Default for client work |
| Internal work (no ticket/project) | No | Default for internal work |

```javascript
function determineBillability(timeEntry, context) {
  // Explicit setting takes precedence
  if (timeEntry.isBillable !== undefined) {
    return timeEntry.isBillable;
  }

  // Check billing code
  if (timeEntry.billingCodeID && context.billingCodes) {
    const billingCode = context.billingCodes[timeEntry.billingCodeID];
    if (billingCode && !billingCode.isBillable) {
      return false;
    }
  }

  // Check contract terms
  if (context.contractInfo?.includesTimeAndMaterials === false) {
    return false;
  }

  // Default: billable for client work
  return !!(timeEntry.ticketID || timeEntry.projectID);
}
```

## Approval Requirements

### Automatic Approval Triggers

Certain conditions automatically require manager approval:

| Condition | Requires Approval | Reason |
|-----------|-------------------|--------|
| Billable time | Yes | Financial impact |
| Hours > 8 | Yes | Overtime review |
| Weekend work | Yes | Policy compliance |
| Holiday work | Yes | Policy compliance |
| Exceeds budget | Yes | Cost control |

```javascript
function requiresApproval(timeEntry, context) {
  // Billable time always requires approval
  if (timeEntry.isBillable) return true;

  // Overtime requires approval
  if (timeEntry.hoursWorked > 8) return true;

  // Weekend work requires approval
  if (timeEntry.dateWorked) {
    const dayOfWeek = new Date(timeEntry.dateWorked).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
  }

  // Budget threshold exceeded
  if (context.projectBudget) {
    const newTotal = context.projectBudget.usedHours + timeEntry.hoursWorked;
    if (newTotal > context.projectBudget.totalHours * 0.9) return true;
  }

  return false;
}
```

## Budget Validation

### Project Budget Checks

```javascript
function validateProjectBudget(timeEntry, projectBudget) {
  const warnings = [];
  const violations = [];

  const newTotalHours = projectBudget.usedHours + timeEntry.hoursWorked;
  const percentUsed = (newTotalHours / projectBudget.totalHours) * 100;

  // Warning at 90% threshold
  if (percentUsed > 90 && percentUsed <= 100) {
    warnings.push(`Project at ${Math.round(percentUsed)}% of hour budget`);
  }

  // Violation when exceeding budget
  if (percentUsed > 100) {
    violations.push('Time entry exceeds project hour budget');
  }

  return { warnings, violations, percentUsed };
}
```

### Contract Limit Checks

```javascript
function validateContractLimits(timeEntry, contractLimits) {
  const warnings = [];
  const violations = [];

  // Check monthly limit
  const newMonthlyHours = contractLimits.usedMonthlyHours + timeEntry.hoursWorked;
  if (newMonthlyHours > contractLimits.monthlyHours) {
    violations.push('Exceeds contract monthly hour limit');
  } else if (newMonthlyHours > contractLimits.monthlyHours * 0.9) {
    warnings.push(`Contract at ${Math.round((newMonthlyHours / contractLimits.monthlyHours) * 100)}% of monthly limit`);
  }

  // Check total contract limit
  const newTotalHours = contractLimits.usedTotalHours + timeEntry.hoursWorked;
  if (newTotalHours > contractLimits.totalHours) {
    violations.push('Exceeds contract total hour limit');
  }

  return { warnings, violations };
}
```

## Time Analytics & KPIs

### Utilization Rate Calculation

```javascript
function calculateUtilization(timeEntries) {
  let totalHours = 0;
  let billableHours = 0;

  timeEntries.forEach(entry => {
    const hours = entry.hoursWorked || 0;
    totalHours += hours;

    if (entry.isBillable) {
      billableHours += hours;
    }
  });

  const utilizationRate = totalHours > 0
    ? (billableHours / totalHours) * 100
    : 0;

  return {
    totalHours: Math.round(totalHours * 100) / 100,
    billableHours: Math.round(billableHours * 100) / 100,
    nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
    utilizationRate: Math.round(utilizationRate * 100) / 100
  };
}
```

### Industry Benchmarks

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Utilization Rate | 65% | 70-75% | 80%+ |
| Average Daily Hours | 6.5h | 7h | 7.5h |
| Approval Turnaround | 24h | 8h | 4h |
| Entry Accuracy | 95% | 98% | 99%+ |

## API Patterns

### Creating a Time Entry

```http
POST /v1.0/TimeEntries
Content-Type: application/json
```

**Ticket Time Entry:**
```json
{
  "ticketID": 54321,
  "resourceID": 29744150,
  "dateWorked": "2024-02-15",
  "hoursWorked": 1.5,
  "summaryNotes": "Troubleshot email delivery issues. Identified DNS misconfiguration.",
  "billingCodeID": 12,
  "roleID": 5,
  "isBillable": true
}
```

**Project Time Entry:**
```json
{
  "projectID": 12345,
  "taskID": 67890,
  "resourceID": 29744150,
  "dateWorked": "2024-02-15",
  "hoursWorked": 4.0,
  "summaryNotes": "Network infrastructure design - Phase 2 planning",
  "internalNotes": "Need to follow up on VLAN configuration",
  "billingCodeID": 8,
  "isBillable": true
}
```

### Query Patterns

**Time entries for a ticket:**
```json
{
  "filter": [
    {"field": "ticketID", "op": "eq", "value": 54321}
  ],
  "includeFields": ["Resource.firstName", "Resource.lastName"]
}
```

**Unapproved time entries for a date range:**
```json
{
  "filter": [
    {"field": "dateWorked", "op": "between", "value": ["2024-02-01", "2024-02-15"]},
    {"field": "approvalStatus", "op": "in", "value": [0, 1]}
  ]
}
```

**Time entries logged today:**
```json
{
  "filter": [
    {"field": "dateWorked", "op": "gte", "value": "2026-04-13"},
    {"field": "dateWorked", "op": "lt", "value": "2026-04-14"}
  ]
}
```

> **Warning:** Using only today's date returns **zero results**. You MUST use a range: `gte` today AND `lt` tomorrow. See the api-patterns skill for the full explanation.

**Billable time by resource (date range):**
```json
{
  "filter": [
    {"field": "resourceID", "op": "eq", "value": 29744150},
    {"field": "isBillable", "op": "eq", "value": true},
    {"field": "dateWorked", "op": "gte", "value": "2024-02-01"},
    {"field": "dateWorked", "op": "lt", "value": "2024-03-01"}
  ]
}
```

### Submitting for Approval

```http
PATCH /v1.0/TimeEntries
Content-Type: application/json
```

```json
{
  "id": 98765,
  "approvalStatus": 1
}
```

### Approving Time Entry

```json
{
  "id": 98765,
  "approvalStatus": 2
}
```

### Rejecting Time Entry

```json
{
  "id": 98765,
  "approvalStatus": 3,
  "internalNotes": "Please add more detail about the work performed"
}
```

## Business Rules

### Quarter-Hour Rounding

Standard MSP practice is to round time to the nearest quarter hour:

```javascript
function roundToQuarterHour(hours) {
  return Math.round(hours * 4) / 4;
}

// Examples:
// 1.12 → 1.0
// 1.13 → 1.25
// 1.38 → 1.5
// 1.63 → 1.75
// 1.88 → 2.0
```

### Minimum Billing Increments

| Work Type | Minimum | Rationale |
|-----------|---------|-----------|
| Remote Support | 0.25h (15 min) | Quick remote fixes |
| Phone Call | 0.25h (15 min) | Brief calls |
| On-Site Visit | 1.0h (60 min) | Travel overhead |
| Emergency/After Hours | 1.0h (60 min) | Premium rate |

### Default Date Handling

If no date is provided, default to the current date:

```javascript
function setDefaultDate(timeEntry) {
  if (!timeEntry.dateWorked) {
    timeEntry.dateWorked = new Date().toISOString().split('T')[0];
  }
  return timeEntry;
}
```

## Common Workflows

### Daily Time Entry Flow

1. **Log time** - Create entry with work details
2. **Review** - Check accuracy and completeness
3. **Submit** - Change status to SUBMITTED (1)
4. **Await approval** - Manager reviews entry
5. **Resolve** - Entry approved or rejected

### End of Week Timesheet

```javascript
// Get all draft entries for the week
const weekEntries = await queryTimeEntries({
  filter: [
    {field: 'resourceID', op: 'eq', value: currentResourceId},
    {field: 'dateWorked', op: 'between', value: [weekStart, weekEnd]},
    {field: 'approvalStatus', op: 'eq', value: 0}
  ]
});

// Submit all for approval
for (const entry of weekEntries) {
  await updateTimeEntry(entry.id, { approvalStatus: 1 });
}
```

### Manager Approval Queue

```javascript
// Get pending approvals for my team
const pendingApprovals = await queryTimeEntries({
  filter: [
    {field: 'approvalStatus', op: 'eq', value: 1},
    {field: 'dateWorked', op: 'gte', value: lastWeekStart}
  ],
  includeFields: ['Resource.firstName', 'Resource.lastName', 'Ticket.title']
});
```

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | TicketID or ProjectID required | Provide either ticket or project |
| 400 | Invalid hours value | Hours must be positive decimal |
| 400 | Future date not allowed | Date cannot be in future |
| 401 | Unauthorized | Verify API credentials |
| 403 | Cannot modify approved entry | Entry is locked after approval |
| 409 | Entry already submitted | Cannot edit while pending |

### Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| ResourceID required | Missing technician | Add resourceID field |
| Invalid dateWorked | Date format wrong | Use YYYY-MM-DD format |
| Hours exceed 24 | Too many hours | Check hour calculation |
| Missing summary | No description | Add summaryNotes |

## Best Practices

1. **Log time immediately** - Don't batch at end of day; details get lost
2. **Use descriptive summaries** - Clients see these on invoices
3. **Round appropriately** - Follow minimum billing rules
4. **Validate before submitting** - Check accuracy before approval
5. **Link to tickets/projects** - Always associate with work items
6. **Monitor utilization** - Track billable vs non-billable ratio
7. **Review budget warnings** - Address before exceeding limits
8. **Use billing codes** - Categorize time for reporting
9. **Keep internal notes separate** - Don't bill clients for non-value work
10. **Approve promptly** - Long approval queues delay billing

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ticket management
- [Autotask Projects](../projects/SKILL.md) - Project management
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements and billing
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
