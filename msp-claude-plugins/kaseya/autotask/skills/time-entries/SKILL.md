---
name: "Autotask Time Entries"
description: >
  Autotask time entry structure: approval status codes and workflow, the time
  entry field schema, the billing rate hierarchy, budget and contract-limit
  validation, utilization analytics, and the MSP business rules for rounding
  and minimum billing increments.
when_to_use: >-
  When logging work hours, billing calculations, approval workflows, utilization tracking, and
  budget validation. Use when: autotask time entry, log time, time tracking, billable hours, time
  entry approval, billing rate, utilization rate, time billing, work log, timesheet, hours worked,
  submit timesheet, or approve time.
---

# Autotask Time Entry Management

## Overview

Time entries are the foundation of MSP billing and resource utilization tracking. Every hour logged against tickets, projects, and contracts flows through the time entry system. This skill covers comprehensive time management including billing calculations, approval workflows, budget validation, and utilization analytics.

## Anti-triggers

- **A flat charge rather than hours** — use
  `autotask-ticket-notes-attachments` for ticket charges.
- **Out-of-pocket costs** — use `autotask-expenses`.
- **What an approved entry became on the invoice** — use
  `autotask-billing`.
- **Which agreement absorbs the hours, and at what rate** — use
  `autotask-contracts`.

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

## Time Entry Field Reference

The fields you touch on nearly every call:

| Group | Key fields |
|-------|-----------|
| Core | `id`, `resourceID`, `ticketID`, `projectID`, `taskID`, `contractID` |
| Time | `dateWorked` (YYYY-MM-DD), `hoursWorked`, `startDateTime`, `endDateTime` |
| Billing | `isBillable`, `billingCodeID`, `contractID` |
| Rate | `hourlyRate`, `roleID`, `internalBillingCodeID` |
| Approval | `approveAndPostDate`, `approvalStatus` |
| Description | `summaryNotes` (client-visible), `internalNotes` |

A time entry requires either a `ticketID` or a `projectID` — never neither, and
never both.

See [references/fields.md](references/fields.md) for the complete field reference.

## Billing Calculations

### Rate Hierarchy

Billing rates are determined in this order:
1. **Contract Rate** - Specific rate defined in contract
2. **Resource Rate** - Rate assigned to technician
3. **Role Rate** - Rate based on assigned role
4. **Default Rate** - System default rate

The first match wins; a contract rate silently overrides a resource's own rate,
which is a common source of "wrong invoice amount" reports.

See [references/examples.md](references/examples.md) for the rate-resolution,
billing-amount, and billability-determination implementations.

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
See [references/examples.md](references/examples.md) for the `requiresApproval`
implementation.

## Budget Validation

Before posting time, check both the project's hour budget and the contract's
block-hour or retainer limit — they are tracked separately and either can be
exceeded independently. Crossing 90% of a project budget flips the entry into
requiring manager approval.

See [references/examples.md](references/examples.md) for the project-budget and
contract-limit check implementations.

## Time Analytics & KPIs

### Industry Benchmarks

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| Utilization Rate | 65% | 70-75% | 80%+ |
| Average Daily Hours | 6.5h | 7h | 7.5h |
| Approval Turnaround | 24h | 8h | 4h |
| Entry Accuracy | 95% | 98% | 99%+ |

See [references/examples.md](references/examples.md) for the utilization-rate
calculation.

## API Patterns

| Purpose | Call |
|---------|------|
| Create entry | `POST /TimeEntries` |
| Query entries | `POST /TimeEntries/query` with a `filter` array |
| Submit for approval | `PATCH /TimeEntries/{id}` setting the approval field |
| Approve / reject | `PATCH /TimeEntries/{id}` (approver credentials required) |

See [references/api.md](references/api.md) for the full create/query request
bodies and the submit, approve, and reject patterns.

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
4. **Link to tickets/projects** - Always associate with work items
5. **Monitor utilization** - Track billable vs non-billable ratio
6. **Review budget warnings** - Address before exceeding limits
7. **Use billing codes** - Categorize time for reporting
8. **Keep internal notes separate** - Don't bill clients for non-value work
9. **Approve promptly** - Long approval queues delay billing

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ticket management
- [Autotask Projects](../projects/SKILL.md) - Project management
- [Autotask Contracts](../contracts/SKILL.md) - Service agreements and billing
- [Autotask API Patterns](../api-patterns/SKILL.md) - Query builder and authentication
