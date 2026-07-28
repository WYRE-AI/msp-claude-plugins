# ConnectWise PSA Time Entry Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `company` | object | Yes* | `{id: companyId}` - Required for ChargeCode |
| `chargeToId` | int | Yes | ID of ticket/project/activity |
| `chargeToType` | string | Yes | ServiceTicket, ProjectTicket, etc. |
| `member` | object | Yes | `{id: memberId}` - Who logged time |
| `timeStart` | datetime | Yes | Start time |
| `timeEnd` | datetime | Yes | End time |

## Alternative Time Entry

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actualHours` | decimal | Alt | Hours worked (instead of start/end) |
| `hoursDeduct` | decimal | No | Hours to deduct (break time) |

## Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `billableOption` | string | No | Billable, DoNotBill, NoCharge, NoDefault |
| `workType` | object | No | `{id: workTypeId}` |
| `workRole` | object | No | `{id: workRoleId}` |
| `hourlyRate` | decimal | System | Calculated rate |
| `agreement` | object | No | `{id: agreementId}` |

## Description Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `notes` | string | No | Time entry notes |
| `internalNotes` | string | No | Internal notes (not on invoice) |
| `addToDetailDescriptionFlag` | boolean | No | Add notes to ticket description |
| `addToInternalAnalysisFlag` | boolean | No | Add to internal analysis |
| `addToResolutionFlag` | boolean | No | Add to resolution |

## Status Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | System | Open, Rejected, Approved, Billed |
| `emailResourceFlag` | boolean | No | Email resource on approval |
| `emailContactFlag` | boolean | No | Email contact |
| `emailCcFlag` | boolean | No | Email CC recipients |
| `emailCc` | string | No | CC email addresses |
