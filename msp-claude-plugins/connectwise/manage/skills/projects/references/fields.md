# ConnectWise PSA Project Field Reference

## Core Fields

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

## Manager and Team Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manager` | object | No | `{id: memberId}` - Project manager |
| `team` | array | No | Array of team member objects |
| `department` | object | No | `{id: departmentId}` |
| `location` | object | No | `{id: locationId}` |

## Timeline Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `estimatedStart` | date | No | Planned start date |
| `estimatedEnd` | date | No | Planned end date |
| `actualStart` | date | System | When project actually started |
| `actualEnd` | date | System | When project completed |
| `scheduledStart` | datetime | No | Scheduled start datetime |
| `scheduledEnd` | datetime | No | Scheduled end datetime |

## Budget Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `estimatedHours` | decimal | No | Total estimated hours |
| `actualHours` | decimal | System | Hours logged to date |
| `budgetAnalysis` | string | No | OverBudget, OnBudget, UnderBudget |
| `budgetHours` | decimal | No | Budget cap in hours |
| `budgetAmount` | decimal | No | Budget cap in dollars |
| `percentComplete` | decimal | No | Completion percentage (0-100) |

## Billing Fields

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

## Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | No | Project description |
| `customerPO` | string(50) | No | Customer PO number |
| `restrictDownPaymentFlag` | boolean | No | Restrict down payment |
| `downpayment` | decimal | No | Down payment amount |

## Phase Fields

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

## Project Ticket Fields

| Field | Type | Description |
|-------|------|-------------|
| `project` | object | `{id: projectId}` |
| `phase` | object | `{id: phaseId}` |

## Team Member Fields

| Field | Type | Description |
|-------|------|-------------|
| `member` | object | `{id: memberId}` |
| `projectRole` | object | `{id: roleId}` |
| `workRole` | object | `{id: workRoleId}` |
| `startDate` | date | Assignment start |
| `endDate` | date | Assignment end |
| `hoursScheduled` | decimal | Planned hours |
