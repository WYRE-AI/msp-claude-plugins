# SuperOps.ai Ticket Field Reference

These tables list the fields on the `Ticket` type and its create and update
inputs in `schema/superops.graphql`
([superops-mcp](https://github.com/WYRE-AI/superops-mcp)).

## Read fields (`Ticket`)

| Field | Type | Description |
|-------|------|-------------|
| `ticketId` | ID | Ticket ID. Tools take this |
| `displayId` | String | Human-facing ticket number |
| `subject` | String | Summary |
| `status`, `priority`, `impact`, `urgency` | String | Tenant-configured values |
| `category`, `subcategory`, `cause`, `subcause` | String | Classification |
| `resolutionCode` | String | Set when resolving |
| `requestType` | String | Incident, Service Request and similar. Replaces the deprecated `ticketType` |
| `source` | String | How the ticket was created |
| `approvalStatus` | String | Approval state |
| `createdTime` / `updatedTime` | String | Record timestamps |
| `firstResponseDueTime` / `firstResponseTime` / `firstResponseViolated` | String / String / Boolean | First-response SLA |
| `resolutionDueTime` / `resolutionTime` / `resolutionViolated` | String / String / Boolean | Resolution SLA |
| `worklogTimespent` | String | Logged time |
| `client`, `site`, `requester`, `additionalRequester`, `followers`, `techGroup`, `technician`, `sla`, `customFields` | JSON | Select by name only |

A ticket has no `ticketNumber`, `assignee`, `dueDate` or readable `description`.

## Write fields (`CreateTicketInput` / `UpdateTicketInput`)

| Field | Shape | Notes |
|-------|-------|-------|
| `subject` | String | Required on create |
| `client` | `{ accountId }` | Required on create |
| `source` | `TicketSource` enum | Required on create. `superops_tickets_create` defaults it to `INTEGRATION` |
| `description` | String | Create only. Write-only |
| `site` | `{ id }` | |
| `requester` | `{ userId }` | A client user |
| `technician` | `{ userId }` | |
| `techGroup` | `{ groupId }` | |
| `status`, `priority`, `impact`, `urgency`, `category`, `subcategory`, `requestType`, `resolutionCode` | String | Must match the tenant's values |
| `addAssets` | `[{ assetId }]` | Create only. Not exposed by `superops_tickets_create` |
