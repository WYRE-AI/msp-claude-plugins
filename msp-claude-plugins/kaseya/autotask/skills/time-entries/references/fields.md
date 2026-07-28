# Autotask Time Entry Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `ticketID` | int | Conditional | Associated ticket (required if no projectID) |
| `projectID` | int | Conditional | Associated project (required if no ticketID) |
| `taskID` | int | No | Associated project task |
| `resourceID` | int | Yes | Technician logging time |
| `dateWorked` | date | Yes | Date work was performed |

## Time Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `hoursWorked` | decimal | Yes | Total hours (rounded to quarter-hour) |
| `hoursToBill` | decimal | No | Billable hours (may differ from worked) |
| `startDateTime` | datetime | No | Work start time |
| `endDateTime` | datetime | No | Work end time |
| `offsetHours` | decimal | No | Offset from actual time |

## Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isBillable` | boolean | No | Whether time is billable |
| `billingCodeID` | int | No | Billing category code |
| `contractID` | int | No | Associated contract |
| `contractServiceID` | int | No | Specific service on contract |
| `contractServiceBundleID` | int | No | Service bundle reference |
| `roleID` | int | No | Role for rate determination |

## Rate Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billingRate` | decimal | No | Hourly billing rate |
| `internalCost` | decimal | No | Internal cost rate |
| `billingAmount` | decimal | System | Calculated billing total |
| `costAmount` | decimal | System | Calculated cost total |

## Approval Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approvalStatus` | int | No | Current approval state (0-3) |
| `approvedByResourceID` | int | System | Who approved the entry |
| `approvedDateTime` | datetime | System | When entry was approved |

## Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `summaryNotes` | text | Recommended | Work summary for client |
| `internalNotes` | text | No | Internal notes (not billed) |
| `nonBillableReason` | text | Conditional | Required if marking non-billable |

