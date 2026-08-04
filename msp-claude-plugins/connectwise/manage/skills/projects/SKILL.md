---
name: "ConnectWise Manage Projects"
description: >
  ConnectWise PSA project management: project lifecycle and status/type
  values, phases, templates, resource/team allocation, budgeting, billing
  methods, and project tickets.
when_to_use: >-
  When creating, updating, managing project phases, templates, and resource allocation. Use when:
  connectwise project, project management, create project connectwise, project phase, project
  template, project resource, project budget, project billing, project ticket, or project
  schedule.
---

# ConnectWise PSA Project Management

## Overview

Projects in ConnectWise PSA track larger bodies of work that span multiple tickets, phases, and resources. Projects support templates, phases, budgeting, resource allocation, and various billing methods. This skill covers project CRUD operations, phases, templates, resources, and project tickets.

## Anti-triggers

- **Service desk work** — break/fix tickets on a service board live at
  `/service/tickets` and are a different entity from project tickets; use
  `connectwise-psa-tickets`.
- **Hours booked against a project** — time charges to a `ProjectTicket`,
  never to the project or phase directly; use
  `connectwise-psa-time-entries`.

## API Endpoint

```
Base: /project/projects
```

## Key Concepts

### Project Status Values

Standard project statuses in ConnectWise PSA:

| Status ID | Name | Description |
|---------|------|-------------|
| 1 | Open | Active project |
| 2 | Closed | Completed project |
| 3 | On Hold | Temporarily paused |
| 4 | Cancelled | Cancelled project |
| 5 | Waiting | Awaiting approval/resources |

Query `/project/projects/statuses` for configurable statuses.

### Project Types

| Type ID | Name | Description |
|---------|------|-------------|
| 1 | Project | Standard project |
| 2 | Template | Project template |

See [references/fields.md](references/fields.md) for the complete project, phase, project ticket, and team member field reference.

### Billing Methods

| Method | Description |
|--------|-------------|
| `ActualRates` | Bill at standard work role rates |
| `FixedFee` | Fixed project price |
| `NotToExceed` | Actual rates with cap |
| `OverrideRate` | Custom hourly rate |

## Common Workflows

### Create a project

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

Fixed-fee and not-to-exceed projects use the same endpoint with a
different `billingMethod` and `billingAmount`/`budgetAmount`. See
[references/api.md](references/api.md) for those variants, plus get,
update, and close-project examples.

### Create a project from a template

```http
GET /project/projects?conditions=type/id=2
```

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

When using `projectTemplateId`, ConnectWise copies all phases from the
template, project tickets associated with those phases, budget and
billing settings, and team assignments (if configured).

### Break a project into phases

Phases give a project its own timelines and budgets per chunk of work.
Endpoint: `/project/projects/{projectId}/phases`.

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

### Create a project ticket

Project tickets are service tickets linked to a project and phase via the
`project` and `phase` fields. See
[references/api.md](references/api.md) for the create request and the
`GET /project/projects/{projectId}/tickets` endpoint.

### Assign team members

Endpoint: `/project/projects/{projectId}/teamMembers`. See
[references/api.md](references/api.md) for the full request shape
(`member`, `projectRole`, `workRole`, `startDate`/`endDate`,
`hoursScheduled`).

## API Patterns

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

## Gotchas

- **Templates are just projects with `type/id=2`.** There's no separate templates endpoint — query `/project/projects?conditions=type/id=2`.
- **`projectTemplateId` only applies at creation.** It copies phases, tickets, budget/billing settings, and team assignments once; it does not keep the new project in sync with later template edits.
- **`budgetAnalysis` is server-calculated**, not settable — use `budgetHours`/`budgetAmount` to set the cap and read `budgetAnalysis` to see whether the project is over/under/on budget.
- **Project tickets are regular service tickets** (`POST /service/tickets`) with `project`/`phase` fields set — there's no separate project-ticket-creation endpoint.

## Best Practices

1. **Use templates** - Create templates for repeatable projects
2. **Define phases** - Break large projects into phases
3. **Set realistic budgets** - Include contingency time
4. **Assign project manager** - Every project needs an owner
5. **Link to agreement** - For managed services project work
6. **Track completion %** - Update regularly for visibility
7. **Use WBS codes** - Helps with reporting and organization
8. **Close completed projects** - Don't leave finished projects open

See [references/errors.md](references/errors.md) for the complete error reference.

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) - Project tickets
- [ConnectWise Time Entries](../time-entries/SKILL.md) - Project time tracking
- [ConnectWise Companies](../companies/SKILL.md) - Company management
- [ConnectWise API Patterns](../api-patterns/SKILL.md) - Query syntax and auth
