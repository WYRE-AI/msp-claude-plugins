# ConnectWise PSA Project API Reference

## Create Project

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

## Get Project

```http
GET /project/projects/{id}
```

## Update Project

```http
PATCH /project/projects/{id}
Content-Type: application/json

{
  "percentComplete": 50,
  "estimatedEnd": "2024-05-15"
}
```

## Close Project

```http
PATCH /project/projects/{id}
Content-Type: application/json

{
  "status": {"id": 2},
  "actualEnd": "2024-05-10"
}
```

## Search Projects

```http
GET /project/projects?conditions=company/id=12345 and status/id=1
```

## Fixed Fee Project

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

## Not-to-Exceed Project

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

## Create Phase

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

Phase endpoint: `/project/projects/{projectId}/phases`

## Get Templates

```http
GET /project/projects?conditions=type/id=2
```

## Create Project from Template

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

## Get Project Tickets

```http
GET /project/projects/{projectId}/tickets
```

## Create Project Ticket

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

## Team Member Assignment

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

Project team endpoint: `/project/projects/{projectId}/teamMembers`
