---
name: "ConnectWise Manage Time Entries"
description: >
  ConnectWise PSA time entry management: charge-to types (tickets, projects,
  charge codes), billable vs non-billable time, work types and work roles,
  time sheets, and the time entry approval workflow.
when_to_use: >-
  When creating, updating, searching, or managing time tracking. Use when: connectwise time entry,
  time tracking connectwise, log time connectwise, billable time, non-billable time, work type,
  work role, time sheet, time approval, or hours logged.
---

# ConnectWise PSA Time Entry Management

## Overview

Time entries in ConnectWise PSA track time spent on tickets, projects, and other activities. Accurate time tracking is essential for billing, resource management, and profitability analysis. This skill covers time entry CRUD operations, work types, work roles, billing settings, and approval workflows.

## Anti-triggers

- **Writing up what happened on a ticket** — narrative goes in a ticket
  note (`cw_add_ticket_note`); only billable duration belongs in a time
  entry. Use `connectwise-manage-tickets`.
- **Project time** — project hours charge to a `ProjectTicket`, so the
  ticket has to be located first; use `connectwise-manage-projects`.

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

See [references/fields.md](references/fields.md) for the complete time entry field reference.

## Work Types

Work types categorize the nature of work performed.

| Type | Description | Typical Billing |
|------|-------------|-----------------|
| Regular | Normal work hours | Billable |
| Overtime | After-hours work | 1.5x rate |
| Training | Training time | Non-billable |
| Travel | Travel time | Varies |
| Remote | Remote support | Billable |
| On-site | On-site work | Billable |
| Administrative | Admin tasks | Non-billable |

Query `GET /time/workTypes` for the configured list.

## Work Roles

Work roles determine billing rates based on skill level.

| Role | Description | Typical Rate |
|------|-------------|--------------|
| Level 1 Tech | Help desk | $75-100/hr |
| Level 2 Tech | Desktop support | $100-125/hr |
| Level 3 Tech | Systems admin | $125-150/hr |
| Engineer | Senior engineer | $150-200/hr |
| Consultant | Expert consultant | $200-250/hr |
| Project Manager | PM work | $125-175/hr |

Query `GET /time/workRoles` for the configured list.

## Billing Options

| Option | Description |
|--------|-------------|
| `Billable` | Time is billable at standard rate |
| `DoNotBill` | Time excluded from billing |
| `NoCharge` | Time shows on invoice at $0 |
| `NoDefault` | Use ticket/agreement default |

### How Billing Is Determined

Precedence order, first match wins:

1. Time entry `billableOption` (if set)
2. Ticket `billTime` setting
3. Agreement billing rules
4. Company default

## Common Workflows

### Log time against a ticket

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

`actualHours` can be used instead of `timeStart`/`timeEnd`. Logging against
a `ChargeCode` requires the `company` field explicitly, since there's no
ticket to infer it from. See [references/api.md](references/api.md) for
the actual-hours and charge-code variants plus get/update/delete/search
examples.

### Approval workflow

1. Time entry created — `Open`
2. Time sheet submitted — `Submitted`
3. Manager approves or rejects — `Approved` or `Rejected` (with `internalNotes` explaining what to fix)
4. Approved time is invoiced — `Billed`

Approve/reject and bulk-approval requests, plus time sheet get/submit
requests, are in [references/api.md](references/api.md).

## API Patterns

Common query conditions for time entries:

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

**Approved time waiting for billing:**
```
conditions=status="Approved" and billableOption="Billable"
```

## Charge Codes

Charge codes are used for non-ticket time (meetings, training, etc.). Query
`GET /time/chargeCodes` for the configured list.

| Code | Description | Billable |
|------|-------------|----------|
| MTNG | Internal meetings | No |
| TRNG | Training | No |
| ADMIN | Administrative | No |
| PTO | Paid time off | No |
| PROJ | Project work | Yes |
| ONCALL | On-call time | Varies |

## Gotchas

- **Billed time entries cannot be deleted.** `DELETE /time/entries/{id}` fails once `status` is `Billed`; you must adjust the invoice instead.
- **`company` is required for `ChargeCode` entries only.** `ServiceTicket`/`ProjectTicket` entries infer the company from the ticket.
- **`billableOption` on the time entry wins over ticket/agreement defaults** — see billing precedence above. A blank or `NoDefault` value falls through to the ticket, then the agreement, then the company.
- Time sheets and time entries use different status vocabularies. Time sheets go `Open -> Submitted -> Approved/Rejected`; time entries go `Open -> Approved/Rejected -> Billed` (no `Submitted` state). Approving a time sheet does not retroactively change the `status` of every entry inside it. See [references/api.md](references/api.md) for both status tables.

## Best Practices

1. **Be specific in notes** - Document what was done for invoice clarity
2. **Use correct work type** - Important for accurate billing rates
3. **Set appropriate work role** - Affects billing rate
4. **Mark non-billable correctly** - Don't inflate billable hours
5. **Use charge codes** - For internal time tracking

See [references/errors.md](references/errors.md) for the complete error reference.

## Related Skills

- [ConnectWise Tickets](../tickets/SKILL.md) - Service tickets
- [ConnectWise Projects](../projects/SKILL.md) - Project management
- [ConnectWise API Patterns](../api-patterns/SKILL.md) - Query syntax and auth
