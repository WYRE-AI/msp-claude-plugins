---
name: "Autotask Projects"
description: >
  Use this skill when working with Autotask projects - creating projects,
  managing tasks, phases, milestones, and resource assignments. Essential
  for MSP project managers handling client implementations, migrations,
  and scheduled work in Autotask PSA.
when_to_use: >-
  When creating projects, managing tasks, phases, milestones, and resource assignments. Use when:
  autotask project, autotask task, project management, project phase, project milestone, resource
  assignment, project billing, or project timeline.
---

# Autotask Projects Management

## Overview

Autotask Projects extend beyond simple ticketing to handle structured work with defined phases, tasks, dependencies, and resource assignments. Projects are used for implementations, migrations, onboarding, and any work requiring planning and tracking.

## Key Concepts

### Project Structure

```
Project
├── Phase 1
│   ├── Task 1.1
│   ├── Task 1.2
│   └── Milestone: Phase 1 Complete
├── Phase 2
│   ├── Task 2.1
│   ├── Task 2.2
│   └── Milestone: Phase 2 Complete
└── Final Milestone: Project Complete
```

### Project Fields

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `projectName` | Project name | Yes |
| `companyID` | Client company | Yes |
| `projectType` | Type category | Yes |
| `status` | Project status | Yes |
| `startDate` | Planned start | No |
| `endDate` | Planned end | No |
| `projectLeadResourceID` | Project manager | No |
| `department` | Department | No |
| `estimatedRevenue` | Expected revenue | No |
| `contractID` | Associated contract | No |

### Project Status Values

| ID | Status | Description |
|----|--------|-------------|
| 1 | New | Just created |
| 5 | Active | In progress |
| 8 | On Hold | Temporarily paused |
| 10 | Complete | Finished |
| 12 | Cancelled | Terminated |

### Task Fields

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier | System |
| `projectID` | Parent project | Yes |
| `phaseID` | Parent phase | No |
| `taskName` | Task title | Yes |
| `status` | Task status | Yes |
| `assignedResourceID` | Assigned tech | No |
| `estimatedHours` | Estimated effort | No |
| `startDate` | Task start | No |
| `endDate` | Task due date | No |
| `priority` | Task priority | No |

## API Patterns

### Creating a Project

```http
POST /v1.0/Projects
Content-Type: application/json
```

```json
{
  "projectName": "Acme Corp - Office 365 Migration",
  "companyID": 12345,
  "projectType": 1,
  "status": 1,
  "startDate": "2024-03-01",
  "endDate": "2024-04-15",
  "projectLeadResourceID": 29744150,
  "description": "Migrate from on-prem Exchange to Office 365",
  "estimatedRevenue": 15000.00,
  "contractID": 54321
}
```

### Creating a Phase

```http
POST /v1.0/Phases
Content-Type: application/json
```

```json
{
  "projectID": 98765,
  "title": "Phase 1: Planning & Assessment",
  "description": "Initial assessment and migration planning",
  "startDate": "2024-03-01",
  "dueDate": "2024-03-08",
  "estimatedHours": 16
}
```

### Creating a Task

```http
POST /v1.0/ProjectTasks
Content-Type: application/json
```

```json
{
  "projectID": 98765,
  "phaseID": 11111,
  "taskName": "Document current Exchange environment",
  "status": 1,
  "assignedResourceID": 29744150,
  "estimatedHours": 4,
  "startDate": "2024-03-01",
  "endDate": "2024-03-02",
  "priority": 2
}
```

### Searching Projects

**Active projects for a company:**
```json
{
  "filter": [
    {"field": "companyID", "op": "eq", "value": 12345},
    {"field": "status", "op": "eq", "value": 5}
  ]
}
```

**Projects by lead:**
```json
{
  "filter": [
    {"field": "projectLeadResourceID", "op": "eq", "value": 29744150},
    {"field": "status", "op": "in", "value": [1, 5]}
  ]
}
```

### Creating Time Entry on Task

```http
POST /v1.0/TimeEntries
Content-Type: application/json
```

```json
{
  "taskID": 22222,
  "resourceID": 29744150,
  "dateWorked": "2024-03-01",
  "startDateTime": "2024-03-01T09:00:00Z",
  "endDateTime": "2024-03-01T12:00:00Z",
  "hoursWorked": 3,
  "summaryNotes": "Documented Exchange server configuration",
  "billingCodeID": 29683556
}
```

### Updating Project Status

```http
PATCH /v1.0/Projects
Content-Type: application/json
```

```json
{
  "id": 98765,
  "status": 5,
  "actualStartDate": "2024-03-01"
}
```

## Common Workflows

### Project Setup

1. **Create project**
   - Link to company and contract
   - Set project lead
   - Define timeline

2. **Create phases**
   - Logical groupings of work
   - Sequential ordering

3. **Create tasks**
   - Assign to phases
   - Estimate hours
   - Set dependencies

4. **Assign resources**
   - Assign tasks to techs
   - Balance workload

### Project Execution

1. **Start project** - Update status to Active
2. **Work tasks** - Log time entries
3. **Complete tasks** - Update task status
4. **Track progress** - Monitor vs estimates
5. **Complete phases** - Mark milestones
6. **Close project** - Final status update

### Project Billing

Projects can be billed:
- **Fixed Fee** - Set project price
- **Time & Materials** - Bill actual time
- **Against Contract** - Deduct from prepaid hours

Always associate project with contract for proper billing flow.

## Error Handling

### Common API Errors

| Code | Message | Resolution |
|------|---------|------------|
| 400 | Invalid projectType | Use valid project type ID |
| 400 | EndDate before StartDate | Fix date sequence |
| 404 | Project not found | Verify project ID |
| 409 | Cannot delete - has time entries | Archive instead of delete |

### Validation Errors

**"ProjectName is required"** - Project name cannot be empty

**"Invalid companyID"** - Company must exist and be active

**"PhaseID does not belong to Project"** - Task's phase must be in same project

## Best Practices

1. **Use phases** - Organize work logically
2. **Estimate accurately** - Track estimates vs actuals
3. **Assign tasks** - Don't leave tasks unassigned
4. **Update status** - Keep project status current
5. **Link to contracts** - Ensure billing flows correctly
6. **Document milestones** - Define clear completion criteria
7. **Regular reviews** - Weekly project status checks

## Related Skills

- [Autotask Tickets](../tickets/SKILL.md) - Ad-hoc service work
- [Autotask Contracts](../contracts/SKILL.md) - Project billing
- [Autotask CRM](../crm/SKILL.md) - Company relationships
