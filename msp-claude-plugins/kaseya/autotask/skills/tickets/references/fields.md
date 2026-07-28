# Autotask Ticket Field Reference

## Core Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int | System | Auto-generated unique identifier |
| `ticketNumber` | string | System | Human-readable (e.g., T20240215.0001) |
| `title` | string(255) | Yes | Brief issue summary |
| `description` | text | No | Detailed description |
| `companyID` | int | Yes | Company/account reference |
| `companyLocationID` | int | No | Site/location within company |
| `contactID` | int | No | Primary contact for ticket |

## Classification Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | int | Yes | Current status (see codes above) |
| `priority` | int | Yes | Urgency level (1-4) |
| `queueID` | int | Yes | Service queue for routing |
| `issueType` | int | No | Primary category |
| `subIssueType` | int | No | Sub-category |
| `ticketType` | int | No | Service Request, Incident, Problem, Change |
| `ticketCategory` | int | No | Additional categorization |

## Assignment Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assignedResourceID` | int | No | Technician assigned |
| `assignedResourceRoleID` | int | No | Role for billing |
| `creatorResourceID` | int | System | Who created the ticket |
| `lastActivityResourceID` | int | System | Last person to update |

## SLA & Timeline Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `createDate` | datetime | System | When ticket was created |
| `dueDateTime` | datetime | No | SLA due date/time |
| `completedDate` | datetime | System | When marked complete |
| `firstResponseDateTime` | datetime | System | First response timestamp |
| `resolutionPlanDateTime` | datetime | No | Expected resolution time |
| `resolvedDateTime` | datetime | System | Actual resolution time |
| `lastActivityDate` | datetime | System | Last update timestamp |

## Contract & Billing Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contractID` | int | No | Associated contract |
| `contractServiceID` | int | No | Specific service on contract |
| `contractServiceBundleID` | int | No | Service bundle |
| `estimatedHours` | decimal | No | Estimated effort |
| `hoursToBeScheduled` | decimal | No | Hours remaining |

## Resolution Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resolution` | text | Conditional | Required when completing |
| `resolutionType` | int | No | Resolution category |

