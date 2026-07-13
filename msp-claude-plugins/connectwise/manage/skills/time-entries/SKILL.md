---
name: "ConnectWise Manage Time Entries"
description: >
  Use this skill when working with ConnectWise PSA time entries - creating,
  updating, searching, or managing time tracking. Covers billable vs non-billable
  time, work types, work roles, time approval, and time sheet operations.
  Essential for MSPs tracking technician time and billing in ConnectWise PSA.
when_to_use: >-
  When creating, updating, searching, or managing time tracking. Use when: connectwise time entry,
  time tracking connectwise, log time connectwise, billable time, non-billable time, work type,
  work role, time sheet, time approval, or hours logged.
---

# ConnectWise PSA Time Entry Management

## Overview

Time entries in ConnectWise PSA track time spent on tickets, projects, and other activities. Accurate time tracking is essential for billing, resource management, and profitability analysis. This skill covers time entry CRUD operations, work types, work roles, billing settings, and approval workflows.

## API Endpoint

```
Base: /time/entries
```

## Time Entry Types

Time can be logged against different record types:

| Charge To Type | Description |
|----------------|-------------|
| `ServiceTicket` | Time against service tickets |
| `ProjectTicket` | Time against project tickets |
| `ChargeCode` | Time against charge codes (internal) |
| `Activity` | Time against activities |

## Complete Time Entry Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `company` | object | Yes* | `{id: companyId}` - Required for ChargeCode |
| `chargeToId` | int | Yes | ID of ticket/project/activity |
| `chargeToType` | string | Yes | ServiceTicket, ProjectTicket, etc. |
| `member` | object | Yes | `{id: memberId}` - Who logged time |
| `timeStart` | datetime | Yes | Start time |
| `timeEnd` | datetime | Yes | End time |

### Alternative Time Entry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actualHours` | decimal | Alt | Hours worked (instead of start/end) |
| `hoursDeduct` | decimal | No | Hours to deduct (break time) |

### Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billableOption` | string | No | Billable, DoNotBill, NoCharge, NoDefault |
| `workType` | object | No | `{id: workTypeId}` |
| `workRole` | object | No | `{id: workRoleId}` |
| `hourlyRate` | decimal | System | Calculated rate |
| `agreement` | object | No | `{id: agreementId}` |

### Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | No | Time entry notes |
| `internalNotes` | string | No | Internal notes (not on invoice) |
| `addToDetailDescriptionFlag` | boolean | No | Add notes to ticket description |
| `addToInternalAnalysisFlag` | boolean | No | Add to internal analysis |
| `addToResolutionFlag` | boolean | No | Add to resolution |

### Status Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | System | Open, Rejected, Approved, Billed |
| `emailResourceFlag` | boolean | No | Email resource on approval |
| `emailContactFlag` | boolean | No | Email contact |
| `emailCcFlag` | boolean | No | Email CC recipients |
| `emailCc` | string | No | CC email addresses |

## Work Types

Work types categorize the nature of work performed.

### Common Work Types

| Type | Description | Typical Billing |
|------|-------------|-----------------|
| Regular | Normal work hours | Billable |
| Overtime | After-hours work | 1.5x rate |
| Training | Training time | Non-billable |
| Travel | Travel time | Varies |
| Remote | Remote support | Billable |
| On-site | On-site work | Billable |
| Administrative | Admin tasks | Non-billable |

### Get Work Types

```http
GET /time/workTypes
```

## Work Roles

Work roles determine billing rates based on skill level.

### Common Work Roles

| Role | Description | Typical Rate |
|------|-------------|--------------|
| Level 1 Tech | Help desk | $75-100/hr |
| Level 2 Tech | Desktop support | $100-125/hr |
| Level 3 Tech | Systems admin | $125-150/hr |
| Engineer | Senior engineer | $150-200/hr |
| Consultant | Expert consultant | $200-250/hr |
| Project Manager | PM work | $125-175/hr |

### Get Work Roles

```http
GET /time/workRoles
```

## Billing Options

### Billable Option Values

| Option | Description |
|--------|-------------|
| `Billable` | Time is billable at standard rate |
| `DoNotBill` | Time excluded from billing |
| `NoCharge` | Time shows on invoice at $0 |
| `NoDefault` | Use ticket/agreement default |

### How Billing is Determined

1. Time entry `billableOption` (if set)
2. Ticket `billTime` setting
3. Agreement billing rules
4. Company default

## API Operations

### Create Time Entry (Start/End)

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 54321,
  "chargeToType": "ServiceTicket",
  "member": {"id": 123},
  "timeStart": "2024-02-15T09:00:00Z",
  "timeEnd": "2024-02-15T10:30:00Z",
  "workType": {"id": 1},
  "workRole": {"id": 2},
  "billableOption": "Billable",
  "notes": "Diagnosed email delivery issue. Identified blocked sender.",
  "addToDetailDescriptionFlag": true
}
```

### Create Time Entry (Actual Hours)

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 54321,
  "chargeToType": "ServiceTicket",
  "member": {"id": 123},
  "timeStart": "2024-02-15T09:00:00Z",
  "actualHours": 1.5,
  "workType": {"id": 1},
  "workRole": {"id": 2},
  "billableOption": "Billable",
  "notes": "Configured DNS records and tested mail flow."
}
```

### Create Time Entry Against Charge Code

```http
POST /time/entries
Content-Type: application/json

{
  "chargeToId": 10,
  "chargeToType": "ChargeCode",
  "company": {"id": 12345},
  "member": {"id": 123},
  "timeStart": "2024-02-15T08:00:00Z",
  "actualHours": 0.5,
  "workType": {"id": 3},
  "billableOption": "DoNotBill",
  "notes": "Weekly team meeting"
}
```

### Get Time Entry

```http
GET /time/entries/{id}
```

### Update Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "notes": "Updated notes with additional details.",
  "actualHours": 2.0
}
```

### Delete Time Entry

```http
DELETE /time/entries/{id}
```

**Note:** Cannot delete billed time entries.

### Search Time Entries

```http
GET /time/entries?conditions=member/id=123 and timeStart>=[2024-02-01]
```

## Common Query Patterns

**Time entries for a ticket:**
```
conditions=chargeToId=54321 and chargeToType="ServiceTicket"
```

**Time entries by member:**
```
conditions=member/id=123
```

**Time entries by date range:**
```
conditions=timeStart>=[2024-02-01] and timeStart<[2024-03-01]
```

**Unbilled time entries:**
```
conditions=status="Open" and billableOption="Billable"
```

**Time entries for company:**
```
conditions=company/id=12345
```

**Approved time waiting for billing:**
```
conditions=status="Approved" and billableOption="Billable"
```

**My time this week:**
```
conditions=member/id=123 and timeStart>=[2024-02-12] and timeStart<[2024-02-19]
```

## Time Sheet Operations

### Time Sheet Endpoint

```
/time/sheets
```

### Get Time Sheets

```http
GET /time/sheets?conditions=member/id=123 and year=2024 and period=7
```

### Time Sheet Status Values

| Status | Description |
|--------|-------------|
| Open | Time sheet open for editing |
| Submitted | Submitted for approval |
| Approved | Approved by manager |
| Rejected | Returned for correction |

### Submit Time Sheet

```http
PATCH /time/sheets/{id}
Content-Type: application/json

{
  "status": "Submitted"
}
```

## Approval Workflow

### Approval Status Values

| Status | Description |
|--------|-------------|
| Open | Pending approval |
| Approved | Approved for billing |
| Rejected | Rejected, needs correction |
| Billed | Already invoiced |

### Approve Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "status": "Approved"
}
```

### Reject Time Entry

```http
PATCH /time/entries/{id}
Content-Type: application/json

{
  "status": "Rejected",
  "internalNotes": "Please add more detail about work performed."
}
```

### Bulk Approval

```http
POST /time/entries/bulk
Content-Type: application/json

{
  "ids": [1001, 1002, 1003],
  "operation": {
    "status": "Approved"
  }
}
```

## Charge Codes

Charge codes are used for non-ticket time (meetings, training, etc.).

### Get Charge Codes

```http
GET /time/chargeCodes
```

### Common Charge Codes

| Code | Description | Billable |
|------|-------------|----------|
| MTNG | Internal meetings | No |
| TRNG | Training | No |
| ADMIN | Administrative | No |
| PTO | Paid time off | No |
| PROJ | Project work | Yes |
| ONCALL | On-call time | Varies |

## Best Practices

1. **Log time promptly** - Enter time daily, not at end of week
2. **Be specific in notes** - Document what was done for invoice clarity
3. **Use correct work type** - Important for accurate billing rates
4. **Set appropriate work role** - Affects billing rate
5. **Mark non-billable correctly** - Don't inflate billable hours
6. **Use charge codes** - For internal time tracking
7. **Submit time sheets** - Follow approval workflow
8. **Review before approval** - Verify accuracy before submitting

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| chargeToId required | Missing ticket/project ID | Include chargeToId |
| member required | Missing member reference | Include `member: {id: x}` |
| timeStart required | Missing start time | Include timeStart field |
| Invalid work type | Work type doesn't exist | Query workTypes endpoint |
| Cannot delete | Time already billed | Cannot delete billed entries |
| Invalid status | Invalid status value | Use Open, Approved, Rejected |

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) - Service tickets
- [ConnectWise Projects](../projects/SKILL.md) - Project management
- [ConnectWise API Patterns](../api-patterns/SKILL.md) - Query syntax and auth
