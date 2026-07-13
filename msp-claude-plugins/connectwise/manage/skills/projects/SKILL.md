---
name: "ConnectWise Manage Projects"
description: >
  Use this skill when working with ConnectWise PSA projects - creating, updating,
  managing project phases, templates, and resource allocation. Covers project
  lifecycle, budgeting, billing methods, and project tickets. Essential for MSPs
  delivering project-based services through ConnectWise PSA.
when_to_use: >-
  When creating, updating, managing project phases, templates, and resource allocation. Use when:
  connectwise project, project management, create project connectwise, project phase, project
  template, project resource, project budget, project billing, project ticket, or project
  schedule.
---

# ConnectWise PSA Project Management

## Overview

Projects in ConnectWise PSA track larger bodies of work that span multiple tickets, phases, and resources. Projects support templates, phases, budgeting, resource allocation, and various billing methods. This skill covers project CRUD operations, phases, templates, resources, and project tickets.

## API Endpoint

```
Base: /project/projects
```

## Project Status Values

Standard project statuses in ConnectWise PSA:

| Status ID | Name | Description |
|---------|------|-------------|
| 1 | Open | Active project |
| 2 | Closed | Completed project |
| 3 | On Hold | Temporarily paused |
| 4 | Cancelled | Cancelled project |
| 5 | Waiting | Awaiting approval/resources |

Query `/project/projects/statuses` for configurable statuses.

## Project Types

| Type ID | Name | Description |
|---------|------|-------------|
| 1 | Project | Standard project |
| 2 | Template | Project template |

## Complete Project Field Reference

### Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `name` | string(100) | Yes | Project name |
| `company` | object | Yes | `{id: companyId}` - Client company |
| `contact` | object | No | `{id: contactId}` - Primary contact |
| `site` | object | No | `{id: siteId}` - Company site |
| `board` | object | No | `{id: boardId}` - Service board for tickets |
| `status` | object | No | `{id: statusId}` |
| `type` | object | No | `{id: typeId}` |

### Manager and Team Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manager` | object | No | `{id: memberId}` - Project manager |
| `team` | array | No | Array of team member objects |
| `department` | object | No | `{id: departmentId}` |
| `location` | object | No | `{id: locationId}` |

### Timeline Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `estimatedStart` | date | No | Planned start date |
| `estimatedEnd` | date | No | Planned end date |
| `actualStart` | date | System | When project actually started |
| `actualEnd` | date | System | When project completed |
| `scheduledStart` | datetime | No | Scheduled start datetime |
| `scheduledEnd` | datetime | No | Scheduled end datetime |

### Budget Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `estimatedHours` | decimal | No | Total estimated hours |
| `actualHours` | decimal | System | Hours logged to date |
| `budgetAnalysis` | string | No | OverBudget, OnBudget, UnderBudget |
| `budgetHours` | decimal | No | Budget cap in hours |
| `budgetAmount` | decimal | No | Budget cap in dollars |
| `percentComplete` | decimal | No | Completion percentage (0-100) |

### Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billingMethod` | string | No | ActualRates, FixedFee, NotToExceed, OverrideRate |
| `billingRateType` | string | No | WorkRole, StaffMember |
| `billingAmount` | decimal | No | Fixed fee or override rate |
| `billProjectAfterClosedFlag` | boolean | No | Allow billing after closed |
| `billTime` | string | No | Billable, DoNotBill, NoCharge |
| `billExpenses` | string | No | Billable, DoNotBill, NoCharge |
| `billProducts` | string | No | Billable, DoNotBill, NoCharge |
| `agreement` | object | No | `{id: agreementId}` - Linked agreement |

### Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | No | Project description |
| `customerPO` | string(50) | No | Customer PO number |
| `restrictDownPaymentFlag` | boolean | No | Restrict down payment |
| `downpayment` | decimal | No | Down payment amount |

## Project Phases

Phases break projects into manageable chunks with their own timelines and budgets.

### Phase Endpoint

```
/project/projects/{projectId}/phases
```

### Phase Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Phase identifier |
| `description` | string(100) | Yes | Phase name |
| `board` | object | No | `{id: boardId}` |
| `status` | object | No | `{id: statusId}` |
| `wbsCode` | string(50) | No | Work breakdown structure code |
| `scheduledStart` | datetime | No | Phase start date |
| `scheduledEnd` | datetime | No | Phase end date |
| `scheduledHours` | decimal | No | Planned hours |
| `actualStart` | datetime | System | When phase started |
| `actualEnd` | datetime | System | When phase completed |
| `actualHours` | decimal | System | Hours logged |
| `billTime` | string | No | Billable, DoNotBill, NoCharge |
| `markAsMilestoneFlag` | boolean | No | Mark as milestone |

### Create Phase

```http
POST /project/projects/{projectId}/phases
Content-Type: application/json

{
  "description": "Phase 1: Discovery",
  "scheduledStart": "2024-03-01",
  "scheduledEnd": "2024-03-15",
  "scheduledHours": 40,
  "wbsCode": "1.1"
}
```

## Project Templates

Templates provide reusable project structures with pre-defined phases and tickets.

### Get Templates

```http
GET /project/projects?conditions=type/id=2
```

### Create Project from Template

```http
POST /project/projects
Content-Type: application/json

{
  "name": "Client Onboarding - ACME Corp",
  "company": {"id": 12345},
  "templateFlag": false,
  "projectTemplateId": 100
}
```

When using `projectTemplateId`, ConnectWise copies:
- All phases from template
- Project tickets associated with phases
- Budget and billing settings
- Team assignments (if configured)

## Project Tickets

Project tickets are service tickets linked to a project and phase.

### Get Project Tickets

```http
GET /project/projects/{projectId}/tickets
```

### Create Project Ticket

```http
POST /service/tickets
Content-Type: application/json

{
  "summary": "Configure Active Directory",
  "board": {"id": 1},
  "company": {"id": 12345},
  "project": {"id": 5000},
  "phase": {"id": 5001}
}
```

### Project Ticket Fields

| Field | Type | Description |
|-------|------|-------------|
| `project` | object | `{id: projectId}` |
| `phase` | object | `{id: phaseId}` |

## Resource Allocation

### Team Member Assignment

```http
POST /project/projects/{projectId}/teamMembers
Content-Type: application/json

{
  "member": {"id": 123},
  "projectRole": {"id": 1},
  "startDate": "2024-03-01",
  "endDate": "2024-06-01",
  "hoursScheduled": 160
}
```

### Project Team Endpoint

```
/project/projects/{projectId}/teamMembers
```

### Team Member Fields

| Field | Type | Description |
|-------|------|-------------|
| `member` | object | `{id: memberId}` |
| `projectRole` | object | `{id: roleId}` |
| `workRole` | object | `{id: workRoleId}` |
| `startDate` | date | Assignment start |
| `endDate` | date | Assignment end |
| `hoursScheduled` | decimal | Planned hours |

## Billing Methods

### Billing Method Options

| Method | Description |
|--------|-------------|
| `ActualRates` | Bill at standard work role rates |
| `FixedFee` | Fixed project price |
| `NotToExceed` | Actual rates with cap |
| `OverrideRate` | Custom hourly rate |

### Fixed Fee Project

```http
POST /project/projects
Content-Type: application/json

{
  "name": "Website Redesign",
  "company": {"id": 12345},
  "billingMethod": "FixedFee",
  "billingAmount": 15000.00
}
```

### Not-to-Exceed Project

```http
POST /project/projects
Content-Type: application/json

{
  "name": "System Migration",
  "company": {"id": 12345},
  "billingMethod": "NotToExceed",
  "budgetAmount": 25000.00
}
```

## API Operations

### Create Project

```http
POST /project/projects
Content-Type: application/json

{
  "name": "Office 365 Migration - ACME Corp",
  "company": {"id": 12345},
  "status": {"id": 1},
  "manager": {"id": 100},
  "estimatedStart": "2024-03-01",
  "estimatedEnd": "2024-05-01",
  "estimatedHours": 200,
  "billingMethod": "ActualRates",
  "description": "Migrate from on-premises Exchange to Office 365"
}
```

### Get Project

```http
GET /project/projects/{id}
```

### Update Project

```http
PATCH /project/projects/{id}
Content-Type: application/json

{
  "percentComplete": 50,
  "estimatedEnd": "2024-05-15"
}
```

### Close Project

```http
PATCH /project/projects/{id}
Content-Type: application/json

{
  "status": {"id": 2},
  "actualEnd": "2024-05-10"
}
```

### Search Projects

```http
GET /project/projects?conditions=company/id=12345 and status/id=1
```

## Common Query Patterns

**Active projects for company:**
```
conditions=company/id=12345 and status/id=1
```

**Projects by manager:**
```
conditions=manager/id=100 and status/id=1
```

**Overdue projects:**
```
conditions=estimatedEnd<[2024-02-01] and status/id=1
```

**Projects over budget:**
```
conditions=budgetAnalysis="OverBudget"
```

**Template projects:**
```
conditions=type/id=2
```

## Best Practices

1. **Use templates** - Create templates for repeatable projects
2. **Define phases** - Break large projects into phases
3. **Set realistic budgets** - Include contingency time
4. **Assign project manager** - Every project needs an owner
5. **Link to agreement** - For managed services project work
6. **Track completion %** - Update regularly for visibility
7. **Use WBS codes** - Helps with reporting and organization
8. **Close completed projects** - Don't leave finished projects open

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Company required | Missing company reference | Include `company: {id: x}` |
| Name required | Missing project name | Provide name field |
| Invalid status | Status doesn't exist | Query statuses endpoint |
| Invalid manager | Member doesn't exist | Verify member ID |
| Template not found | Invalid projectTemplateId | Query templates first |

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) - Project tickets
- [ConnectWise Time Entries](../time-entries/SKILL.md) - Project time tracking
- [ConnectWise Companies](../companies/SKILL.md) - Company management
- [ConnectWise API Patterns](../api-patterns/SKILL.md) - Query syntax and auth
